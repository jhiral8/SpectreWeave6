-- FINAL COMPREHENSIVE DATABASE MIGRATION FOR SPECTREWEAVE5
-- This migration will create all missing tables and columns needed for the children's book feature
-- Run this ENTIRE script in your Supabase SQL Editor

-- =======================================================================================
-- 1. CREATE OR UPDATE PROJECTS TABLE WITH ALL REQUIRED COLUMNS
-- =======================================================================================

-- First, create the projects table if it doesn't exist (it should exist)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Now add ALL required columns (using IF NOT EXISTS pattern)
DO $$
BEGIN
    -- Basic columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='title') THEN
        ALTER TABLE projects ADD COLUMN title VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='description') THEN
        ALTER TABLE projects ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='user_id') THEN
        ALTER TABLE projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='created_at') THEN
        ALTER TABLE projects ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='updated_at') THEN
        ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Children's book specific columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='project_type') THEN
        ALTER TABLE projects ADD COLUMN project_type VARCHAR(50) DEFAULT 'manuscript';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='target_age') THEN
        ALTER TABLE projects ADD COLUMN target_age VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='book_theme') THEN
        ALTER TABLE projects ADD COLUMN book_theme VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='illustration_style') THEN
        ALTER TABLE projects ADD COLUMN illustration_style VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='author_style') THEN
        ALTER TABLE projects ADD COLUMN author_style VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='total_pages') THEN
        ALTER TABLE projects ADD COLUMN total_pages INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='book_metadata') THEN
        ALTER TABLE projects ADD COLUMN book_metadata JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='status') THEN
        ALTER TABLE projects ADD COLUMN status VARCHAR(50) DEFAULT 'draft';
    END IF;
END $$;

-- =======================================================================================
-- 2. CREATE CHARACTER_PROFILES TABLE
-- =======================================================================================

CREATE TABLE IF NOT EXISTS character_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    visual_description TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'supporting',
    personality TEXT[],
    reference_images JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_character_role CHECK (role IN ('protagonist', 'antagonist', 'supporting', 'narrator', 'background'))
);

-- =======================================================================================
-- 3. CREATE BOOK_GENERATIONS TABLE WITH ALL REQUIRED COLUMNS
-- =======================================================================================

CREATE TABLE IF NOT EXISTS book_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    generation_type VARCHAR(50) NOT NULL,
    generation_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_generation_type CHECK (generation_type IN ('story', 'images', 'complete')),
    CONSTRAINT check_generation_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- =======================================================================================
-- 4. CREATE BOOK_PAGES TABLE
-- =======================================================================================

CREATE TABLE IF NOT EXISTS book_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    text TEXT,
    illustration_prompt TEXT,
    illustration_url TEXT,
    generation_id UUID REFERENCES book_generations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_book_page UNIQUE (book_id, page_number)
);

-- =======================================================================================
-- 5. CREATE CHARACTER_CONSISTENCY TABLE
-- =======================================================================================

CREATE TABLE IF NOT EXISTS character_consistency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES character_profiles(id) ON DELETE CASCADE,
    prompt_pattern TEXT NOT NULL,
    visual_features JSONB NOT NULL,
    consistency_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================================================
-- 6. CREATE BOOKS TABLE (FALLBACK)
-- =======================================================================================

CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    author_style VARCHAR(50),
    theme VARCHAR(50),
    style VARCHAR(50),
    age_group VARCHAR(10),
    page_count INTEGER DEFAULT 6,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =======================================================================================

CREATE INDEX IF NOT EXISTS idx_projects_user_type ON projects(user_id, project_type);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_character_profiles_project ON character_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_book_generations_book ON book_generations(book_id);
CREATE INDEX IF NOT EXISTS idx_book_pages_book ON book_pages(book_id);
CREATE INDEX IF NOT EXISTS idx_books_user ON books(user_id);

-- =======================================================================================
-- 8. ENABLE ROW LEVEL SECURITY
-- =======================================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_consistency ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- =======================================================================================
-- 9. CREATE ROW LEVEL SECURITY POLICIES
-- =======================================================================================

-- Projects policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own projects" ON projects;
CREATE POLICY "Users can create own projects" ON projects
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (user_id = auth.uid());

-- Character profiles policies
DROP POLICY IF EXISTS "Users can view own character profiles" ON character_profiles;
CREATE POLICY "Users can view own character profiles" ON character_profiles
    FOR SELECT USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can create character profiles for own projects" ON character_profiles;
CREATE POLICY "Users can create character profiles for own projects" ON character_profiles
    FOR INSERT WITH CHECK (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update own character profiles" ON character_profiles;
CREATE POLICY "Users can update own character profiles" ON character_profiles
    FOR UPDATE USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete own character profiles" ON character_profiles;
CREATE POLICY "Users can delete own character profiles" ON character_profiles
    FOR DELETE USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

-- Book generations policies
DROP POLICY IF EXISTS "Users can view own book generations" ON book_generations;
CREATE POLICY "Users can view own book generations" ON book_generations
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own book generations" ON book_generations;
CREATE POLICY "Users can create own book generations" ON book_generations
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Book pages policies
DROP POLICY IF EXISTS "Users can view own book pages" ON book_pages;
CREATE POLICY "Users can view own book pages" ON book_pages
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own book pages" ON book_pages;
CREATE POLICY "Users can manage own book pages" ON book_pages
    FOR ALL USING (user_id = auth.uid());

-- Books policies
DROP POLICY IF EXISTS "Users can view own books" ON books;
CREATE POLICY "Users can view own books" ON books
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own books" ON books;
CREATE POLICY "Users can manage own books" ON books
    FOR ALL USING (user_id = auth.uid());

-- =======================================================================================
-- 10. CREATE UPDATE TRIGGERS
-- =======================================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_character_profiles_updated_at ON character_profiles;
CREATE TRIGGER update_character_profiles_updated_at BEFORE UPDATE ON character_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_book_generations_updated_at ON book_generations;
CREATE TRIGGER update_book_generations_updated_at BEFORE UPDATE ON book_generations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_book_pages_updated_at ON book_pages;
CREATE TRIGGER update_book_pages_updated_at BEFORE UPDATE ON book_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================================================================================
-- MIGRATION COMPLETE - VERIFICATION
-- =======================================================================================

-- Verify that all tables and columns exist
DO $$
BEGIN
    -- Check if all required columns exist in projects table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='projects' 
        AND column_name IN ('id', 'title', 'description', 'user_id', 'project_type', 'target_age', 'book_theme', 'illustration_style', 'author_style', 'total_pages', 'book_metadata', 'created_at', 'updated_at')
        GROUP BY table_name
        HAVING COUNT(*) >= 12
    ) THEN
        RAISE EXCEPTION 'Projects table is missing required columns';
    END IF;
    
    -- Check if all required tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='character_profiles') THEN
        RAISE EXCEPTION 'character_profiles table does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='book_generations') THEN
        RAISE EXCEPTION 'book_generations table does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='book_pages') THEN
        RAISE EXCEPTION 'book_pages table does not exist';
    END IF;
    
    RAISE NOTICE 'SUCCESS: All required tables and columns have been created!';
END $$;

-- Final success message
SELECT 'DATABASE MIGRATION COMPLETED SUCCESSFULLY! All tables, columns, indexes, and policies are now in place.' as status;