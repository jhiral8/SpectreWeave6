-- MINIMAL DATABASE FIX FOR BOOK_PAGES 400 ERRORS
-- This script ensures the book_pages table has the required columns
-- Run this AFTER running the diagnosis script to confirm what's missing

-- =======================================================================================
-- BACKUP EXISTING DATA (SAFETY FIRST)
-- =======================================================================================
DO $$
BEGIN
    -- Only create backup if table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'book_pages') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS book_pages_backup_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MI') || ' AS SELECT * FROM book_pages';
        RAISE NOTICE 'Backup created for book_pages table';
    END IF;
END $$;

-- =======================================================================================
-- ENSURE BOOK_PAGES TABLE EXISTS WITH REQUIRED COLUMNS
-- =======================================================================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS book_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns one by one (safe approach)
DO $$
BEGIN
    -- Add illustration_url column (the main issue)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='book_pages' AND column_name='illustration_url') THEN
        ALTER TABLE book_pages ADD COLUMN illustration_url TEXT;
        RAISE NOTICE 'Added illustration_url column to book_pages';
    END IF;
    
    -- Add illustration_prompt column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='book_pages' AND column_name='illustration_prompt') THEN
        ALTER TABLE book_pages ADD COLUMN illustration_prompt TEXT;
        RAISE NOTICE 'Added illustration_prompt column to book_pages';
    END IF;
    
    -- Add project_id column for new schema support
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='book_pages' AND column_name='project_id') THEN
        ALTER TABLE book_pages ADD COLUMN project_id UUID;
        RAISE NOTICE 'Added project_id column to book_pages';
    END IF;
    
    -- Add book_id column for legacy support
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='book_pages' AND column_name='book_id') THEN
        ALTER TABLE book_pages ADD COLUMN book_id UUID;
        RAISE NOTICE 'Added book_id column to book_pages';
    END IF;
    
    -- Add generation_id for tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='book_pages' AND column_name='generation_id') THEN
        ALTER TABLE book_pages ADD COLUMN generation_id UUID;
        RAISE NOTICE 'Added generation_id column to book_pages';
    END IF;
    
    -- Add additional media columns for future expansion
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='book_pages' AND column_name='video_url') THEN
        ALTER TABLE book_pages ADD COLUMN video_url TEXT;
        RAISE NOTICE 'Added video_url column to book_pages';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='book_pages' AND column_name='audio_url') THEN
        ALTER TABLE book_pages ADD COLUMN audio_url TEXT;
        RAISE NOTICE 'Added audio_url column to book_pages';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='book_pages' AND column_name='page_metadata') THEN
        ALTER TABLE book_pages ADD COLUMN page_metadata JSONB DEFAULT '{}';
        RAISE NOTICE 'Added page_metadata column to book_pages';
    END IF;
END $$;

-- =======================================================================================
-- CREATE NECESSARY INDEXES FOR PERFORMANCE
-- =======================================================================================
CREATE INDEX IF NOT EXISTS idx_book_pages_project_id ON book_pages(project_id);
CREATE INDEX IF NOT EXISTS idx_book_pages_book_id ON book_pages(book_id);
CREATE INDEX IF NOT EXISTS idx_book_pages_user_id ON book_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_book_pages_project_page ON book_pages(project_id, page_number);
CREATE INDEX IF NOT EXISTS idx_book_pages_book_page ON book_pages(book_id, page_number);

-- =======================================================================================
-- ENABLE ROW LEVEL SECURITY
-- =======================================================================================
ALTER TABLE book_pages ENABLE ROW LEVEL SECURITY;

-- =======================================================================================
-- CREATE OR UPDATE RLS POLICIES
-- =======================================================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own book pages" ON book_pages;
DROP POLICY IF EXISTS "Users can manage own book pages" ON book_pages;
DROP POLICY IF EXISTS "Users can view book pages of their projects" ON book_pages;
DROP POLICY IF EXISTS "Users can insert book pages for their projects" ON book_pages;
DROP POLICY IF EXISTS "Users can update book pages of their projects" ON book_pages;
DROP POLICY IF EXISTS "Users can delete book pages of their projects" ON book_pages;

-- Create comprehensive policies that handle both project_id and book_id approaches
CREATE POLICY "book_pages_select_policy" ON book_pages
    FOR SELECT USING (
        user_id = auth.uid() 
        OR 
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = book_pages.project_id 
            AND projects.user_id = auth.uid()
        ))
    );

CREATE POLICY "book_pages_insert_policy" ON book_pages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        AND (
            project_id IS NULL 
            OR EXISTS (
                SELECT 1 FROM projects 
                WHERE projects.id = book_pages.project_id 
                AND projects.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "book_pages_update_policy" ON book_pages
    FOR UPDATE USING (
        user_id = auth.uid() 
        OR 
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = book_pages.project_id 
            AND projects.user_id = auth.uid()
        ))
    );

CREATE POLICY "book_pages_delete_policy" ON book_pages
    FOR DELETE USING (
        user_id = auth.uid() 
        OR 
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = book_pages.project_id 
            AND projects.user_id = auth.uid()
        ))
    );

-- =======================================================================================
-- ADD CONSTRAINTS FOR DATA INTEGRITY
-- =======================================================================================
DO $$
BEGIN
    -- Add unique constraint for project pages
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'unique_project_page') THEN
        ALTER TABLE book_pages ADD CONSTRAINT unique_project_page UNIQUE (project_id, page_number);
        RAISE NOTICE 'Added unique constraint for project_id, page_number';
    END IF;
    
    -- Add unique constraint for book pages (legacy)
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'unique_book_page') THEN
        ALTER TABLE book_pages ADD CONSTRAINT unique_book_page UNIQUE (book_id, page_number);
        RAISE NOTICE 'Added unique constraint for book_id, page_number';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Note: Constraints may already exist or conflict with existing data';
END $$;

-- =======================================================================================
-- CREATE UPDATE TRIGGER FOR UPDATED_AT
-- =======================================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_book_pages_updated_at ON book_pages;
CREATE TRIGGER update_book_pages_updated_at 
    BEFORE UPDATE ON book_pages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================================================================================
-- VERIFICATION CHECK
-- =======================================================================================
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'book_pages' 
    AND column_name IN ('id', 'illustration_url', 'project_id', 'book_id', 'user_id', 'page_number');
    
    IF column_count >= 6 THEN
        RAISE NOTICE 'SUCCESS: book_pages table now has all required columns!';
    ELSE
        RAISE EXCEPTION 'FAILURE: book_pages table is still missing required columns. Found % of 6 required columns.', column_count;
    END IF;
END $$;

-- Final success message
SELECT 
    'MINIMAL FIX COMPLETED' as status,
    'book_pages table should now work with frontend code' as result;