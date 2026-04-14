-- ═══════════════════════════════════════════════════════════════════════════
--  CMS CONTENT TABLES
--  One-shot migration for all previously-hardcoded nav-page content.
--  Safe to re-run (uses IF NOT EXISTS / ON CONFLICT DO NOTHING).
--
--  Covers: partners, platform features, about (pillars + stats + vision + founder),
--  contact departments & people, office locations, press outlets, media videos,
--  inner-circle content (value props + how it works + testimonials),
--  membership comparison rows, and generic FAQs.
--
--  Archive page is NOT covered — it already works fine with the existing
--  `events` table filtered by status='completed'.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── PARTNERS ───────────────────────────────────────────────────────────
-- Categories match the live /partners page: title, powered_by, associate, media
CREATE TABLE IF NOT EXISTS partners (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  category    text NOT NULL
              CHECK (category IN ('title', 'powered_by', 'associate', 'media')),
  logo_url    text,
  website_url text,
  description text,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_partners_category ON partners (category, sort_order);


-- ─── PLATFORM FEATURES ──────────────────────────────────────────────────
-- Three platform types: conclave, inner_circle, show
CREATE TABLE IF NOT EXISTS platform_features (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform      text NOT NULL
                CHECK (platform IN ('conclave', 'inner_circle', 'show')),
  title         text NOT NULL,
  icon          text,  -- lucide-react icon name
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_platform_features ON platform_features (platform, sort_order);


-- ─── ABOUT PAGE SECTIONS ────────────────────────────────────────────────
-- Generic CMS-like table: section_type determines what it is
CREATE TABLE IF NOT EXISTS about_sections (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type  text NOT NULL
                CHECK (section_type IN ('pillar', 'stat', 'founder', 'vision')),
  title         text NOT NULL,
  subtitle      text,
  description   text,
  icon          text,
  image_url     text,
  metric_value  text,   -- for stats: "50+", "500+"
  metric_label  text,
  link_url      text,   -- optional link (e.g. LinkedIn for founder)
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_about_sections ON about_sections (section_type, sort_order);


-- ─── CONTACT DEPARTMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_departments (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL,
  description   text,
  icon          text,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Contact people — a department can have multiple contacts
CREATE TABLE IF NOT EXISTS contact_persons (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id uuid REFERENCES contact_departments(id) ON DELETE CASCADE,
  name          text NOT NULL,
  role          text,        -- "VP Marketing", "General Inquiries", "Event Registration"
  email         text,
  phone         text,        -- formatted for display e.g. "+91 72279 93338"
  phone_raw     text,        -- raw for tel: link e.g. "+917227993338"
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contact_persons_dept ON contact_persons (department_id, sort_order);

-- Office locations
CREATE TABLE IF NOT EXISTS office_locations (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  city          text NOT NULL,
  address_lines text[] NOT NULL DEFAULT '{}',  -- multi-line address
  timezone      text,
  phone         text,
  email         text,
  is_primary    boolean NOT NULL DEFAULT false,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);


-- ─── MEDIA: PRESS OUTLETS + VIDEO HIGHLIGHTS ────────────────────────────
CREATE TABLE IF NOT EXISTS press_outlets (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL,
  logo_url      text,
  article_url   text,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_videos (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text NOT NULL,
  description   text,
  youtube_id    text,  -- just the ID, not full URL
  thumbnail_url text,
  label         text,  -- badge label e.g. "Bengaluru 2025"
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);


-- ─── INNER CIRCLE CONTENT ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inner_circle_content (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type  text NOT NULL
                CHECK (content_type IN ('value_prop', 'how_it_works', 'testimonial')),
  title         text NOT NULL,
  description   text,
  subtitle      text,  -- for testimonials: role/company; for how_it_works: step number
  icon          text,
  accent        text,  -- for value_props: tailwind gradient classes
  image_url     text,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inner_circle_content ON inner_circle_content (content_type, sort_order);


-- ─── MEMBERSHIP COMPARISON ──────────────────────────────────────────────
-- Each row is one feature compared across the four tier slugs
CREATE TABLE IF NOT EXISTS membership_comparison_rows (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  feature       text NOT NULL,
  silver_value  text,   -- string "5%" / "true" / "false" / "VIP"
  gold_value    text,
  platinum_value text,
  titanium_value text,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);


-- ─── GENERIC FAQS (for memberships + any page) ──────────────────────────
CREATE TABLE IF NOT EXISTS faqs (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page          text NOT NULL,  -- 'memberships', 'inner_circle', 'general', etc.
  question      text NOT NULL,
  answer        text NOT NULL,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_faqs_page ON faqs (page, sort_order);


-- ═══════════════════════════════════════════════════════════════════════════
--  RLS POLICIES
--  Anyone (anon) can SELECT active rows. Only authenticated can write.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'partners', 'platform_features', 'about_sections',
    'contact_departments', 'contact_persons', 'office_locations',
    'press_outlets', 'media_videos',
    'inner_circle_content', 'membership_comparison_rows', 'faqs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format(
      'DROP POLICY IF EXISTS %I_anon_select ON %I',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY %I_anon_select ON %I FOR SELECT TO anon USING (is_active = true)',
      t, t
    );

    EXECUTE format(
      'DROP POLICY IF EXISTS %I_auth_all ON %I',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY %I_auth_all ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
--  SEED DATA (mirrors the live hardcoded content)
-- ═══════════════════════════════════════════════════════════════════════════

-- Partners (matches /partners page: 16 partners across 4 categories)
INSERT INTO partners (name, category, logo_url, sort_order)
SELECT * FROM (VALUES
  ('Tata',                   'title',      '/partners/tata.jpg',                  1),
  ('Reliance Jio',           'title',      '/partners/reliance-jio.png',          2),
  ('HCL Tech',               'title',      '/partners/hcltech.png',               3),
  ('EY',                     'title',      '/partners/ey.png',                    4),
  ('Axis Bank',              'powered_by', '/partners/axis-bank.png',            10),
  ('ICICI Bank',             'powered_by', '/partners/icici-bank.png',           11),
  ('SBI',                    'powered_by', '/partners/sbi.png',                  12),
  ('Barclays',               'powered_by', '/partners/barclays.png',             13),
  ('Atos',                   'powered_by', '/partners/atos.png',                 14),
  ('Apollo',                 'associate',  '/partners/apollo.png',               20),
  ('Cadila Pharmaceuticals', 'associate',  '/partners/cadila.png',               21),
  ('Prabhudas Lilladher',    'associate',  '/partners/prabhudas-lilladher.png',  22),
  ('SIBAE',                  'associate',  '/partners/sibae.png',                23),
  ('Frost & Sullivan',       'associate',  '/partners/frost-sullivan.png',       24),
  ('H&M',                    'associate',  '/partners/hm.png',                   25),
  ('Gulf News',              'media',      '/partners/gulf-news.png',            30)
) AS v(name, category, logo_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM partners p WHERE p.name = v.name);


-- Platform features (matches /platforms page)
INSERT INTO platform_features (platform, title, icon, sort_order)
SELECT * FROM (VALUES
  -- Conclaves
  ('conclave',     '650+ CXOs and senior leaders per flagship event',                 'Crown',         1),
  ('conclave',     'Delegates from 30+ countries across every edition',               'Globe',         2),
  ('conclave',     'Asia Leadership Awards honouring transformational leaders',        'Award',         3),
  ('conclave',     'Deep-dive tracks on AI, cybersecurity, talent, and sustainability', 'Lightbulb',     4),
  -- Inner Circle
  ('inner_circle', 'Invite-only membership for CXOs and senior leaders',              'Lock',          1),
  ('inner_circle', 'Private roundtables with peers across industries',                 'MessageCircle', 2),
  ('inner_circle', 'Curated peer connections matched by role and interest',            'Users',         3),
  ('inner_circle', 'Strategic access to policymakers and thought leaders',             'Sparkles',      4),
  -- Show
  ('show',         'Long-form interviews with global C-suite executives',              'Radio',         1),
  ('show',         'Industry insights and emerging trend analysis',                    'TrendingUp',    2),
  ('show',         'Multi-format content: video, audio, and editorial',                'Video',         3),
  ('show',         'Behind-the-scenes perspectives on leadership decisions',           'BookOpen',      4)
) AS v(platform, title, icon, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM platform_features pf
  WHERE pf.platform = v.platform AND pf.title = v.title
);


-- About pillars (4) — matches /about Why TLF Exists
INSERT INTO about_sections (section_type, title, description, icon, sort_order)
SELECT * FROM (VALUES
  ('pillar', 'Strategic Conversations',
   'High-value dialogues that shape industries. Curated discussions between C-suite executives, policymakers, and transformation leaders that drive real outcomes.',
   'MessageSquare', 1),
  ('pillar', 'Global Connectivity',
   'A living network spanning 30+ countries, from Bengaluru to Dubai, Kuala Lumpur to London, connecting leaders who are redefining the global business landscape.',
   'Globe', 2),
  ('pillar', 'Curated Access',
   'An invite-only inner circle where senior leaders gain exclusive peer connections, private roundtables, and strategic access to the people who matter most.',
   'ShieldCheck', 3),
  ('pillar', 'Ecosystem Building',
   'Cross-sector partnerships that bridge enterprises, GCCs, governments, startups, and industry pioneers, creating multiplier effects across the ecosystem.',
   'Handshake', 4)
) AS v(section_type, title, description, icon, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM about_sections s
  WHERE s.section_type = v.section_type AND s.title = v.title
);

-- About stats (4) — matches /about Stats block
INSERT INTO about_sections (section_type, title, metric_value, metric_label, sort_order)
SELECT * FROM (VALUES
  ('stat', 'Events',    '50+',     'Events',    1),
  ('stat', 'Countries', '30+',     'Countries', 2),
  ('stat', 'Leaders',   '2,000+',  'Leaders',   3),
  ('stat', 'Speakers',  '500+',    'Speakers',  4)
) AS v(section_type, title, metric_value, metric_label, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM about_sections s
  WHERE s.section_type = v.section_type AND s.title = v.title
);

-- About vision (1)
INSERT INTO about_sections (section_type, title, description, sort_order)
SELECT * FROM (VALUES
  ('vision',
   'To build the world''s most impactful leadership ecosystem',
   'Where every conversation sparks action, every connection creates value, and every leader finds the platform to amplify their impact on the global stage.',
   1)
) AS v(section_type, title, description, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM about_sections s WHERE s.section_type = 'vision'
);

-- About founder (1)
INSERT INTO about_sections (section_type, title, subtitle, description, image_url, link_url, sort_order)
SELECT * FROM (VALUES
  ('founder',
   'Sunny Shah',
   'Founder & CEO',
   'As Founder & CEO of The Leadership Federation, Sunny Shah envisioned a platform that transcends traditional conferences and networking events. His vision centres on creating lasting bridges between enterprises, Global Capability Centres, governments, and emerging ecosystems.

Under his leadership, TLF has grown into one of the most respected leadership platforms in the GCC and Asia-Pacific region, convening decision-makers from over 30 countries and facilitating the strategic conversations that shape industries.

His approach is rooted in a singular belief: that the right conversation between the right leaders at the right time can transform enterprises, economies, and communities. This philosophy drives every event, every programme, and every partnership within the TLF ecosystem.',
   '/sunny-shah.jpg',
   'https://www.linkedin.com/in/sunnymshah/',
   1)
) AS v(section_type, title, subtitle, description, image_url, link_url, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM about_sections s WHERE s.section_type = 'founder'
);


-- Contact departments (4) — matches /contact Reach the Right Team
INSERT INTO contact_departments (name, description, icon, sort_order)
SELECT * FROM (VALUES
  ('Sponsorship & Exhibitor',
   'Partner with us as a sponsor or exhibitor at our global leadership events.',
   'Handshake', 1),
  ('Award Nomination & Speaker Opportunity',
   'Nominate for awards or explore speaking engagements at TLF events.',
   'Trophy', 2),
  ('Marketing & Support',
   'Media inquiries, marketing collaborations, and general support.',
   'Megaphone', 3),
  ('General Inquiries',
   'For general questions, event registration, and other inquiries.',
   'Mail', 4)
) AS v(name, description, icon, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM contact_departments d WHERE d.name = v.name
);

-- Contact persons (seeded after departments — reference via lookup)
INSERT INTO contact_persons (department_id, name, role, email, phone, phone_raw, sort_order)
SELECT
  (SELECT id FROM contact_departments WHERE name = v.dept LIMIT 1),
  v.name, v.role, v.email, v.phone, v.phone_raw, v.sort_order
FROM (VALUES
  ('Sponsorship & Exhibitor',                'Harshal Patel',   NULL,                                  'Harshal@theleadershipfederation.com', '+91 72279 93338', '+917227993338', 1),
  ('Award Nomination & Speaker Opportunity', 'Ovais Kapadia',   NULL,                                  'Ovais@theleadershipfederation.com',   '+91 91060 33979', '+919106033979', 1),
  ('Award Nomination & Speaker Opportunity', 'Manan Desai',     NULL,                                  'Manan@theleadershipfederation.com',   '+91 99782 57508', '+919978257508', 2),
  ('Marketing & Support',                    'Jessica Morgan',  'VP Marketing',                        'Hello@theleadershipfederation.com',   NULL,              NULL,            1),
  ('General Inquiries',                      'General',         'General Inquiries',                   'hello@theleadershipfederation.com',   NULL,              NULL,            1),
  ('General Inquiries',                      'Registration',    'Event Registration',                  'register@theleadershipfederation.com',NULL,              NULL,            2)
) AS v(dept, name, role, email, phone, phone_raw, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM contact_persons cp
  WHERE cp.name = v.name AND cp.email = v.email
);

-- Primary office location — Dubai (matches /contact address block)
INSERT INTO office_locations (city, address_lines, is_primary, sort_order)
SELECT * FROM (VALUES
  ('Dubai',
   ARRAY['The Leadership Federation',
         'Office No. 44-43, Building of Dubai Municipality',
         'Bur Dubai - Al Fahidi',
         'Dubai, United Arab Emirates'],
   true, 1)
) AS v(city, address_lines, is_primary, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM office_locations o WHERE o.city = v.city);


-- Press outlets (matches /media In The Press)
INSERT INTO press_outlets (name, sort_order)
SELECT * FROM (VALUES
  ('Economic Times',    1),
  ('Forbes India',      2),
  ('Business Standard', 3),
  ('CNBC-TV18',         4),
  ('YourStory',         5),
  ('Gulf News',         6)
) AS v(name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM press_outlets p WHERE p.name = v.name);


-- Inner Circle: value props (3) — matches /inner-circle Why Join
INSERT INTO inner_circle_content (content_type, title, description, icon, accent, sort_order)
SELECT * FROM (VALUES
  ('value_prop', 'GCC Leaders Network',
   'Connect with leaders from Global Capability Centres and enterprise hubs worldwide. Forge strategic alliances with peers driving digital transformation across industries.',
   'Globe', 'from-blue-500/20 to-blue-600/10', 1),
  ('value_prop', 'CXO Leaders Network',
   'Peer-to-peer C-suite networking with vetted senior executives. Join curated roundtables, private forums, and strategic conversations that shape your leadership trajectory.',
   'Users', 'from-[#e7ab1c]/20 to-[#d49c10]/10', 2),
  ('value_prop', 'Exclusive Content',
   'Access members-only insights, research reports, leadership playbooks, and curated discussions. Stay ahead with content crafted for senior decision-makers.',
   'BookOpen', 'from-purple-500/20 to-purple-600/10', 3)
) AS v(content_type, title, description, icon, accent, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM inner_circle_content c
  WHERE c.content_type = v.content_type AND c.title = v.title
);

-- Inner Circle: how it works (3) — matches /inner-circle Three Steps to Join
INSERT INTO inner_circle_content (content_type, title, description, subtitle, icon, sort_order)
SELECT * FROM (VALUES
  ('how_it_works', 'Apply',
   'Submit your application with your leadership profile. We review every application to ensure the community maintains its high standard of membership.',
   '01', 'CheckCircle2', 1),
  ('how_it_works', 'Get Approved',
   'Our team reviews your profile and background. Approved members receive an invitation to join the exclusive community platform on Circle.so.',
   '02', 'Shield', 2),
  ('how_it_works', 'Join the Community',
   'Access the full Inner Circle — peer networking, discussion groups, exclusive events, private roundtables, and members-only content.',
   '03', 'Sparkles', 3)
) AS v(content_type, title, description, subtitle, icon, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM inner_circle_content c
  WHERE c.content_type = v.content_type AND c.title = v.title
);

-- Inner Circle: testimonials (3) — matches /inner-circle Member Voices
INSERT INTO inner_circle_content (content_type, title, description, subtitle, sort_order)
SELECT * FROM (VALUES
  ('testimonial',
   'Senior GCC Leader',
   'The Inner Circle has been transformative for my leadership journey. The quality of conversations and connections here is unmatched.',
   'Global Capability Centre', 1),
  ('testimonial',
   'Enterprise CXO',
   'Access to peer CXOs across industries has opened strategic partnerships I never would have found through traditional networking.',
   'Fortune 500 Company', 2),
  ('testimonial',
   'Chief Technology Officer',
   'The curated content and private roundtables provide insights that directly impact my decision-making as a leader.',
   'Leading Tech Enterprise', 3)
) AS v(content_type, title, description, subtitle, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM inner_circle_content c
  WHERE c.content_type = v.content_type AND c.title = v.title
);


-- Membership comparison rows — matches /memberships Compare Tiers table
INSERT INTO membership_comparison_rows (feature, silver_value, gold_value, platinum_value, titanium_value, sort_order)
SELECT * FROM (VALUES
  ('Member Directory Access',    'true',     'true',    'true',       'true',                 1),
  ('Event Discount',             '5%',       '10%',     '15%',        '20%',                  2),
  ('Event Credits',              '₹25,000',  '₹50,000', '₹75,000',    '₹1,00,000',            3),
  ('Priority Networking',        'true',     'true',    'VIP',        'VIP + Inner Circle',   4),
  ('Conference Access',          'true',     'true',    'true',       'true',                 5),
  ('Workshop Access',            'true',     'true',    'true',       'true',                 6),
  ('Masterclass Access',         'false',    'false',   'true',       'true',                 7),
  ('Relationship Manager',       'false',    'true',    'true',       'Senior RM',            8),
  ('Speaker Opportunities',      'false',    'false',   'true',       'true',                 9),
  ('Jury Opportunities',         'false',    'false',   'false',      'true',                10),
  ('Brand Visibility at Events', 'false',    'false',   'false',      'true',                11)
) AS v(feature, silver_value, gold_value, platinum_value, titanium_value, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM membership_comparison_rows r WHERE r.feature = v.feature
);


-- FAQs for memberships (6) — matches /memberships FAQ section
INSERT INTO faqs (page, question, answer, sort_order)
SELECT * FROM (VALUES
  ('memberships', 'How long is the membership valid?',
   'All memberships are valid for one year from the date of activation. Renewals are offered at preferential rates to existing members.', 1),
  ('memberships', 'What are event credits and how do I use them?',
   'Event credits equal 100% of your membership fee. They can be applied towards registration at any Leadership Federation event during your membership period, effectively giving you full cashback on your membership investment.', 2),
  ('memberships', 'Can I upgrade my membership tier?',
   'Yes. You can upgrade at any time by paying the difference between your current tier and the desired tier. Your membership period remains the same from the original activation date.', 3),
  ('memberships', 'Is GST included in the listed prices?',
   'No. The listed prices are exclusive of GST (18%). GST will be added at checkout. For international members paying in USD, no GST applies.', 4),
  ('memberships', 'How does the member directory work?',
   'Our exclusive directory connects you with verified global leaders, CXOs, and decision-makers across 30+ countries. You can search by industry, geography, or role to find the right connections for collaboration.', 5),
  ('memberships', 'What is the application process?',
   'Submit your application through the registration form. Our team will review your profile within 48 hours and send you a confirmation along with payment details upon approval.', 6)
) AS v(page, question, answer, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM faqs f WHERE f.page = v.page AND f.question = v.question
);

-- FAQs for inner-circle (5) — matches /inner-circle FAQ section
INSERT INTO faqs (page, question, answer, sort_order)
SELECT * FROM (VALUES
  ('inner_circle', 'Who is The Inner Circle for?',
   'The Inner Circle is designed for senior leaders — CXOs, GCC heads, VPs, Directors, and enterprise decision-makers. We maintain a curated membership to ensure every member benefits from high-quality peer connections.', 1),
  ('inner_circle', 'How is this different from LinkedIn or other networks?',
   'Unlike open platforms, The Inner Circle is invite-only and curated. Every member is vetted, conversations are private, and the community is focused on strategic leadership rather than broad social networking.', 2),
  ('inner_circle', 'What platform does The Inner Circle use?',
   'We host The Inner Circle on Circle.so, a premium community platform that enables discussion spaces, direct messaging, events, and resource libraries — all in a private, secure environment.', 3),
  ('inner_circle', 'Is there a membership fee?',
   'Please visit our Inner Circle page or contact us for the latest membership details. We offer different tiers to accommodate various levels of engagement and access.', 4),
  ('inner_circle', 'Can I attend TLF events through The Inner Circle?',
   'Yes. Inner Circle members receive priority access, exclusive discounts, and VIP experiences at all TLF events including the GCC Leadership Conclave, Asia Leadership Awards, and regional summits.', 5)
) AS v(page, question, answer, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM faqs f WHERE f.page = v.page AND f.question = v.question
);


-- ═══════════════════════════════════════════════════════════════════════════
--  VERIFY
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  'partners'                    AS t, count(*) FROM partners UNION ALL SELECT
  'platform_features',          count(*) FROM platform_features UNION ALL SELECT
  'about_sections',             count(*) FROM about_sections UNION ALL SELECT
  'contact_departments',        count(*) FROM contact_departments UNION ALL SELECT
  'contact_persons',            count(*) FROM contact_persons UNION ALL SELECT
  'office_locations',           count(*) FROM office_locations UNION ALL SELECT
  'press_outlets',              count(*) FROM press_outlets UNION ALL SELECT
  'media_videos',               count(*) FROM media_videos UNION ALL SELECT
  'inner_circle_content',       count(*) FROM inner_circle_content UNION ALL SELECT
  'membership_comparison_rows', count(*) FROM membership_comparison_rows UNION ALL SELECT
  'faqs',                       count(*) FROM faqs;
