-- Character Lock System Migration for SpectreWeave5
-- Implements comprehensive character consistency tracking with multi-modal embeddings and GraphRAG integration

-- Character profiles table - stores detailed character information and reference data
CREATE TABLE IF NOT EXISTS character_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    role VARCHAR(50) DEFAULT 'main', -- main, supporting, background, narrator
    
    -- Physical characteristics
    physical_traits JSONB NOT NULL DEFAULT '{}', -- {"height": "tall", "hair_color": "brown", "eye_color": "blue", etc.}
    personality_traits JSONB NOT NULL DEFAULT '{}', -- {"brave": true, "curious": true, "kind": true, etc.}
    
    -- Visual consistency data
    reference_images JSONB DEFAULT '[]', -- Array of image URLs for turnarounds/reference
    character_embeddings JSONB DEFAULT '{}', -- Multi-modal embeddings for consistency matching
    style_tokens JSONB DEFAULT '[]', -- Special tokens for prompt engineering
    
    -- Consistency tracking
    consistency_score FLOAT DEFAULT 0.0, -- Current consistency score (0-1)
    total_generations INTEGER DEFAULT 0,
    consistent_generations INTEGER DEFAULT 0,
    
    -- GraphRAG integration
    neo4j_node_id VARCHAR(255), -- Reference to Neo4j character node
    knowledge_graph_data JSONB DEFAULT '{}',
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_role CHECK (role IN ('main', 'supporting', 'background', 'narrator')),
    CONSTRAINT valid_consistency_score CHECK (consistency_score >= 0.0 AND consistency_score <= 1.0)
);

-- Backfill missing columns if the table already existed from a previous migration
ALTER TABLE character_profiles
  ADD COLUMN IF NOT EXISTS consistency_score FLOAT DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS neo4j_node_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS character_embeddings JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS style_tokens JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS knowledge_graph_data JSONB DEFAULT '{}';

-- Character appearances table - tracks every generated image of characters
CREATE TABLE IF NOT EXISTS character_appearances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_profile_id UUID NOT NULL REFERENCES character_profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    page_id UUID REFERENCES book_pages(id) ON DELETE CASCADE,
    
    -- Image data
    image_url TEXT NOT NULL,
    image_base64 TEXT, -- For embedding generation
    prompt_used TEXT NOT NULL,
    enhanced_prompt TEXT,
    
    -- Consistency analysis
    embedding_vector JSONB, -- Multi-modal embedding of this appearance
    consistency_score FLOAT DEFAULT 0.0, -- Similarity to reference embeddings
    similarity_scores JSONB DEFAULT '{}', -- Detailed similarity breakdown
    
    -- Generation metadata
    generation_model VARCHAR(100),
    style_used VARCHAR(100),
    controlnet_applied BOOLEAN DEFAULT false,
    reference_image_used TEXT, -- URL of reference image if used
    
    -- Validation status
    validated BOOLEAN DEFAULT false,
    validation_score FLOAT,
    validation_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_appearance_consistency_score CHECK (consistency_score >= 0.0 AND consistency_score <= 1.0),
    CONSTRAINT valid_validation_score CHECK (validation_score IS NULL OR (validation_score >= 0.0 AND validation_score <= 1.0))
);

-- Character turnarounds table - stores 360-degree reference views
CREATE TABLE IF NOT EXISTS character_turnarounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_profile_id UUID NOT NULL REFERENCES character_profiles(id) ON DELETE CASCADE,
    
    -- Turnaround views
    front_view_url TEXT,
    side_view_url TEXT,
    back_view_url TEXT,
    three_quarter_view_url TEXT,
    
    -- Additional angles
    additional_angles JSONB DEFAULT '[]', -- Array of {angle: string, url: string}
    
    -- Style information
    illustration_style VARCHAR(100) NOT NULL,
    art_style_notes TEXT,
    
    -- Embedding data
    master_embedding JSONB, -- Combined embedding from all views
    view_embeddings JSONB DEFAULT '{}', -- Individual embeddings per view
    
    -- Generation metadata
    generated_as_batch BOOLEAN DEFAULT false,
    generation_prompt TEXT,
    consistency_validated BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Character consistency rules table - defines consistency validation rules
CREATE TABLE IF NOT EXISTS character_consistency_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_profile_id UUID NOT NULL REFERENCES character_profiles(id) ON DELETE CASCADE,
    
    -- Rule definition
    rule_type VARCHAR(50) NOT NULL, -- embedding_similarity, trait_validation, style_consistency
    rule_config JSONB NOT NULL,
    weight FLOAT DEFAULT 1.0, -- Importance weight for scoring
    
    -- Validation thresholds
    min_score FLOAT DEFAULT 0.7,
    warning_threshold FLOAT DEFAULT 0.8,
    
    -- Rule metadata
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_rule_type CHECK (rule_type IN ('embedding_similarity', 'trait_validation', 'style_consistency', 'pose_consistency', 'color_consistency')),
    CONSTRAINT valid_weight CHECK (weight >= 0.0 AND weight <= 2.0),
    CONSTRAINT valid_thresholds CHECK (min_score >= 0.0 AND min_score <= 1.0 AND warning_threshold >= 0.0 AND warning_threshold <= 1.0)
);

-- Character generation sessions table - tracks batch generation sessions
CREATE TABLE IF NOT EXISTS character_generation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Session details
    session_type VARCHAR(50) NOT NULL, -- character_creation, book_illustration, turnaround_generation
    status VARCHAR(20) DEFAULT 'pending',
    
    -- Characters involved
    character_profiles JSONB NOT NULL, -- Array of character profile IDs
    total_generations INTEGER DEFAULT 0,
    completed_generations INTEGER DEFAULT 0,
    failed_generations INTEGER DEFAULT 0,
    
    -- Quality metrics
    average_consistency_score FLOAT DEFAULT 0.0,
    session_quality_score FLOAT DEFAULT 0.0,
    
    -- Session configuration
    generation_config JSONB DEFAULT '{}',
    consistency_config JSONB DEFAULT '{}',
    
    -- Results
    generated_images JSONB DEFAULT '[]', -- Array of generated image metadata
    consistency_report JSONB DEFAULT '{}',
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_session_type CHECK (session_type IN ('character_creation', 'book_illustration', 'turnaround_generation', 'consistency_validation')),
    CONSTRAINT valid_session_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled'))
);

-- Ensure columns used by indexes exist when table pre-exists
ALTER TABLE character_generation_sessions
  ADD COLUMN IF NOT EXISTS session_type VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();

-- Vector similarity cache table - caches embedding similarity calculations
CREATE TABLE IF NOT EXISTS character_similarity_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source and target
    source_appearance_id UUID REFERENCES character_appearances(id) ON DELETE CASCADE,
    target_appearance_id UUID REFERENCES character_appearances(id) ON DELETE CASCADE,
    
    -- Similarity metrics
    cosine_similarity FLOAT NOT NULL,
    euclidean_distance FLOAT,
    structural_similarity JSONB DEFAULT '{}', -- Breakdown by facial features, pose, etc.
    
    -- Metadata
    embedding_model VARCHAR(100) NOT NULL,
    calculation_method VARCHAR(50) NOT NULL,
    
    -- Caching
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    
    CONSTRAINT unique_similarity_pair UNIQUE (source_appearance_id, target_appearance_id),
    CONSTRAINT valid_cosine_similarity CHECK (cosine_similarity >= -1.0 AND cosine_similarity <= 1.0),
    CONSTRAINT valid_euclidean_distance CHECK (euclidean_distance >= 0.0)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_character_profiles_project_id ON character_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_character_profiles_name ON character_profiles(name);
CREATE INDEX IF NOT EXISTS idx_character_profiles_role ON character_profiles(role);
CREATE INDEX IF NOT EXISTS idx_character_profiles_consistency_score ON character_profiles(consistency_score);
CREATE INDEX IF NOT EXISTS idx_character_profiles_neo4j_node ON character_profiles(neo4j_node_id);

CREATE INDEX IF NOT EXISTS idx_character_appearances_character_profile ON character_appearances(character_profile_id);
CREATE INDEX IF NOT EXISTS idx_character_appearances_project_id ON character_appearances(project_id);
CREATE INDEX IF NOT EXISTS idx_character_appearances_page_id ON character_appearances(page_id);
CREATE INDEX IF NOT EXISTS idx_character_appearances_consistency_score ON character_appearances(consistency_score);
CREATE INDEX IF NOT EXISTS idx_character_appearances_validated ON character_appearances(validated);
CREATE INDEX IF NOT EXISTS idx_character_appearances_created_at ON character_appearances(created_at);

CREATE INDEX IF NOT EXISTS idx_character_turnarounds_character_profile ON character_turnarounds(character_profile_id);
CREATE INDEX IF NOT EXISTS idx_character_turnarounds_style ON character_turnarounds(illustration_style);

CREATE INDEX IF NOT EXISTS idx_character_consistency_rules_character_profile ON character_consistency_rules(character_profile_id);
CREATE INDEX IF NOT EXISTS idx_character_consistency_rules_type ON character_consistency_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_character_consistency_rules_active ON character_consistency_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_character_generation_sessions_project_id ON character_generation_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_character_generation_sessions_status ON character_generation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_character_generation_sessions_type ON character_generation_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_character_generation_sessions_started_at ON character_generation_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_character_similarity_cache_source ON character_similarity_cache(source_appearance_id);
CREATE INDEX IF NOT EXISTS idx_character_similarity_cache_target ON character_similarity_cache(target_appearance_id);
CREATE INDEX IF NOT EXISTS idx_character_similarity_cache_expires ON character_similarity_cache(expires_at);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_character_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_character_profiles_updated_at'
  ) THEN
CREATE TRIGGER update_character_profiles_updated_at 
    BEFORE UPDATE ON character_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_character_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_character_appearances_updated_at'
  ) THEN
CREATE TRIGGER update_character_appearances_updated_at 
    BEFORE UPDATE ON character_appearances 
    FOR EACH ROW EXECUTE FUNCTION update_character_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_character_turnarounds_updated_at'
  ) THEN
CREATE TRIGGER update_character_turnarounds_updated_at 
    BEFORE UPDATE ON character_turnarounds 
    FOR EACH ROW EXECUTE FUNCTION update_character_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_character_consistency_rules_updated_at'
  ) THEN
CREATE TRIGGER update_character_consistency_rules_updated_at 
    BEFORE UPDATE ON character_consistency_rules 
    FOR EACH ROW EXECUTE FUNCTION update_character_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_character_generation_sessions_updated_at'
  ) THEN
CREATE TRIGGER update_character_generation_sessions_updated_at 
    BEFORE UPDATE ON character_generation_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_character_updated_at_column();
  END IF;
END $$;

-- Function to update character consistency scores
CREATE OR REPLACE FUNCTION update_character_consistency_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the character profile's consistency metrics
    WITH consistency_stats AS (
        SELECT 
            COUNT(*) as total_appearances,
            AVG(consistency_score) as avg_consistency,
            COUNT(*) FILTER (WHERE consistency_score >= 0.8) as consistent_count
        FROM character_appearances 
        WHERE character_profile_id = NEW.character_profile_id
    )
    UPDATE character_profiles 
    SET 
        total_generations = consistency_stats.total_appearances,
        consistent_generations = consistency_stats.consistent_count,
        consistency_score = COALESCE(consistency_stats.avg_consistency, 0.0)
    FROM consistency_stats 
    WHERE id = NEW.character_profile_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_character_consistency_on_appearance_change'
  ) THEN
CREATE TRIGGER update_character_consistency_on_appearance_change
    AFTER INSERT OR UPDATE ON character_appearances
    FOR EACH ROW EXECUTE FUNCTION update_character_consistency_score();
  END IF;
END $$;

-- Function to clean up expired similarity cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_similarity_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM character_similarity_cache 
    WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Row Level Security policies
ALTER TABLE character_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_appearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_turnarounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_consistency_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_similarity_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies for character_profiles
CREATE POLICY "Users can view character profiles of their projects" ON character_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert character profiles for their projects" ON character_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update character profiles of their projects" ON character_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete character profiles of their projects" ON character_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_profiles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- RLS policies for character_appearances
CREATE POLICY "Users can view character appearances of their projects" ON character_appearances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_appearances.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert character appearances for their projects" ON character_appearances
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_appearances.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update character appearances of their projects" ON character_appearances
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_appearances.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete character appearances of their projects" ON character_appearances
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = character_appearances.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Similar RLS policies for other tables (abbreviated for brevity)
CREATE POLICY "character_turnarounds_access" ON character_turnarounds FOR ALL USING (
    EXISTS (
        SELECT 1 FROM character_profiles cp 
        JOIN projects p ON p.id = cp.project_id 
        WHERE cp.id = character_turnarounds.character_profile_id 
        AND p.user_id = auth.uid()
    )
);

CREATE POLICY "character_consistency_rules_access" ON character_consistency_rules FOR ALL USING (
    EXISTS (
        SELECT 1 FROM character_profiles cp 
        JOIN projects p ON p.id = cp.project_id 
        WHERE cp.id = character_consistency_rules.character_profile_id 
        AND p.user_id = auth.uid()
    )
);

CREATE POLICY "character_generation_sessions_access" ON character_generation_sessions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = character_generation_sessions.project_id 
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "character_similarity_cache_access" ON character_similarity_cache FOR ALL USING (
    EXISTS (
        SELECT 1 FROM character_appearances ca
        JOIN projects p ON p.id = ca.project_id 
        WHERE ca.id = character_similarity_cache.source_appearance_id 
        AND p.user_id = auth.uid()
    )
);

-- Default character consistency rules
INSERT INTO character_consistency_rules (character_profile_id, rule_type, rule_config, weight, min_score, description)
SELECT 
    cp.id,
    'embedding_similarity',
    '{"similarity_threshold": 0.85, "comparison_method": "cosine", "feature_weights": {"face": 0.4, "clothing": 0.2, "pose": 0.2, "style": 0.2}}',
    1.0,
    0.8,
    'Primary embedding similarity validation for character consistency'
FROM character_profiles cp
WHERE NOT EXISTS (
    SELECT 1 FROM character_consistency_rules ccr 
    WHERE ccr.character_profile_id = cp.id 
    AND ccr.rule_type = 'embedding_similarity'
);

-- Comments for documentation
COMMENT ON TABLE character_profiles IS 'Comprehensive character profile data with multi-modal embeddings for consistency tracking';
COMMENT ON TABLE character_appearances IS 'Every generated image of characters with consistency analysis and embedding data';
COMMENT ON TABLE character_turnarounds IS '360-degree reference views for characters to ensure consistent appearance';
COMMENT ON TABLE character_consistency_rules IS 'Configurable rules for validating character visual consistency';
COMMENT ON TABLE character_generation_sessions IS 'Batch generation sessions with quality metrics and consistency tracking';
COMMENT ON TABLE character_similarity_cache IS 'Cached similarity calculations between character appearances for performance';

COMMENT ON COLUMN character_profiles.character_embeddings IS 'Multi-modal embeddings using voyage-multimodal-3 or similar models';
COMMENT ON COLUMN character_profiles.style_tokens IS 'Special tokens for LoRA/textual inversion character consistency';
COMMENT ON COLUMN character_profiles.neo4j_node_id IS 'Reference to Neo4j character knowledge graph node';
COMMENT ON COLUMN character_appearances.embedding_vector IS 'Multi-modal embedding vector for this specific appearance';
COMMENT ON COLUMN character_appearances.controlnet_applied IS 'Whether ControlNet conditioning was used for generation';
COMMENT ON COLUMN character_similarity_cache.structural_similarity IS 'Detailed similarity breakdown by facial features, pose, clothing, etc.';