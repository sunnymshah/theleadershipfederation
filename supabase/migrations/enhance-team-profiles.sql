-- =========================================================================
-- Enhance team_members for Netflix-style profile picker + collab platform
-- Adds: avatar_url, accent_color, department, title, status, last_seen_at
-- Backfills accent_color for existing rows from a stable palette.
--
-- Safe to re-run (ADD COLUMN IF NOT EXISTS, UPDATE WHERE NULL).
-- =========================================================================

-- 1. Columns --------------------------------------------------------------

ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS avatar_url   TEXT,
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#c9a84c',
  ADD COLUMN IF NOT EXISTS department   TEXT,
  ADD COLUMN IF NOT EXISTS title        TEXT,
  ADD COLUMN IF NOT EXISTS status       TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'invited', 'suspended')),
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_team_members_status     ON team_members (status);
CREATE INDEX IF NOT EXISTS idx_team_members_department ON team_members (department);

-- 2. Backfill accent_color deterministically for existing rows ------------
-- Uses MD5(id)[0..6] mapped onto a curated palette so every row gets a
-- consistent colour even without hitting the app.

WITH palette AS (
  SELECT ARRAY[
    '#c9a84c', '#e7ab1c', '#b8941a',
    '#4f46e5', '#7c3aed', '#9333ea',
    '#2563eb', '#0891b2', '#0d9488',
    '#16a34a', '#059669', '#65a30d',
    '#dc2626', '#ea580c', '#d97706',
    '#db2777', '#e11d48', '#c026d3'
  ] AS colors
)
UPDATE team_members tm
SET accent_color = p.colors[
  (('x' || substr(md5(tm.id::text), 1, 8))::bit(32)::int % array_length(p.colors, 1)) + 1
]
FROM palette p
WHERE tm.accent_color IS NULL OR tm.accent_color = '#c9a84c';

-- 3. Public view for login profile picker ---------------------------------
-- NEVER expose emails on the login screen (admin enumeration vector).
-- This view is queried by the service-role client in the profile list
-- endpoint, which returns only non-sensitive fields to anon clients.

CREATE OR REPLACE VIEW public_team_profiles AS
SELECT
  id,
  name,
  avatar_url,
  accent_color,
  department,
  title,
  role,
  profile_id
FROM team_members
WHERE status = 'active';

COMMENT ON VIEW public_team_profiles IS
  'Safe subset of team_members for the login profile picker. Omits email.';

-- 4. RLS on the view not needed — the view inherits from team_members.
--    The login endpoint will always route through the service-role admin
--    client (because team_members RLS blocks anon reads). That is the
--    correct boundary: anon clients never touch the DB directly.
