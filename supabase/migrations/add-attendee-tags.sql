ALTER TABLE attendees ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS dietary_preference TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS vip_level TEXT CHECK (vip_level IN ('standard', 'vip', 'vvip', 'speaker', 'sponsor', 'media'));

CREATE INDEX IF NOT EXISTS idx_attendees_tags ON attendees USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_attendees_vip ON attendees(vip_level);
