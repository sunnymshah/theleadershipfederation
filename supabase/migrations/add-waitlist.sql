-- =========================================================================
-- Waitlist fields for attendees
-- Run AFTER add-payment-fields.sql
-- =========================================================================

ALTER TABLE attendees ADD COLUMN IF NOT EXISTS waitlist_position integer;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS promoted_at timestamptz;

-- Index for efficient waitlist queries
CREATE INDEX IF NOT EXISTS idx_attendees_waitlist ON attendees (ticket_id, waitlist_position)
  WHERE status = 'waitlisted';
