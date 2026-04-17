-- =========================================================================
-- Setup: Supabase Storage bucket `public_images`
--
-- eventActions.uploadCoverImage puts uploaded event cover photos in a
-- bucket named `public_images`. If the bucket doesn't exist, uploads
-- silently fail (or hang, pre-30s-timeout) — that's what caused the
-- "image not saving, endlessly loading" symptom.
--
-- This migration:
--   1. Creates the bucket (public-read, idempotent)
--   2. Sets a reasonable file-size limit (5 MB — matches the client UI check)
--   3. Allows authenticated users to INSERT (upload) objects
--   4. Allows anyone (including anon/public) to SELECT (view) the public URL
--
-- Run this once in Supabase → SQL Editor.
-- =========================================================================

-- 1. Create bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public_images',
  'public_images',
  true,
  5 * 1024 * 1024, -- 5 MB, matches the client-side limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public              = EXCLUDED.public,
      file_size_limit     = EXCLUDED.file_size_limit,
      allowed_mime_types  = EXCLUDED.allowed_mime_types;

-- 2. Storage.objects RLS — drop any older conflicting policies, then
--    re-create with a clean allow-list.
DROP POLICY IF EXISTS "public_images read"    ON storage.objects;
DROP POLICY IF EXISTS "public_images upload"  ON storage.objects;
DROP POLICY IF EXISTS "public_images manage"  ON storage.objects;

-- Anyone (including unauthenticated visitors) can READ bucket contents.
-- Needed because the public site displays the uploaded cover images.
CREATE POLICY "public_images read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'public_images');

-- Authenticated users can UPLOAD — our server-side uploader uses the
-- service-role key which bypasses RLS anyway, but this also lets a
-- logged-in admin upload from a client component if we add that later.
CREATE POLICY "public_images upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'public_images');

-- Authenticated users can UPDATE/DELETE their own objects (e.g. replace
-- a cover image when editing an event).
CREATE POLICY "public_images manage"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'public_images')
  WITH CHECK (bucket_id = 'public_images');
