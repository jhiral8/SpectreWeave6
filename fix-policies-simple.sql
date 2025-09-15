-- Simple RLS policy fix for projects table
-- Run this in Supabase SQL Editor

-- Enable RLS on projects if not already enabled
ALTER TABLE projects ENABLE ROW Level SECURITY;

-- Drop and recreate the view policy for projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Drop and recreate the insert policy for projects  
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Drop and recreate the update policy for projects
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Test query - this should work without 406 error
-- SELECT id, title, project_type FROM projects WHERE user_id = auth.uid()::text LIMIT 5;