-- Fix RLS context issue for SECURITY INVOKER functions
-- The problem is that Bearer token authentication may not properly set auth.uid() in PostgreSQL context
-- Solution: Use SECURITY DEFINER with explicit user ID verification

-- Drop existing functions
DROP FUNCTION IF EXISTS batch_update_book_page_illustrations(UUID, JSONB, UUID);
DROP FUNCTION IF EXISTS update_book_page_illustration(UUID, INTEGER, TEXT, TEXT, UUID);

-- Recreate batch update function with SECURITY DEFINER and explicit user verification
CREATE OR REPLACE FUNCTION batch_update_book_page_illustrations(
    p_book_id UUID,
    p_updates JSONB,
    p_user_id UUID -- Made required, not optional
) RETURNS TABLE (
    page_number INTEGER,
    updated BOOLEAN,
    error_message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Use DEFINER to bypass RLS, but verify ownership manually
AS $$
DECLARE
    update_record RECORD;
    v_updated_count INTEGER;
    v_book_exists BOOLEAN := FALSE;
    v_user_owns_book BOOLEAN := FALSE;
BEGIN
    -- Validate required user_id parameter
    IF p_user_id IS NULL THEN
        RETURN QUERY SELECT 0, FALSE, 'user_id parameter is required'::TEXT;
        RETURN;
    END IF;
    
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
    
    -- Verify at least one page exists for this book
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
            
            -- Try project_id first (new schema) with explicit ownership check
            UPDATE book_pages 
            SET 
                illustration_url = update_record.ill_url,
                illustration_prompt = COALESCE(update_record.ill_prompt, book_pages.illustration_prompt),
                updated_at = NOW()
            WHERE book_pages.project_id = p_book_id 
              AND book_pages.page_number = update_record.page_num
              AND book_pages.user_id = p_user_id; -- Explicit user check
            
            GET DIAGNOSTICS v_updated_count = ROW_COUNT;
            
            -- If no rows updated with project_id, try book_id (legacy schema)
            IF v_updated_count = 0 THEN
                UPDATE book_pages 
                SET 
                    illustration_url = update_record.ill_url,
                    illustration_prompt = COALESCE(update_record.ill_prompt, book_pages.illustration_prompt),
                    updated_at = NOW()
                WHERE book_pages.book_id = p_book_id 
                  AND book_pages.page_number = update_record.page_num
                  AND book_pages.user_id = p_user_id; -- Explicit user check
                
                GET DIAGNOSTICS v_updated_count = ROW_COUNT;
            END IF;
            
            -- Return result for this page
            RETURN QUERY SELECT 
                update_record.page_num,
                (v_updated_count > 0)::BOOLEAN,
                CASE WHEN v_updated_count = 0 THEN 'Page not found or access denied' ELSE NULL END::TEXT;
                
        EXCEPTION WHEN OTHERS THEN
            -- Return error for this page
            RETURN QUERY SELECT 
                update_record.page_num,
                FALSE,
                SQLERRM::TEXT;
        END;
    END LOOP;
END;
$$;

-- Recreate single update function with SECURITY DEFINER and explicit user verification
CREATE OR REPLACE FUNCTION update_book_page_illustration(
    p_book_id UUID,
    p_page_number INTEGER,
    p_illustration_url TEXT,
    p_user_id UUID, -- Made required, not optional - moved before optional param
    p_illustration_prompt TEXT DEFAULT NULL
) RETURNS TABLE (
    updated_count INTEGER,
    update_method TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Use DEFINER to bypass RLS, but verify ownership manually
AS $$
DECLARE
    v_updated_count INTEGER := 0;
    v_update_method TEXT;
    v_user_owns_book BOOLEAN := FALSE;
BEGIN
    -- Validate required user_id parameter
    IF p_user_id IS NULL THEN
        RETURN QUERY SELECT 0, 'error: user_id required'::TEXT;
        RETURN;
    END IF;
    
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
    
    -- Try project_id first (new schema) with explicit ownership check
    UPDATE book_pages 
    SET 
        illustration_url = p_illustration_url,
        illustration_prompt = COALESCE(p_illustration_prompt, book_pages.illustration_prompt),
        updated_at = NOW()
    WHERE book_pages.project_id = p_book_id 
      AND book_pages.page_number = p_page_number
      AND book_pages.user_id = p_user_id; -- Explicit user check
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count > 0 THEN
        v_update_method := 'project_id';
    ELSE
        -- Fallback to book_id (legacy schema) with explicit ownership check
        UPDATE book_pages 
        SET 
            illustration_url = p_illustration_url,
            illustration_prompt = COALESCE(p_illustration_prompt, book_pages.illustration_prompt),
            updated_at = NOW()
        WHERE book_pages.book_id = p_book_id 
          AND book_pages.page_number = p_page_number
          AND book_pages.user_id = p_user_id; -- Explicit user check
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        v_update_method := 'book_id';
    END IF;
    
    RETURN QUERY SELECT v_updated_count, v_update_method;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION batch_update_book_page_illustrations(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_book_page_illustration(UUID, INTEGER, TEXT, UUID, TEXT) TO authenticated;

-- Also grant to anon role since API might call with anon key + auth headers
GRANT EXECUTE ON FUNCTION batch_update_book_page_illustrations(UUID, JSONB, UUID) TO anon;
GRANT EXECUTE ON FUNCTION update_book_page_illustration(UUID, INTEGER, TEXT, UUID, TEXT) TO anon;

-- Add documentation comments
COMMENT ON FUNCTION batch_update_book_page_illustrations IS 'Batch update book page illustrations with SECURITY DEFINER and explicit user ownership verification to avoid RLS context issues';
COMMENT ON FUNCTION update_book_page_illustration IS 'Single update book page illustration with SECURITY DEFINER and explicit user ownership verification to avoid RLS context issues';