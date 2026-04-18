-- =========================================================================
-- Event Page Builder — Puck integration
--
-- Adds a `builder_data` JSONB column to the `events` table. This column
-- stores a Puck `Data` object: { content: [...], root: {...}, zones: {} }.
--
-- Decision logic on /events/[slug]:
--   if event.builder_data?.content?.length > 0  -> render Puck
--   else if event_sections has rows             -> render legacy renderer
--   else                                         -> render legacy hard-coded layout
--
-- This keeps backward compatibility: existing events with event_sections
-- rows keep working unchanged. New events or opted-in events get the Puck
-- canvas.
-- =========================================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS builder_data JSONB;

-- Published snapshot vs. draft: we keep the *published* data in the column
-- above. The draft is held in-memory in the Puck editor and autosaved to a
-- separate column. This lets admins tinker without touching the live page.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS builder_draft JSONB;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS builder_published_at TIMESTAMPTZ;

COMMENT ON COLUMN events.builder_data IS
  'Puck editor data for this event page. When set, /events/[slug] renders via Puck''s <Render> instead of the legacy layout.';
COMMENT ON COLUMN events.builder_draft IS
  'In-progress Puck draft. Autosaved from the admin builder. Publish copies this to builder_data.';
COMMENT ON COLUMN events.builder_published_at IS
  'Timestamp of the last publish. Null means never published.';
