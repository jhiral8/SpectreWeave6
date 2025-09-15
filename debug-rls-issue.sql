-- DEBUGGING RLS ISSUE - Run this to check current state and fix RLS policies

-- 1. Check if projects table has any data
SELECT 'Projects table row count:' as info, COUNT(*) as count FROM projects;

-- 2. Check if the specific project exists
SELECT 'Specific project exists:' as info, COUNT(*) as count 
FROM projects 
WHERE id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd';

-- 3. Check current RLS policies on projects table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'projects';

-- 4. Temporarily disable RLS for testing (can re-enable after)
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- 5. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- 6. Re-enable RLS with a permissive policy for debugging
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 7. Create a temporary permissive policy for anon access (for debugging only)
DROP POLICY IF EXISTS "debug_allow_anon_read" ON projects;
CREATE POLICY "debug_allow_anon_read" ON projects
    FOR SELECT TO anon, authenticated
    USING (true);

SELECT 'RLS debugging setup complete' as status;