-- ── Builder sub-page slug redirects ──────────────────────────────────
-- When an admin renames a sub-page (renameBuilderPage) we record a
-- mapping from the OLD slug → the NEW slug here, so old links keep
-- working with a 301. Public route hits the redirect map on 404 before
-- giving up.
--
-- Schema: jsonb map keyed by old slug, value is the new slug. Both are
-- already URL-safe via slugifyPage(). Empty map by default.
--
-- Apply via Supabase SQL Editor (no CLI in this workflow).

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS builder_pages_redirects jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.events.builder_pages_redirects IS
  'Map of old sub-page slug -> new sub-page slug, written when an admin renames a builder page. Read on 404 to issue a 301.';
