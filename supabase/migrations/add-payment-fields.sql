-- =========================================================================
-- Payment fields for Razorpay integration
-- Run AFTER schema-phase-3.sql
-- =========================================================================

ALTER TABLE attendees ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'free'));
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS payment_amount integer DEFAULT 0;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS invoice_number text;

-- Index for payment lookups (webhook reconciliation)
CREATE INDEX IF NOT EXISTS idx_attendees_razorpay_order ON attendees (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_attendees_payment_id ON attendees (payment_id);
