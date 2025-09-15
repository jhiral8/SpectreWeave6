-- DATABASE SCHEMA DIAGNOSTIC SCRIPT
-- Run this in your Supabase SQL Editor to diagnose the book_pages table issue

-- =======================================================================================
-- 1. CHECK IF BOOK_PAGES TABLE EXISTS
-- =======================================================================================
SELECT 
    'book_pages table existence' as check_name,
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'book_pages' AND table_schema = 'public'
    ) as exists;

-- =======================================================================================
-- 2. CHECK ALL COLUMNS IN BOOK_PAGES TABLE
-- =======================================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'book_pages' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =======================================================================================
-- 3. CHECK SPECIFICALLY FOR ILLUSTRATION_URL COLUMN
-- =======================================================================================
SELECT 
    'illustration_url column' as check_name,
    EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'book_pages' 
        AND column_name = 'illustration_url'
        AND table_schema = 'public'
    ) as exists;

-- =======================================================================================
-- 4. CHECK FOR PROJECT_ID COLUMN  
-- =======================================================================================
SELECT 
    'project_id column' as check_name,
    EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'book_pages' 
        AND column_name = 'project_id'
        AND table_schema = 'public'
    ) as exists;

-- =======================================================================================
-- 5. CHECK FOR BOOK_ID COLUMN (LEGACY)
-- =======================================================================================
SELECT 
    'book_id column' as check_name,
    EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'book_pages' 
        AND column_name = 'book_id'
        AND table_schema = 'public'
    ) as exists;

-- =======================================================================================
-- 6. CHECK ROW LEVEL SECURITY STATUS
-- =======================================================================================
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'book_pages' 
  AND schemaname = 'public';

-- =======================================================================================
-- 7. LIST ALL POLICIES ON BOOK_PAGES
-- =======================================================================================
SELECT 
    pol.policyname as policy_name,
    pol.cmd as command,
    pol.qual as using_expression,
    pol.with_check as with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
WHERE pc.relname = 'book_pages';

-- =======================================================================================
-- 8. SAMPLE DATA CHECK (if table exists and has data)
-- =======================================================================================
SELECT 
    COUNT(*) as total_rows,
    COUNT(illustration_url) as rows_with_illustration_url,
    COUNT(project_id) as rows_with_project_id,
    COUNT(book_id) as rows_with_book_id
FROM book_pages
WHERE EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'book_pages' AND table_schema = 'public'
);

-- =======================================================================================
-- 9. CHECK RELATED TABLES
-- =======================================================================================
SELECT 
    'projects table' as table_name,
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'projects' AND table_schema = 'public'
    ) as exists
UNION ALL
SELECT 
    'books table' as table_name,
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'books' AND table_schema = 'public'
    ) as exists;

-- =======================================================================================
-- 10. SHOW CURRENT DATABASE VERSION/SCHEMA
-- =======================================================================================
SELECT 
    current_database() as database_name,
    current_schema() as current_schema,
    version() as postgres_version;