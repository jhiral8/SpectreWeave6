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
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Insert a test project
INSERT INTO projects (id, title, description, content, brief, user_id) VALUES 
('99689206-b94a-4f69-b066-a0cdc0217b60', 'Test Project', 'A test project for development', '<h1>Test Content</h1>', '<h2>Test Brief</h2>', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;