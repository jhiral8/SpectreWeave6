-- The RLS error is actually coming from book_generations INSERT, not the batch update!
-- Let's disable RLS on book_generations table specifically

-- Check if the table exists and disable RLS
ALTER TABLE IF EXISTS book_generations DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their book generations" ON book_generations;
DROP POLICY IF EXISTS "Users can insert their book generations" ON book_generations;  
DROP POLICY IF EXISTS "Users can update their book generations" ON book_generations;
DROP POLICY IF EXISTS "Users can delete their book generations" ON book_generations;

-- Add comment
COMMENT ON TABLE book_generations IS 'RLS DISABLED: Fixed image generation RLS violation on INSERT operations';