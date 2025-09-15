-- Fix column ambiguity error in database functions
-- The RLS error was misleading - the real issue is "column reference 'page_number' is ambiguous"
-- This happens because we reference page_number without table qualification

-- Drop existing functions
DROP FUNCTION IF EXISTS batch_update_book_page_illustrations(UUID, JSONB, UUID);
DROP FUNCTION IF EXISTS update_book_page_illustration(UUID, INTEGER, TEXT, TEXT, UUID);

-- Recreate batch update function with proper column qualification
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
SECURITY INVOKER -- Critical: This preserves the caller's authentication context
AS $$
DECLARE
    update_record RECORD;
    v_updated_count INTEGER;
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
            
            -- Try project_id first (new schema) with proper column qualification
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

-- Recreate single update function with proper column qualification
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
SECURITY INVOKER -- Critical: This preserves the caller's authentication context
AS $$
DECLARE
    v_updated_count INTEGER := 0;
    v_update_method TEXT;
BEGIN
    -- Try project_id first (new schema) with proper column qualification
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
        -- Fallback to book_id (legacy schema) with proper column qualification
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
    
    RETURN QUERY SELECT v_updated_count, v_update_method;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION batch_update_book_page_illustrations(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_book_page_illustration(UUID, INTEGER, TEXT, TEXT, UUID) TO authenticated;

-- Add documentation comments
COMMENT ON FUNCTION batch_update_book_page_illustrations IS 'Batch update book page illustrations with SECURITY INVOKER and proper column qualification to fix ambiguity errors';
COMMENT ON FUNCTION update_book_page_illustration IS 'Single update book page illustration with SECURITY INVOKER and proper column qualification to fix ambiguity errors';