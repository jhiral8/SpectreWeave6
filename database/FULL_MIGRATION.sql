-- Complete Database Migration for SpectreWeave5 Children's Books Feature
-- Run this in your Supabase SQL Editor

-- Step 1: Add missing columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'manuscript',
ADD COLUMN IF NOT EXISTS target_age VARCHAR(10),
ADD COLUMN IF NOT EXISTS book_theme VARCHAR(50),
ADD COLUMN IF NOT EXISTS illustration_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS author_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS total_pages INTEGER,
ADD COLUMN IF NOT EXISTS book_metadata JSONB DEFAULT '{}';

-- Add constraints for valid values
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_project_type;
ALTER TABLE projects ADD CONSTRAINT check_project_type 
CHECK (project_type IN ('manuscript', 'childrens-book', 'poetry', 'screenplay'));

ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_target_age;
ALTER TABLE projects ADD CONSTRAINT check_target_age 
CHECK (target_age IS NULL OR target_age IN ('0-2', '3-5', '6-8', '9-12', 'teen'));

-- Step 2: Create character_profiles table
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
    CONSTRAINT check_role CHECK (role IN ('protagonist', 'antagonist', 'supporting', 'narrator', 'background'))
);

-- Step 3: Create book_generations table
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
    CONSTRAINT check_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Step 4: Create book_pages table
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

-- Step 5: Create character_consistency table
CREATE TABLE IF NOT EXISTS character_consistency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES character_profiles(id) ON DELETE CASCADE,
    prompt_pattern TEXT NOT NULL,
    visual_features JSONB NOT NULL,
    consistency_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create books table (if not exists)
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

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_type ON projects(user_id, project_type);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_character_profiles_project ON character_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_book_generations_book ON book_generations(book_id);
CREATE INDEX IF NOT EXISTS idx_book_pages_book ON book_pages(book_id);
CREATE INDEX IF NOT EXISTS idx_books_user ON books(user_id);

-- Step 8: Enable Row Level Security (RLS)
ALTER TABLE character_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_consistency ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
-- Character profiles policies
CREATE POLICY "Users can view own character profiles" ON character_profiles
    FOR SELECT USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create character profiles for own projects" ON character_profiles
    FOR INSERT WITH CHECK (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own character profiles" ON character_profiles
    FOR UPDATE USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete own character profiles" ON character_profiles
    FOR DELETE USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

-- Book generations policies
CREATE POLICY "Users can view own book generations" ON book_generations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own book generations" ON book_generations
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Book pages policies
CREATE POLICY "Users can view own book pages" ON book_pages
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own book pages" ON book_pages
    FOR ALL USING (user_id = auth.uid());

-- Character consistency policies
CREATE POLICY "Users can view character consistency for own projects" ON character_consistency
    FOR SELECT USING (
        character_id IN (
            SELECT cp.id FROM character_profiles cp
            JOIN projects p ON cp.project_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage character consistency for own projects" ON character_consistency
    FOR ALL USING (
        character_id IN (
            SELECT cp.id FROM character_profiles cp
            JOIN projects p ON cp.project_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

-- Books policies
CREATE POLICY "Users can view own books" ON books
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own books" ON books
    FOR ALL USING (user_id = auth.uid());

-- Step 10: Update functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_character_profiles_updated_at BEFORE UPDATE ON character_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_generations_updated_at BEFORE UPDATE ON book_generations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_pages_updated_at BEFORE UPDATE ON book_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration complete!
SELECT 'Migration completed successfully!' as status;