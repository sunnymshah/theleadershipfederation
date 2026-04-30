-- ── Close-out migration ─────────────────────────────────────────────
--
-- A1 — Pages model: only Home is auto-seeded going forward. The seed
--      function is updated to insert just the home row. Existing events
--      keep their 12 rows; the editor lets users delete the ones they
--      don't want now (no destructive backfill of historical rows).
--
-- A2 — events.logo_url: optional event-logo image URL with optional
--      ?fp=x,y suffix for focal point. Powers EventTopNav left-edge
--      logo + Hero useEventLogo + Footer.

-- A1: rewrite the seed function so new events only get home.
CREATE OR REPLACE FUNCTION public.seed_event_standard_pages(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Always-present home page. Slug is "home" but the public route
  -- maps it to /events/{slug} (no /home suffix).
  INSERT INTO public.event_standard_pages
    (event_id, kind, label, slug, sort_order, visible, settings)
  VALUES
    (p_event_id, 'home', 'Home', 'home', 0, true, '{}'::jsonb)
  ON CONFLICT (event_id, kind) DO NOTHING;
END
$$;

-- A1: dedupe — guarantee exactly one home row per event. If duplicates
-- exist (shouldn't, but defensive), keep the oldest by created_at.
WITH ranked AS (
  SELECT id, event_id, kind, created_at,
         ROW_NUMBER() OVER (PARTITION BY event_id, kind ORDER BY created_at) AS rn
  FROM public.event_standard_pages
  WHERE kind = 'home'
)
DELETE FROM public.event_standard_pages
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- A1: ensure every existing event has at least its home row.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT e.id FROM public.events e
    LEFT JOIN public.event_standard_pages p
      ON p.event_id = e.id AND p.kind = 'home'
    WHERE p.id IS NULL
  LOOP
    PERFORM public.seed_event_standard_pages(r.id);
  END LOOP;
END $$;

-- A2: events.logo_url — image URL with optional ?fp=x,y suffix.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS logo_url text;
