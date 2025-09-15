-- Migration: Add Character Lock System for Consistent Character Generation
-- This migration creates tables for character profiles, reference images, and consistency tracking

-- Create character profiles table
CREATE TABLE IF NOT EXISTS character_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    visual_description TEXT NOT NULL,
    personality TEXT[] DEFAULT ARRAY[]::TEXT[],
    role VARCHAR(50) NOT NULL CHECK (role IN ('protagonist', 'antagonist', 'supporting', 'narrator', 'background')),
    appearance_embedding VECTOR(768), -- For multi-modal embeddings
    style_embedding VECTOR(768), -- For style consistency
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT unique_character_name_per_project UNIQUE (project_id, name)
);

-- Create character reference images table
CREATE TABLE IF NOT EXISTS character_reference_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES character_profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('front_view', 'side_view', 'back_view', 'close_up', 'full_body', 'emotion', 'outfit')),
    description TEXT,
    is_canonical BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one canonical image per type per character
    CONSTRAINT unique_canonical_per_type UNIQUE (character_id, type, is_canonical) DEFERRABLE INITIALLY DEFERRED
);

-- Create character consistency tracking table
CREATE TABLE IF NOT EXISTS character_consistency (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES character_profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    page_number INTEGER,
    book_id UUID, -- For legacy support
    consistency_score DECIMAL(3,2) NOT NULL CHECK (consistency_score >= 0 AND consistency_score <= 1),
    similarity_scores JSONB DEFAULT '{}',
    detected_features JSONB DEFAULT '{}',
    validation_results JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create character relationships table (for GraphRAG integration)
CREATE TABLE IF NOT EXISTS character_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES character_profiles(id) ON DELETE CASCADE,
    target_character_id UUID NOT NULL REFERENCES character_profiles(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) NOT NULL CHECK (relationship_type IN ('friend', 'family', 'enemy', 'neutral', 'romantic', 'mentor')),
    description TEXT,
    strength DECIMAL(3,2) DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
    context TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent self-relationships and duplicates
    CONSTRAINT no_self_relationship CHECK (character_id != target_character_id),
    CONSTRAINT unique_character_relationship UNIQUE (character_id, target_character_id)
);

-- Create character story elements table (for knowledge graph)
CREATE TABLE IF NOT EXISTS character_story_elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES character_profiles(id) ON DELETE CASCADE,
    element_type VARCHAR(20) NOT NULL CHECK (element_type IN ('setting', 'object', 'event', 'emotion', 'conflict')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    association_strength DECIMAL(3,2) DEFAULT 0.5 CHECK (association_strength >= 0 AND association_strength <= 1),
    appearances TEXT[] DEFAULT ARRAY[]::TEXT[], -- Page/scene references
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create character generation sessions table (for tracking generation attempts)
CREATE TABLE IF NOT EXISTS character_generation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES character_profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    scene_prompt TEXT NOT NULL,
    reference_mode VARCHAR(20) NOT NULL CHECK (reference_mode IN ('embedding', 'controlnet', 'hybrid')),
    consistency_threshold DECIMAL(3,2) NOT NULL,
    max_retries INTEGER NOT NULL,
    final_consistency_score DECIMAL(3,2),
    attempts_made INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    result_image_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_character_profiles_project_id ON character_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_character_profiles_name ON character_profiles(name);
CREATE INDEX IF NOT EXISTS idx_character_profiles_role ON character_profiles(role);

CREATE INDEX IF NOT EXISTS idx_character_reference_images_character_id ON character_reference_images(character_id);
CREATE INDEX IF NOT EXISTS idx_character_reference_images_type ON character_reference_images(type);
CREATE INDEX IF NOT EXISTS idx_character_reference_images_canonical ON character_reference_images(is_canonical) WHERE is_canonical = true;

CREATE INDEX IF NOT EXISTS idx_character_consistency_character_id ON character_consistency(character_id);
CREATE INDEX IF NOT EXISTS idx_character_consistency_project_id ON character_consistency(project_id);
CREATE INDEX IF NOT EXISTS idx_character_consistency_score ON character_consistency(consistency_score);
CREATE INDEX IF NOT EXISTS idx_character_consistency_created_at ON character_consistency(created_at);

CREATE INDEX IF NOT EXISTS idx_character_relationships_character_id ON character_relationships(character_id);
CREATE INDEX IF NOT EXISTS idx_character_relationships_target_id ON character_relationships(target_character_id);
CREATE INDEX IF NOT EXISTS idx_character_relationships_type ON character_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_character_story_elements_character_id ON character_story_elements(character_id);
CREATE INDEX IF NOT EXISTS idx_character_story_elements_type ON character_story_elements(element_type);

CREATE INDEX IF NOT EXISTS idx_character_generation_sessions_character_id ON character_generation_sessions(character_id);
CREATE INDEX IF NOT EXISTS idx_character_generation_sessions_project_id ON character_generation_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_character_generation_sessions_status ON character_generation_sessions(status);

-- Add triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_character_profiles_updated_at ON character_profiles;
CREATE TRIGGER update_character_profiles_updated_at 
    BEFORE UPDATE ON character_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_character_relationships_updated_at ON character_relationships;
CREATE TRIGGER update_character_relationships_updated_at 
    BEFORE UPDATE ON character_relationships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_character_story_elements_updated_at ON character_story_elements;
CREATE TRIGGER update_character_story_elements_updated_at 
    BEFORE UPDATE ON character_story_elements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_character_generation_sessions_updated_at ON character_generation_sessions;
CREATE TRIGGER update_character_generation_sessions_updated_at 
    BEFORE UPDATE ON character_generation_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE character_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_reference_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_consistency ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_story_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_generation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for character_profiles
CREATE POLICY "Users can view characters of their projects" ON character_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create characters for their projects" ON character_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update characters of their projects" ON character_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete characters of their projects" ON character_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- RLS policies for character_reference_images
CREATE POLICY "Users can view reference images of their characters" ON character_reference_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM character_profiles cp
            JOIN projects p ON p.id = cp.project_id 
            WHERE cp.id = character_reference_images.character_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create reference images for their characters" ON character_reference_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM character_profiles cp
            JOIN projects p ON p.id = cp.project_id 
            WHERE cp.id = character_reference_images.character_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update reference images of their characters" ON character_reference_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM character_profiles cp
            JOIN projects p ON p.id = cp.project_id 
            WHERE cp.id = character_reference_images.character_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete reference images of their characters" ON character_reference_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM character_profiles cp
            JOIN projects p ON p.id = cp.project_id 
            WHERE cp.id = character_reference_images.character_id 
            AND p.user_id = auth.uid()
        )
    );

-- RLS policies for character_consistency
CREATE POLICY "Users can view consistency data of their characters" ON character_consistency
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_consistency.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create consistency data for their characters" ON character_consistency
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_consistency.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- RLS policies for character_relationships
CREATE POLICY "Users can view relationships of their characters" ON character_relationships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM character_profiles cp
            JOIN projects p ON p.id = cp.project_id 
            WHERE cp.id = character_relationships.character_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create relationships for their characters" ON character_relationships
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM character_profiles cp
            JOIN projects p ON p.id = cp.project_id 
            WHERE cp.id = character_relationships.character_id 
            AND p.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM character_profiles cp2
            JOIN projects p2 ON p2.id = cp2.project_id 
            WHERE cp2.id = character_relationships.target_character_id 
            AND p2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update relationships of their characters" ON character_relationships
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM character_profiles cp
            JOIN projects p ON p.id = cp.project_id 
            WHERE cp.id = character_relationships.character_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete relationships of their characters" ON character_relationships
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM character_profiles cp
            JOIN projects p ON p.id = cp.project_id 
            WHERE cp.id = character_relationships.character_id 
            AND p.user_id = auth.uid()
        )
    );

-- RLS policies for character_story_elements
CREATE POLICY "Users can view story elements of their characters" ON character_story_elements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM character_profiles cp
            JOIN projects p ON p.id = cp.project_id 
            WHERE cp.id = character_story_elements.character_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create story elements for their characters" ON character_story_elements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM character_profiles cp
            JOIN projects p ON p.id = cp.project_id 
            WHERE cp.id = character_story_elements.character_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update story elements of their characters" ON character_story_elements
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM character_profiles cp
            JOIN projects p ON p.id = cp.project_id 
            WHERE cp.id = character_story_elements.character_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete story elements of their characters" ON character_story_elements
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM character_profiles cp
            JOIN projects p ON p.id = cp.project_id 
            WHERE cp.id = character_story_elements.character_id 
            AND p.user_id = auth.uid()
        )
    );

-- RLS policies for character_generation_sessions
CREATE POLICY "Users can view generation sessions of their characters" ON character_generation_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_generation_sessions.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create generation sessions for their characters" ON character_generation_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_generation_sessions.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update generation sessions of their characters" ON character_generation_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_generation_sessions.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Create storage bucket for character images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('character-images', 'character-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for character images storage
CREATE POLICY "Anyone can view character images" ON storage.objects
    FOR SELECT USING (bucket_id = 'character-images');

CREATE POLICY "Authenticated users can upload character images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'character-images' 
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can update their character images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'character-images' 
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can delete their character images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'character-images' 
        AND auth.uid() IS NOT NULL
    );

-- Add helpful views for common queries
CREATE OR REPLACE VIEW character_profiles_with_stats AS
SELECT 
    cp.*,
    COUNT(cri.id) as reference_image_count,
    COUNT(cc.id) as consistency_check_count,
    AVG(cc.consistency_score) as average_consistency_score,
    MAX(cc.created_at) as last_consistency_check
FROM character_profiles cp
LEFT JOIN character_reference_images cri ON cri.character_id = cp.id
LEFT JOIN character_consistency cc ON cc.character_id = cp.id
GROUP BY cp.id;

-- Function to get character consistency trend
CREATE OR REPLACE FUNCTION get_character_consistency_trend(character_id_param UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    avg_score DECIMAL,
    check_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(cc.created_at) as date,
        AVG(cc.consistency_score) as avg_score,
        COUNT(*) as check_count
    FROM character_consistency cc
    WHERE cc.character_id = character_id_param
        AND cc.created_at >= NOW() - INTERVAL '%s days' % days_back
    GROUP BY DATE(cc.created_at)
    ORDER BY DATE(cc.created_at);
END;
$$ LANGUAGE plpgsql;

-- Function to find similar characters based on embeddings
CREATE OR REPLACE FUNCTION find_similar_characters(
    character_id_param UUID,
    similarity_threshold DECIMAL DEFAULT 0.8,
    limit_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    similar_character_id UUID,
    character_name VARCHAR,
    similarity_score DECIMAL
) AS $$
BEGIN
    -- This is a placeholder for actual vector similarity search
    -- In a real implementation, this would use vector similarity functions
    RETURN QUERY
    SELECT 
        cp.id as similar_character_id,
        cp.name as character_name,
        0.85 as similarity_score -- Placeholder value
    FROM character_profiles cp
    WHERE cp.id != character_id_param
        AND cp.appearance_embedding IS NOT NULL
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE character_profiles IS 'Core character profiles for consistent character generation';
COMMENT ON TABLE character_reference_images IS 'Reference images used for character consistency';
COMMENT ON TABLE character_consistency IS 'Tracks consistency scores and validation results';
COMMENT ON TABLE character_relationships IS 'Character relationships for story context';
COMMENT ON TABLE character_story_elements IS 'Story elements associated with characters';
COMMENT ON TABLE character_generation_sessions IS 'Tracks character image generation sessions';

COMMENT ON COLUMN character_profiles.appearance_embedding IS 'Multi-modal embedding for character appearance';
COMMENT ON COLUMN character_profiles.style_embedding IS 'Embedding for character art style';
COMMENT ON COLUMN character_reference_images.is_canonical IS 'Whether this is the primary reference for this view type';
COMMENT ON COLUMN character_consistency.consistency_score IS 'Consistency score from 0 to 1';
COMMENT ON COLUMN character_relationships.strength IS 'Relationship strength from 0 to 1';

-- Insert some default character templates for common archetypes
INSERT INTO character_profiles (project_id, name, description, visual_description, personality, role, metadata)
SELECT 
    p.id,
    template.name,
    template.description,
    template.visual_description,
    template.personality,
    template.role,
    template.metadata::jsonb
FROM projects p,
(VALUES 
    ('Curious Child', 'A young protagonist full of wonder', 'A child with bright eyes, colorful clothes, and an eager expression', ARRAY['curious', 'brave', 'kind'], 'protagonist', '{"archetype": "template", "age_group": "3-5"}'),
    ('Wise Mentor', 'An older character who guides the protagonist', 'An elderly figure with kind eyes, gentle smile, and warm clothing', ARRAY['wise', 'patient', 'caring'], 'supporting', '{"archetype": "template", "role": "mentor"}'),
    ('Friendly Animal', 'A talking animal companion', 'A cute, expressive animal with human-like qualities and bright colors', ARRAY['loyal', 'funny', 'helpful'], 'supporting', '{"archetype": "template", "species": "various"}'),
    ('Magical Creature', 'A fantasy being with special powers', 'A mythical creature with sparkles, wings, or other magical features', ARRAY['magical', 'mysterious', 'helpful'], 'supporting', '{"archetype": "template", "type": "fantasy"}')
) AS template(name, description, visual_description, personality, role, metadata)
WHERE p.project_type = 'childrens-book'
AND NOT EXISTS (
    SELECT 1 FROM character_profiles cp 
    WHERE cp.project_id = p.id AND cp.name = template.name
)
LIMIT 0; -- Don't actually insert templates automatically, just show the structure