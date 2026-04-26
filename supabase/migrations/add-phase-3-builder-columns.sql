-- ── Phase 3 — inline builder managers, additional columns ────────────
-- Adds the columns the new in-builder Speakers / Sessions / Tickets /
-- Sponsors panels need. All nullable; existing rows untouched.
--
-- Apply via Supabase SQL Editor (no CLI).

-- ── Speakers ──────────────────────────────────────────────────────────
-- (slug + bio + social already added by add-speakers-session-slugs.sql.
--  Just add private contact + ensure the JSONB shape exists.)
ALTER TABLE public.speakers
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.speakers
  ALTER COLUMN social SET DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.speakers.email IS
  'Private speaker contact email — never rendered on public pages.';
COMMENT ON COLUMN public.speakers.phone IS
  'Private speaker contact phone — never rendered on public pages.';

-- ── Sessions ──────────────────────────────────────────────────────────
-- (slug already added by add-speakers-session-slugs.sql)
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS hall        text,
  ADD COLUMN IF NOT EXISTS banner_url  text,
  ADD COLUMN IF NOT EXISTS description text;

COMMENT ON COLUMN public.sessions.hall IS
  'Hall / room label override (separate from the existing room column for clarity).';

-- ── Tickets ───────────────────────────────────────────────────────────
-- (features + early_bird_ends_at already added by add-tickets-pricing-fields.sql)
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS sales_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS sales_ends_at   timestamptz,
  ADD COLUMN IF NOT EXISTS visibility      text NOT NULL DEFAULT 'public';

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_visibility_check
  CHECK (visibility IN ('public', 'hidden', 'requires_promo'))
  NOT VALID;

COMMENT ON COLUMN public.tickets.sales_starts_at IS
  'Optional sale-window open. Public route hides ticket before this.';
COMMENT ON COLUMN public.tickets.sales_ends_at IS
  'Optional sale-window close. Public route hides ticket after this.';
COMMENT ON COLUMN public.tickets.visibility IS
  'public | hidden | requires_promo — used by tickets list rendering and gating.';

-- ── Sponsors ──────────────────────────────────────────────────────────
ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS about text;

COMMENT ON COLUMN public.sponsors.about IS
  'Long-form sponsor description (markdown). Used by per-sponsor detail.';

-- ── Per-event sponsor tier registry ──────────────────────────────────
-- Drag-reorderable tiers, with display colour per tier. Empty by default
-- — sponsors can keep using the legacy free-text tier column until the
--  admin chooses to manage them here.
CREATE TABLE IF NOT EXISTS public.event_sponsor_tiers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_sponsor_tiers_event_order
  ON public.event_sponsor_tiers (event_id, sort_order);

ALTER TABLE public.event_sponsor_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin manage tiers" ON public.event_sponsor_tiers;
CREATE POLICY "super_admin manage tiers"
  ON public.event_sponsor_tiers
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Anon can read tier metadata so public sponsor groupings work.
DROP POLICY IF EXISTS "anon reads tiers" ON public.event_sponsor_tiers;
CREATE POLICY "anon reads tiers"
  ON public.event_sponsor_tiers
  FOR SELECT
  TO anon, authenticated
  USING (true);
