-- ── Zoho-Gap-Pass migration ─────────────────────────────────────────
--
-- Ships the schema for: Exhibitors + Categories (ITEM 6), Hotels (ITEM
-- 7), nav_extra_links (ITEM 8), event-thumbnail + favicon columns
-- (ITEM 10.5 / 10.6).
--
-- All tables enable RLS and grant anon SELECT (so the public page can
-- read them) while restricting writes to super_admin.

/* ── ITEM 6 — exhibitors + categories ─────────────────────────── */
CREATE TABLE IF NOT EXISTS public.event_exhibitor_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text,
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_exhibitor_categories_event_idx
  ON public.event_exhibitor_categories(event_id);

CREATE TABLE IF NOT EXISTS public.exhibitors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name        text NOT NULL,
  logo_url    text,
  category    text,
  booth       text,
  description text,
  website     text,
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exhibitors_event_idx ON public.exhibitors(event_id);
CREATE INDEX IF NOT EXISTS exhibitors_category_idx ON public.exhibitors(event_id, category);

ALTER TABLE public.exhibitors                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_exhibitor_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exhibitors anon read"        ON public.exhibitors;
DROP POLICY IF EXISTS "exhibitors super_admin write" ON public.exhibitors;
DROP POLICY IF EXISTS "exhib categories anon read"        ON public.event_exhibitor_categories;
DROP POLICY IF EXISTS "exhib categories super_admin write" ON public.event_exhibitor_categories;

CREATE POLICY "exhibitors anon read" ON public.exhibitors
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "exhibitors super_admin write" ON public.exhibitors
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "exhib categories anon read" ON public.event_exhibitor_categories
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "exhib categories super_admin write" ON public.event_exhibitor_categories
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

/* ── ITEM 7 — hotels ──────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS public.event_hotels (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name         text NOT NULL,
  image_url    text,
  address      text,
  distance_km  numeric,
  price_range  text,
  booking_url  text,
  description  text,
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_hotels_event_idx ON public.event_hotels(event_id);

ALTER TABLE public.event_hotels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotels anon read"        ON public.event_hotels;
DROP POLICY IF EXISTS "hotels super_admin write" ON public.event_hotels;

CREATE POLICY "hotels anon read" ON public.event_hotels
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "hotels super_admin write" ON public.event_hotels
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

/* ── ITEM 8 — nav_extra_links column ──────────────────────────── */
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS nav_extra_links jsonb NOT NULL DEFAULT '[]'::jsonb;

/* ── ITEM 10.5 — event thumbnail (separate from cover) ────────── */
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS thumbnail_url text;

/* ── ITEM 10.6 — favicon ──────────────────────────────────────── */
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS favicon_url text;
