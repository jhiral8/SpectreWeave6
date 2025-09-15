-- Replace the batch function with one that has extensive debugging
-- This will help us figure out exactly where the RLS error is coming from

DROP FUNCTION IF EXISTS batch_update_book_page_illustrations(UUID, JSONB, UUID);

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
    v_debug_info TEXT;
BEGIN
    -- Add extensive debug logging
    RAISE NOTICE 'BATCH_UPDATE_DEBUG: Starting with book_id=%, user_id=%, updates=%', p_book_id, p_user_id, p_updates;
    
    -- Check if RLS is enabled on book_pages
    SELECT CASE WHEN relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END 
    INTO v_debug_info
    FROM pg_class 
    WHERE relname = 'book_pages';
    
    RAISE NOTICE 'BATCH_UPDATE_DEBUG: RLS on book_pages is %', v_debug_info;
    
    -- Check current role and auth context
    RAISE NOTICE 'BATCH_UPDATE_DEBUG: Current role=%, auth.uid()=%, session_user=%', 
        current_setting('role', true), 
        COALESCE(auth.uid()::text, 'NULL'),
        session_user;
    
    -- Process each update with detailed logging
    FOR update_record IN 
        SELECT 
            (value->>'page_number')::INTEGER as page_num,
            value->>'illustration_url' as ill_url,
            value->>'illustration_prompt' as ill_prompt
        FROM jsonb_array_elements(p_updates)
    LOOP
        BEGIN
            RAISE NOTICE 'BATCH_UPDATE_DEBUG: Processing page % with url=%', 
                update_record.page_num, update_record.ill_url;
            
            v_updated_count := 0;
            
            -- Try project_id first with detailed logging
            RAISE NOTICE 'BATCH_UPDATE_DEBUG: Attempting UPDATE via project_id';
            
            UPDATE book_pages 
            SET 
                illustration_url = update_record.ill_url,
                illustration_prompt = COALESCE(update_record.ill_prompt, book_pages.illustration_prompt),
                updated_at = NOW()
            WHERE book_pages.project_id = p_book_id 
              AND book_pages.page_number = update_record.page_num
              AND book_pages.user_id = p_user_id;
            
            GET DIAGNOSTICS v_updated_count = ROW_COUNT;
            RAISE NOTICE 'BATCH_UPDATE_DEBUG: project_id update affected % rows', v_updated_count;
            
            -- If no rows updated with project_id, try book_id
            IF v_updated_count = 0 THEN
                RAISE NOTICE 'BATCH_UPDATE_DEBUG: Attempting UPDATE via book_id';
                
                UPDATE book_pages 
                SET 
                    illustration_url = update_record.ill_url,
                    illustration_prompt = COALESCE(update_record.ill_prompt, book_pages.illustration_prompt),
                    updated_at = NOW()
                WHERE book_pages.book_id = p_book_id 
                  AND book_pages.page_number = update_record.page_num
                  AND book_pages.user_id = p_user_id;
                
                GET DIAGNOSTICS v_updated_count = ROW_COUNT;
                RAISE NOTICE 'BATCH_UPDATE_DEBUG: book_id update affected % rows', v_updated_count;
            END IF;
            
            RAISE NOTICE 'BATCH_UPDATE_DEBUG: Page % completed successfully', update_record.page_num;
            
            -- Return success result
            RETURN QUERY SELECT 
                update_record.page_num,
                (v_updated_count > 0)::BOOLEAN,
                CASE WHEN v_updated_count = 0 THEN 'Page not found' ELSE NULL END::TEXT;
                
        EXCEPTION WHEN OTHERS THEN
            -- Log the exact error with full context
            RAISE NOTICE 'BATCH_UPDATE_DEBUG: ERROR on page %: SQLSTATE=%, SQLERRM=%', 
                update_record.page_num, SQLSTATE, SQLERRM;
            
            -- Return error for this page
            RETURN QUERY SELECT 
                update_record.page_num,
                FALSE,
                FORMAT('SQLSTATE=%s: %s', SQLSTATE, SQLERRM)::TEXT;
        END;
    END LOOP;
    
    RAISE NOTICE 'BATCH_UPDATE_DEBUG: Function completed';
    
END;
$$;