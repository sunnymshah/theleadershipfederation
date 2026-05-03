-- ── Manager Parity migration ─────────────────────────────────────
--
-- Adds the columns the Zoho-style ManagerTable surfaces in row chrome
-- + ProfilePanel views:
--   speakers.country            text  — flag column in the row
--   speakers.featured           bool  — star toggle in the row
--   sessions.featured           bool  — star toggle in the row
--   sponsors.featured           bool  — star toggle in the row
--   speakers.sort_order         int   — already present in some
--                                       deployments; defensively added
--                                       so the migration is safe to
--                                       run on either state.
--
-- All defaults set so existing rows don't need a backfill.

ALTER TABLE public.speakers
  ADD COLUMN IF NOT EXISTS country    text,
  ADD COLUMN IF NOT EXISTS featured   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order int     NOT NULL DEFAULT 0;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS featured   boolean NOT NULL DEFAULT false;

ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS featured   boolean NOT NULL DEFAULT false;
