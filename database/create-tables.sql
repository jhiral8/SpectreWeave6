-- Combined SQL script to create all required tables for children's book API
-- Run this in Supabase SQL Editor

-- 1. Create character profiles table
CREATE TABLE IF NOT EXISTS public.character_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    visual_description TEXT DEFAULT '',
    personality TEXT[] DEFAULT '{}',
    role TEXT DEFAULT 'supporting' CHECK (role IN ('protagonist', 'antagonist', 'supporting', 'narrator', 'background')),
    appearance_embedding FLOAT[] DEFAULT NULL,
    style_embedding FLOAT[] DEFAULT NULL,
    metadata JSONB DEFAULT '{"totalAppearances": 0, "averageConsistencyScore": 0, "preferredStyles": [], "inconsistencyFlags": [], "tags": []}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT character_profiles_project_name_unique UNIQUE(project_id, name)
);

-- 2. Create character reference images table
CREATE TABLE IF NOT EXISTS public.character_reference_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_id UUID NOT NULL REFERENCES public.character_profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('front_view', 'side_view', 'back_view', 'close_up', 'full_body', 'emotion', 'outfit')),
    description TEXT DEFAULT '',
    is_canonical BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create book generations table
CREATE TABLE IF NOT EXISTS public.book_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    generation_type TEXT NOT NULL CHECK (generation_type IN ('story', 'illustration', 'batch_illustration')),
    generation_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create book pages table
CREATE TABLE IF NOT EXISTS public.book_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    text TEXT DEFAULT '',
    illustration_prompt TEXT DEFAULT '',
    illustration_url TEXT DEFAULT NULL,
    generation_id UUID REFERENCES public.book_generations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT book_pages_book_page_unique UNIQUE(book_id, page_number)
);

-- 5. Create character consistency table
CREATE TABLE IF NOT EXISTS public.character_consistency (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_id UUID REFERENCES public.character_profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    page_number INTEGER DEFAULT NULL,
    book_id UUID DEFAULT NULL,
    project_id UUID DEFAULT NULL,
    consistency_score FLOAT NOT NULL DEFAULT 0.0,
    similarity_scores JSONB DEFAULT '{}'::jsonb,
    detected_features JSONB DEFAULT '{}'::jsonb,
    validation_results JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_character_profiles_project_id ON public.character_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_character_profiles_name ON public.character_profiles(name);
CREATE INDEX IF NOT EXISTS idx_character_profiles_role ON public.character_profiles(role);

CREATE INDEX IF NOT EXISTS idx_character_reference_images_character_id ON public.character_reference_images(character_id);
CREATE INDEX IF NOT EXISTS idx_character_reference_images_type ON public.character_reference_images(type);
CREATE INDEX IF NOT EXISTS idx_character_reference_images_canonical ON public.character_reference_images(is_canonical);

CREATE INDEX IF NOT EXISTS idx_book_generations_book_id ON public.book_generations(book_id);
CREATE INDEX IF NOT EXISTS idx_book_generations_user_id ON public.book_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_book_generations_type ON public.book_generations(generation_type);
CREATE INDEX IF NOT EXISTS idx_book_generations_status ON public.book_generations(status);

CREATE INDEX IF NOT EXISTS idx_book_pages_book_id ON public.book_pages(book_id);
CREATE INDEX IF NOT EXISTS idx_book_pages_user_id ON public.book_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_book_pages_page_number ON public.book_pages(page_number);
CREATE INDEX IF NOT EXISTS idx_book_pages_generation_id ON public.book_pages(generation_id);

CREATE INDEX IF NOT EXISTS idx_character_consistency_character_id ON public.character_consistency(character_id);
CREATE INDEX IF NOT EXISTS idx_character_consistency_book_id ON public.character_consistency(book_id);
CREATE INDEX IF NOT EXISTS idx_character_consistency_project_id ON public.character_consistency(project_id);
CREATE INDEX IF NOT EXISTS idx_character_consistency_score ON public.character_consistency(consistency_score);

-- Enable RLS (Row Level Security) for all tables
ALTER TABLE public.character_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_reference_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_consistency ENABLE ROW LEVEL SECURITY;

-- RLS Policies for character_profiles
DROP POLICY IF EXISTS "Users can view character profiles for their projects" ON public.character_profiles;
CREATE POLICY "Users can view character profiles for their projects" ON public.character_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.books 
            WHERE books.id = character_profiles.project_id 
            AND books.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert character profiles for their projects" ON public.character_profiles;
CREATE POLICY "Users can insert character profiles for their projects" ON public.character_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.books 
            WHERE books.id = character_profiles.project_id 
            AND books.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update character profiles for their projects" ON public.character_profiles;
CREATE POLICY "Users can update character profiles for their projects" ON public.character_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.books 
            WHERE books.id = character_profiles.project_id 
            AND books.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete character profiles for their projects" ON public.character_profiles;
CREATE POLICY "Users can delete character profiles for their projects" ON public.character_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.books 
            WHERE books.id = character_profiles.project_id 
            AND books.user_id = auth.uid()
        )
    );

-- RLS Policies for book_generations
DROP POLICY IF EXISTS "Users can view their own book generations" ON public.book_generations;
CREATE POLICY "Users can view their own book generations" ON public.book_generations
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own book generations" ON public.book_generations;
CREATE POLICY "Users can insert their own book generations" ON public.book_generations
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own book generations" ON public.book_generations;
CREATE POLICY "Users can update their own book generations" ON public.book_generations
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own book generations" ON public.book_generations;
CREATE POLICY "Users can delete their own book generations" ON public.book_generations
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for book_pages
DROP POLICY IF EXISTS "Users can view their own book pages" ON public.book_pages;
CREATE POLICY "Users can view their own book pages" ON public.book_pages
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own book pages" ON public.book_pages;
CREATE POLICY "Users can insert their own book pages" ON public.book_pages
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own book pages" ON public.book_pages;
CREATE POLICY "Users can update their own book pages" ON public.book_pages
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own book pages" ON public.book_pages;
CREATE POLICY "Users can delete their own book pages" ON public.book_pages
    FOR DELETE USING (user_id = auth.uid());