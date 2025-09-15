-- Add the update_book_page_illustration function that was removed
-- This function handles updating book pages with proper RLS compliance

CREATE OR REPLACE FUNCTION update_book_page_illustration(
    p_book_id UUID,
    p_page_number INTEGER,
    p_illustration_url TEXT,
    p_illustration_prompt TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    updated_count INTEGER,
    update_method TEXT
) AS $$
DECLARE
    v_updated_count INTEGER := 0;
    v_update_method TEXT;
BEGIN
    -- Try project_id first (new schema)
    UPDATE book_pages 
    SET 
        illustration_url = p_illustration_url,
        illustration_prompt = COALESCE(p_illustration_prompt, illustration_prompt),
        updated_at = NOW()
    WHERE project_id = p_book_id 
      AND page_number = p_page_number
      AND (p_user_id IS NULL OR user_id = p_user_id);
    
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
          AND page_number = p_page_number
          AND (p_user_id IS NULL OR user_id = p_user_id);
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        v_update_method := 'book_id';
    END IF;
    
    RETURN QUERY SELECT v_updated_count, v_update_method;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION update_book_page_illustration IS 'Unified function to update book page illustrations, handling both project_id and book_id schemas with RLS compliance';