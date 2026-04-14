-- Registration table for multi-purpose registrations
-- (award nominations, delegates, sponsors, speakers, jury, membership)

CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  designation TEXT,
  linkedin_url TEXT,
  event_id UUID REFERENCES events(id),
  participation_type TEXT NOT NULL CHECK (participation_type IN ('award_nomination', 'delegate', 'sponsor', 'speaker', 'jury', 'membership')),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_participation_type ON registrations(participation_type);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);

-- Enable RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Public insert policy (anyone can register)
CREATE POLICY "Anyone can insert registrations"
  ON registrations FOR INSERT
  WITH CHECK (true);

-- Only authenticated users (admins) can read registrations
CREATE POLICY "Authenticated users can read registrations"
  ON registrations FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated users (admins) can update registrations
CREATE POLICY "Authenticated users can update registrations"
  ON registrations FOR UPDATE
  USING (auth.role() = 'authenticated');
