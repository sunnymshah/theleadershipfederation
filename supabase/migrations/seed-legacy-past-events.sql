-- =========================================================================
-- Seed: 20 legacy past events as rows in the events table
--
-- These used to be hardcoded in app/(site)/archive/page.tsx as
-- PAST_EVENTS array. They were stripped in commit 41a8727
-- ("Remove all hardcoded fallback data") at the user's request — correct
-- move for the newer events the admin manages, but it also removed the
-- historical back-catalogue that links to the legacy TLF site.
--
-- This migration re-introduces them the RIGHT way: as real DB rows with
-- status='completed' and a new external_url column. The archive page
-- renders rows with external_url as <a target="_blank">...</a> pointing
-- to the legacy pages, while DB-native events render as internal
-- /events/[slug] pages. Admin can edit/delete any of these from the
-- events console like any other event.
--
-- Idempotent: ON CONFLICT (slug) DO NOTHING — safe to re-run.
-- =========================================================================

-- 1. Add the external_url column (if it doesn't already exist)
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_url TEXT;
COMMENT ON COLUMN events.external_url IS
  'Legacy archive events link to the old TLF site. When set, the /archive page renders the card as an external link (opens in new tab) instead of linking to the internal /events/[slug] page.';

-- Also ensure `series` exists for the archive-page filter chips
ALTER TABLE events ADD COLUMN IF NOT EXISTS series TEXT;
COMMENT ON COLUMN events.series IS
  'Event series name (e.g. "GCC Leadership Conclave", "Asia Leadership Awards"). Used for grouping on the archive page.';

-- 2. Seed the 20 legacy past events.
-- Every row: status='completed', external_url set, no tickets/attendees
INSERT INTO events (slug, title, start_date, end_date, venue, description, status, series, external_url)
VALUES
  -- GCC Leadership Conclave (6 rows)
  ('legacy-gcc-5', '5th GCC Leadership Conclave — Pune', '2026-01-21', '2026-01-22', 'Hyatt Pune, India', '1,000+ CXOs gathered in Pune for two days of leadership discourse, innovation showcases, and cross-industry networking.', 'completed', 'GCC Leadership Conclave', 'https://gcc.theleadershipfederation.com/pune'),
  ('legacy-gcc-ai', 'Global AI Leadership Summit — India Edition', '2026-03-12', '2026-03-12', 'Hyderabad, India', 'A focused summit on AI-driven leadership, bringing together technology leaders and enterprise CXOs to shape the future of AI adoption.', 'completed', 'GCC Leadership Conclave', 'https://gcc.theleadershipfederation.com/ai'),
  ('legacy-gcc-4', '4th GCC Leadership Conclave — Hyderabad', '2025-11-13', '2025-11-14', 'ITC Kohenur, Hyderabad, India', '1,000+ attendees over two days at ITC Kohenur, featuring keynotes, panel discussions, and the GCC Excellence Awards.', 'completed', 'GCC Leadership Conclave', 'https://gcc.theleadershipfederation.com/'),
  ('legacy-gcc-3', '3rd GCC Leadership Conclave — Bengaluru', '2025-09-03', '2025-09-03', 'Bengaluru, India', '300+ CXOs convened in Bengaluru to discuss innovation, leadership excellence, and global capability center strategies.', 'completed', 'GCC Leadership Conclave', 'https://theleadershipfederation.com/gccleadershipconclavebengaluru3rdseptember'),
  ('legacy-gcc-2', '2nd GCC Leadership Conclave — Hyderabad', '2025-07-30', '2025-07-30', 'Hyderabad, India', 'The second edition brought GCC leaders from across India to Hyderabad for a day of strategic insights and networking.', 'completed', 'GCC Leadership Conclave', 'https://gcc2.theleadershipfederation.com/'),
  ('legacy-gcc-1', '1st GCC Leadership Conclave — Bengaluru', '2025-05-14', '2025-05-14', 'Novotel Bengaluru Outer Ring Road, India', 'The inaugural GCC Leadership Conclave — a landmark gathering of global capability center leaders in India''s tech capital.', 'completed', 'GCC Leadership Conclave', 'https://gcc1.theleadershipfederation.com/'),

  -- Asia Leadership Awards (6 rows)
  ('legacy-ala-7', '7th Asia Leadership Awards — Kuala Lumpur', '2025-07-04', '2025-07-04', 'Aloft KL Sentral, Kuala Lumpur, Malaysia', 'Recognising outstanding leaders across Asia at the prestigious Aloft KL Sentral in Malaysia''s capital.', 'completed', 'Asia Leadership Awards', 'https://www.theleadershipfederation.com/7th-asia-leadership-awards-kuala-lumpur-malaysia'),
  ('legacy-ala-6', '6th Asia Leadership Awards — Bangkok', '2025-04-12', '2025-04-12', 'Pullman Bangkok Hotel G, Thailand', 'The 6th edition returned to Bangkok to honour visionary leaders shaping Asia''s business landscape.', 'completed', 'Asia Leadership Awards', 'https://theleadershipfederation.com/6thasialeadershipawardsbangkok'),
  ('legacy-ala-5', '5th Asia Leadership Awards — Mumbai', '2024-12-05', '2024-12-05', 'Radisson Blu International Airport Hotel, Mumbai, India', 'Celebrating leadership excellence in India''s financial capital with 200+ CXOs and industry trailblazers.', 'completed', 'Asia Leadership Awards', 'https://www.theleadershipfederation.com/5th-asia-leadership-awards-mumbai'),
  ('legacy-ala-4', '4th Asia Leadership Awards — Bangkok', '2024-07-26', '2024-07-26', 'Pullman G Hotel Bangkok, Thailand', 'A grand ceremony at Pullman G Hotel honouring Asia''s most impactful leaders across industries.', 'completed', 'Asia Leadership Awards', 'https://theleadershipfederation.com/winners-4th-asia-leadership-awards-bangkok'),
  ('legacy-ala-3', '3rd Asia Leadership Awards — Mumbai', '2024-05-30', '2024-05-30', 'Radisson Blu Mumbai International Airport Hotel, India', 'The 3rd edition brought together senior executives and entrepreneurs for an evening of recognition and networking.', 'completed', 'Asia Leadership Awards', 'https://theleadershipfederation.com/pastwinners-asia-leadership-3rd-edition-mumbai'),
  ('legacy-ala-2', '2nd Asia Leadership Awards — Mumbai', '2019-11-27', '2019-11-27', 'Taj Lands End, Mumbai, India', 'The second edition at the iconic Taj Lands End, recognising Asia''s finest leaders before the global pandemic pause.', 'completed', 'Asia Leadership Awards', 'https://theleadershipfederation.com/winners-2nd-edition-asia-leadership-awards-2019-mumbai'),

  -- Middle East Asia Leadership Awards (2 rows)
  ('legacy-meala-3', '3rd Middle East Asia Leadership Awards — Dubai', '2024-10-05', '2024-10-05', 'Marriott Hotel, Dubai, UAE', '200+ leaders from the Middle East and Asia gathered in Dubai to celebrate excellence in leadership and innovation.', 'completed', 'Middle East Asia Leadership Awards', 'https://theleadershipfederation.com/winners-3rd-edition-middleeastasiaawards-dubai'),
  ('legacy-meala-2', '2nd Middle East Asia Leadership Awards — Dubai', '2024-01-20', '2024-01-20', 'Dubai, UAE', 'The second edition recognising exceptional leadership across the Middle East and Asia regions.', 'completed', 'Middle East Asia Leadership Awards', 'https://theleadershipfederation.com/winner-2nd-edition-middle-east-asia-leadership'),

  -- Bharat Leadership Excellence Awards (2 rows)
  ('legacy-blea-2', '2nd Bharat Leadership Excellence Awards — Delhi', '2025-02-01', '2025-02-01', 'Aloft by Marriott, New Delhi, India', 'Honouring India''s most impactful leaders across government, business, and social sectors at the national capital.', 'completed', 'Bharat Leadership Excellence Awards', 'https://theleadershipfederation.com/2ndbharatleadershipawards'),
  ('legacy-blea-1', '1st Bharat Leadership Excellence Awards — Delhi', '2024-08-30', '2024-08-30', 'Roseate House Hotel, Aerocity, New Delhi, India', 'The inaugural Bharat Leadership Excellence Awards — 200+ attendees celebrating India''s leadership legacy.', 'completed', 'Bharat Leadership Excellence Awards', 'https://theleadershipfederation.com/bharatleadershipexcellenceawards'),

  -- Innovation & Startup Summit (2 rows)
  ('legacy-issa-2', '2nd Innovation & Startup Summit & Awards — Mumbai', '2025-04-17', '2025-04-17', 'Radisson Blu Mumbai International Airport, India', 'Startups, investors, and innovation leaders came together for a day of showcases, pitches, and awards.', 'completed', 'Innovation & Startup Summit', 'https://theleadershipfederation.com/2ndinnovationandstartupsummitandawardsmumbai'),
  ('legacy-issa-1', '1st Innovation & Startup Summit & Awards — Dubai', '2024-04-18', '2024-04-18', 'DoubleTree by Hilton — Al Jadaf, Dubai, UAE', 'The first-ever Innovation & Startup Summit bringing together entrepreneurs and investors in Dubai.', 'completed', 'Innovation & Startup Summit', 'https://theleadershipfederation.com/innovationandstartupsummitandawards')
ON CONFLICT (slug) DO NOTHING;

-- Sanity check: count of legacy rows after seed
-- SELECT series, COUNT(*) FROM events WHERE slug LIKE 'legacy-%' GROUP BY series ORDER BY series;
