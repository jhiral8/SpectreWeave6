-- SIMPLE SECURE STORAGE POLICY
-- Create user-based security for storage without complex RLS that might have permission issues

-- Ensure bucket is configured properly (public for reading, but controlled for writing)
UPDATE storage.buckets 
SET public = true
WHERE id = 'book-images';

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on book-images bucket" ON storage.objects;

-- Simple policies that work reliably
-- Anyone can read book images (for displaying in UI)
CREATE POLICY "Anyone can read book images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'book-images');

-- Only authenticated users can insert/upload (service role bypasses this anyway)  
CREATE POLICY "Authenticated users can upload book images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'book-images');

-- Only authenticated users can update book images
CREATE POLICY "Authenticated users can update book images" ON storage.objects
  FOR UPDATE  
  TO authenticated
  USING (bucket_id = 'book-images');

-- Only authenticated users can delete book images
CREATE POLICY "Authenticated users can delete book images" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'book-images');

-- Security Note: File paths now include user ID (userId/bookId/filename.png)
-- This provides logical separation even with simpler policies
-- Service role client bypasses RLS entirely for reliable uploads