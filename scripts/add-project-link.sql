-- Add project_id column to books table to link with projects
-- This allows books to optionally be managed as projects

-- Add the column if it doesn't exist
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_books_project_id ON books(project_id);

-- Optional: Add the children's book columns to projects table
-- Run this only if you want full integration with projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'manuscript',
ADD COLUMN IF NOT EXISTS target_age VARCHAR(10),
ADD COLUMN IF NOT EXISTS book_theme VARCHAR(50),
ADD COLUMN IF NOT EXISTS illustration_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS author_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS total_pages INTEGER,
ADD COLUMN IF NOT EXISTS book_metadata JSONB DEFAULT '{}';

-- Verify the changes
SELECT 
  'books.project_id exists' as check_item,
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'books' AND column_name = 'project_id'
  ) as status;

SELECT 
  'projects.project_type exists' as check_item,
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'project_type'
  ) as status;