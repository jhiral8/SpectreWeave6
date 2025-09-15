-- Simple RLS policy fix for projects table to resolve 406 errors
-- This fixes the user access policies for the new children's book columns

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create simple, working RLS policies
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Enable RLS on books table as well
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Drop existing book policies
DROP POLICY IF EXISTS "Users can view their own books" ON books;
DROP POLICY IF EXISTS "Users can insert their own books" ON books;
DROP POLICY IF EXISTS "Users can update their own books" ON books;
DROP POLICY IF EXISTS "Users can delete their own books" ON books;

-- Create book policies
CREATE POLICY "Users can view their own books" ON books
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own books" ON books
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own books" ON books
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own books" ON books
  FOR DELETE USING (auth.uid()::text = user_id::text);