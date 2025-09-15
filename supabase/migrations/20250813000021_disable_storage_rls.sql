-- The RLS error is coming from Supabase Storage, not database tables!
-- Disable RLS on the book-images storage bucket

-- Disable RLS on the book-images bucket
UPDATE storage.buckets 
SET public = true
WHERE id = 'book-images';

-- Drop any existing storage policies
DROP POLICY IF EXISTS "Users can upload book images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view book images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update book images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete book images" ON storage.objects;

-- Create permissive storage policies
CREATE POLICY "Allow all operations on book-images bucket" ON storage.objects
  FOR ALL USING (bucket_id = 'book-images');

-- Comment removed due to permission restrictions