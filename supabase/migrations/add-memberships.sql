-- ═══════════════════════════════════════════════════════════════════════════
--  MEMBERSHIP TIERS & APPLICATIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS membership_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price_inr INTEGER NOT NULL,
  price_usd INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  benefits JSONB DEFAULT '[]',
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS membership_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_id UUID REFERENCES membership_tiers(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  designation TEXT,
  linkedin_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default tiers
INSERT INTO membership_tiers (name, slug, price_inr, price_usd, discount_percent, is_popular, sort_order, benefits) VALUES
('Silver', 'silver', 25000, 275, 5, false, 1, '["Exclusive member directory access", "5% discount on all events", "Event credits worth ₹25,000", "Priority networking opportunities", "Conference & workshop access"]'),
('Gold', 'gold', 50000, 550, 10, false, 2, '["Exclusive member directory access", "10% discount on all events", "Event credits worth ₹50,000", "Priority networking opportunities", "Conference & workshop access", "Dedicated relationship manager"]'),
('Platinum', 'platinum', 75000, 825, 15, true, 3, '["Exclusive member directory access", "15% discount on all events", "Event credits worth ₹75,000", "Priority VIP networking", "All conferences, workshops & masterclasses", "Dedicated relationship manager", "Speaker opportunity consideration"]'),
('Titanium', 'titanium', 100000, 1100, 20, false, 4, '["Exclusive member directory access", "20% discount on all events", "Event credits worth ₹1,00,000", "Priority VIP networking & Inner Circle access", "All conferences, workshops & masterclasses", "Dedicated senior relationship manager", "Speaker & jury opportunity consideration", "Brand visibility at events"]');
