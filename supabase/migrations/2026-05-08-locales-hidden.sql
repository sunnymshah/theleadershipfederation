-- ── PART C10 — events.locales_hidden ─────────────────────────────
--
-- Adds the per-event "hidden from public switcher" locale list. The
-- locale stays in events.locales (it's still a valid translation
-- target authors can edit) — it's just not shown to anonymous
-- visitors in the EventTopNav language switcher.
--
-- The default locale is server-side guaranteed never to land in this
-- array (setEventLanguages enforces it), so the visitor-landing
-- locale is always reachable.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS locales_hidden text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.events.locales_hidden IS
  'Locales suppressed from the public top-nav language switcher. Subset of events.locales; default_locale is excluded by server-side guard.';
