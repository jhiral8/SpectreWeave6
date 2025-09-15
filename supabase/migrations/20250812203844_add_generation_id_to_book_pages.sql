-- Fix missing generation_id column in book_pages table
-- This addresses the PGRST204 error: "Could not find the 'generation_id' column of 'book_pages' in the schema cache"

-- Add the missing generation_id column to book_pages table
ALTER TABLE book_pages 
ADD COLUMN IF NOT EXISTS generation_id UUID REFERENCES book_generations(id) ON DELETE SET NULL;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_book_pages_generation_id ON book_pages(generation_id);

-- Add comment for documentation
COMMENT ON COLUMN book_pages.generation_id IS 'Links pages to the generation process that created them';