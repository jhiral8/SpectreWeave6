-- SAFE DIAGNOSTIC SCRIPT FOR BOOK_PAGES 400 ERROR
-- This script performs READ-ONLY queries to diagnose the issue
-- NO MODIFICATIONS are made to the database

-- 1. Check if book_pages table exists
SELECT 
    schemaname, 
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'book_pages';

-- 2. Check table structure and columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'book_pages' 
ORDER BY ordinal_position;

-- 3. Check for RLS policies on book_pages
SELECT 
    schemaname, 
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'book_pages';

-- 4. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'book_pages';

-- 5. Check for any constraints that might block access
SELECT 
    constraint_name,
    constraint_type,
    table_name,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'book_pages';

-- 6. Check indexes on the table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'book_pages';

-- 7. Sample data check (limit 1 row to see structure)
-- This will fail gracefully if RLS blocks access
SELECT 
    id,
    project_id,
    book_id,
    page_number,
    illustration_url,
    user_id,
    created_at,
    updated_at
FROM book_pages 
LIMIT 1;

-- 8. Check if there are any records with the specific project_id from the error
-- Using a placeholder - replace with actual project_id from the error
SELECT COUNT(*) as total_pages_for_project
FROM book_pages 
WHERE project_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd';

-- 9. Check if auth.users function is accessible (RLS dependency)
SELECT current_user, session_user;

-- 10. Check if uuid_generate_v4() extension is available
SELECT uuid_generate_v4() as sample_uuid;

-- 11. Check recent migration history
SELECT * FROM migrations_log 
WHERE migration_name LIKE '%book_pages%' 
ORDER BY applied_at DESC 
LIMIT 5;

-- 12. Check for any triggers on book_pages
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'book_pages';

-- 13. Test the exact query from the error (read-only)
-- This simulates: select=id%2Cillustration_url&project_id=eq.5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd
SELECT 
    id,
    illustration_url
FROM book_pages 
WHERE project_id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd';

-- 14. Check if there are orphaned records (no project_id or book_id)
SELECT COUNT(*) as orphaned_pages
FROM book_pages 
WHERE project_id IS NULL AND book_id IS NULL;

-- 15. Show distribution of project_id vs book_id usage
SELECT 
    CASE 
        WHEN project_id IS NOT NULL AND book_id IS NOT NULL THEN 'both_ids'
        WHEN project_id IS NOT NULL AND book_id IS NULL THEN 'project_id_only'
        WHEN project_id IS NULL AND book_id IS NOT NULL THEN 'book_id_only'
        ELSE 'no_ids'
    END as id_pattern,
    COUNT(*) as count
FROM book_pages 
GROUP BY 1;