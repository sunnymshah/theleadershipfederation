-- =========================================================================
-- Event Sections (Zoho-Backstage-style page builder)
--
-- Each event owns an ordered list of "sections" that render as the public
-- /events/[slug] page. Admin edits them in /admin/events/<id>/builder.
--
-- The sections table is deliberately generic (JSONB payload) so we can add
-- new block types without schema migrations. Core types right now:
--
--   hero           — big banner with title/subtitle and optional background
--                     image, CTA buttons
--   rich_text      — long-form paragraph ("About this event")
--   stats_row      — up to 4 key metrics (e.g. "30+ countries", "500+ CXOs")
--   speakers_grid  — pulls from speakers table for this event, grid layout
--   agenda         — pulls from sessions table for this event, timeline
--   tickets_cta    — shows ticket tiers + "Buy Tickets" button
--   sponsors_grid  — pulls from sponsors table
--   video          — YouTube embed (by id)
--   gallery        — image grid (urls stored in data.images[])
--   cta_button     — centered button with text + url (e.g. "Nominate a
--                     Speaker")
--   faqs           — FAQ accordion (pulls from faqs table by page='event:<slug>')
--
-- Adding a new block type in future = add kind value + render component.
-- =========================================================================

CREATE TABLE IF NOT EXISTS event_sections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  kind        text NOT NULL,
  title       text,
  subtitle    text,
  body        text,
  image_url   text,
  video_url   text,
  cta_label   text,
  cta_url     text,
  data        jsonb NOT NULL DEFAULT '{}',
  sort_order  int  NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_sections_event
  ON event_sections (event_id, sort_order);

-- RLS: public read (active only), authenticated manage-all (permission
-- enforcement happens in server actions via requirePermission)
ALTER TABLE event_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_sections anon read" ON event_sections;
CREATE POLICY "event_sections anon read"
  ON event_sections FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "event_sections auth manage" ON event_sections;
CREATE POLICY "event_sections auth manage"
  ON event_sections FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
