-- ── Standard-sections architecture (Phase 5) ────────────────────────
-- Every event auto-gets 12 canonical pages: home / agenda / speakers /
-- discussions / tickets / networking / sponsors / venue / exhibitors /
-- gallery / register / signin. Users hide / customise; they don't add
-- or delete from this set. This mirrors Zoho Backstage exactly.
--
-- Per-page Puck data lives in `settings.puckData`; per-locale data
-- lives at `settings.<locale>.puckData` once Phase 5.1 lands.

CREATE TABLE IF NOT EXISTS public.event_standard_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  kind text NOT NULL,
  label text NOT NULL,
  slug text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, kind),
  UNIQUE (event_id, slug),
  CHECK (kind IN ('home','agenda','speakers','discussions','tickets',
                  'networking','sponsors','venue','exhibitors','gallery',
                  'register','signin'))
);

CREATE INDEX IF NOT EXISTS event_standard_pages_event_sort_idx
  ON public.event_standard_pages(event_id, sort_order);

CREATE INDEX IF NOT EXISTS event_standard_pages_visible_idx
  ON public.event_standard_pages(event_id, visible);

ALTER TABLE public.event_standard_pages ENABLE ROW LEVEL SECURITY;

-- anon reads: only visible pages of published events.
DROP POLICY IF EXISTS "anon select visible standard pages" ON public.event_standard_pages;
CREATE POLICY "anon select visible standard pages"
  ON public.event_standard_pages
  FOR SELECT
  TO anon
  USING (
    visible = true
    AND EXISTS (SELECT 1 FROM public.events e
                WHERE e.id = event_standard_pages.event_id
                  AND e.status IN ('published','live','completed'))
  );

-- authenticated admins via permission helper.
DROP POLICY IF EXISTS "super_admin all standard pages" ON public.event_standard_pages;
CREATE POLICY "super_admin all standard pages"
  ON public.event_standard_pages
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Seed canonical 12 rows for an event.
CREATE OR REPLACE FUNCTION public.seed_event_standard_pages(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  defaults jsonb := '[
    {"kind":"home",        "label":"Home",         "slug":"home",         "sort_order":0,  "visible":true},
    {"kind":"agenda",      "label":"Agenda",       "slug":"agenda",       "sort_order":10, "visible":true},
    {"kind":"speakers",    "label":"Speakers",     "slug":"speakers",     "sort_order":20, "visible":true},
    {"kind":"discussions", "label":"Discussions",  "slug":"discussions",  "sort_order":30, "visible":false},
    {"kind":"tickets",     "label":"Tickets",      "slug":"tickets",      "sort_order":40, "visible":true},
    {"kind":"networking",  "label":"Networking",   "slug":"networking",   "sort_order":50, "visible":false},
    {"kind":"sponsors",    "label":"Sponsors",     "slug":"sponsors",     "sort_order":60, "visible":true},
    {"kind":"venue",       "label":"Venue",        "slug":"venue",        "sort_order":70, "visible":true},
    {"kind":"exhibitors",  "label":"Exhibitors",   "slug":"exhibitors",   "sort_order":80, "visible":false},
    {"kind":"gallery",     "label":"Gallery",      "slug":"gallery",      "sort_order":90, "visible":true},
    {"kind":"register",    "label":"Register Now", "slug":"register-now", "sort_order":100,"visible":true},
    {"kind":"signin",      "label":"Sign In",      "slug":"sign-in",      "sort_order":110,"visible":true}
  ]'::jsonb;
  row jsonb;
BEGIN
  FOR row IN SELECT * FROM jsonb_array_elements(defaults) LOOP
    INSERT INTO public.event_standard_pages
      (event_id, kind, label, slug, sort_order, visible, settings)
    VALUES (
      p_event_id,
      row->>'kind',
      row->>'label',
      row->>'slug',
      (row->>'sort_order')::int,
      (row->>'visible')::boolean,
      '{}'::jsonb
    )
    ON CONFLICT (event_id, kind) DO NOTHING;
  END LOOP;
END
$$;

-- Auto-seed on event INSERT.
CREATE OR REPLACE FUNCTION public.trg_seed_event_standard_pages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.seed_event_standard_pages(NEW.id);
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS seed_standard_pages_after_insert ON public.events;
CREATE TRIGGER seed_standard_pages_after_insert
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.trg_seed_event_standard_pages();

-- Backfill: any existing event with zero rows gets the canonical 12.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT e.id FROM public.events e
    LEFT JOIN public.event_standard_pages p ON p.event_id = e.id
    GROUP BY e.id
    HAVING COUNT(p.id) = 0
  LOOP
    PERFORM public.seed_event_standard_pages(r.id);
  END LOOP;
END $$;

-- Migrate existing builder_data → home page settings.puckData (idempotent).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT e.id, e.builder_data
    FROM public.events e
    WHERE e.builder_data IS NOT NULL
      AND jsonb_typeof(e.builder_data) = 'object'
  LOOP
    UPDATE public.event_standard_pages
    SET settings = jsonb_set(
          COALESCE(settings, '{}'::jsonb),
          '{puckData}',
          r.builder_data,
          true
        )
    WHERE event_id = r.id
      AND kind = 'home'
      AND (settings->'puckData') IS NULL;
  END LOOP;
END $$;

-- ── Webhook delivery log (Phase 3.8) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  endpoint_url text NOT NULL,
  webhook_event text NOT NULL,
  payload jsonb NOT NULL,
  status_code int,
  response_body text,
  attempts int NOT NULL DEFAULT 1,
  fired_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_webhook_deliveries_event_idx
  ON public.event_webhook_deliveries(event_id, fired_at DESC);

ALTER TABLE public.event_webhook_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "super_admin webhook deliveries" ON public.event_webhook_deliveries;
CREATE POLICY "super_admin webhook deliveries"
  ON public.event_webhook_deliveries
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ── User-saved templates (Phase 4.6) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_user_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  data jsonb NOT NULL,
  thumbnail_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_user_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "super_admin user templates" ON public.event_user_templates;
CREATE POLICY "super_admin user templates"
  ON public.event_user_templates
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ── Multi-language base columns (Phase 5.1) ──────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS locales text[] NOT NULL DEFAULT ARRAY['en']::text[],
  ADD COLUMN IF NOT EXISTS default_locale text NOT NULL DEFAULT 'en';

-- ── Scheduled publish (Phase 6.1) ────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS builder_scheduled_publish_at timestamptz;

CREATE INDEX IF NOT EXISTS events_scheduled_publish_idx
  ON public.events(builder_scheduled_publish_at)
  WHERE builder_scheduled_publish_at IS NOT NULL;

-- ── Custom-domain mapping (Phase 3.3) ────────────────────────────────
-- Lives in events.builder_settings.domain.{domain, status, verified_at}
-- but we add a function-index for fast hostname → event_id lookup at the
-- edge so /proxy.ts middleware can do a single sub-100ms query.
CREATE INDEX IF NOT EXISTS events_custom_domain_idx
  ON public.events ((builder_settings->'domain'->>'domain'))
  WHERE builder_settings->'domain'->>'domain' IS NOT NULL;

-- ── Section comments + presence (Phase 6.3 / 6.4 stub) ───────────────
CREATE TABLE IF NOT EXISTS public.event_builder_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  page_kind text NOT NULL,
  block_id text NOT NULL,
  body text NOT NULL,
  author_id uuid,
  parent_id uuid REFERENCES public.event_builder_comments(id) ON DELETE CASCADE,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_builder_comments_block_idx
  ON public.event_builder_comments(event_id, page_kind, block_id, created_at);
ALTER TABLE public.event_builder_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "super_admin builder comments" ON public.event_builder_comments;
CREATE POLICY "super_admin builder comments"
  ON public.event_builder_comments
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ── A/B testing schema (Phase 5.9) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  page_kind text NOT NULL,
  block_id text NOT NULL,
  name text NOT NULL,
  variants jsonb NOT NULL,
  traffic_split int NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'draft',
  conversion_event text,
  started_at timestamptz,
  ended_at timestamptz,
  winner_variant text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_ab_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "super_admin ab tests" ON public.event_ab_tests;
CREATE POLICY "super_admin ab tests"
  ON public.event_ab_tests
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE TABLE IF NOT EXISTS public.event_ab_exposures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.event_ab_tests(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  variant text NOT NULL,
  exposed_at timestamptz NOT NULL DEFAULT now(),
  converted boolean NOT NULL DEFAULT false,
  converted_at timestamptz
);
CREATE INDEX IF NOT EXISTS event_ab_exposures_test_visitor_idx
  ON public.event_ab_exposures(test_id, visitor_id);
ALTER TABLE public.event_ab_exposures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon insert ab exposures" ON public.event_ab_exposures;
CREATE POLICY "anon insert ab exposures"
  ON public.event_ab_exposures
  FOR INSERT TO anon
  WITH CHECK (true);
DROP POLICY IF EXISTS "super_admin ab exposures" ON public.event_ab_exposures;
CREATE POLICY "super_admin ab exposures"
  ON public.event_ab_exposures
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
