-- Enhanced event fields for premium event pages
ALTER TABLE events ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_address TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_attendees INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN events.tagline IS 'Short subtitle shown below event title on public page';
COMMENT ON COLUMN events.venue_address IS 'Full address of the event venue';
COMMENT ON COLUMN events.registration_deadline IS 'When registration closes (null = open until event)';
COMMENT ON COLUMN events.highlights IS 'JSON array of key themes/highlights e.g. ["AI Leadership", "Digital Transformation"]';
COMMENT ON COLUMN events.is_featured IS 'Feature this event on homepage and archive banner';
COMMENT ON COLUMN events.max_attendees IS 'Overall capacity limit for the event';
COMMENT ON COLUMN events.contact_email IS 'Contact email shown on event page';
COMMENT ON COLUMN events.social_links IS 'JSON object with social media links {"linkedin":"url","twitter":"url"}';
