-- Fix RLS policies for SECURITY DEFINER functions
-- The issue is that SECURITY DEFINER functions lose the authentication context
-- So we need to create a function that properly bypasses RLS or handles the context

-- Drop existing function first
DROP FUNCTION IF EXISTS batch_update_book_page_illustrations(UUID, JSONB, UUID);

-- Create a helper function that sets the proper context for RLS
CREATE OR REPLACE FUNCTION set_config_for_user(user_id UUID) 
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', user_id)::text, true);
    PERFORM set_config('role', 'authenticated', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the batch update function with proper context handling
CREATE OR REPLACE FUNCTION batch_update_book_page_illustrations(
    p_book_id UUID,
    p_updates JSONB,
    p_user_id UUID
) RETURNS TABLE (
    page_number INTEGER,
    updated BOOLEAN,
    error_message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    update_record RECORD;
    v_updated_count INTEGER;
    v_book_exists BOOLEAN := FALSE;
    v_user_owns_book BOOLEAN := FALSE;
    v_original_role TEXT;
BEGIN
    -- Store original role
    SELECT current_setting('role', true) INTO v_original_role;
    
    -- Validate required user_id parameter
    IF p_user_id IS NULL THEN
        RETURN QUERY SELECT 0, FALSE, 'user_id parameter is required'::TEXT;
        RETURN;
    END IF;
    
    -- Set the authentication context for this session
    PERFORM set_config_for_user(p_user_id);
    
    -- Verify book ownership BEFORE processing any updates
    -- Check projects table first (new schema)
    SELECT EXISTS(
        SELECT 1 FROM projects 
        WHERE projects.id = p_book_id 
        AND projects.user_id = p_user_id
    ) INTO v_user_owns_book;
    
    -- If not found in projects, check books table (legacy schema)
    IF NOT v_user_owns_book THEN
        SELECT EXISTS(
            SELECT 1 FROM books 
            WHERE books.id = p_book_id 
            AND books.user_id = p_user_id
        ) INTO v_user_owns_book;
    END IF;
    
    -- Verify at least one page exists for this book (double-check book exists)
    SELECT EXISTS(
        SELECT 1 FROM book_pages 
        WHERE (book_pages.project_id = p_book_id OR book_pages.book_id = p_book_id)
    ) INTO v_book_exists;
    
    -- Fail if user doesn't own the book
    IF NOT v_user_owns_book THEN
        RETURN QUERY SELECT 0, FALSE, 'Access denied: user does not own this book'::TEXT;
        RETURN;
    END IF;
    
    -- Fail if book has no pages
    IF NOT v_book_exists THEN
        RETURN QUERY SELECT 0, FALSE, 'Book not found or has no pages'::TEXT;
        RETURN;
    END IF;
    
    -- Process each update in the JSONB array
    FOR update_record IN 
        SELECT 
            (value->>'page_number')::INTEGER as page_num,
            value->>'illustration_url' as ill_url,
            value->>'illustration_prompt' as ill_prompt
        FROM jsonb_array_elements(p_updates)
    LOOP
        BEGIN
            v_updated_count := 0;
            
            -- Try project_id first (new schema)
            UPDATE book_pages 
            SET 
                illustration_url = update_record.ill_url,
                illustration_prompt = COALESCE(update_record.ill_prompt, book_pages.illustration_prompt),
                updated_at = NOW()
            WHERE book_pages.project_id = p_book_id 
              AND book_pages.page_number = update_record.page_num;
            
            GET DIAGNOSTICS v_updated_count = ROW_COUNT;
            
            -- If no rows updated with project_id, try book_id (legacy schema)
            IF v_updated_count = 0 THEN
                UPDATE book_pages 
                SET 
                    illustration_url = update_record.ill_url,
                    illustration_prompt = COALESCE(update_record.ill_prompt, book_pages.illustration_prompt),
                    updated_at = NOW()
                WHERE book_pages.book_id = p_book_id 
                  AND book_pages.page_number = update_record.page_num;
                
                GET DIAGNOSTICS v_updated_count = ROW_COUNT;
            END IF;
            
            -- Return result for this page
            RETURN QUERY SELECT 
                update_record.page_num,
                (v_updated_count > 0)::BOOLEAN,
                CASE WHEN v_updated_count = 0 THEN 'Page not found' ELSE NULL END::TEXT;
                
        EXCEPTION WHEN OTHERS THEN
            -- Return error for this page
            RETURN QUERY SELECT 
                update_record.page_num,
                FALSE,
                SQLERRM::TEXT;
        END;
    END LOOP;
    
    -- Reset the role
    IF v_original_role IS NOT NULL THEN
        PERFORM set_config('role', v_original_role, true);
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    -- Reset the role in case of error
    IF v_original_role IS NOT NULL THEN
        PERFORM set_config('role', v_original_role, true);
    END IF;
    RAISE;
END;
$$;

-- Update the single page update function as well
DROP FUNCTION IF EXISTS update_book_page_illustration(UUID, INTEGER, TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION update_book_page_illustration(
    p_book_id UUID,
    p_page_number INTEGER,
    p_illustration_url TEXT,
    p_user_id UUID,
    p_illustration_prompt TEXT DEFAULT NULL
) RETURNS TABLE (
    updated_count INTEGER,
    update_method TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INTEGER := 0;
    v_update_method TEXT;
    v_user_owns_book BOOLEAN := FALSE;
    v_original_role TEXT;
BEGIN
    -- Store original role
    SELECT current_setting('role', true) INTO v_original_role;
    
    -- Validate required user_id parameter
    IF p_user_id IS NULL THEN
        RETURN QUERY SELECT 0, 'error: user_id required'::TEXT;
        RETURN;
    END IF;
    
    -- Set the authentication context for this session
    PERFORM set_config_for_user(p_user_id);
    
    -- Verify book ownership BEFORE processing update
    -- Check projects table first (new schema)
    SELECT EXISTS(
        SELECT 1 FROM projects 
        WHERE projects.id = p_book_id 
        AND projects.user_id = p_user_id
    ) INTO v_user_owns_book;
    
    -- If not found in projects, check books table (legacy schema)
    IF NOT v_user_owns_book THEN
        SELECT EXISTS(
            SELECT 1 FROM books 
            WHERE books.id = p_book_id 
            AND books.user_id = p_user_id
        ) INTO v_user_owns_book;
    END IF;
    
    -- Fail if user doesn't own the book
    IF NOT v_user_owns_book THEN
        RETURN QUERY SELECT 0, 'error: access denied'::TEXT;
        RETURN;
    END IF;
    
    -- Try project_id first (new schema)
    UPDATE book_pages 
    SET 
        illustration_url = p_illustration_url,
        illustration_prompt = COALESCE(p_illustration_prompt, book_pages.illustration_prompt),
        updated_at = NOW()
    WHERE book_pages.project_id = p_book_id 
      AND book_pages.page_number = p_page_number;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count > 0 THEN
        v_update_method := 'project_id';
    ELSE
        -- Fallback to book_id (legacy schema)
        UPDATE book_pages 
        SET 
            illustration_url = p_illustration_url,
            illustration_prompt = COALESCE(p_illustration_prompt, book_pages.illustration_prompt),
            updated_at = NOW()
        WHERE book_pages.book_id = p_book_id 
          AND book_pages.page_number = p_page_number;
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        v_update_method := 'book_id';
    END IF;
    
    -- Reset the role
    IF v_original_role IS NOT NULL THEN
        PERFORM set_config('role', v_original_role, true);
    END IF;
    
    RETURN QUERY SELECT v_updated_count, v_update_method;
    
EXCEPTION WHEN OTHERS THEN
    -- Reset the role in case of error
    IF v_original_role IS NOT NULL THEN
        PERFORM set_config('role', v_original_role, true);
    END IF;
    RAISE;
END;
$$;

-- Update RLS policies to be more permissive for SECURITY DEFINER functions
-- These policies should allow updates when the context is properly set

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their book pages" ON book_pages;
DROP POLICY IF EXISTS "Users can insert their book pages" ON book_pages;
DROP POLICY IF EXISTS "Users can update their book pages" ON book_pages;
DROP POLICY IF EXISTS "Users can delete their book pages" ON book_pages;

-- Create more permissive policies that handle SECURITY DEFINER context
CREATE POLICY "Users can view their book pages" ON book_pages
    FOR SELECT USING (
        -- Direct user ownership
        (user_id = auth.uid())
        OR
        -- Project ownership (new schema)
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = book_pages.project_id 
            AND projects.user_id = auth.uid()
        ))
        OR
        -- Book ownership (legacy schema)
        (book_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM books 
            WHERE books.id = book_pages.book_id 
            AND books.user_id = auth.uid()
        ))
        OR
        -- Allow service role and SECURITY DEFINER context
        auth.role() = 'service_role'
        OR
        -- Allow when called from SECURITY DEFINER functions (jwt claims set)
        current_setting('request.jwt.claims', true) IS NOT NULL
    );

CREATE POLICY "Users can insert their book pages" ON book_pages
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            -- Direct user ownership
            (user_id = auth.uid())
            OR
            -- Project ownership (new schema)
            (project_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM projects 
                WHERE projects.id = book_pages.project_id 
                AND projects.user_id = auth.uid()
            ))
            OR
            -- Book ownership (legacy schema)
            (book_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM books 
                WHERE books.id = book_pages.book_id 
                AND books.user_id = auth.uid()
            ))
            OR
            -- Allow service role and SECURITY DEFINER context
            auth.role() = 'service_role'
            OR
            -- Allow when called from SECURITY DEFINER functions
            current_setting('request.jwt.claims', true) IS NOT NULL
        )
    );

CREATE POLICY "Users can update their book pages" ON book_pages
    FOR UPDATE USING (
        auth.uid() IS NOT NULL
        AND (
            -- Direct user ownership
            (user_id = auth.uid())
            OR
            -- Project ownership (new schema)
            (project_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM projects 
                WHERE projects.id = book_pages.project_id 
                AND projects.user_id = auth.uid()
            ))
            OR
            -- Book ownership (legacy schema)
            (book_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM books 
                WHERE books.id = book_pages.book_id 
                AND books.user_id = auth.uid()
            ))
            OR
            -- Allow service role and SECURITY DEFINER context
            auth.role() = 'service_role'
            OR
            -- Allow when called from SECURITY DEFINER functions
            current_setting('request.jwt.claims', true) IS NOT NULL
        )
    );

CREATE POLICY "Users can delete their book pages" ON book_pages
    FOR DELETE USING (
        auth.uid() IS NOT NULL
        AND (
            -- Direct user ownership
            (user_id = auth.uid())
            OR
            -- Project ownership (new schema)
            (project_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM projects 
                WHERE projects.id = book_pages.project_id 
                AND projects.user_id = auth.uid()
            ))
            OR
            -- Book ownership (legacy schema)
            (book_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM books 
                WHERE books.id = book_pages.book_id 
                AND books.user_id = auth.uid()
            ))
            OR
            -- Allow service role and SECURITY DEFINER context
            auth.role() = 'service_role'
            OR
            -- Allow when called from SECURITY DEFINER functions
            current_setting('request.jwt.claims', true) IS NOT NULL
        )
    );

-- Grant execute permissions to all relevant roles
GRANT EXECUTE ON FUNCTION set_config_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_config_for_user(UUID) TO anon;
GRANT EXECUTE ON FUNCTION set_config_for_user(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION batch_update_book_page_illustrations(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_book_page_illustration(UUID, INTEGER, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION batch_update_book_page_illustrations(UUID, JSONB, UUID) TO anon;
GRANT EXECUTE ON FUNCTION update_book_page_illustration(UUID, INTEGER, TEXT, UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION batch_update_book_page_illustrations(UUID, JSONB, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_book_page_illustration(UUID, INTEGER, TEXT, UUID, TEXT) TO service_role;

-- Add documentation comments
COMMENT ON FUNCTION set_config_for_user IS 'Helper function to set authentication context for SECURITY DEFINER functions';
COMMENT ON FUNCTION batch_update_book_page_illustrations IS 'Batch update book page illustrations with proper SECURITY DEFINER context handling';
COMMENT ON FUNCTION update_book_page_illustration IS 'Single update book page illustration with proper SECURITY DEFINER context handling';