-- =========================================================================
-- Email Templates table for configurable email communications
-- =========================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('confirmation', 'reminder', 'thank_you', 'rejection', 'waitlist', 'certificate', 'invoice', 'custom')),
  is_default BOOLEAN DEFAULT false,
  event_id UUID REFERENCES events(id),
  variables TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage templates"
  ON email_templates FOR ALL TO authenticated USING (true);

-- Seed default templates
INSERT INTO email_templates (name, slug, subject, body_html, template_type, is_default, variables) VALUES
(
  'Registration Confirmation',
  'confirmation-default',
  'Registration Confirmed — {{event_title}}',
  '<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;"><div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e7ab1c;"><h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">The Leadership Federation</h1></div><div style="padding: 32px 0;"><p style="font-size: 16px; color: #333;">Dear {{attendee_name}},</p><p style="font-size: 16px; color: #333;">Your registration for <strong>{{event_title}}</strong> has been confirmed.</p><div style="background: #f8f4e8; border-left: 4px solid #e7ab1c; padding: 16px; margin: 24px 0; border-radius: 4px;"><p style="margin: 0; font-size: 14px;"><strong>Event:</strong> {{event_title}}<br><strong>Date:</strong> {{event_date}}<br><strong>Venue:</strong> {{event_venue}}<br><strong>Ticket:</strong> {{ticket_name}}</p></div><p style="font-size: 14px; color: #666;">Please keep this email for your reference. Present your QR code at the venue for check-in.</p></div><div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">&copy; The Leadership Federation</div></div>',
  'confirmation',
  true,
  ARRAY['attendee_name', 'event_title', 'event_date', 'event_venue', 'ticket_name', 'qr_token']
),
(
  'Event Reminder',
  'reminder-default',
  'Reminder: {{event_title}} is Coming Up!',
  '<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;"><div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e7ab1c;"><h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">The Leadership Federation</h1></div><div style="padding: 32px 0;"><p style="font-size: 16px; color: #333;">Dear {{attendee_name}},</p><p style="font-size: 16px; color: #333;">This is a reminder that <strong>{{event_title}}</strong> is happening soon!</p><div style="background: #f8f4e8; border-left: 4px solid #e7ab1c; padding: 16px; margin: 24px 0; border-radius: 4px;"><p style="margin: 0; font-size: 14px;"><strong>Date:</strong> {{event_date}}<br><strong>Venue:</strong> {{event_venue}}</p></div><p style="font-size: 14px; color: #666;">We look forward to seeing you there!</p></div><div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">&copy; The Leadership Federation</div></div>',
  'reminder',
  true,
  ARRAY['attendee_name', 'event_title', 'event_date', 'event_venue']
),
(
  'Thank You',
  'thank-you-default',
  'Thank You for Attending {{event_title}}',
  '<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;"><div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e7ab1c;"><h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">The Leadership Federation</h1></div><div style="padding: 32px 0;"><p style="font-size: 16px; color: #333;">Dear {{attendee_name}},</p><p style="font-size: 16px; color: #333;">Thank you for attending <strong>{{event_title}}</strong>. We hope you found the experience valuable.</p><p style="font-size: 14px; color: #666;">We would love to hear your feedback. Your insights help us improve future events.</p></div><div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">&copy; The Leadership Federation</div></div>',
  'thank_you',
  true,
  ARRAY['attendee_name', 'event_title']
)
ON CONFLICT (slug) DO NOTHING;
