-- =========================================================================
-- Event Page Builder — multi-page support
--
-- Extends `events` with two JSONB columns that hold SECONDARY pages the
-- admin builds in Puck alongside the main event page (which remains in
-- `builder_data` / `builder_draft`).
--
-- Shape:
--   builder_pages / builder_pages_draft :: {
--     [pageSlug: string]: {
--       title: string                -- human label shown in the nav
--       data:  { content: [...], root: {...}, zones: {} }  -- Puck Data
--       order?: number               -- 0..N controls nav ordering
--     }
--   }
--
-- `pageSlug` is a URL-safe slug used at `/events/[slug]/p/[pageSlug]`.
-- We intentionally prefix sub-pages with `/p/` so they can't collide with
-- existing static child routes like `/events/[slug]/tickets` or `/live`.
--
-- Home ( = `/events/[slug]`) stays in `builder_data`; admins pick "Home"
-- in the page switcher to edit it. Anything added via "+ Add page" lands
-- in `builder_pages[slug]`.
--
-- Both columns default to '{}' so NULL-safety in the loaders is trivial.
-- =========================================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS builder_pages JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS builder_pages_draft JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN events.builder_pages IS
  'Published secondary Puck pages for this event. Map of { pageSlug: { title, data, order? } }. Home page stays in builder_data.';
COMMENT ON COLUMN events.builder_pages_draft IS
  'Unpublished/in-progress version of builder_pages. Publish copies this to builder_pages.';
