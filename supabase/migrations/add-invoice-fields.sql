-- =========================================================================
-- Invoice fields for GST invoice generation
-- Run AFTER add-payment-fields.sql
-- =========================================================================

-- invoice_number already exists from add-payment-fields.sql
-- Add the generated_at timestamp if it doesn't exist
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS invoice_generated_at timestamptz;

-- Create a sequence for invoice numbering (optional — the app uses
-- a count-based approach, but this is available if needed)
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;
