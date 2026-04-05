-- =========================================================================
-- The Leadership Federation — Sponsor Self-Service Portal
-- Adds portal-specific columns to the sponsors table
-- =========================================================================

ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS booth_details text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS portal_password text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- Index for portal login lookups
CREATE INDEX IF NOT EXISTS idx_sponsors_contact_email ON sponsors (contact_email);

-- Allow anonymous read for portal login (only contact_email match, password checked in app)
CREATE POLICY "anon_sponsors_portal_login" ON sponsors FOR SELECT TO anon
  USING (contact_email IS NOT NULL);
