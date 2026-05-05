-- ── Customize Text overrides (ITEM 4.1) ─────────────────────────
--
-- Adds events.text_overrides jsonb default '{}' to store per-locale
-- string overrides for every visible UI string on the public event
-- pages. Shape:
--
--   {
--     "<locale>": {
--       "<key>": "<override string>"
--     }
--   }
--
-- Example:
--   {
--     "en": { "nav.register": "Get tickets" },
--     "hi": { "nav.register": "टिकट लें" }
--   }
--
-- Code reads via lib/i18n.ts → getString(key, locale, overrides);
-- when no override exists, the DEFAULT_STRINGS fallback ships.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS text_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;
