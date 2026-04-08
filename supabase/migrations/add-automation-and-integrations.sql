-- =========================================================================
-- Email Automation, Event Templates, Webhooks, API Keys, Refunds
-- =========================================================================

-- Email Automation Rules (drip sequences)
CREATE TABLE IF NOT EXISTS email_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'registration', 'payment_confirmed', 'check_in',
    'days_before_event', 'days_after_event', 'session_reminder',
    'waitlist_promoted', 'approval_approved', 'approval_rejected'
  )),
  trigger_config JSONB DEFAULT '{}',
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  delay_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sent_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES email_automations(id) ON DELETE CASCADE,
  attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_automation_send UNIQUE(automation_id, attendee_id)
);

-- Event Templates (for cloning)
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS template_name TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS cloned_from UUID REFERENCES events(id);

-- Sponsor Tiers / Packages
CREATE TABLE IF NOT EXISTS sponsor_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze', 'custom')),
  price NUMERIC(12,2),
  currency TEXT DEFAULT 'INR',
  benefits JSONB DEFAULT '[]',
  max_sponsors INTEGER,
  booth_size TEXT,
  logo_placement TEXT,
  speaking_slot BOOLEAN DEFAULT false,
  lead_access BOOLEAN DEFAULT true,
  branding_assets JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES sponsor_packages(id);
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS booth_visits INTEGER DEFAULT 0;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS branded_page_slug TEXT;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS branded_page_config JSONB DEFAULT '{}';

-- Webhook System
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  headers JSONB DEFAULT '{}',
  retry_count INTEGER DEFAULT 3,
  last_triggered_at TIMESTAMPTZ,
  last_status INTEGER,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API Keys for third-party access
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions TEXT[] DEFAULT '{"read"}',
  rate_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Refund tracking
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS refund_status TEXT CHECK (refund_status IN ('none', 'requested', 'processing', 'refunded', 'denied'));
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2);
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS refund_id TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;

-- Session enhancements for agenda builder
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS track TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS room TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_break BOOLEAN DEFAULT false;

-- Attendee engagement scoring
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS sessions_attended INTEGER DEFAULT 0;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS polls_participated INTEGER DEFAULT 0;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS questions_asked INTEGER DEFAULT 0;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS networking_connections INTEGER DEFAULT 0;

-- RLS
ALTER TABLE email_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth manage automations" ON email_automations FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth manage automation_logs" ON email_automation_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth manage sponsor_packages" ON sponsor_packages FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon read sponsor_packages" ON sponsor_packages FOR SELECT TO anon USING (true);
CREATE POLICY "Auth manage webhooks" ON webhooks FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth manage webhook_logs" ON webhook_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth manage api_keys" ON api_keys FOR ALL TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automations_event ON email_automations(event_id);
CREATE INDEX IF NOT EXISTS idx_automations_trigger ON email_automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation ON email_automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_packages_event ON sponsor_packages(event_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_attendees_refund ON attendees(refund_status);
CREATE INDEX IF NOT EXISTS idx_sessions_track ON sessions(track);
CREATE INDEX IF NOT EXISTS idx_sessions_room ON sessions(room);
