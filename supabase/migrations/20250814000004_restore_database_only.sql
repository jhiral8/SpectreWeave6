-- RESTORE DATABASE TABLE SECURITY ONLY
-- Re-enable RLS on database tables (not storage which requires special permissions)

-- Re-enable RLS on database tables that were disabled during debugging
ALTER TABLE book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY; 
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_generations ENABLE ROW LEVEL SECURITY;

-- Restore essential RLS policies that were dropped
DO $$
BEGIN
    -- Book pages policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'book_pages' AND policyname = 'Users can view their book pages') THEN
        CREATE POLICY "Users can view their book pages" ON book_pages
          FOR SELECT TO authenticated USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'book_pages' AND policyname = 'Users can insert their book pages') THEN
        CREATE POLICY "Users can insert their book pages" ON book_pages
          FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'book_pages' AND policyname = 'Users can update their book pages') THEN
        CREATE POLICY "Users can update their book pages" ON book_pages
          FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    END IF;

    -- Projects policies  
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can view their projects') THEN
        CREATE POLICY "Users can view their projects" ON projects
          FOR SELECT TO authenticated USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can insert their projects') THEN
        CREATE POLICY "Users can insert their projects" ON projects
          FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can update their projects') THEN
        CREATE POLICY "Users can update their projects" ON projects
          FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    END IF;

    -- Book generations policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'book_generations' AND policyname = 'Users can view their book generations') THEN
        CREATE POLICY "Users can view their book generations" ON book_generations
          FOR SELECT TO authenticated USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'book_generations' AND policyname = 'Users can insert their book generations') THEN
        CREATE POLICY "Users can insert their book generations" ON book_generations
          FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
    END IF;
END $$;