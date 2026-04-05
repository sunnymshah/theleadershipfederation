-- Feature 14: Event Gallery/Media
-- Upload and display event photos for post-event marketing

CREATE TABLE IF NOT EXISTS event_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  photographer TEXT,
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE event_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage gallery" ON event_gallery FOR ALL TO authenticated USING (true);
CREATE POLICY "Public can view gallery" ON event_gallery FOR SELECT TO anon USING (true);
