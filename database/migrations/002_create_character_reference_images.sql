-- Migration: Create character reference images table
-- This table stores reference images for characters in the character lock system

CREATE TABLE IF NOT EXISTS public.character_reference_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_id UUID NOT NULL REFERENCES public.character_profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('front_view', 'side_view', 'back_view', 'close_up', 'full_body', 'emotion', 'outfit')),
    description TEXT DEFAULT '',
    is_canonical BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT character_reference_images_character_id_type_canonical UNIQUE(character_id, type, is_canonical) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_character_reference_images_character_id ON public.character_reference_images(character_id);
CREATE INDEX IF NOT EXISTS idx_character_reference_images_type ON public.character_reference_images(type);
CREATE INDEX IF NOT EXISTS idx_character_reference_images_canonical ON public.character_reference_images(is_canonical);

-- Enable RLS (Row Level Security)
ALTER TABLE public.character_reference_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view reference images for their character profiles" ON public.character_reference_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.character_profiles cp
            JOIN public.projects p ON p.id = cp.project_id
            WHERE cp.id = character_reference_images.character_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert reference images for their character profiles" ON public.character_reference_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.character_profiles cp
            JOIN public.projects p ON p.id = cp.project_id
            WHERE cp.id = character_reference_images.character_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update reference images for their character profiles" ON public.character_reference_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.character_profiles cp
            JOIN public.projects p ON p.id = cp.project_id
            WHERE cp.id = character_reference_images.character_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete reference images for their character profiles" ON public.character_reference_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.character_profiles cp
            JOIN public.projects p ON p.id = cp.project_id
            WHERE cp.id = character_reference_images.character_id 
            AND p.user_id = auth.uid()
        )
    );