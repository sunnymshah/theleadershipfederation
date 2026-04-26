-- ── Tickets pricing fields ────────────────────────────────────────────
-- For the new TicketsPricing builder block (B16):
--   features            text[]            — feature bullets shown on the card
--   early_bird_ends_at  timestamptz       — when the early-bird countdown expires
-- Both columns nullable; existing tickets keep working unchanged.
--
-- Apply via Supabase SQL Editor (no CLI in this workflow).

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS features            text[],
  ADD COLUMN IF NOT EXISTS early_bird_ends_at  timestamptz;

COMMENT ON COLUMN public.tickets.features IS
  'Optional bullet-list features displayed on the TicketsPricing builder block.';
COMMENT ON COLUMN public.tickets.early_bird_ends_at IS
  'When set, TicketsPricing renders an early-bird countdown for this ticket.';
