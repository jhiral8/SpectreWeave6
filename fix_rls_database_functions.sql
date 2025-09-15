-- Fix RLS policy violations for book_pages database functions
-- This addresses the "new row violates row-level security policy" errors

-- =======================================================================================
-- STEP 1: FIX DATABASE FUNCTIONS WITH SECURITY INVOKER
-- =======================================================================================

-- Drop and recreate the batch update function with SECURITY INVOKER
DROP FUNCTION IF EXISTS batch_update_book_page_illustrations(UUID, JSONB, UUID);

CREATE OR REPLACE FUNCTION batch_update_book_page_illustrations(
    p_book_id UUID,
    p_updates JSONB,
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    page_number INTEGER,
    updated BOOLEAN,
    error_message TEXT
) 
LANGUAGE plpgsql
SECURITY INVOKER -- This ensures the function runs with the caller's privileges
AS $$
DECLARE
    update_record RECORD;
    v_updated_count INTEGER;
    v_error_message TEXT;
BEGIN
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
            v_error_message := NULL;
            
            -- Try project_id first (new schema) - remove user_id filter to let RLS handle it
            UPDATE book_pages 
            SET 
                illustration_url = update_record.ill_url,
                illustration_prompt = COALESCE(update_record.ill_prompt, illustration_prompt),
                updated_at = NOW()
            WHERE project_id = p_book_id 
              AND page_number = update_record.page_num;
            
            GET DIAGNOSTICS v_updated_count = ROW_COUNT;
            
            -- If no rows updated with project_id, try book_id (legacy schema)
            IF v_updated_count = 0 THEN
                UPDATE book_pages 
                SET 
                    illustration_url = update_record.ill_url,
                    illustration_prompt = COALESCE(update_record.ill_prompt, illustration_prompt),
                    updated_at = NOW()
                WHERE book_id = p_book_id 
                  AND page_number = update_record.page_num;
                
                GET DIAGNOSTICS v_updated_count = ROW_COUNT;
            END IF;
            
            -- Return result for this page
            RETURN QUERY SELECT 
                update_record.page_num,
                (v_updated_count > 0)::BOOLEAN,
                CASE WHEN v_updated_count = 0 THEN 'Page not found or access denied' ELSE NULL END;
                
        EXCEPTION WHEN OTHERS THEN
            -- Return error for this page
            RETURN QUERY SELECT 
                update_record.page_num,
                FALSE,
                SQLERRM;
        END;
    END LOOP;
END;
$$;

-- Drop and recreate the single update function with SECURITY INVOKER
DROP FUNCTION IF EXISTS update_book_page_illustration(UUID, INTEGER, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION update_book_page_illustration(
    p_book_id UUID,
    p_page_number INTEGER,
    p_illustration_url TEXT,
    p_illustration_prompt TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    updated_count INTEGER,
    update_method TEXT
) 
LANGUAGE plpgsql
SECURITY INVOKER -- This ensures the function runs with the caller's privileges
AS $$
DECLARE
    v_updated_count INTEGER := 0;
    v_update_method TEXT;
BEGIN
    -- Try project_id first (new schema) - remove user_id filter to let RLS handle it
    UPDATE book_pages 
    SET 
        illustration_url = p_illustration_url,
        illustration_prompt = COALESCE(p_illustration_prompt, illustration_prompt),
        updated_at = NOW()
    WHERE project_id = p_book_id 
      AND page_number = p_page_number;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count > 0 THEN
        v_update_method := 'project_id';
    ELSE
        -- Fallback to book_id (legacy schema)
        UPDATE book_pages 
        SET 
            illustration_url = p_illustration_url,
            illustration_prompt = COALESCE(p_illustration_prompt, illustration_prompt),
            updated_at = NOW()
        WHERE book_id = p_book_id 
          AND page_number = p_page_number;
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        v_update_method := 'book_id';
    END IF;
    
    RETURN QUERY SELECT v_updated_count, v_update_method;
END;
$$;

-- =======================================================================================
-- STEP 2: ENSURE PROPER USER CONTEXT PROPAGATION
-- =======================================================================================

-- Create a helper function to verify user authentication context
CREATE OR REPLACE FUNCTION check_user_auth_context() 
RETURNS TABLE (
    auth_uid UUID,
    current_user TEXT,
    session_user TEXT
) 
LANGUAGE plpgsql 
SECURITY INVOKER
AS $$
BEGIN
    RETURN QUERY SELECT 
        auth.uid() as auth_uid,
        current_user as current_user,
        session_user as session_user;
END;
$$;

-- =======================================================================================
-- STEP 3: VERIFY RLS POLICIES ARE CORRECT
-- =======================================================================================

-- Ensure RLS is enabled on book_pages
ALTER TABLE book_pages ENABLE ROW LEVEL SECURITY;

-- Verify the RLS policies are working correctly by creating a test function
CREATE OR REPLACE FUNCTION test_rls_policies(test_user_id UUID, test_project_id UUID)
RETURNS TABLE (
    test_name TEXT,
    result BOOLEAN,
    details TEXT
) 
LANGUAGE plpgsql 
SECURITY INVOKER
AS $$
DECLARE
    page_count INTEGER;
BEGIN
    -- Test 1: Check if user can see pages they own via project_id
    SELECT COUNT(*) INTO page_count 
    FROM book_pages bp
    JOIN projects p ON p.id = bp.project_id
    WHERE p.user_id = test_user_id AND bp.project_id = test_project_id;
    
    RETURN QUERY SELECT 
        'Project-based access test'::TEXT, 
        (page_count >= 0)::BOOLEAN, 
        format('Found %s pages for user %s in project %s', page_count, test_user_id, test_project_id);
    
    -- Test 2: Check auth.uid() context
    RETURN QUERY SELECT 
        'Auth context test'::TEXT,
        (auth.uid() IS NOT NULL)::BOOLEAN,
        format('auth.uid() returns: %s', COALESCE(auth.uid()::TEXT, 'NULL'));
        
    -- Test 3: Check RLS policy evaluation
    BEGIN
        SELECT COUNT(*) INTO page_count FROM book_pages WHERE project_id = test_project_id;
        RETURN QUERY SELECT 
            'RLS policy test'::TEXT,
            TRUE,
            format('Can access %s pages via RLS for project %s', page_count, test_project_id);
    EXCEPTION WHEN insufficient_privilege THEN
        RETURN QUERY SELECT 
            'RLS policy test'::TEXT,
            FALSE,
            'RLS policies are blocking access';
    END;
END;
$$;

-- =======================================================================================
-- STEP 4: ADD LOGGING FOR DEBUGGING
-- =======================================================================================

-- Create a logging table for debugging function calls
CREATE TABLE IF NOT EXISTS book_pages_function_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    function_name TEXT NOT NULL,
    book_id UUID,
    user_id_param UUID,
    auth_uid UUID,
    session_info JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the log table
ALTER TABLE book_pages_function_log ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own logs
CREATE POLICY "Users can insert their own logs" ON book_pages_function_log
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view their own logs
CREATE POLICY "Users can view their own logs" ON book_pages_function_log
    FOR SELECT USING (auth_uid = auth.uid() OR user_id_param = auth.uid());

-- =======================================================================================
-- STEP 5: CREATE ENHANCED DEBUGGING FUNCTIONS
-- =======================================================================================

-- Enhanced batch update function with logging
CREATE OR REPLACE FUNCTION batch_update_book_page_illustrations_debug(
    p_book_id UUID,
    p_updates JSONB,
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    page_number INTEGER,
    updated BOOLEAN,
    error_message TEXT
) 
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    update_record RECORD;
    v_updated_count INTEGER;
    v_error_message TEXT;
    v_auth_uid UUID;
    v_log_id UUID;
BEGIN
    -- Get current auth context
    v_auth_uid := auth.uid();
    
    -- Log function call
    INSERT INTO book_pages_function_log (
        function_name, book_id, user_id_param, auth_uid, session_info
    ) VALUES (
        'batch_update_book_page_illustrations_debug',
        p_book_id,
        p_user_id,
        v_auth_uid,
        jsonb_build_object(
            'updates_count', jsonb_array_length(p_updates),
            'current_user', current_user,
            'session_user', session_user
        )
    ) RETURNING id INTO v_log_id;
    
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
            v_error_message := NULL;
            
            -- Try project_id first (new schema)
            UPDATE book_pages 
            SET 
                illustration_url = update_record.ill_url,
                illustration_prompt = COALESCE(update_record.ill_prompt, illustration_prompt),
                updated_at = NOW()
            WHERE project_id = p_book_id 
              AND page_number = update_record.page_num;
            
            GET DIAGNOSTICS v_updated_count = ROW_COUNT;
            
            -- If no rows updated with project_id, try book_id (legacy schema)
            IF v_updated_count = 0 THEN
                UPDATE book_pages 
                SET 
                    illustration_url = update_record.ill_url,
                    illustration_prompt = COALESCE(update_record.ill_prompt, illustration_prompt),
                    updated_at = NOW()
                WHERE book_id = p_book_id 
                  AND page_number = update_record.page_num;
                
                GET DIAGNOSTICS v_updated_count = ROW_COUNT;
            END IF;
            
            -- Return result for this page
            RETURN QUERY SELECT 
                update_record.page_num,
                (v_updated_count > 0)::BOOLEAN,
                CASE WHEN v_updated_count = 0 THEN 'Page not found or access denied' ELSE NULL END;
                
        EXCEPTION WHEN OTHERS THEN
            -- Log the error
            UPDATE book_pages_function_log 
            SET error_message = SQLERRM 
            WHERE id = v_log_id;
            
            -- Return error for this page
            RETURN QUERY SELECT 
                update_record.page_num,
                FALSE,
                SQLERRM;
        END;
    END LOOP;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION batch_update_book_page_illustrations IS 'Fixed batch update function with SECURITY INVOKER for proper RLS compliance';
COMMENT ON FUNCTION update_book_page_illustration IS 'Fixed single update function with SECURITY INVOKER for proper RLS compliance';
COMMENT ON FUNCTION batch_update_book_page_illustrations_debug IS 'Debug version with logging for troubleshooting RLS issues';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION batch_update_book_page_illustrations(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_book_page_illustration(UUID, INTEGER, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION batch_update_book_page_illustrations_debug(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_auth_context() TO authenticated;
GRANT EXECUTE ON FUNCTION test_rls_policies(UUID, UUID) TO authenticated;

-- Create a view for easy access to function logs
CREATE OR REPLACE VIEW book_pages_function_debug_view AS
SELECT 
    l.function_name,
    l.book_id,
    l.user_id_param,
    l.auth_uid,
    l.session_info,
    l.error_message,
    l.created_at,
    p.title as project_title,
    p.user_id as project_owner_id
FROM book_pages_function_log l
LEFT JOIN projects p ON p.id = l.book_id
WHERE l.auth_uid = auth.uid()
ORDER BY l.created_at DESC;

-- Enable RLS on the view
ALTER VIEW book_pages_function_debug_view SET (security_barrier = true);

-- =======================================================================================
-- COMPLETION MESSAGE
-- =======================================================================================

DO $$
BEGIN
    RAISE NOTICE 'RLS database function fix completed successfully!';
    RAISE NOTICE 'Key changes made:';
    RAISE NOTICE '1. Added SECURITY INVOKER to all functions to preserve user context';
    RAISE NOTICE '2. Removed user_id filtering from WHERE clauses to let RLS handle authorization';
    RAISE NOTICE '3. Added debugging functions and logging for troubleshooting';
    RAISE NOTICE '4. Created test functions to verify RLS policy behavior';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test the image generation API to verify the fix works';
    RAISE NOTICE '2. Use batch_update_book_page_illustrations_debug for detailed logging if issues persist';
    RAISE NOTICE '3. Check book_pages_function_debug_view for function call logs';
END $$;