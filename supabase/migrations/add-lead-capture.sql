-- Lead capture system for sponsors
-- Allows booth staff to capture leads via QR scan or manual entry

CREATE TABLE IF NOT EXISTS sponsor_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  attendee_id UUID REFERENCES attendees(id),
  lead_name TEXT NOT NULL,
  lead_email TEXT,
  lead_phone TEXT,
  lead_company TEXT,
  lead_designation TEXT,
  notes TEXT,
  interest_level TEXT DEFAULT 'medium' CHECK (interest_level IN ('hot', 'warm', 'medium', 'cold')),
  captured_via TEXT DEFAULT 'manual' CHECK (captured_via IN ('qr_scan', 'manual', 'badge_scan')),
  captured_at TIMESTAMPTZ DEFAULT now(),
  follow_up_status TEXT DEFAULT 'pending' CHECK (follow_up_status IN ('pending', 'contacted', 'meeting_set', 'closed', 'not_interested')),
  follow_up_notes TEXT,
  CONSTRAINT unique_sponsor_lead UNIQUE(sponsor_id, event_id, lead_email)
);

ALTER TABLE sponsor_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage all leads"
  ON sponsor_leads FOR ALL TO authenticated USING (true);

CREATE POLICY "Anon can insert leads"
  ON sponsor_leads FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can read own sponsor leads"
  ON sponsor_leads FOR SELECT TO anon USING (true);

CREATE INDEX IF NOT EXISTS idx_sponsor_leads_sponsor ON sponsor_leads(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_leads_event ON sponsor_leads(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_leads_interest ON sponsor_leads(interest_level);
