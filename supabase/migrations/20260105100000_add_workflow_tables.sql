-- Migration: Add Chapter Outlines and Agent Reviews Tables
-- This migration supports the story writing workflow:
-- 1. Chapter outlines with scene beats for planning
-- 2. Agent review sessions for tracking AI feedback

-- ============================================
-- CHAPTER OUTLINES TABLE
-- Stores chapter plans with scene beats
-- ============================================
CREATE TABLE IF NOT EXISTS chapter_outlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Outline content
    premise TEXT,                          -- One-line chapter premise
    summary TEXT,                          -- Brief summary of chapter events
    
    -- POV and characters
    pov_character_id UUID REFERENCES story_characters(id) ON DELETE SET NULL,
    character_ids UUID[] DEFAULT ARRAY[]::UUID[],  -- Characters appearing
    
    -- Location
    location_ids UUID[] DEFAULT ARRAY[]::UUID[],   -- Locations featured
    
    -- Story structure placement
    act INTEGER CHECK (act IN (1, 2, 3)),          -- Three-act structure
    structure_beat VARCHAR(50),                    -- E.g., "inciting_incident", "midpoint", "climax"
    sequence_order INTEGER DEFAULT 0,              -- Order in the outline
    
    -- Scene beats (stored as JSON array)
    -- Each beat: {id, title, description, characters[], locationId, tensionLevel, wordTarget, status}
    beats JSONB DEFAULT '[]'::jsonb,
    
    -- Target metrics
    target_word_count INTEGER,
    estimated_scenes INTEGER,
    
    -- AI generation tracking
    ai_generated BOOLEAN DEFAULT false,
    generation_prompt TEXT,
    generation_model VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'outlined', 'writing', 'complete')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for chapter_outlines
CREATE INDEX IF NOT EXISTS idx_chapter_outlines_project ON chapter_outlines(project_id);
CREATE INDEX IF NOT EXISTS idx_chapter_outlines_chapter ON chapter_outlines(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_outlines_user ON chapter_outlines(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_outlines_order ON chapter_outlines(project_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_chapter_outlines_act ON chapter_outlines(project_id, act);

-- Enable RLS
ALTER TABLE chapter_outlines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chapter_outlines
DROP POLICY IF EXISTS "Users can view their own chapter outlines" ON chapter_outlines;
CREATE POLICY "Users can view their own chapter outlines" ON chapter_outlines 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own chapter outlines" ON chapter_outlines;
CREATE POLICY "Users can create their own chapter outlines" ON chapter_outlines 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own chapter outlines" ON chapter_outlines;
CREATE POLICY "Users can update their own chapter outlines" ON chapter_outlines 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own chapter outlines" ON chapter_outlines;
CREATE POLICY "Users can delete their own chapter outlines" ON chapter_outlines 
    FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- AGENT REVIEWS TABLE
-- Stores AI agent review sessions and suggestions
-- ============================================
CREATE TABLE IF NOT EXISTS agent_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Agent info
    agent_id VARCHAR(50) NOT NULL,         -- E.g., "dialogue-master", "style-coach"
    agent_name VARCHAR(100),               -- Display name
    agent_category VARCHAR(30),            -- "generation", "analysis", "consistency"
    
    -- Input
    input_content TEXT,                    -- The text that was reviewed
    input_word_count INTEGER,
    input_selection_start INTEGER,         -- If reviewing a selection
    input_selection_end INTEGER,
    
    -- Results (stored as JSON)
    -- Each suggestion: {id, line, column, originalText, issue, suggestion, severity, accepted, appliedAt}
    suggestions JSONB DEFAULT '[]'::jsonb,
    suggestion_count INTEGER DEFAULT 0,
    accepted_count INTEGER DEFAULT 0,
    
    -- Summary
    summary TEXT,                          -- AI-generated summary of findings
    score DECIMAL(3, 2),                   -- Optional quality score (0-1)
    
    -- Execution info
    model_used VARCHAR(100),
    tokens_used INTEGER,
    execution_time_ms INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'reviewed')),
    error_message TEXT,
    
    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,               -- When user finished reviewing suggestions
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for agent_reviews
CREATE INDEX IF NOT EXISTS idx_agent_reviews_project ON agent_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_chapter ON agent_reviews(chapter_id);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_user ON agent_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_agent ON agent_reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_status ON agent_reviews(status);

-- Enable RLS
ALTER TABLE agent_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_reviews
DROP POLICY IF EXISTS "Users can view their own agent reviews" ON agent_reviews;
CREATE POLICY "Users can view their own agent reviews" ON agent_reviews 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own agent reviews" ON agent_reviews;
CREATE POLICY "Users can create their own agent reviews" ON agent_reviews 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own agent reviews" ON agent_reviews;
CREATE POLICY "Users can update their own agent reviews" ON agent_reviews 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own agent reviews" ON agent_reviews;
CREATE POLICY "Users can delete their own agent reviews" ON agent_reviews 
    FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- STORY STRUCTURE TEMPLATES TABLE
-- Predefined story structure templates
-- ============================================
CREATE TABLE IF NOT EXISTS story_structure_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template info
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),                  -- "classic", "genre", "experimental"
    
    -- Structure definition (JSON)
    -- {acts: [{name, percentage, beats: [{name, description, percentage}]}]}
    structure JSONB NOT NULL,
    
    -- Metadata
    is_system BOOLEAN DEFAULT false,       -- System templates can't be deleted
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default structure templates
INSERT INTO story_structure_templates (name, description, category, structure, is_system) VALUES
(
    'Three-Act Structure',
    'Classic narrative structure with setup, confrontation, and resolution',
    'classic',
    '{
        "acts": [
            {
                "name": "Act 1: Setup",
                "percentage": 25,
                "beats": [
                    {"name": "Opening Image", "description": "Establish the world and tone", "percentage": 5},
                    {"name": "Theme Stated", "description": "Hint at the story''s message", "percentage": 5},
                    {"name": "Setup", "description": "Introduce protagonist and their world", "percentage": 10},
                    {"name": "Catalyst/Inciting Incident", "description": "Event that disrupts the status quo", "percentage": 5}
                ]
            },
            {
                "name": "Act 2: Confrontation",
                "percentage": 50,
                "beats": [
                    {"name": "Debate", "description": "Protagonist hesitates or prepares", "percentage": 5},
                    {"name": "Break into Two", "description": "Protagonist commits to the journey", "percentage": 5},
                    {"name": "B Story/Fun and Games", "description": "Explore premise, subplots develop", "percentage": 15},
                    {"name": "Midpoint", "description": "False victory or defeat, raises stakes", "percentage": 5},
                    {"name": "Bad Guys Close In", "description": "External and internal pressures mount", "percentage": 10},
                    {"name": "All Is Lost", "description": "Lowest point, seems hopeless", "percentage": 5},
                    {"name": "Dark Night of the Soul", "description": "Protagonist reflects, finds new insight", "percentage": 5}
                ]
            },
            {
                "name": "Act 3: Resolution",
                "percentage": 25,
                "beats": [
                    {"name": "Break into Three", "description": "New plan based on insight", "percentage": 5},
                    {"name": "Finale/Climax", "description": "Final confrontation, all threads converge", "percentage": 15},
                    {"name": "Final Image", "description": "Show how protagonist has changed", "percentage": 5}
                ]
            }
        ]
    }'::jsonb,
    true
),
(
    'Hero''s Journey',
    'Joseph Campbell''s monomyth structure',
    'classic',
    '{
        "acts": [
            {
                "name": "Departure",
                "percentage": 30,
                "beats": [
                    {"name": "Ordinary World", "description": "Hero in their normal life", "percentage": 8},
                    {"name": "Call to Adventure", "description": "Challenge or opportunity appears", "percentage": 7},
                    {"name": "Refusal of the Call", "description": "Hero hesitates or declines", "percentage": 5},
                    {"name": "Meeting the Mentor", "description": "Guidance or gift received", "percentage": 5},
                    {"name": "Crossing the Threshold", "description": "Hero commits to the journey", "percentage": 5}
                ]
            },
            {
                "name": "Initiation",
                "percentage": 45,
                "beats": [
                    {"name": "Tests, Allies, Enemies", "description": "Hero navigates new world", "percentage": 10},
                    {"name": "Approach to Inmost Cave", "description": "Preparing for major challenge", "percentage": 10},
                    {"name": "Ordeal", "description": "Hero faces greatest fear or enemy", "percentage": 10},
                    {"name": "Reward", "description": "Hero gains prize or knowledge", "percentage": 8},
                    {"name": "The Road Back", "description": "Consequences and chase", "percentage": 7}
                ]
            },
            {
                "name": "Return",
                "percentage": 25,
                "beats": [
                    {"name": "Resurrection", "description": "Final test, hero transformed", "percentage": 15},
                    {"name": "Return with Elixir", "description": "Hero brings boon to ordinary world", "percentage": 10}
                ]
            }
        ]
    }'::jsonb,
    true
),
(
    'Seven-Point Structure',
    'Dan Wells'' seven-point story structure',
    'classic',
    '{
        "acts": [
            {
                "name": "Beginning",
                "percentage": 15,
                "beats": [
                    {"name": "Hook", "description": "Opposite of resolution, engaging opening", "percentage": 15}
                ]
            },
            {
                "name": "Rising Action",
                "percentage": 55,
                "beats": [
                    {"name": "Plot Turn 1", "description": "Call to action, world changes", "percentage": 10},
                    {"name": "Pinch Point 1", "description": "Pressure from antagonist", "percentage": 10},
                    {"name": "Midpoint", "description": "Hero moves from reaction to action", "percentage": 15},
                    {"name": "Pinch Point 2", "description": "More pressure, stakes raised", "percentage": 10},
                    {"name": "Plot Turn 2", "description": "Final piece of puzzle, hero empowered", "percentage": 10}
                ]
            },
            {
                "name": "End",
                "percentage": 30,
                "beats": [
                    {"name": "Resolution", "description": "Climax and conclusion", "percentage": 30}
                ]
            }
        ]
    }'::jsonb,
    true
)
ON CONFLICT DO NOTHING;


-- ============================================
-- UPDATE TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_chapter_outlines_updated_at ON chapter_outlines;
CREATE TRIGGER update_chapter_outlines_updated_at
    BEFORE UPDATE ON chapter_outlines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- ADD story_framework COLUMN TO PROJECTS
-- For storing overall story framework data
-- ============================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS story_framework JSONB DEFAULT '{}'::jsonb;

-- Framework structure:
-- {
--   "premise": "One-line premise",
--   "genre": "fantasy",
--   "subgenres": ["epic", "romance"],
--   "themes": ["redemption", "sacrifice"],
--   "tone": "dark but hopeful",
--   "targetWordCount": 80000,
--   "targetAudience": "adult",
--   "structureTemplate": "three-act",
--   "completedPhases": ["premise", "characters", "world"],
--   "aiNotes": "Additional context from framework building sessions"
-- }


-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE chapter_outlines IS 'Chapter plans with scene beats for story planning workflow';
COMMENT ON TABLE agent_reviews IS 'AI agent review sessions with suggestions for chapters';
COMMENT ON TABLE story_structure_templates IS 'Predefined story structure templates (three-act, hero journey, etc.)';
COMMENT ON COLUMN projects.story_framework IS 'Overall story framework data including premise, genre, themes, and AI notes';
