-- Verification script for image generation database operations
-- This script helps debug image generation and database saving issues

-- =======================================================================================
-- 1. CHECK TABLE SCHEMAS AND CONSTRAINTS
-- =======================================================================================

-- Check book_pages table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'book_pages' 
ORDER BY ordinal_position;

-- Check constraints on book_pages table
SELECT 
    constraint_name, 
    constraint_type, 
    is_deferrable, 
    initially_deferred
FROM information_schema.table_constraints 
WHERE table_name = 'book_pages';

-- Check unique constraint details
SELECT 
    kcu.column_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'book_pages' 
  AND tc.constraint_type = 'UNIQUE';

-- =======================================================================================
-- 2. CHECK CURRENT DATA STATE FOR THE PROBLEMATIC BOOK
-- =======================================================================================

-- Show all entries for book_id 5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd
SELECT 
    'book_pages' as table_name,
    id,
    book_id,
    project_id,
    page_number,
    LENGTH(text) as text_length,
    image_url IS NOT NULL as has_image_url,
    illustration_prompt IS NOT NULL as has_prompt,
    generation_id,
    created_at,
    updated_at
FROM book_pages 
WHERE book_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'
ORDER BY page_number, created_at DESC;

-- Check if there are entries with project_id instead of book_id
SELECT 
    'book_pages_by_project' as table_name,
    id,
    book_id,
    project_id,
    page_number,
    LENGTH(text) as text_length,
    image_url IS NOT NULL as has_image_url,
    illustration_prompt IS NOT NULL as has_prompt,
    generation_id,
    created_at,
    updated_at
FROM book_pages 
WHERE project_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'
ORDER BY page_number, created_at DESC;

-- =======================================================================================
-- 3. CHECK PROJECT AND BOOK TABLES
-- =======================================================================================

-- Check if the book exists in projects table
SELECT 
    'projects' as source_table,
    id,
    title,
    project_type,
    target_age,
    book_theme,
    illustration_style,
    total_pages,
    status,
    user_id,
    created_at
FROM projects 
WHERE id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd';

-- Check if the book exists in books table (legacy)
SELECT 
    'books' as source_table,
    id,
    title,
    author_style,
    theme,
    style,
    age_group,
    user_id,
    created_at
FROM books 
WHERE id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd';

-- =======================================================================================
-- 4. CHECK GENERATION HISTORY
-- =======================================================================================

-- Check generation records for this book
SELECT 
    id,
    book_id,
    project_id,
    user_id,
    generation_type,
    status,
    generation_data->'pages_generated' as pages_generated,
    generation_data->'images' as images_info,
    created_at,
    updated_at
FROM book_generations 
WHERE book_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'
   OR project_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'
ORDER BY created_at DESC;

-- =======================================================================================
-- 5. IDENTIFY DUPLICATE ISSUES
-- =======================================================================================

-- Find duplicates by book_id and page_number
SELECT 
    'duplicates_by_book_id' as check_type,
    book_id,
    page_number,
    COUNT(*) as duplicate_count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created,
    ARRAY_AGG(id ORDER BY created_at DESC) as page_ids
FROM book_pages 
WHERE book_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'
GROUP BY book_id, page_number
HAVING COUNT(*) > 1;

-- Find duplicates by project_id and page_number  
SELECT 
    'duplicates_by_project_id' as check_type,
    project_id,
    page_number,
    COUNT(*) as duplicate_count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created,
    ARRAY_AGG(id ORDER BY created_at DESC) as page_ids
FROM book_pages 
WHERE project_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'
GROUP BY project_id, page_number
HAVING COUNT(*) > 1;

-- Check for mixed references (both book_id and project_id set)
SELECT 
    'mixed_references' as check_type,
    id,
    book_id,
    project_id,
    page_number,
    created_at
FROM book_pages 
WHERE (book_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd' OR project_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd')
  AND book_id IS NOT NULL 
  AND project_id IS NOT NULL;

-- =======================================================================================
-- 6. RECOMMENDED ACTIONS SUMMARY
-- =======================================================================================

-- This query will help determine the best cleanup strategy
SELECT 
    'summary' as report_type,
    COUNT(*) as total_pages,
    COUNT(DISTINCT page_number) as unique_pages,
    COUNT(*) - COUNT(DISTINCT page_number) as duplicates_to_remove,
    COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as pages_with_images,
    COUNT(CASE WHEN image_url IS NULL THEN 1 END) as pages_without_images,
    MIN(page_number) as min_page,
    MAX(page_number) as max_page
FROM book_pages 
WHERE book_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'
   OR project_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd';