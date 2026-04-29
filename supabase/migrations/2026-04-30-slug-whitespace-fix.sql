-- ── Slug whitespace fix (Layout-Fix Section 5d) ─────────────────────
--
-- Backfills any existing events / event_standard_pages slugs that have
-- whitespace, mixed case, or non-canonical characters into the form
-- the lib/slug.ts normalizer would have produced.
--
-- Then adds a CHECK constraint on each table so future writes that
-- bypass the application layer (rare, but possible via SQL Editor or a
-- direct admin tool) still produce canonical kebab-case slugs.

-- 1. Backfill events.slug
UPDATE public.events
SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(trim(slug), '\s+', '-', 'g'),
      '[^a-z0-9\-]', '', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE slug IS NOT NULL
  AND (slug ~ '\s' OR slug != lower(slug) OR slug ~ '[^a-z0-9\-]' OR slug ~ '--');

-- 2. Backfill event_standard_pages.slug (only if the table exists yet —
--    some installs run this migration before add-event-standard-pages.sql)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'event_standard_pages'
  ) THEN
    UPDATE public.event_standard_pages
    SET slug = lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(trim(slug), '\s+', '-', 'g'),
          '[^a-z0-9\-]', '', 'g'
        ),
        '-+', '-', 'g'
      )
    )
    WHERE slug IS NOT NULL
      AND (slug ~ '\s' OR slug != lower(slug) OR slug ~ '[^a-z0-9\-]' OR slug ~ '--');
  END IF;
END $$;

-- 3. Add CHECK constraint on events.slug
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_slug_format_chk;
ALTER TABLE public.events
  ADD CONSTRAINT events_slug_format_chk CHECK (
    slug IS NULL
    OR length(slug) = 0
    OR slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'
  );

-- 4. Same on event_standard_pages.slug (if the table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'event_standard_pages'
  ) THEN
    ALTER TABLE public.event_standard_pages
      DROP CONSTRAINT IF EXISTS event_standard_pages_slug_format_chk;
    ALTER TABLE public.event_standard_pages
      ADD CONSTRAINT event_standard_pages_slug_format_chk CHECK (
        slug IS NULL
        OR length(slug) = 0
        OR slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'
      );
  END IF;
END $$;
