-- =========================================================================
-- The Leadership Federation — Supabase Storage Setup
-- Run this in Supabase → SQL Editor after all schema phases
-- Creates a public_images bucket for speaker headshots, event banners,
-- and sponsor logos with proper RLS policies
-- =========================================================================

-- Create the storage bucket (public = viewable without auth)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public_images',
  'public_images',
  true,
  5242880, -- 5MB max
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;


-- ─── STORAGE POLICIES ───────────────────────────────────────────────────

-- Authenticated admins can upload images
create policy "Admins can upload images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'public_images');

-- Authenticated admins can update/replace images
create policy "Admins can update images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'public_images');

-- Authenticated admins can delete images
create policy "Admins can delete images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'public_images');

-- Anyone can view images (public bucket)
create policy "Public can view images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'public_images');
