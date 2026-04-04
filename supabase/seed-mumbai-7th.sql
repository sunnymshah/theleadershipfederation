-- ============================================================
-- SEED: 7th GCC Leadership Conclave — Mumbai, May 21-22, 2026
-- Run this in the Supabase SQL Editor (Dashboard > SQL)
-- ============================================================

-- 1. Archive old events (mark as completed, keep for SEO)
UPDATE events SET status = 'completed' WHERE status = 'published';

-- 2. Insert the 7th GCC Leadership Conclave — Mumbai
INSERT INTO events (id, title, slug, start_date, end_date, venue, description, status, cover_image_url, created_by)
VALUES (
  gen_random_uuid(),
  '7th GCC Leadership Conclave',
  '7th-gcc-leadership-conclave-mumbai',
  '2026-05-21T09:00:00+05:30',
  '2026-05-22T18:00:00+05:30',
  'Mumbai, India',
  '700+ CXOs, GCC leaders, and policymakers converge for the flagship 7th edition. Two days of high-impact keynotes, strategic panels on AI integration, talent-first operations, and cross-border leadership, plus the GCC Excellence Awards.',
  'published',
  '/hero-speaker.jpg',
  (SELECT id FROM auth.users LIMIT 1)
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  venue = EXCLUDED.venue,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  cover_image_url = EXCLUDED.cover_image_url,
  updated_at = now();

-- 3. Get the event ID for ticket/speaker/session creation
DO $$
DECLARE
  v_event_id uuid;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE slug = '7th-gcc-leadership-conclave-mumbai';

  -- 4. Create ticket tiers
  INSERT INTO tickets (id, event_id, name, description, price_inr, inventory_limit, sold, status) VALUES
    (gen_random_uuid(), v_event_id, 'Standard Pass', '2-day access to all keynotes, panels, and networking sessions', 15000, 400, 0, 'published'),
    (gen_random_uuid(), v_event_id, 'VIP Pass', 'Priority seating, executive roundtables, VIP lounge, and all Standard benefits', 35000, 150, 0, 'published'),
    (gen_random_uuid(), v_event_id, 'Inner Circle', 'Private dinners with speakers, 1-on-1 meetings, premium networking, and all VIP benefits', 75000, 50, 0, 'published')
  ON CONFLICT DO NOTHING;

  -- 5. Sample sessions (Day 1)
  INSERT INTO sessions (id, event_id, title, description, start_time, end_time, session_type, track, room) VALUES
    (gen_random_uuid(), v_event_id, 'Registration & Networking Breakfast', 'Welcome coffee and open networking', '2026-05-21T09:00:00+05:30', '2026-05-21T09:30:00+05:30', 'networking', 'Main', 'Grand Ballroom'),
    (gen_random_uuid(), v_event_id, 'Opening Keynote: The Future of GCCs in India', 'Setting the stage for the future of Global Capability Centers', '2026-05-21T09:30:00+05:30', '2026-05-21T10:00:00+05:30', 'keynote', 'Main', 'Grand Ballroom'),
    (gen_random_uuid(), v_event_id, 'Panel: AI-First GCC Operations — From Hype to Reality', 'How leading GCCs integrate agentic AI into core operations', '2026-05-21T10:00:00+05:30', '2026-05-21T11:00:00+05:30', 'panel', 'Main', 'Grand Ballroom'),
    (gen_random_uuid(), v_event_id, 'Fireside Chat: Building a Culture of Innovation', 'Deep dive into innovation culture at scale', '2026-05-21T11:30:00+05:30', '2026-05-21T12:30:00+05:30', 'keynote', 'Main', 'Grand Ballroom'),
    (gen_random_uuid(), v_event_id, 'Workshop: Talent Strategy for 2027 and Beyond', 'Hands-on talent pipeline building', '2026-05-21T13:30:00+05:30', '2026-05-21T14:30:00+05:30', 'workshop', 'Track A', 'Conference Room A'),
    (gen_random_uuid(), v_event_id, 'Panel: Cross-Border GCC Expansion Playbook', 'Navigating multi-country GCC operations', '2026-05-21T14:30:00+05:30', '2026-05-21T15:30:00+05:30', 'panel', 'Main', 'Grand Ballroom'),
    (gen_random_uuid(), v_event_id, 'Closing Keynote: Leadership in the Agentic Era', 'Vision for GCC leadership in the age of AI agents', '2026-05-21T15:30:00+05:30', '2026-05-21T16:00:00+05:30', 'keynote', 'Main', 'Grand Ballroom'),
    -- Day 2
    (gen_random_uuid(), v_event_id, 'Keynote: India as the Global GCC Capital', 'India''s rise as the centre of global capability', '2026-05-22T09:30:00+05:30', '2026-05-22T10:30:00+05:30', 'keynote', 'Main', 'Grand Ballroom'),
    (gen_random_uuid(), v_event_id, 'Panel: Data-Driven Decision Making at Scale', 'Leveraging data for enterprise-wide impact', '2026-05-22T10:30:00+05:30', '2026-05-22T11:30:00+05:30', 'panel', 'Main', 'Grand Ballroom'),
    (gen_random_uuid(), v_event_id, 'Workshop: Building Resilient GCC Teams', 'Resilience frameworks for distributed teams', '2026-05-22T12:00:00+05:30', '2026-05-22T13:00:00+05:30', 'workshop', 'Track A', 'Conference Room A'),
    (gen_random_uuid(), v_event_id, 'GCC Excellence Awards Ceremony', 'Recognising transformational GCC leaders', '2026-05-22T14:00:00+05:30', '2026-05-22T15:30:00+05:30', 'keynote', 'Main', 'Grand Ballroom')
  ON CONFLICT DO NOTHING;

END $$;

-- Verify
SELECT title, slug, status, start_date, venue FROM events ORDER BY start_date DESC;
