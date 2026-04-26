-- ── Microsite settings JSONB ──────────────────────────────────────────
-- Backs the in-builder Settings panel (B7). One JSONB column on the
-- events table holds the nine groups: general / seo / domain / privacy /
-- cookies / code / analytics / webhooks / languages.
--
-- Each group lives under its own key; missing keys are treated as empty
-- by the consumer code. The structure is intentionally loose so we can
-- extend per-group fields without further migrations.
--
-- Apply via Supabase SQL Editor.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS builder_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.events.builder_settings IS
  'Microsite settings written by the in-builder Settings panel: general/seo/domain/privacy/cookies/code/analytics/webhooks/languages.';
