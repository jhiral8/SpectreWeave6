-- Migration: Add Story Framework Tables
-- This migration creates tables for story notes, locations, and world-building elements
-- for the SpectreWeave IDE writing environment

-- ============================================
-- STORY NOTES TABLE
-- Stores research, plot ideas, character details, worldbuilding notes, themes
-- ============================================
CREATE TABLE IF NOT EXISTS story_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Content
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    
    -- Categorization
    category VARCHAR(50) NOT NULL DEFAULT 'other' 
        CHECK (category IN ('research', 'plot', 'character', 'worldbuilding', 'theme', 'other')),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Ordering and organization
    parent_id UUID REFERENCES story_notes(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    
    -- Metadata
    is_pinned BOOLEAN DEFAULT false,
    color VARCHAR(20), -- For visual organization
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for story_notes
CREATE INDEX IF NOT EXISTS idx_story_notes_project ON story_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_story_notes_user ON story_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_story_notes_category ON story_notes(project_id, category);
CREATE INDEX IF NOT EXISTS idx_story_notes_tags ON story_notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_story_notes_parent ON story_notes(parent_id);

-- Enable RLS
ALTER TABLE story_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for story_notes
DROP POLICY IF EXISTS "Users can view their own story notes" ON story_notes;
CREATE POLICY "Users can view their own story notes" ON story_notes 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own story notes" ON story_notes;
CREATE POLICY "Users can create their own story notes" ON story_notes 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own story notes" ON story_notes;
CREATE POLICY "Users can update their own story notes" ON story_notes 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own story notes" ON story_notes;
CREATE POLICY "Users can delete their own story notes" ON story_notes 
    FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- STORY LOCATIONS TABLE
-- Stores locations, settings, and places in the story world
-- ============================================
CREATE TABLE IF NOT EXISTS story_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Type classification
    type VARCHAR(50) DEFAULT 'other'
        CHECK (type IN ('city', 'town', 'village', 'building', 'room', 'landscape', 'region', 'country', 'world', 'other')),
    
    -- Hierarchy (for nested locations like room->building->city)
    parent_id UUID REFERENCES story_locations(id) ON DELETE SET NULL,
    
    -- Additional details
    attributes JSONB DEFAULT '{}', -- For climate, population, culture, etc.
    image_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique name per project
    CONSTRAINT unique_location_name_per_project UNIQUE (project_id, name)
);

-- Indexes for story_locations
CREATE INDEX IF NOT EXISTS idx_story_locations_project ON story_locations(project_id);
CREATE INDEX IF NOT EXISTS idx_story_locations_user ON story_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_story_locations_type ON story_locations(project_id, type);
CREATE INDEX IF NOT EXISTS idx_story_locations_parent ON story_locations(parent_id);

-- Enable RLS
ALTER TABLE story_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for story_locations
DROP POLICY IF EXISTS "Users can view their own story locations" ON story_locations;
CREATE POLICY "Users can view their own story locations" ON story_locations 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own story locations" ON story_locations;
CREATE POLICY "Users can create their own story locations" ON story_locations 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own story locations" ON story_locations;
CREATE POLICY "Users can update their own story locations" ON story_locations 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own story locations" ON story_locations;
CREATE POLICY "Users can delete their own story locations" ON story_locations 
    FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- STORY TIMELINE TABLE
-- Stores timeline events for plotting and continuity
-- ============================================
CREATE TABLE IF NOT EXISTS story_timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Event details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Timing (can be story time or real dates)
    story_date VARCHAR(100), -- Flexible for "Day 3" or "Year 2045" etc
    sequence_order INTEGER DEFAULT 0, -- For ordering events
    
    -- Connections
    chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
    location_id UUID REFERENCES story_locations(id) ON DELETE SET NULL,
    
    -- Characters involved (array of character IDs)
    character_ids UUID[] DEFAULT ARRAY[]::UUID[],
    
    -- Type
    event_type VARCHAR(50) DEFAULT 'plot_point'
        CHECK (event_type IN ('backstory', 'plot_point', 'climax', 'resolution', 'subplot', 'flashback', 'other')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for story_timeline_events
CREATE INDEX IF NOT EXISTS idx_timeline_project ON story_timeline_events(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_user ON story_timeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_chapter ON story_timeline_events(chapter_id);
CREATE INDEX IF NOT EXISTS idx_timeline_location ON story_timeline_events(location_id);
CREATE INDEX IF NOT EXISTS idx_timeline_order ON story_timeline_events(project_id, sequence_order);

-- Enable RLS
ALTER TABLE story_timeline_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for story_timeline_events
DROP POLICY IF EXISTS "Users can view their own timeline events" ON story_timeline_events;
CREATE POLICY "Users can view their own timeline events" ON story_timeline_events 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own timeline events" ON story_timeline_events;
CREATE POLICY "Users can create their own timeline events" ON story_timeline_events 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own timeline events" ON story_timeline_events;
CREATE POLICY "Users can update their own timeline events" ON story_timeline_events 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own timeline events" ON story_timeline_events;
CREATE POLICY "Users can delete their own timeline events" ON story_timeline_events 
    FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- STORY CHARACTERS TABLE
-- Stores character profiles for the story
-- ============================================
CREATE TABLE IF NOT EXISTS story_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'supporting'
        CHECK (role IN ('protagonist', 'antagonist', 'supporting', 'minor', 'narrator')),
    
    -- Details
    description TEXT,
    traits TEXT[] DEFAULT ARRAY[]::TEXT[],
    notes TEXT,
    
    -- Visual (optional)
    image_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique name per project
    CONSTRAINT unique_story_character_name_per_project UNIQUE (project_id, name)
);

-- Indexes for story_characters
CREATE INDEX IF NOT EXISTS idx_story_characters_project ON story_characters(project_id);
CREATE INDEX IF NOT EXISTS idx_story_characters_user ON story_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_story_characters_role ON story_characters(project_id, role);

-- Enable RLS
ALTER TABLE story_characters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for story_characters
DROP POLICY IF EXISTS "Users can view their own story characters" ON story_characters;
CREATE POLICY "Users can view their own story characters" ON story_characters 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own story characters" ON story_characters;
CREATE POLICY "Users can create their own story characters" ON story_characters 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own story characters" ON story_characters;
CREATE POLICY "Users can update their own story characters" ON story_characters 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own story characters" ON story_characters;
CREATE POLICY "Users can delete their own story characters" ON story_characters 
    FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- UPDATE TRIGGERS
-- Automatically update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_story_notes_updated_at ON story_notes;
CREATE TRIGGER update_story_notes_updated_at
    BEFORE UPDATE ON story_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_story_locations_updated_at ON story_locations;
CREATE TRIGGER update_story_locations_updated_at
    BEFORE UPDATE ON story_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_story_timeline_events_updated_at ON story_timeline_events;
CREATE TRIGGER update_story_timeline_events_updated_at
    BEFORE UPDATE ON story_timeline_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_story_characters_updated_at ON story_characters;
CREATE TRIGGER update_story_characters_updated_at
    BEFORE UPDATE ON story_characters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE story_notes IS 'Research notes, plot ideas, and story framework elements for writing projects';
COMMENT ON TABLE story_locations IS 'Locations and settings within story worlds';
COMMENT ON TABLE story_timeline_events IS 'Timeline events for plot continuity tracking';
COMMENT ON TABLE story_characters IS 'Character profiles for fiction writing';
