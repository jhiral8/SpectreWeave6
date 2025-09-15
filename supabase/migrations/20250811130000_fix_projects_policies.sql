-- Fix RLS policies for children's book projects
-- Ensure users can access their own projects with the new columns

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create comprehensive RLS policies for projects table
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Ensure RLS is enabled on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;

-- Also fix books table policies if needed
DROP POLICY IF EXISTS "Users can view their own books" ON books;
DROP POLICY IF EXISTS "Users can insert their own books" ON books;
DROP POLICY IF EXISTS "Users can update their own books" ON books;
DROP POLICY IF EXISTS "Users can delete their own books" ON books;

CREATE POLICY "Users can view their own books" ON books
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own books" ON books
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own books" ON books
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own books" ON books
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Ensure RLS is enabled on books table
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users for books
GRANT SELECT, INSERT, UPDATE, DELETE ON books TO authenticated;

-- Grant permissions on the books_with_projects view
GRANT SELECT ON books_with_projects TO authenticated;