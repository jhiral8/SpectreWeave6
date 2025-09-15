-- Migration: Integrate Children's Books with SpectreWeave5 Projects
-- This migration creates a unified approach supporting both existing books and new project-based books

-- Add project_type column to existing projects table to support children's books
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'manuscript',
ADD COLUMN IF NOT EXISTS target_age VARCHAR(10),
ADD COLUMN IF NOT EXISTS book_theme VARCHAR(50),
ADD COLUMN IF NOT EXISTS illustration_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS author_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS total_pages INTEGER,
ADD COLUMN IF NOT EXISTS book_metadata JSONB DEFAULT '{}';

-- Add a reference to link books to projects (for existing books to be managed in portal)
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for the new project_id reference
CREATE INDEX IF NOT EXISTS idx_books_project_id ON books(project_id);

-- Update existing book_pages to also support project_id for unified access
ALTER TABLE book_pages
ADD COLUMN IF NOT EXISTS project_id UUID,
ADD COLUMN IF NOT EXISTS illustration_prompt TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS page_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing book_generations to also support project_id and enhanced tracking
ALTER TABLE book_generations
ADD COLUMN IF NOT EXISTS project_id UUID,
ADD COLUMN IF NOT EXISTS generation_type VARCHAR(20) DEFAULT 'story',
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_items INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_items INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS result_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create book_templates table for story templates
CREATE TABLE IF NOT EXISTS book_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL, -- 'character', 'plot', 'theme', 'complete'
    author_style VARCHAR(50),
    target_age VARCHAR(10),
    book_theme VARCHAR(50),
    template_content JSONB NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_user_type ON projects(user_id, project_type);
CREATE INDEX IF NOT EXISTS idx_book_pages_project_id ON book_pages(project_id);
CREATE INDEX IF NOT EXISTS idx_book_pages_project_page ON book_pages(project_id, page_number);
CREATE INDEX IF NOT EXISTS idx_book_generations_project_id ON book_generations(project_id);
CREATE INDEX IF NOT EXISTS idx_book_generations_status ON book_generations(status);
CREATE INDEX IF NOT EXISTS idx_book_templates_type ON book_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_book_templates_author_style ON book_templates(author_style);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
DROP TRIGGER IF EXISTS update_book_pages_updated_at ON book_pages;
CREATE TRIGGER update_book_pages_updated_at 
    BEFORE UPDATE ON book_pages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_book_generations_updated_at ON book_generations;
CREATE TRIGGER update_book_generations_updated_at 
    BEFORE UPDATE ON book_generations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_book_templates_updated_at ON book_templates;
CREATE TRIGGER update_book_templates_updated_at 
    BEFORE UPDATE ON book_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for book_pages
CREATE POLICY "Users can view book pages of their projects" ON book_pages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = book_pages.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert book pages for their projects" ON book_pages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = book_pages.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update book pages of their projects" ON book_pages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = book_pages.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete book pages of their projects" ON book_pages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = book_pages.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- RLS policies for book_generations
CREATE POLICY "Users can view generations of their projects" ON book_generations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = book_generations.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert generations for their projects" ON book_generations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = book_generations.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update generations of their projects" ON book_generations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = book_generations.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- RLS policies for book_templates
CREATE POLICY "Anyone can view public templates" ON book_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own templates" ON book_templates
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Authenticated users can create templates" ON book_templates
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Users can update their own templates" ON book_templates
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates" ON book_templates
    FOR DELETE USING (created_by = auth.uid());

-- Insert default book templates
INSERT INTO book_templates (title, description, template_type, author_style, target_age, book_theme, template_content) VALUES
('Magical Forest Adventure', 'A classic adventure in an enchanted forest', 'complete', 'dr-seuss', '3-5', 'magical-forest', 
'{"mainCharacter": "A curious young [animal]", "setting": "An enchanted forest filled with talking trees", "conflict": "The forest''s magic is fading", "resolution": "Friendship and kindness restore the magic", "moralLesson": "Kindness and cooperation can overcome any challenge"}'),

('Underwater Discovery', 'An educational journey beneath the waves', 'complete', 'eric-carle', '3-5', 'underwater-adventure',
'{"mainCharacter": "A small colorful fish", "setting": "The vast ocean depths", "conflict": "Getting separated from family", "resolution": "Using courage and new friends to reunite", "moralLesson": "Being different makes you special"}'),

('Space Explorer', 'A journey to the stars and beyond', 'complete', 'roald-dahl', '6-8', 'space-exploration',
'{"mainCharacter": "A young astronaut with big dreams", "setting": "Distant planets and space stations", "conflict": "Equipment malfunction during exploration", "resolution": "Creative problem-solving saves the day", "moralLesson": "Creativity and persistence can solve any problem"}'),

('Friendly Dragons', 'Dragons who help instead of harm', 'character', 'a-a-milne', '3-5', 'fairy-tale-castle',
'{"characters": [{"name": "Spark", "description": "A small dragon who breathes flowers instead of fire", "personality": "Kind, gentle, misunderstood"}]}'),

('Animal Friends', 'Stories of woodland creatures', 'character', 'beatrix-potter', '0-2', 'animal-kingdom',
'{"characters": [{"name": "Benny Bunny", "description": "A curious rabbit who loves vegetables", "personality": "Adventurous, kind, always hungry"}]}')

ON CONFLICT DO NOTHING;

-- Add constraint to ensure valid project types
ALTER TABLE projects ADD CONSTRAINT check_project_type 
CHECK (project_type IN ('manuscript', 'childrens-book', 'poetry', 'screenplay'));

-- Add constraint to ensure valid age groups
ALTER TABLE projects ADD CONSTRAINT check_target_age 
CHECK (target_age IS NULL OR target_age IN ('0-2', '3-5', '6-8', '9-12', 'teen'));

-- Add constraint to ensure valid generation types
ALTER TABLE book_generations ADD CONSTRAINT check_generation_type
CHECK (generation_type IN ('story', 'images', 'videos', 'audio', 'export'));

-- Add constraint to ensure valid generation status
ALTER TABLE book_generations ADD CONSTRAINT check_generation_status
CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled'));

-- Comment on new columns and tables for documentation
COMMENT ON COLUMN projects.project_type IS 'Type of project: manuscript, childrens-book, poetry, screenplay';
COMMENT ON COLUMN projects.target_age IS 'Target age group for children''s books: 0-2, 3-5, 6-8, 9-12, teen';
COMMENT ON COLUMN projects.book_theme IS 'Visual theme for children''s books: magical-forest, underwater-adventure, etc.';
COMMENT ON COLUMN projects.illustration_style IS 'Art style for illustrations: watercolor, digital-art, cartoon, etc.';
COMMENT ON COLUMN projects.author_style IS 'Famous author style to emulate: dr-seuss, roald-dahl, etc.';
COMMENT ON COLUMN projects.total_pages IS 'Total number of pages for children''s books';
COMMENT ON COLUMN projects.book_metadata IS 'Additional metadata specific to children''s books';

COMMENT ON TABLE book_pages IS 'Individual pages of children''s books with text and media';
COMMENT ON TABLE book_generations IS 'Tracks progress of AI generation tasks for books';
COMMENT ON TABLE book_templates IS 'Reusable templates for story creation';