-- Fix image_url NOT NULL constraint in book_pages table
-- This addresses the PostgreSQL error: "null value in column 'image_url' of relation 'book_pages' violates not-null constraint"

-- Make image_url column nullable since images are generated after story generation
ALTER TABLE book_pages 
ALTER COLUMN image_url DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN book_pages.image_url IS 'URL to the generated illustration image. Nullable since images are generated after story text.';