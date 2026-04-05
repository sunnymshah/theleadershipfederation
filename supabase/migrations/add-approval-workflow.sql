-- =========================================================================
-- Registration Approval Workflow
-- Adds approval columns to events and attendees for VIP event gating
-- =========================================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;

ALTER TABLE attendees ADD COLUMN IF NOT EXISTS approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved';
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update the attendees status check to include 'pending_approval'
ALTER TABLE attendees DROP CONSTRAINT IF EXISTS attendees_status_check;
ALTER TABLE attendees ADD CONSTRAINT attendees_status_check
  CHECK (status IN ('registered', 'confirmed', 'checked_in', 'cancelled', 'waitlisted', 'pending_approval'));

-- Index for efficient approval queries
CREATE INDEX IF NOT EXISTS idx_attendees_approval_status ON attendees (approval_status);

COMMENT ON COLUMN events.requires_approval IS 'When true, new registrations need admin approval before confirmation';
COMMENT ON COLUMN attendees.approval_status IS 'Approval workflow status: pending, approved, or rejected';
COMMENT ON COLUMN attendees.approved_by IS 'Admin user who approved/rejected the registration';
COMMENT ON COLUMN attendees.approved_at IS 'Timestamp when the registration was approved/rejected';
COMMENT ON COLUMN attendees.rejection_reason IS 'Reason given when rejecting a registration';
