-- Fix RLS policies for book_pages to handle both project_id and book_id schemas
-- This addresses the "new row violates row-level security policy" errors

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view book pages of their projects" ON book_pages;
DROP POLICY IF EXISTS "Users can insert book pages for their projects" ON book_pages;
DROP POLICY IF EXISTS "Users can update book pages of their projects" ON book_pages;
DROP POLICY IF EXISTS "Users can delete book pages of their projects" ON book_pages;

-- Create new policies that handle both project_id and book_id schemas
-- SELECT policy - allows reading if user owns the project OR the book
CREATE POLICY "Users can view their book pages" ON book_pages
    FOR SELECT USING (
        -- Check project_id first (new schema)
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = book_pages.project_id 
            AND projects.user_id = auth.uid()
        ))
        OR
        -- Check book_id fallback (legacy schema)
        (book_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM books 
            WHERE books.id = book_pages.book_id 
            AND books.user_id = auth.uid()
        ))
        OR
        -- Direct user_id check (if available)
        (user_id = auth.uid())
    );

-- INSERT policy - allows creating if user owns the project OR book
CREATE POLICY "Users can insert their book pages" ON book_pages
    FOR INSERT WITH CHECK (
        -- Check project_id first (new schema)
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = book_pages.project_id 
            AND projects.user_id = auth.uid()
        ))
        OR
        -- Check book_id fallback (legacy schema)
        (book_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM books 
            WHERE books.id = book_pages.book_id 
            AND books.user_id = auth.uid()
        ))
        OR
        -- Direct user_id check (if available)
        (user_id = auth.uid())
    );

-- UPDATE policy - allows updating if user owns the project OR book
CREATE POLICY "Users can update their book pages" ON book_pages
    FOR UPDATE USING (
        -- Check project_id first (new schema)
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = book_pages.project_id 
            AND projects.user_id = auth.uid()
        ))
        OR
        -- Check book_id fallback (legacy schema)
        (book_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM books 
            WHERE books.id = book_pages.book_id 
            AND books.user_id = auth.uid()
        ))
        OR
        -- Direct user_id check (if available)
        (user_id = auth.uid())
    );

-- DELETE policy - allows deleting if user owns the project OR book
CREATE POLICY "Users can delete their book pages" ON book_pages
    FOR DELETE USING (
        -- Check project_id first (new schema)
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = book_pages.project_id 
            AND projects.user_id = auth.uid()
        ))
        OR
        -- Check book_id fallback (legacy schema)
        (book_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM books 
            WHERE books.id = book_pages.book_id 
            AND books.user_id = auth.uid()
        ))
        OR
        -- Direct user_id check (if available)
        (user_id = auth.uid())
    );

-- Add comment for documentation
COMMENT ON TABLE book_pages IS 'Individual pages of children''s books with text and media. RLS policies handle both project_id (new) and book_id (legacy) schemas.';