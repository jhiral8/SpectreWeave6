-- Clean up specific book that's causing constraint violations
-- Book ID: 5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd

-- First, let's see what exists
SELECT 'Current book_pages entries:' as info;
SELECT book_id, project_id, page_number, created_at, image_url IS NOT NULL as has_image
FROM book_pages 
WHERE book_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd' 
   OR project_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'
ORDER BY page_number;

-- Delete all entries for this book to allow clean regeneration
DELETE FROM book_pages 
WHERE book_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd' 
   OR project_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd';

-- Verify deletion
SELECT 'After cleanup:' as info;
SELECT COUNT(*) as remaining_entries
FROM book_pages 
WHERE book_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd' 
   OR project_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd';

-- Check project status
SELECT 'Project status:' as info;
SELECT id, title, status, project_type, created_at
FROM projects 
WHERE id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd';