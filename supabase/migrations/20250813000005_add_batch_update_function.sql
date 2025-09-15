-- Add the missing batch_update_book_page_illustrations function
-- This function handles batch updating of book pages with proper RLS compliance

CREATE OR REPLACE FUNCTION batch_update_book_page_illustrations(
    p_book_id UUID,
    p_updates JSONB,
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    page_number INTEGER,
    updated BOOLEAN,
    error_message TEXT
) AS $$
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
            
            -- Try project_id first (new schema)
            UPDATE book_pages 
            SET 
                illustration_url = update_record.ill_url,
                illustration_prompt = COALESCE(update_record.ill_prompt, illustration_prompt),
                updated_at = NOW()
            WHERE project_id = p_book_id 
              AND page_number = update_record.page_num
              AND (p_user_id IS NULL OR user_id = p_user_id);
            
            GET DIAGNOSTICS v_updated_count = ROW_COUNT;
            
            -- If no rows updated with project_id, try book_id (legacy schema)
            IF v_updated_count = 0 THEN
                UPDATE book_pages 
                SET 
                    illustration_url = update_record.ill_url,
                    illustration_prompt = COALESCE(update_record.ill_prompt, illustration_prompt),
                    updated_at = NOW()
                WHERE book_id = p_book_id 
                  AND page_number = update_record.page_num
                  AND (p_user_id IS NULL OR user_id = p_user_id);
                
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
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION batch_update_book_page_illustrations IS 'Batch update function for book page illustrations, handling both project_id and book_id schemas with RLS compliance';