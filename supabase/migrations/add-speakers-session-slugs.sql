-- ── Speaker + session slugs / bios / socials ──────────────────────────
-- Powers the new builder detail-page routes:
--   /events/<eventSlug>/speakers/<speakerSlug>   (B18)
--   /events/<eventSlug>/sessions/<sessionSlug>   (B19)
--
-- All columns nullable; routes fall through to notFound() when the slug
-- isn't recognised.

ALTER TABLE public.speakers
  ADD COLUMN IF NOT EXISTS slug   text,
  ADD COLUMN IF NOT EXISTS bio    text,
  ADD COLUMN IF NOT EXISTS social jsonb;

CREATE INDEX IF NOT EXISTS speakers_event_slug_idx
  ON public.speakers (event_id, slug)
  WHERE slug IS NOT NULL;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS slug text;

CREATE INDEX IF NOT EXISTS sessions_event_slug_idx
  ON public.sessions (event_id, slug)
  WHERE slug IS NOT NULL;

COMMENT ON COLUMN public.speakers.slug IS
  'URL-safe slug; if NULL the speaker has no detail page.';
COMMENT ON COLUMN public.speakers.bio IS
  'Long-form bio shown on /events/<slug>/speakers/<speakerSlug>.';
COMMENT ON COLUMN public.speakers.social IS
  'JSON map of platform -> URL (linkedin, twitter, website, ...).';
COMMENT ON COLUMN public.sessions.slug IS
  'URL-safe slug; if NULL the session has no detail page.';
