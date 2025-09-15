-- Integration Migration: Link books with projects table
-- This adds the necessary columns to enable both standalone books and project-linked books

-- Add project_id column to books table (allows optional linking)
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for better performance on project_id lookups
CREATE INDEX IF NOT EXISTS idx_books_project_id ON books(project_id);

-- Add children's book specific columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'manuscript',
ADD COLUMN IF NOT EXISTS target_age VARCHAR(10),
ADD COLUMN IF NOT EXISTS book_theme VARCHAR(50),
ADD COLUMN IF NOT EXISTS illustration_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS author_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS total_pages INTEGER,
ADD COLUMN IF NOT EXISTS book_metadata JSONB DEFAULT '{}';

-- Create index on project_type for filtering
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(project_type);

-- Create a view that combines books with their linked project data
CREATE OR REPLACE VIEW books_with_projects AS
SELECT 
    b.*,
    p.title as project_title,
    p.description as project_description,
    p.project_type,
    p.status as project_status,
    p.archived as project_archived
FROM books b
LEFT JOIN projects p ON b.project_id = p.id;