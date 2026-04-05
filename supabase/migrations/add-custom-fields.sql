-- Feature 13: Custom Registration Fields per Event
-- Allows admins to add custom form fields per event (e.g., "T-shirt Size", "Dietary Preference")

CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'select', 'checkbox', 'number', 'email', 'url')),
  options TEXT[],
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_field_value UNIQUE(custom_field_id, attendee_id)
);

ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage custom fields" ON custom_fields FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated can manage field values" ON custom_field_values FOR ALL TO authenticated USING (true);
CREATE POLICY "Public can read custom fields" ON custom_fields FOR SELECT TO anon USING (true);
CREATE POLICY "Public can write field values" ON custom_field_values FOR INSERT TO anon WITH CHECK (true);
