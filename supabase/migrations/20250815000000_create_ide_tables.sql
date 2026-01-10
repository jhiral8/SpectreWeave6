-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  brief TEXT,
  genre TEXT,
  status TEXT DEFAULT 'draft',
  archived BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own projects' AND tablename = 'projects') THEN
        CREATE POLICY "Users can view their own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own projects' AND tablename = 'projects') THEN
        CREATE POLICY "Users can create their own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own projects' AND tablename = 'projects') THEN
        CREATE POLICY "Users can update their own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own projects' AND tablename = 'projects') THEN
        CREATE POLICY "Users can delete their own projects" ON projects FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT DEFAULT '',
  "order" INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chapters
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view chapters for their projects' AND tablename = 'chapters') THEN
        CREATE POLICY "Users can view chapters for their projects" ON chapters FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = chapters.project_id AND projects.user_id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create chapters for their projects' AND tablename = 'chapters') THEN
        CREATE POLICY "Users can create chapters for their projects" ON chapters FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = chapters.project_id AND projects.user_id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update chapters for their projects' AND tablename = 'chapters') THEN
        CREATE POLICY "Users can update chapters for their projects" ON chapters FOR UPDATE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = chapters.project_id AND projects.user_id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete chapters for their projects' AND tablename = 'chapters') THEN
        CREATE POLICY "Users can delete chapters for their projects" ON chapters FOR DELETE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = chapters.project_id AND projects.user_id = auth.uid()));
    END IF;
END $$;
