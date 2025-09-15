-- Complete Children's Book Integration Migration
-- This script creates the necessary columns and relationships for both approaches:
-- 1. Standalone books using the books table directly
-- 2. Unified management with optional project linking

-- First, add the project_id column to books table (allows optional linking)
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for better performance on project_id lookups
CREATE INDEX IF NOT EXISTS idx_books_project_id ON books(project_id);

-- Add children's book specific columns to projects table for full integration
-- These are optional and only used when creating books through the projects interface
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'manuscript',
ADD COLUMN IF NOT EXISTS target_age VARCHAR(10),
ADD COLUMN IF NOT EXISTS book_theme VARCHAR(50),
ADD COLUMN IF NOT EXISTS illustration_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS author_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS total_pages INTEGER,
ADD COLUMN IF NOT EXISTS book_metadata JSONB DEFAULT '{}';

-- Create an index on project_type for filtering
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(project_type);

-- Optional: Create a view that combines books with their linked project data
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

-- Grant permissions (adjust as needed for your setup)
-- Note: You may need to modify these based on your specific role setup
-- GRANT SELECT, INSERT, UPDATE, DELETE ON books_with_projects TO authenticated;
-- GRANT USAGE ON SCHEMA public TO authenticated;

-- Verification queries to check the migration
-- Run these to verify everything was created successfully:

-- Check if books.project_id column exists
SELECT 
  'books.project_id column' as check_item,
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'books' AND column_name = 'project_id'
  ) as exists;

-- Check if projects.project_type column exists  
SELECT 
  'projects.project_type column' as check_item,
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'project_type'
  ) as exists;

-- Check if the view was created
SELECT 
  'books_with_projects view' as check_item,
  EXISTS(
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'books_with_projects'
  ) as exists;

-- Check existing data integrity
SELECT 
  COUNT(*) as total_books,
  COUNT(project_id) as books_with_projects,
  COUNT(*) - COUNT(project_id) as standalone_books
FROM books;

-- Sample query to see books with their optional project data
-- SELECT * FROM books_with_projects LIMIT 5;