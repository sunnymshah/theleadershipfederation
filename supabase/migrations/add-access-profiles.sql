-- ============================================================
-- Access Profiles — fine-grained visibility & permission sets
-- ============================================================

-- Profiles table (max 20 enforced via CHECK constraint)
CREATE TABLE IF NOT EXISTS access_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  max_profiles INTEGER DEFAULT 20,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_profile_name UNIQUE(name),
  CONSTRAINT max_profiles_check CHECK (
    (SELECT count(*) FROM access_profiles) <= 20
  )
);

-- Link team members to profiles
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES access_profiles(id);

-- RLS
ALTER TABLE access_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read profiles"
  ON access_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage profiles"
  ON access_profiles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.role = 'super_admin'
    )
  );

-- Seed 5 system profiles matching existing roles
INSERT INTO access_profiles (name, description, color, permissions, is_system) VALUES
(
  'Super Admin',
  'Full unrestricted access to all features and settings',
  '#DC2626',
  '{"events":{"view":true,"create":true,"edit":true,"delete":true},"tickets":{"view":true,"create":true,"edit":true,"delete":true},"attendees":{"view":true,"create":true,"edit":true,"delete":true,"export":true},"speakers":{"view":true,"create":true,"edit":true,"delete":true},"sessions":{"view":true,"create":true,"edit":true,"delete":true},"sponsors":{"view":true,"create":true,"edit":true,"delete":true},"promo_codes":{"view":true,"create":true,"edit":true,"delete":true},"analytics":{"view":true},"certificates":{"view":true,"generate":true,"email":true},"invoices":{"view":true,"generate":true,"email":true},"check_in":{"perform":true},"settings":{"view":true,"edit":true},"team":{"view":true,"manage":true},"payments":{"view":true,"refund":true}}',
  true
),
(
  'Admin',
  'Manage all event operations except team and settings',
  '#7C3AED',
  '{"events":{"view":true,"create":true,"edit":true,"delete":true},"tickets":{"view":true,"create":true,"edit":true,"delete":true},"attendees":{"view":true,"create":true,"edit":true,"delete":true,"export":true},"speakers":{"view":true,"create":true,"edit":true,"delete":true},"sessions":{"view":true,"create":true,"edit":true,"delete":true},"sponsors":{"view":true,"create":true,"edit":true,"delete":true},"promo_codes":{"view":true,"create":true,"edit":true,"delete":true},"analytics":{"view":true},"certificates":{"view":true,"generate":true,"email":true},"invoices":{"view":true,"generate":true,"email":true},"check_in":{"perform":true},"settings":{"view":false,"edit":false},"team":{"view":false,"manage":false},"payments":{"view":true,"refund":false}}',
  true
),
(
  'Manager',
  'Manage events, speakers, sessions, and view attendees',
  '#2563EB',
  '{"events":{"view":true,"create":true,"edit":true,"delete":false},"tickets":{"view":true,"create":true,"edit":true,"delete":false},"attendees":{"view":true,"create":false,"edit":false,"delete":false,"export":false},"speakers":{"view":true,"create":true,"edit":true,"delete":true},"sessions":{"view":true,"create":true,"edit":true,"delete":true},"sponsors":{"view":true,"create":true,"edit":true,"delete":false},"promo_codes":{"view":true,"create":false,"edit":false,"delete":false},"analytics":{"view":true},"certificates":{"view":true,"generate":false,"email":false},"invoices":{"view":true,"generate":false,"email":false},"check_in":{"perform":false},"settings":{"view":false,"edit":false},"team":{"view":false,"manage":false},"payments":{"view":true,"refund":false}}',
  true
),
(
  'Check-in Staff',
  'Perform event day check-ins only',
  '#059669',
  '{"events":{"view":true,"create":false,"edit":false,"delete":false},"tickets":{"view":true,"create":false,"edit":false,"delete":false},"attendees":{"view":true,"create":false,"edit":false,"delete":false,"export":false},"speakers":{"view":false,"create":false,"edit":false,"delete":false},"sessions":{"view":false,"create":false,"edit":false,"delete":false},"sponsors":{"view":false,"create":false,"edit":false,"delete":false},"promo_codes":{"view":false,"create":false,"edit":false,"delete":false},"analytics":{"view":false},"certificates":{"view":false,"generate":false,"email":false},"invoices":{"view":false,"generate":false,"email":false},"check_in":{"perform":true},"settings":{"view":false,"edit":false},"team":{"view":false,"manage":false},"payments":{"view":false,"refund":false}}',
  true
),
(
  'Viewer',
  'Read-only access to events, speakers, sessions, tickets, and analytics',
  '#6B7280',
  '{"events":{"view":true,"create":false,"edit":false,"delete":false},"tickets":{"view":true,"create":false,"edit":false,"delete":false},"attendees":{"view":true,"create":false,"edit":false,"delete":false,"export":false},"speakers":{"view":true,"create":false,"edit":false,"delete":false},"sessions":{"view":true,"create":false,"edit":false,"delete":false},"sponsors":{"view":true,"create":false,"edit":false,"delete":false},"promo_codes":{"view":false,"create":false,"edit":false,"delete":false},"analytics":{"view":true},"certificates":{"view":false,"generate":false,"email":false},"invoices":{"view":false,"generate":false,"email":false},"check_in":{"perform":false},"settings":{"view":false,"edit":false},"team":{"view":false,"manage":false},"payments":{"view":false,"refund":false}}',
  true
)
ON CONFLICT (name) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_access_profiles_active ON access_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_profile ON team_members(profile_id);

-- Organization settings table
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read settings"
  ON organization_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage settings"
  ON organization_settings FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.role IN ('super_admin', 'admin')
    )
  );

-- Seed default org settings
INSERT INTO organization_settings (key, value) VALUES
('general', '{"org_name": "The Leadership Federation", "org_email": "events@theleadershipfederation.com", "org_phone": "", "org_website": "https://theleadershipfederation.com", "org_address": "", "default_currency": "INR", "timezone": "Asia/Kolkata"}'),
('registration', '{"auto_confirm": true, "require_phone": false, "require_company": false, "require_designation": false, "max_tickets_per_email": 5, "allow_cancellation": true, "cancellation_cutoff_hours": 48}'),
('payments', '{"gateway": "razorpay", "auto_invoice": true, "invoice_prefix": "INV"}'),
('tax', '{"enable_gst": true, "gstin": "", "company_name": "The Leadership Federation", "company_address": "", "cgst_rate": 9, "sgst_rate": 9, "igst_rate": 18, "hsn_sac": "998554"}'),
('notifications', '{"send_confirmation_email": true, "send_invoice_email": true, "send_reminder_email": true, "reminder_hours_before": 24, "notify_admin_on_registration": true, "notify_admin_on_cancellation": true}'),
('branding', '{"primary_color": "#e7ab1c", "logo_url": "", "certificate_footer_text": "This certificate is issued by The Leadership Federation"}')
ON CONFLICT (key) DO NOTHING;
