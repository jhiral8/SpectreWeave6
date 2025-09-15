-- Add illustration_url column to book_pages table
-- This fixes the frontend error: "column book_pages.illustration_url does not exist"

-- Add the illustration_url column (copy data from image_url if it exists)
ALTER TABLE book_pages 
ADD COLUMN IF NOT EXISTS illustration_url TEXT;

-- Copy existing image_url data to illustration_url where illustration_url is null
UPDATE book_pages 
SET illustration_url = image_url 
WHERE illustration_url IS NULL AND image_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN book_pages.illustration_url IS 'URL to the generated illustration image. Used by frontend for display.';