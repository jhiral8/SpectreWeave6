-- Migration: Create book generations and related tables
-- These tables store generated stories and their metadata

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

-- Create book pages table for storing individual story pages
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
    
    -- Constraints
    CONSTRAINT book_pages_book_page_unique UNIQUE(book_id, page_number)
);

-- Create character consistency table for tracking character appearance consistency
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

-- Enable RLS (Row Level Security)
ALTER TABLE public.book_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_consistency ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for book_generations
CREATE POLICY "Users can view their own book generations" ON public.book_generations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own book generations" ON public.book_generations
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own book generations" ON public.book_generations
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own book generations" ON public.book_generations
    FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for book_pages
CREATE POLICY "Users can view their own book pages" ON public.book_pages
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own book pages" ON public.book_pages
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own book pages" ON public.book_pages
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own book pages" ON public.book_pages
    FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for character_consistency
CREATE POLICY "Users can view character consistency for their characters" ON public.character_consistency
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.character_profiles cp
            JOIN public.projects p ON p.id = cp.project_id
            WHERE cp.id = character_consistency.character_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert character consistency for their characters" ON public.character_consistency
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.character_profiles cp
            JOIN public.projects p ON p.id = cp.project_id
            WHERE cp.id = character_consistency.character_id 
            AND p.user_id = auth.uid()
        )
    );