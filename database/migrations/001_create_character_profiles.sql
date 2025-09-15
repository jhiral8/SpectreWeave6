-- Migration: Create character profiles table for character lock system
-- This table stores character profiles used for consistent character generation

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
    metadata JSONB DEFAULT '{
        "totalAppearances": 0,
        "averageConsistencyScore": 0,
        "preferredStyles": [],
        "inconsistencyFlags": [],
        "tags": []
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT character_profiles_project_name_unique UNIQUE(project_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_character_profiles_project_id ON public.character_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_character_profiles_name ON public.character_profiles(name);
CREATE INDEX IF NOT EXISTS idx_character_profiles_role ON public.character_profiles(role);

-- Enable RLS (Row Level Security)
ALTER TABLE public.character_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view character profiles for their projects" ON public.character_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert character profiles for their projects" ON public.character_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update character profiles for their projects" ON public.character_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete character profiles for their projects" ON public.character_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
    );