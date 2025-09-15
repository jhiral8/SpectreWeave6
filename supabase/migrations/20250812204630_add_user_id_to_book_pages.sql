-- Add missing user_id column to book_pages table
-- This addresses the PGRST204 error: "Could not find the 'user_id' column of 'book_pages' in the schema cache"

-- Add the missing user_id column to book_pages table
ALTER TABLE book_pages 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_book_pages_user_id ON book_pages(user_id);

-- Add comment for documentation
COMMENT ON COLUMN book_pages.user_id IS 'Links pages to the user who created them for RLS policies';