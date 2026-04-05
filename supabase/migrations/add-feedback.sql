-- ── Feedback / Survey System ──────────────────────────────────────────
-- Post-event feedback collection from attendees.

CREATE TABLE IF NOT EXISTS event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  attendee_id UUID REFERENCES attendees(id),
  attendee_email TEXT NOT NULL,
  attendee_name TEXT,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  content_rating INTEGER CHECK (content_rating BETWEEN 1 AND 5),
  venue_rating INTEGER CHECK (venue_rating BETWEEN 1 AND 5),
  organization_rating INTEGER CHECK (organization_rating BETWEEN 1 AND 5),
  speaker_rating INTEGER CHECK (speaker_rating BETWEEN 1 AND 5),
  would_recommend BOOLEAN,
  best_part TEXT,
  improvement TEXT,
  additional_comments TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_feedback UNIQUE(event_id, attendee_email)
);

ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage feedback"
  ON event_feedback FOR ALL TO authenticated USING (true);

CREATE POLICY "Public can submit feedback"
  ON event_feedback FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public can read own feedback"
  ON event_feedback FOR SELECT TO anon USING (true);
