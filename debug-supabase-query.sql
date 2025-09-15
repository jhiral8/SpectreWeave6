-- Debug query to test what's causing the 406 error
-- Run this in Supabase SQL Editor to check permissions

-- Check if the projects table has the required columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('project_type', 'target_age', 'book_theme', 'illustration_style', 'author_style', 'total_pages', 'book_metadata');

-- Check RLS policies on projects table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'projects';

-- Test if we can select from projects with our new columns
SELECT id, title, project_type, target_age, book_theme, user_id
FROM projects 
WHERE project_type = 'childrens-book' 
LIMIT 5;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('projects', 'books');

-- Test basic select without filtering
SELECT id, title, user_id FROM projects LIMIT 3;