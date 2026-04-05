-- =========================================================================
-- Email Campaigns tables for bulk email sending with tracking
-- =========================================================================

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  event_id UUID REFERENCES events(id),
  template_id UUID REFERENCES email_templates(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  segment TEXT DEFAULT 'all' CHECK (segment IN ('all', 'registered', 'checked_in', 'waitlisted', 'vip', 'not_checked_in', 'custom')),
  custom_filter JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  CONSTRAINT unique_campaign_recipient UNIQUE(campaign_id, attendee_id)
);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage campaigns" ON email_campaigns FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated can manage campaign recipients" ON email_campaign_recipients FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON email_campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_event ON email_campaigns(event_id);
