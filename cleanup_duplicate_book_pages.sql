-- Cleanup script for duplicate book_pages entries
-- This script removes duplicate entries for book_id 5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd
-- and keeps only the most recent entry for each page_number

-- STEP 1: Identify duplicate entries
-- Run this first to see what duplicates exist
SELECT 
    book_id,
    page_number,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id ORDER BY created_at DESC) as page_ids,
    ARRAY_AGG(created_at ORDER BY created_at DESC) as creation_dates
FROM book_pages 
WHERE book_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'
GROUP BY book_id, page_number
HAVING COUNT(*) > 1;

-- STEP 2: Show all entries for the problematic book_id (for verification)
SELECT 
    id,
    book_id,
    page_number,
    text,
    image_url,
    illustration_prompt,
    created_at,
    updated_at
FROM book_pages 
WHERE book_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'
ORDER BY page_number, created_at DESC;

-- STEP 3: Delete duplicate entries, keeping only the most recent for each page_number
-- This uses a CTE to identify which entries to keep
WITH ranked_pages AS (
    SELECT 
        id,
        book_id,
        page_number,
        ROW_NUMBER() OVER (PARTITION BY book_id, page_number ORDER BY created_at DESC, id DESC) as rn
    FROM book_pages
    WHERE book_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'
)
DELETE FROM book_pages 
WHERE id IN (
    SELECT id 
    FROM ranked_pages 
    WHERE rn > 1
);

-- STEP 4: Verify cleanup was successful
-- This should return no rows if cleanup was successful
SELECT 
    book_id,
    page_number,
    COUNT(*) as count_after_cleanup
FROM book_pages 
WHERE book_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'
GROUP BY book_id, page_number
HAVING COUNT(*) > 1;

-- STEP 5: Show remaining entries after cleanup
SELECT 
    id,
    book_id,
    page_number,
    text,
    image_url,
    illustration_prompt,
    created_at,
    updated_at
FROM book_pages 
WHERE book_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'
ORDER BY page_number;