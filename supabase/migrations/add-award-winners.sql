-- Award editions & winners tables
-- Used by the /winners page and admin panel

CREATE TABLE IF NOT EXISTS award_editions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  event_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  city TEXT,
  country TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS award_winners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  edition_id UUID REFERENCES award_editions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  designation TEXT,
  award_category TEXT,
  image_url TEXT,
  linkedin_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed editions from real LF history
INSERT INTO award_editions (name, slug, event_name, year, city, country, sort_order) VALUES
('2nd Asia Leadership Awards', '2nd-ala-2019', 'Asia Leadership Awards', 2019, 'Mumbai', 'India', 1),
('2nd Middle East Asia Awards', '2nd-meaa', 'Middle East Asia Leadership Awards', 2019, 'Dubai', 'UAE', 2),
('Innovation & Start-up Summit', 'innovation-summit-dubai', 'Innovation & Start-up Summit', 2020, 'Dubai', 'UAE', 3),
('3rd Asia Leadership Awards', '3rd-ala-mumbai', 'Asia Leadership Awards', 2022, 'Mumbai', 'India', 4),
('3rd Middle East Asia Awards', '3rd-meaa-dubai', 'Middle East Asia Leadership Awards', 2023, 'Dubai', 'UAE', 5),
('4th Asia Leadership Awards', '4th-ala-bangkok', 'Asia Leadership Awards', 2024, 'Bangkok', 'Thailand', 6),
('Bharat Leadership Excellence Awards', 'bharat-lea-2024', 'Bharat Leadership Excellence Awards', 2024, 'New Delhi', 'India', 7),
('5th Asia Leadership Awards', '5th-ala-mumbai', 'Asia Leadership Awards', 2025, 'Mumbai', 'India', 8),
('2nd Bharat Leadership Summit', '2nd-bharat-summit', 'Bharat Leadership Excellence Summit & Awards', 2025, 'New Delhi', 'India', 9);
