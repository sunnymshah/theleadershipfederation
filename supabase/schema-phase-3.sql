-- =========================================================================
-- The Leadership Federation — Phase 3
-- Run AFTER schema-phase-2.sql
-- Adds: qr_token on attendees, auto-email tracking
-- =========================================================================

-- Add QR token and confirmation tracking to attendees
alter table attendees add column if not exists qr_token text unique;
alter table attendees add column if not exists confirmation_sent_at timestamptz;

-- Create index for QR token lookups (used during check-in scanning)
create index if not exists idx_attendees_qr_token on attendees (qr_token);
