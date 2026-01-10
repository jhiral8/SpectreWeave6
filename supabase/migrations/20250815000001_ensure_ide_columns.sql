-- Ensure projects table has the expected columns for the IDE
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS brief TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Ensure chapters table has the expected columns
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
