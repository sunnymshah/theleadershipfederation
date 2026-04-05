-- ── Discount Automation (Early Bird / Timed Pricing) ─────────────────
-- Auto-adjust ticket prices based on date ranges.

CREATE TABLE IF NOT EXISTS ticket_price_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_inr INTEGER NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ticket_price_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage price tiers"
  ON ticket_price_tiers FOR ALL TO authenticated USING (true);

CREATE POLICY "Public can read active price tiers"
  ON ticket_price_tiers FOR SELECT TO anon USING (is_active = true);
