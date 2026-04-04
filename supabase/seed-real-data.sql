-- =========================================================================
-- The Leadership Federation — Real Event Data (Scraped from live websites)
-- Run AFTER schema-phase-1.sql, schema-phase-2.sql, schema-phase-3.sql
--
-- Sources:
--   theleadershipfederation.com
--   gcc.theleadershipfederation.com/bengaluru
--   gcc.theleadershipfederation.com/ai
--   gcc4.theleadershipfederation.com
--   gcc.theleadershipfederation.com/pune
--   theleadershipfederation.com/advisoryboardandjury
--   Press releases (Business Standard, The Print, Bollywood Wave)
--
-- WARNING: Delete existing seed data first if you already ran schema-phase-1
-- =========================================================================

-- Clean out placeholder seed data
delete from speakers;
delete from tickets;
delete from sponsors;
delete from sessions;
delete from events;


-- =========================================================================
-- EVENTS
-- =========================================================================

insert into events (id, title, slug, start_date, end_date, venue, description, status) values

-- 1) 6th GCC Leadership Conclave - Bengaluru (UPCOMING)
(
  '11111111-1111-1111-1111-000000000001',
  '6th GCC Leadership Conclave - Bengaluru',
  '6th-gcc-leadership-conclave-bengaluru',
  '2026-04-07 08:00:00+05:30',
  '2026-04-08 17:00:00+05:30',
  'JW Marriott Hotel Bengaluru, 24/1 Vittal Mallya Rd, KG Halli, Shanthala Nagar, Ashok Nagar, Bengaluru 560001, India',
  'India''s largest and most influential gathering of GCC leaders. The 6th Edition brings together 650+ CXOs, innovators, and policymakers to discuss AI integration, cyber strategy, talent transformation, digital-first GCC operations, and sustainability.',
  'published'
),

-- 2) Global AI Leadership Summit - Hyderabad (COMPLETED)
(
  '11111111-1111-1111-1111-000000000002',
  'Global AI Leadership Summit - India Edition',
  'global-ai-leadership-summit-india-2026',
  '2026-03-12 08:00:00+05:30',
  '2026-03-12 18:00:00+05:30',
  'ITC Kohenur, a Luxury Collection Hotel, Hyderabad, Survey No 83/1, Hyderabad Knowledge City, Plot No.5, Silpa Gram Craft Village, Madhapur, Hyderabad 500032, India',
  'A strategic summit designed for leaders driving AI in enterprises. Brought together leading CXOs, AI strategists, GCC leaders, and technology innovators to explore how AI is reshaping global enterprises and accelerating digital transformation. A strategic extension of the GCC Leadership Conclave platform.',
  'completed'
),

-- 3) 5th GCC Leadership Conclave - Pune (COMPLETED)
(
  '11111111-1111-1111-1111-000000000003',
  '5th GCC Leadership Conclave - Pune',
  '5th-gcc-leadership-conclave-pune',
  '2026-01-21 08:00:00+05:30',
  '2026-01-22 17:00:00+05:30',
  'Hyatt Pune, Pulse Mall, 88 Pune Nagar Rd, Aga Khan Palace, Kalyani Nagar, Pune 411006, India',
  'The milestone 5th edition and largest GCC conclave to date with 1,000+ attendees including 120+ CXOs. Featured CXO round-tables, fireside conversations, master sessions, and policy dialogues on GCC innovation, digital transformation, and enterprise leadership.',
  'completed'
),

-- 4) 4th GCC Leadership Conclave - Hyderabad (COMPLETED)
(
  '11111111-1111-1111-1111-000000000004',
  '4th GCC Leadership Conclave - Hyderabad',
  '4th-gcc-leadership-conclave-hyderabad',
  '2025-11-13 08:00:00+05:30',
  '2025-11-14 17:00:00+05:30',
  'ITC Kohenur, a Luxury Collection Hotel, Hyderabad, Survey No.83/1, Madhapur, Hyderabad Knowledge City, Hyderabad 500081, India',
  'Landmark 4th edition recording over 1000 attendees across two days including 120+ CXOs. Delivered powerful learnings through CXO round-tables, fireside conversations, master sessions, and policy dialogues on AI acceleration, automation, enterprise modernisation, and GCCs as global innovation hubs.',
  'completed'
),

-- 5) GCC Leadership Conclave - Bengaluru Sep 2025 (COMPLETED)
(
  '11111111-1111-1111-1111-000000000005',
  '3rd GCC Leadership Conclave - Bengaluru',
  '3rd-gcc-leadership-conclave-bengaluru-sep-2025',
  '2025-09-03 08:00:00+05:30',
  '2025-09-03 17:00:00+05:30',
  'Novotel Outer Ring Road, Bengaluru, India',
  'A powerful platform connecting CXOs and transformation leaders from India''s top GCCs for networking and thought leadership opportunities.',
  'completed'
),

-- 6) GCC Leadership Conclave - Bengaluru May 2025 (1st/2nd Edition) (COMPLETED)
(
  '11111111-1111-1111-1111-000000000006',
  'GCC Leadership Conclave - Bengaluru (May 2025)',
  'gcc-leadership-conclave-bengaluru-may-2025',
  '2025-05-14 08:00:00+05:30',
  '2025-05-14 17:00:00+05:30',
  'Bengaluru, India',
  'The GCC Leadership Conclave concluded in Bengaluru celebrating excellence in Global Capability Centers with 300+ CXOs and industry experts. Over 65 awards were presented. Inaugurated by IAS Shri Daljeet Kumar, Deputy Secretary, Government of Karnataka.',
  'completed'
),

-- 7) 7th Asia Leadership Awards - Kuala Lumpur (COMPLETED)
(
  '11111111-1111-1111-1111-000000000007',
  '7th Asia Leadership Awards - Kuala Lumpur',
  '7th-asia-leadership-awards-kuala-lumpur',
  '2025-07-04 09:00:00+08:00',
  '2025-07-04 21:00:00+08:00',
  'Aloft KL Sentral, Kuala Lumpur, Malaysia',
  'Celebrating and spotlighting extraordinary contributions to leadership, technology, enterprise, education, and innovation across Asia.',
  'completed'
),

-- 8) 5th Asia Leadership Awards - Mumbai (COMPLETED)
(
  '11111111-1111-1111-1111-000000000008',
  '5th Asia Leadership Awards - Mumbai',
  '5th-asia-leadership-awards-mumbai',
  '2024-11-30 09:00:00+05:30',
  '2024-11-30 21:00:00+05:30',
  'Radisson Blu International Airport Hotel, Mumbai, India',
  'Celebrating extraordinary achievements by outstanding individuals and companies across Asia. 300+ participants, 200+ nominations.',
  'completed'
),

-- 9) 4th Asia Leadership Awards - Bangkok (COMPLETED)
(
  '11111111-1111-1111-1111-000000000009',
  '4th Asia Leadership Awards - Bangkok',
  '4th-asia-leadership-awards-bangkok',
  '2024-07-26 09:00:00+07:00',
  '2024-07-26 21:00:00+07:00',
  'Pullman G Hotel Bangkok, Thailand',
  'A grand celebration in Bangkok bringing together 150+ prominent leaders from 16 countries.',
  'completed'
),

-- 10) 3rd Asia Leadership Awards - Mumbai (COMPLETED)
(
  '11111111-1111-1111-1111-000000000010',
  '3rd Asia Leadership Awards - Mumbai',
  '3rd-asia-leadership-awards-mumbai',
  '2024-05-30 09:00:00+05:30',
  '2024-05-30 21:00:00+05:30',
  'Radisson Blu International Airport, Mumbai, India',
  'Celebrating extraordinary achievements by outstanding individuals and companies across Asia. 300+ participants, 200+ nominations, 10+ speakers.',
  'completed'
),

-- 11) Middle East Asia Leadership Awards - Dubai (COMPLETED)
(
  '11111111-1111-1111-1111-000000000011',
  'Middle East Asia Leadership Awards - Dubai',
  'middle-east-asia-leadership-awards-dubai-2024',
  '2024-01-20 09:00:00+04:00',
  '2024-01-20 21:00:00+04:00',
  'DoubleTree by Hilton, Al Jadaf, Dubai, UAE',
  'The biggest red-carpet event of 2024 celebrating extraordinary achievements by outstanding individuals and companies across the Middle East and Asia. 250+ participants, 160+ nominations, 15+ speakers.',
  'completed'
),

-- 12) 2nd Bharat Leadership Excellence Awards - New Delhi (COMPLETED)
(
  '11111111-1111-1111-1111-000000000012',
  '2nd Bharat Leadership Excellence Awards - New Delhi',
  '2nd-bharat-leadership-excellence-awards-delhi',
  '2025-02-01 09:00:00+05:30',
  '2025-02-01 21:00:00+05:30',
  'Aloft New Delhi Aerocity, New Delhi, India',
  'Celebrating leadership excellence across 12 categories including Fintech, Healthcare, Travel & Tourism, Automobile, Real Estate, Banking & Finance, Education & Skill Development, Home & Lifestyle, Electronics & Gadgets, AI & Robotics, Social Service & CSR, and Information Technology.',
  'completed'
);


-- =========================================================================
-- TICKETS
-- =========================================================================

-- 6th GCC Leadership Conclave - Bengaluru
insert into tickets (event_id, name, description, price_inr, inventory_limit, status) values
('11111111-1111-1111-1111-000000000001', 'VIP Pass (2 Days)', 'Full 2-day access to all sessions, networking, and exhibition', 25000, 650, 'published'),
('11111111-1111-1111-1111-000000000001', 'VIP Pass with CXO Dinner', '2-day access plus exclusive CXO networking dinner', 50000, 100, 'published');

-- Global AI Leadership Summit - Hyderabad
insert into tickets (event_id, name, description, price_inr, inventory_limit, sold, status) values
('11111111-1111-1111-1111-000000000002', 'VIP Delegate Pass', 'Full-day access to all sessions and networking', 20000, 500, 500, 'archived'),
('11111111-1111-1111-1111-000000000002', 'VVIP with CXO Dinner', 'Full-day access plus exclusive CXO networking dinner', 40000, 100, 100, 'archived');

-- 5th GCC Leadership Conclave - Pune
insert into tickets (event_id, name, description, price_inr, inventory_limit, sold, status) values
('11111111-1111-1111-1111-000000000003', 'VIP Pass (2 Days)', 'Full 2-day access to all sessions and networking', 35000, 725, 725, 'archived'),
('11111111-1111-1111-1111-000000000003', 'VVIP Pass (2 Days + CXO Dinner)', '2-day access plus exclusive CXO networking dinner', 70000, 100, 100, 'archived');

-- 4th GCC Leadership Conclave - Hyderabad
insert into tickets (event_id, name, description, price_inr, inventory_limit, sold, status) values
('11111111-1111-1111-1111-000000000004', 'VIP Pass (2 Days)', 'Full 2-day access to all sessions and networking', 39999, 200, 200, 'archived'),
('11111111-1111-1111-1111-000000000004', 'VVIP Pass (2 Days + CXO Dinner)', '2-day access plus exclusive CXO networking dinner', 69999, 50, 50, 'archived');


-- =========================================================================
-- SPEAKERS — 6th GCC Leadership Conclave - Bengaluru (67 speakers)
-- =========================================================================

insert into speakers (event_id, name, designation, company, sort_order) values
('11111111-1111-1111-1111-000000000001', 'Srinivas Mendu', 'CEO', 'FundsIndia Private Wealth', 1),
('11111111-1111-1111-1111-000000000001', 'Vineet Dwivedi', 'Vice President, Global Head', 'Alcon Global Services', 2),
('11111111-1111-1111-1111-000000000001', 'Srinivas Sampath', 'VP R&D and Site Leader', 'Upland India', 3),
('11111111-1111-1111-1111-000000000001', 'Surendra Bashani', 'Head of Best Buy India', 'Best Buy India', 4),
('11111111-1111-1111-1111-000000000001', 'Rajesh Puneyani', 'Vice President & Managing Director', 'Kenvue GCC', 5),
('11111111-1111-1111-1111-000000000001', 'Shalini Nataraj', 'Global Head of HR Delivery', 'A.P. Moller-Maersk', 6),
('11111111-1111-1111-1111-000000000001', 'Nikhil Malhotra', 'Vice President', 'Everest Group', 7),
('11111111-1111-1111-1111-000000000001', 'Akash Sureka', 'Founder', 'TheNoah.AI', 8),
('11111111-1111-1111-1111-000000000001', 'Sivakumar Selva Ganapathy', 'Vice President – India Digital/IT', 'Johnson Controls', 9),
('11111111-1111-1111-1111-000000000001', 'Vybhava Srinivasan', 'Managing Director & Head Availity India', 'Availity India', 10),
('11111111-1111-1111-1111-000000000001', 'Rohit Aradhya', 'Managing Director & VP', 'Barracuda', 11),
('11111111-1111-1111-1111-000000000001', 'Nagalakshmi Shetty', 'Vice President & India Country Head', 'Icon PLC', 12),
('11111111-1111-1111-1111-000000000001', 'Srinivas Chamarthy', 'SVP Engineering & India Site Lead', 'Diligent India', 13),
('11111111-1111-1111-1111-000000000001', 'Saraswathi Ramachandra', 'Managing Director & Country Head', 'Lightcast', 14),
('11111111-1111-1111-1111-000000000001', 'Shivi Mithal', 'Vice President and Country Manager', 'Mimecast', 15),
('11111111-1111-1111-1111-000000000001', 'Rency Matthew', 'Managing Director People Leader', 'Sabre Corporation', 16),
('11111111-1111-1111-1111-000000000001', 'Romit Sen', 'Sr Director of Product Management & India Site Lead', 'Blackhawk Network', 17),
('11111111-1111-1111-1111-000000000001', 'Srinivasan Ramakrishnan', 'VP & Global Head Procurement', 'Schneider Electric', 18),
('11111111-1111-1111-1111-000000000001', 'Prakash Kumar', 'Head of Corporate IT', 'ZEISS India', 19),
('11111111-1111-1111-1111-000000000001', 'Nayeema Kouser', 'Global Finance Operations & Centre Head', 'Sinch', 20),
('11111111-1111-1111-1111-000000000001', 'Amitesh Pandey', 'Vice President', 'Recro', 21),
('11111111-1111-1111-1111-000000000001', 'Kavita Viswanath', 'SVP & India Country Lead', 'Toast', 22),
('11111111-1111-1111-1111-000000000001', 'Utkarsh Sawant', 'Global Head of Cyber Strategy', 'Diageo', 23),
('11111111-1111-1111-1111-000000000001', 'Pratik Nath', 'Managing Director', 'Epsilon India', 24),
('11111111-1111-1111-1111-000000000001', 'Sreedhar Pathri', 'Director, Sourcing Ops & ProcureTech', 'Iron Mountain', 25),
('11111111-1111-1111-1111-000000000001', 'Suchismita Sanyal', 'India Strategy Manager', 'ExxonMobil', 26),
('11111111-1111-1111-1111-000000000001', 'Haren Sanghvi', 'Chief Executive Officer', 'HSAG', 27),
('11111111-1111-1111-1111-000000000001', 'Girish Gadamsetty', 'Director - Business Operations', 'Adobe', 28),
('11111111-1111-1111-1111-000000000001', 'Venkatesh Duraisamy', 'Director – Data Engineering', 'Sandisk', 29),
('11111111-1111-1111-1111-000000000001', 'Nicholas Ellis', 'EVP, Business Operations & Emerging Markets', 'Progress', 30),
('11111111-1111-1111-1111-000000000001', 'Titir Pal', 'Managing Director, Head of Analytics & Information Management', 'Citi', 31),
('11111111-1111-1111-1111-000000000001', 'Amit Singh', 'Global Practice Lead - AI', 'Tavant Technologies', 32),
('11111111-1111-1111-1111-000000000001', 'Neeraj Matiyani', 'Head of Sales', 'DevRev', 33),
('11111111-1111-1111-1111-000000000001', 'Sameer Singh', 'COO', '91Springboard', 34),
('11111111-1111-1111-1111-000000000001', 'Hari Ramdas', 'Head - Corporate Salary', 'RBL Bank', 35),
('11111111-1111-1111-1111-000000000001', 'Sachin Nigam', 'CTO and Co-founder', 'Goavega Software', 36),
('11111111-1111-1111-1111-000000000001', 'Anil Raghav', 'Managing Director', 'Zoetis', 37),
('11111111-1111-1111-1111-000000000001', 'Pancham Taneja', 'Country Head – India', 'Delta Capita', 38),
('11111111-1111-1111-1111-000000000001', 'Tanin Chakraborty', 'Sr Director I DPO', 'Biocon Biologics', 39),
('11111111-1111-1111-1111-000000000001', 'Nithya Subramanian', 'Global Data & AI Leader & Member Board of Directors', 'Best Buy', 40),
('11111111-1111-1111-1111-000000000001', 'Pravin Dadu', 'Vice President GCC Practice Head', 'Esolutions', 41),
('11111111-1111-1111-1111-000000000001', 'Dr. Githa Heggde', 'Dean & Principal', 'MICA - The School of Ideas', 42),
('11111111-1111-1111-1111-000000000001', 'Gaurav Agarwal', 'VP Engineering', 'symplr', 43),
('11111111-1111-1111-1111-000000000001', 'Siddhartha Nagar', 'Head, Industry Partnerships and Career Services', 'BITSoM', 44),
('11111111-1111-1111-1111-000000000001', 'Bhaskar Sagar', 'Cluster Head, GCC & Social Infrastructure', 'GIFT City', 45),
('11111111-1111-1111-1111-000000000001', 'Sumeer Chopra', 'MD Head of CIB Business Risk Capability Office', 'HSBC', 46),
('11111111-1111-1111-1111-000000000001', 'Pankaj Kakkar', 'Managing Director', 'Symplr', 47),
('11111111-1111-1111-1111-000000000001', 'Subhash Bhaskaran', 'Head - Sales & Partnerships', 'SIERRA ODC PRIVATE LIMITED', 48),
('11111111-1111-1111-1111-000000000001', 'Molyama Kromah', 'Head Technical Solutions India (TSI)', 'bp', 49),
('11111111-1111-1111-1111-000000000001', 'Nitesh Ambuj', 'Head of Chapter Node - AI & Intelligent Automation', 'Ericsson', 50),
('11111111-1111-1111-1111-000000000001', 'Tarunesh Mongia', 'Managing Principal', 'Orcapod', 51),
('11111111-1111-1111-1111-000000000001', 'Vinika Yadav', 'HR Operations Head SEA & MEA & CSS India Center Head', 'Hitachi Energy', 52),
('11111111-1111-1111-1111-000000000001', 'Devinder Singh', 'Head of Cyber Governance, Risk, & Compliance', 'Carrier', 53),
('11111111-1111-1111-1111-000000000001', 'Vaishali Wagle', 'Founder & CEO', 'ZENESSE', 54),
('11111111-1111-1111-1111-000000000001', 'Fatima Shariff', 'Chief Financial Officer', 'Kenvue GCC', 55),
('11111111-1111-1111-1111-000000000001', 'Varun Verma', 'Site Lead, Global Digital Technology Hub', 'Albemarle', 56),
('11111111-1111-1111-1111-000000000001', 'Pooja Singh', 'Seasoned GCC Leader', NULL, 57),
('11111111-1111-1111-1111-000000000001', 'Monica Pirgal', 'Chief Executive Officer', 'Bhartiya Converge', 58),
('11111111-1111-1111-1111-000000000001', 'Atul Chanani', 'Head of Global FP&A - India GCC, Director', 'Citi', 59),
('11111111-1111-1111-1111-000000000001', 'Aniket Bansod', 'Director - Business Development', 'Amicorp Advisory Services', 60),
('11111111-1111-1111-1111-000000000001', 'Saravanan Kesavan', 'Dean and Professor of Operations', 'BITSoM', 61),
('11111111-1111-1111-1111-000000000001', 'Diwakar Pathak', 'Senior Product Manager, Data, AI & Security', 'Ericsson', 62),
('11111111-1111-1111-1111-000000000001', 'Raja Ukil', 'Sr Vice President – Head of APJ Sales & Global Alliances', 'ColorTokens', 63),
('11111111-1111-1111-1111-000000000001', 'Savitha Sethuram', 'Head of Applied AI, Global Delivery', 'Google', 64),
('11111111-1111-1111-1111-000000000001', 'Divesh Singla', 'Seasoned GCC Leader', NULL, 65),
('11111111-1111-1111-1111-000000000001', 'Pawan Sachdeva', 'Sr. Managing Director & Technology Head - India', 'Carelon Global Solutions', 66),
('11111111-1111-1111-1111-000000000001', 'Sreedevi Hegde', 'Managing Director & Board Member, GCC Head', 'Vervent', 67);


-- =========================================================================
-- SPEAKERS — Global AI Leadership Summit - Hyderabad (51 speakers)
-- =========================================================================

insert into speakers (event_id, name, designation, company, sort_order) values
('11111111-1111-1111-1111-000000000002', 'Rajesh Puneyani', 'VP & Managing Director', 'Kenvue GCC', 1),
('11111111-1111-1111-1111-000000000002', 'Kaushik Das', 'Seasoned GCC Leader', NULL, 2),
('11111111-1111-1111-1111-000000000002', 'Srinivas Sampath', 'VP R&D and Site Leader', 'Upland India', 3),
('11111111-1111-1111-1111-000000000002', 'Monica Pirgal', 'CEO', 'Bhartiya Converge', 4),
('11111111-1111-1111-1111-000000000002', 'Sandeep Patnaik', 'Sr. Managing Director', 'JLL India', 5),
('11111111-1111-1111-1111-000000000002', 'Aneel Kumar Savalagi', 'Global Chapter Leader, ICC & Data', 'Takeda', 6),
('11111111-1111-1111-1111-000000000002', 'Amrish Kumar', 'Chief Product & Technology Officer', 'Ascent Health Solutions', 7),
('11111111-1111-1111-1111-000000000002', 'Mayur Kapur', 'Chief Strategy Officer - Asia', 'TransUnion', 8),
('11111111-1111-1111-1111-000000000002', 'Ganesh Mahadevan', 'CIO CDO', 'BOSCH', 9),
('11111111-1111-1111-1111-000000000002', 'Anish Agarwal', 'VP & Global Head of AI', 'Warner Bros Discovery', 10),
('11111111-1111-1111-1111-000000000002', 'Venu Kasojjala', 'Data Leader', 'PwC India', 11),
('11111111-1111-1111-1111-000000000002', 'Avinash Gupta', 'Managing Director India & Board Member', 'Fortuna Entertainment', 12),
('11111111-1111-1111-1111-000000000002', 'Pallavi Katiyar', 'Chief Information Officer', 'Tech Mahindra', 13),
('11111111-1111-1111-1111-000000000002', 'Vijaya Kadiyala', 'Executive Director, Technology & Data', 'DBS Bank', 14),
('11111111-1111-1111-1111-000000000002', 'Vivek Sahni', 'Global Change & Service Desk Leader', 'Qnity Electronics (DuPont)', 15),
('11111111-1111-1111-1111-000000000002', 'Amjad Khan Patan', 'VP and Centre Head', 'Bosch', 16),
('11111111-1111-1111-1111-000000000002', 'Dilip Manepalli', 'VP - Innovation & Analytics', 'Vodafone Group', 17),
('11111111-1111-1111-1111-000000000002', 'Surjeet Singh', 'Regional & Managing Director', 'Computershare', 18),
('11111111-1111-1111-1111-000000000002', 'Avinash Samrit', 'President & Country Manager', 'Clean Harbors', 19),
('11111111-1111-1111-1111-000000000002', 'Venugopal Reddy Kandimalla', 'President & India Head', 'Zelis', 20),
('11111111-1111-1111-1111-000000000002', 'Padma Priya Saraswatula', 'Partner & Executive Director, IBM Consulting', 'IBM', 21),
('11111111-1111-1111-1111-000000000002', 'Arun Prakash Asokan', 'Director of Data Science & AI', 'Novartis', 22),
('11111111-1111-1111-1111-000000000002', 'Kingshuk Roy', 'Director', 'UBS', 23),
('11111111-1111-1111-1111-000000000002', 'Anudeep Kamuni', 'Director – Global HR Data Analytics', 'Syneos Health', 24),
('11111111-1111-1111-1111-000000000002', 'Jahangir Shaik', 'Director of Artificial Intelligence', 'Optum', 25),
('11111111-1111-1111-1111-000000000002', 'Nivedita Parwatkar', 'Sr. Director & Head – GTAC', 'Bristol Myers Squibb', 26),
('11111111-1111-1111-1111-000000000002', 'Shobhit Mathur', 'Co-founder', 'Ionic Wealth', 27),
('11111111-1111-1111-1111-000000000002', 'Sriram Cherukuvada', 'VP and Head of Engineering & Delivery', 'Adroitent, Inc.', 28),
('11111111-1111-1111-1111-000000000002', 'Niranjan Gattupalli', 'Co-Founder & CEO', 'CloudFulcrum & DWP Global Corp', 29),
('11111111-1111-1111-1111-000000000002', 'Vijay Morampudi', 'Senior Vice President', 'Marsh', 30),
('11111111-1111-1111-1111-000000000002', 'Saurabh Yadav', 'Director – Data Engineering', 'Quarks Technosoft', 31),
('11111111-1111-1111-1111-000000000002', 'Girija Kolagada', 'VP – APAC HR & India Country Leader', 'Progress', 32),
('11111111-1111-1111-1111-000000000002', 'Divesh Singla', 'Seasoned GCC Leader', NULL, 33),
('11111111-1111-1111-1111-000000000002', 'Raghu Pareddy', 'Founder & CEO', 'Wissen Technology', 34),
('11111111-1111-1111-1111-000000000002', 'Ankita Pathak', 'Head of Global Investments', 'Ionic Wealth', 35),
('11111111-1111-1111-1111-000000000002', 'Valli Bollavaram', 'Chief Technology Officer', 'Swiss Re Global Business Solutions', 36),
('11111111-1111-1111-1111-000000000002', 'Madhusmita Mohapatra', 'Deputy General Manager, Head of Data Platform', 'Mercedes-Benz R&D', 37),
('11111111-1111-1111-1111-000000000002', 'Vishal Kirti Sharma', 'Chief Technology Officer', 'E-Solutions', 38),
('11111111-1111-1111-1111-000000000002', 'Vishal Rakyan', 'Business Head – HNI', 'Ionic Wealth', 39),
('11111111-1111-1111-1111-000000000002', 'Prashanth Nanjundappa', 'VP of Product Management – AI', 'Progress', 40),
('11111111-1111-1111-1111-000000000002', 'Dr. Nupur Soni', 'Director Technology R&D', 'Amgen', 41),
('11111111-1111-1111-1111-000000000002', 'Manish Gupta', 'Director - Commercial Real Estate', 'Regalia Business Park', 42),
('11111111-1111-1111-1111-000000000002', 'Gautam Gouthi', 'Director', 'Brahma H.R Consultants', 43),
('11111111-1111-1111-1111-000000000002', 'Vijaya Mair', 'President - TTPOC, Dean - CDC', 'CVR College of Engineering', 44),
('11111111-1111-1111-1111-000000000002', 'Pavan Deevi', 'Senior Vice President', 'Broadridge', 45),
('11111111-1111-1111-1111-000000000002', 'Saravanan Kesavan', 'Dean and Professor of Operations', 'BITSoM', 46),
('11111111-1111-1111-1111-000000000002', 'Vineet Batra', 'VP – Head of India Data & Analytics', 'Chubb Insurance', 47),
('11111111-1111-1111-1111-000000000002', 'Bhaskar Sinha', 'Director Innovations Labs', 'Schneider Electric', 48),
('11111111-1111-1111-1111-000000000002', 'Venkata Phani Kumar Varma', 'Head of Data, AI & Innovation', 'Lumen India', 49),
('11111111-1111-1111-1111-000000000002', 'Vishal Saroha', 'Executive Director', 'Wells Fargo', 50),
('11111111-1111-1111-1111-000000000002', 'Anita Manda', 'Executive Vice President', 'Broadridge', 51);


-- =========================================================================
-- SPEAKERS — 5th GCC Leadership Conclave - Pune (selected major speakers)
-- =========================================================================

insert into speakers (event_id, name, designation, company, sort_order) values
('11111111-1111-1111-1111-000000000003', 'Vikram Kulkarni', 'Head HSBC Technology India & CIO MSS Operations', 'HSBC', 1),
('11111111-1111-1111-1111-000000000003', 'Sandeep Poddar', 'Chief Architect, Kimberly Clark GCC Pune', 'Kimberly Clark', 2),
('11111111-1111-1111-1111-000000000003', 'Sagar Chatterji', 'Director - Chief of Growth', 'TRC Corporate Consulting', 3),
('11111111-1111-1111-1111-000000000003', 'Biswajit Panda', 'SVP & Head of India GCCs', 'NielsenIQ', 4),
('11111111-1111-1111-1111-000000000003', 'Sameer Shaikh', 'India Head & Senior Director', 'XPO', 5),
('11111111-1111-1111-1111-000000000003', 'Dawn Tiura', 'President & CEO', 'SIG | ORG', 6),
('11111111-1111-1111-1111-000000000003', 'Vinod Shah', 'Site Head & VP of Engineering', 'Zendesk', 7),
('11111111-1111-1111-1111-000000000003', 'Paritosh Mathur', 'Head Wholesale Banking', 'IDFC FIRST BANK LTD', 8),
('11111111-1111-1111-1111-000000000003', 'Aman Dalal', 'Head Transaction Banking Group', 'IDFC FIRST BANK LTD', 9),
('11111111-1111-1111-1111-000000000003', 'Sudipta Adhya', 'Managing Director & Co-Head', 'BNY', 10),
('11111111-1111-1111-1111-000000000003', 'Kamaljit Singh', 'Head of Data & AI Wealth Management', 'Northern Trust', 11),
('11111111-1111-1111-1111-000000000003', 'Jinya Suzuki', 'CEO', 'MUFG Global Services', 12),
('11111111-1111-1111-1111-000000000003', 'Ranjan Bhattacharya', 'MD & Head of Strategy MENAT & India', 'HSBC', 13),
('11111111-1111-1111-1111-000000000003', 'Mayank Purohit', 'Sr. Director Head S/W Engineering Team', 'Samsung India', 14),
('11111111-1111-1111-1111-000000000003', 'Neeraj Mishra', 'Executive Leadership Head of Technology India Leader', 'Xplor Technologies', 15),
('11111111-1111-1111-1111-000000000003', 'Vijay Anand', 'Global Technology Leader Digital Transformation', 'FIS', 16),
('11111111-1111-1111-1111-000000000003', 'Ashutosh Sharma', 'Country Director Head of India Development Centre', 'Checkmarx', 17),
('11111111-1111-1111-1111-000000000003', 'Savitha Sethuram', 'Head of Applied AI Global Delivery', 'Google', 18),
('11111111-1111-1111-1111-000000000003', 'Vijaya Kadiyala', 'ED Head of Data/AI & Enterprise Cloud', 'DBS Tech India', 19),
('11111111-1111-1111-1111-000000000003', 'Megha Yethadka', 'Global Head Uber AI Solutions', 'Uber', 20),
('11111111-1111-1111-1111-000000000003', 'Nitin Dhavate', 'Data Privacy Digital & AI Head APMA', 'Novartis', 21),
('11111111-1111-1111-1111-000000000003', 'Akash Sureka', 'Founder', 'TheNoah.AI', 22),
('11111111-1111-1111-1111-000000000003', 'Ranjith Doshi', 'Global CFO and India COO', 'Collabera', 23),
('11111111-1111-1111-1111-000000000003', 'Sunil Modi', 'Senior Vice President Head of FSSC Global Center', 'Vanderlande', 24),
('11111111-1111-1111-1111-000000000003', 'Shammi Prabhakar', 'Executive Director & GPO', 'NielsenIQ', 25),
('11111111-1111-1111-1111-000000000003', 'Manish Jain', 'GCC Centre Head India YUM Brands', 'YUM Brands', 26),
('11111111-1111-1111-1111-000000000003', 'Srinivasan Ramakrishnan', 'Vice President & Global Head Global Procurement Services', 'Schneider Electric', 27),
('11111111-1111-1111-1111-000000000003', 'Aparna Rao', 'VP & MD/Site Lead CBS India', 'Cencora', 28),
('11111111-1111-1111-1111-000000000003', 'Srini Nandigam', 'Managing Director', 'Advance Auto', 29),
('11111111-1111-1111-1111-000000000003', 'Arvind Chittora', 'Managing Director', 'Sonoco India Performance Hub', 30),
('11111111-1111-1111-1111-000000000003', 'Amit Talwar', 'Country Director & India Leader', 'AGCO Corporation', 31),
('11111111-1111-1111-1111-000000000003', 'Ajay Wadhwa', 'CEO', 'Tata Motors Global Services Ltd.', 32),
('11111111-1111-1111-1111-000000000003', 'Arun Palivela', 'India Director Head of Innovation Center', 'Align Technology', 33),
('11111111-1111-1111-1111-000000000003', 'Jayesh Prajapati', 'Head of Pune Technology Center', 'SLB (Schlumberger)', 34),
('11111111-1111-1111-1111-000000000003', 'Shalini Pillay', 'India Leader Global Capability Centers', 'KPMG', 35),
('11111111-1111-1111-1111-000000000003', 'Rohan Lobo', 'Partner Industry and Channel Leader for GCC', 'Deloitte India', 36),
('11111111-1111-1111-1111-000000000003', 'Surendra Bashani', 'Head of Best Buy India', 'Best Buy India', 37),
('11111111-1111-1111-1111-000000000003', 'Jaideep Agarwal', 'India Global Business Services (GBS) Leader', 'Warner Bros. Discovery', 38),
('11111111-1111-1111-1111-000000000003', 'Romit Sen', 'Senior Director of Product Management India Site Leader', 'BlackHawk Network', 39),
('11111111-1111-1111-1111-000000000003', 'Milesh Jamburao', 'Vice President Head of Strategy and Operations', 'SAP Labs India', 40),
('11111111-1111-1111-1111-000000000003', 'Pankaj Ingle', 'Head of India Engineering & IT', 'Ford Credit', 41),
('11111111-1111-1111-1111-000000000003', 'Deepak Gupta', 'Deputy Head TIAA GC & Head Enterprise Tech & Business Shared Services', 'TIAA Global Capabilities', 42),
('11111111-1111-1111-1111-000000000003', 'Bhavuk Chawla', 'Founder & CEO', 'DataCouch', 43),
('11111111-1111-1111-1111-000000000003', 'Nitin Tappe', 'Cofounder & CEO', 'Pratiti Technologies', 44),
('11111111-1111-1111-1111-000000000003', 'Blessy Varghese', 'Global Business Development & India Country Manager', 'ABBYY', 45),
('11111111-1111-1111-1111-000000000003', 'Kapil Kella', 'Talent Acquisition Leader', 'NCS Group', 46),
('11111111-1111-1111-1111-000000000003', 'Chitralekha Tiwari', 'Head Talent Acquisition & Attraction Global Service Centre', 'DP World', 47),
('11111111-1111-1111-1111-000000000003', 'Sandeep Kulkarni', 'Sr VP & Head', 'Worley Enterprise Services', 48),
('11111111-1111-1111-1111-000000000003', 'Deepak Malkani', 'Head of GBS India', 'Akzonobel', 49),
('11111111-1111-1111-1111-000000000003', 'Sandeep Prabhani', 'Global Head Digital Business Operations', 'ATOS', 50),
('11111111-1111-1111-1111-000000000003', 'Kaushik Das', 'Seasoned GCC Leader', NULL, 51),
('11111111-1111-1111-1111-000000000003', 'Monica Pirgal', 'Chief Executive Officer', 'Bhartiya Converge', 52),
('11111111-1111-1111-1111-000000000003', 'Vaishali Wagle', 'Founder & CEO', 'ZENESSE', 53),
('11111111-1111-1111-1111-000000000003', 'Dr. Anuradha Bhatia', 'Head of Technology India CTO', 'Standard Chartered India', 54),
('11111111-1111-1111-1111-000000000003', 'Anita Manda', 'Executive Vice President', 'Broadridge', 55),
('11111111-1111-1111-1111-000000000003', 'Nanda K Lakkaraju', 'Managing Director', 'Carrier Technologies India', 56),
('11111111-1111-1111-1111-000000000003', 'Pawan Sachdeva', 'Managing Director Digital and Health Services', 'Carelon', 57),
('11111111-1111-1111-1111-000000000003', 'Rajesh Puneyani', 'Vice President & Managing Director', 'Kenvue GCC', 58),
('11111111-1111-1111-1111-000000000003', 'Srinivas Sampath', 'VP R&D and Site Leader', 'Upland India', 59),
('11111111-1111-1111-1111-000000000003', 'Vineet Dwivedi', 'Vice President Global Head', 'Alcon Global Services', 60),
('11111111-1111-1111-1111-000000000003', 'Rajesh Menon', 'Vice President Global Business Services', 'CrowdStrike India Pvt', 61),
('11111111-1111-1111-1111-000000000003', 'Ajay Singh', 'Country Head India', 'Sterling Outsourcing', 62),
('11111111-1111-1111-1111-000000000003', 'Mrinal Duggal', 'Head of Sanofi Global Service Hyderabad Hub', 'Sanofi', 63),
('11111111-1111-1111-1111-000000000003', 'Saurabh Bali', 'Vice President & India Leader', 'Ensemble Health Partners India', 64),
('11111111-1111-1111-1111-000000000003', 'Dr. Vivek Jha', 'Sr. Director Strategy AI & Transformation GCC', 'Eli Lilly and Company', 65),
('11111111-1111-1111-1111-000000000003', 'Manish Gupta', 'Director Commercial Real Estate', 'Regalia Business Park', 66),
('11111111-1111-1111-1111-000000000003', 'Shameel Sharma', 'Managing Director', 'Marriott Tech Accelerator', 67),
('11111111-1111-1111-1111-000000000003', 'Navin Bishnoi', 'Country Head & AVP Central Engineering', 'Marvell Technology', 68),
('11111111-1111-1111-1111-000000000003', 'Amita Karadkhedkar', 'Sr. Director Technology Strategy & Transformation', 'Mastercard', 69),
('11111111-1111-1111-1111-000000000003', 'Adi Raheja', 'Founder & Principal Consultant', 'ARC (Adi Raheja and Co)', 70),
('11111111-1111-1111-1111-000000000003', 'Varun Venkatkrishnan', 'VP Employee Benefits', 'Acko', 71),
('11111111-1111-1111-1111-000000000003', 'Subramani Ramakrishnan', 'Chief Architect', 'Business Core Solutions', 72),
('11111111-1111-1111-1111-000000000003', 'Nishit Narang', 'Associate Professor & Group Head Computer Science', 'BITS Pilani', 73);


-- =========================================================================
-- SPEAKERS — 4th GCC Leadership Conclave - Hyderabad (selected speakers)
-- =========================================================================

insert into speakers (event_id, name, designation, company, sort_order) values
('11111111-1111-1111-1111-000000000004', 'Shri Seeram Sambasiva Rao IAS', 'Special Secretary - IT & Electronics and Environment Departments', 'Government of Kerala', 1),
('11111111-1111-1111-1111-000000000004', 'Dr. Darez Ahamed IAS', 'MD & CEO, Guidance', 'Government of Tamil Nadu', 2),
('11111111-1111-1111-1111-000000000004', 'Rena Jamil IAS', 'Government Representative', 'Government of Chhattisgarh', 3),
('11111111-1111-1111-1111-000000000004', 'Jayesh Ranjan', 'Special Chief Secretary', 'Government of Telangana', 4),
('11111111-1111-1111-1111-000000000004', 'IAS Shri Daljeet Kumar', 'Deputy Secretary, Department of Electronics, IT, BT & S&T', 'Government of Karnataka', 5),
('11111111-1111-1111-1111-000000000004', 'Robin Joffe', 'Partner & Managing Director', 'Frost & Sullivan', 6),
('11111111-1111-1111-1111-000000000004', 'Siva Krishna Kolli', 'CEO', 'KN Advisors', 7),
('11111111-1111-1111-1111-000000000004', 'CA. Milind Limaye', 'Partner', 'Kirtane & Pandit', 8),
('11111111-1111-1111-1111-000000000004', 'Vinod Vasudevan', 'Digital Transformation Leader', 'Carrier', 9),
('11111111-1111-1111-1111-000000000004', 'Divesh Singla', 'SVP Global Operations & MD', 'Signant Health', 10),
('11111111-1111-1111-1111-000000000004', 'Alok Kumar Srivastava', 'GDC & Global Branches Head', 'NEC Corporation India', 11),
('11111111-1111-1111-1111-000000000004', 'Dr. Dinesh Chandrasekar', 'Chief Strategy Officer', 'Centific', 12),
('11111111-1111-1111-1111-000000000004', 'Navin Bishnoi', 'Country Head & AVP', 'Marvell Technology', 13),
('11111111-1111-1111-1111-000000000004', 'George Inasu', 'MD & Country Head', 'Fidelity National Financial India', 14),
('11111111-1111-1111-1111-000000000004', 'Aparna Rao', 'VP & MD/Site Lead', 'Cencora', 15),
('11111111-1111-1111-1111-000000000004', 'Jinya Suzuki', 'CEO', 'MUFG Global Services', 16),
('11111111-1111-1111-1111-000000000004', 'Malahar Pinnelli', 'VP & Country Leader', '7-Eleven Global Solution Center', 17),
('11111111-1111-1111-1111-000000000004', 'Anil Kumar Madugulla', 'Sr Director', 'Baxter', 18),
('11111111-1111-1111-1111-000000000004', 'Pancham Taneja', 'Country Head – India', 'Delta Capita', 19),
('11111111-1111-1111-1111-000000000004', 'Pawan Sachdeva', 'Managing Director', 'Carelon', 20),
('11111111-1111-1111-1111-000000000004', 'Amar Shah', 'Vice President', 'Diageo', 21),
('11111111-1111-1111-1111-000000000004', 'Dr. Dinesh Kumar Murugesan', 'VP GES HR & Head GCC', 'DSM Firmenich', 22),
('11111111-1111-1111-1111-000000000004', 'Namita Adavi', 'Partner & Head - GCCs', 'Zinnov', 23),
('11111111-1111-1111-1111-000000000004', 'Rajesh Puneyani', 'VP & MD', 'Kenvue GCC', 24),
('11111111-1111-1111-1111-000000000004', 'Mayank Purohit', 'Sr. Director', 'Samsung India', 25),
('11111111-1111-1111-1111-000000000004', 'Richa Jain', 'MD', 'Northern Tool + Equipment', 26),
('11111111-1111-1111-1111-000000000004', 'Kalyan Varanasi', 'Sr Director Hyderabad Center', 'HCA Healthcare India', 27),
('11111111-1111-1111-1111-000000000004', 'Vijaya Kadiyala', 'ED | Head of Data/AI', 'DBS Tech India', 28),
('11111111-1111-1111-1111-000000000004', 'Anuprita Bhattacharya', 'Head of MITC', 'Merck Group', 29),
('11111111-1111-1111-1111-000000000004', 'Sumithra Thyagarajan', 'GCC Site Head', 'Invesco', 30),
('11111111-1111-1111-1111-000000000004', 'Savitha Sethuram', 'Head of Applied AI', 'Google', 31),
('11111111-1111-1111-1111-000000000004', 'Shalini Pillay', 'India Leader | Global Capability Centers', 'KPMG', 32),
('11111111-1111-1111-1111-000000000004', 'Tilak Banerjee', 'Head – Innovation Capability Centre', 'Takeda India', 33),
('11111111-1111-1111-1111-000000000004', 'Srinivas Sampath', 'VP R&D & Site Leader', 'Upland India', 34),
('11111111-1111-1111-1111-000000000004', 'Megha Yethadka', 'Global Head Uber AI Solutions', 'Uber', 35),
('11111111-1111-1111-1111-000000000004', 'Dilip Manepalli', 'VP - Innovation & Analytics', 'Vodafone', 36),
('11111111-1111-1111-1111-000000000004', 'Vivek Sahni', 'Global Change Leader', 'Dupont', 37),
('11111111-1111-1111-1111-000000000004', 'Sudipta Adhya', 'MD & Co-Head', 'BNY', 38),
('11111111-1111-1111-1111-000000000004', 'Milesh Jamburao', 'VP – Head of Strategy & Operations', 'SAP Labs India', 39),
('11111111-1111-1111-1111-000000000004', 'Priyanka Gupta', 'Partner People Consulting', 'EY India', 40),
('11111111-1111-1111-1111-000000000004', 'Ned Mody', 'Country Head & Executive MD', 'Cantor Fitzgerald & Newmark', 41),
('11111111-1111-1111-1111-000000000004', 'Gaurav Mathur', 'CEO', 'Credera India GCC', 42),
('11111111-1111-1111-1111-000000000004', 'Soumitra Saha', 'MD & Country Head', 'Lumen Technologies', 43),
('11111111-1111-1111-1111-000000000004', 'Shameel Sharma', 'MD', 'Marriott Tech Accelerator', 44),
('11111111-1111-1111-1111-000000000004', 'Rajeev Mago', 'VP Head India GCC', 'Western Union', 45),
('11111111-1111-1111-1111-000000000004', 'Srinivasan Ramakrishnan', 'VP & Global Head', 'Schneider Electric', 46),
('11111111-1111-1111-1111-000000000004', 'Tarunesh Mongia', 'Managing Principal', 'Orcapod', 47),
('11111111-1111-1111-1111-000000000004', 'Akash Sureka', 'Founder', 'TheNoah.AI', 48),
('11111111-1111-1111-1111-000000000004', 'Vineet Dwivedi', 'VP Global Head', 'Alcon Global Services', 49),
('11111111-1111-1111-1111-000000000004', 'Pavan Deevi', 'Senior Vice President', 'Broadridge India', 50);


-- =========================================================================
-- SPEAKERS — 3rd GCC Leadership Conclave - Bengaluru Sep 2025
-- =========================================================================

insert into speakers (event_id, name, designation, company, sort_order) values
('11111111-1111-1111-1111-000000000005', 'Pawan Sachdeva', 'Managing Director, Digital & Health Services', 'Carelon', 1),
('11111111-1111-1111-1111-000000000005', 'Rajesh Puneyani', 'Vice President & Managing Director', 'Kenvue GCC', 2),
('11111111-1111-1111-1111-000000000005', 'Robin Joffe', 'Partner & Managing Director', 'Frost & Sullivan', 3),
('11111111-1111-1111-1111-000000000005', 'Rohit Kaila', 'Head of Technology & Site Leader', 'Wayfair India TDC', 4),
('11111111-1111-1111-1111-000000000005', 'Shyam Enjeti', 'Chief Delivery Officer', 'Encora', 5),
('11111111-1111-1111-1111-000000000005', 'Joyce Rodriguez', 'Head, Digital Cybersecurity', 'Airbus', 6),
('11111111-1111-1111-1111-000000000005', 'Aparna Rao', 'VP & MD/Site Lead CBS India', 'Cencora', 7),
('11111111-1111-1111-1111-000000000005', 'George Inasu', 'MD & Country Head', 'Fidelity National Financial India', 8),
('11111111-1111-1111-1111-000000000005', 'Jinya Suzuki', 'CEO', 'MUFG Global Services', 9),
('11111111-1111-1111-1111-000000000005', 'Anil Sharma', 'Chief Technology Officer', 'PepsiCo', 10),
('11111111-1111-1111-1111-000000000005', 'Amar Shah', 'Vice President', 'Diageo', 11),
('11111111-1111-1111-1111-000000000005', 'Alok Srivastava', 'GDC and Global Branches Head', 'NEC Corporation', 12);


-- =========================================================================
-- SPEAKERS — GCC Leadership Conclave Bengaluru May 2025
-- =========================================================================

insert into speakers (event_id, name, designation, company, sort_order) values
('11111111-1111-1111-1111-000000000006', 'IAS Shri Daljeet Kumar', 'Deputy Secretary, Department of Electronics, IT, BT & S&T', 'Government of Karnataka', 1),
('11111111-1111-1111-1111-000000000006', 'Robin Joffe', 'Partner & Managing Director', 'Frost & Sullivan', 2),
('11111111-1111-1111-1111-000000000006', 'Suryanarayanan Sankaran', 'Managing Partner & Director', 'Weaver and Tidwell India LLP', 3),
('11111111-1111-1111-1111-000000000006', 'Vaishnavi Kudige', 'Senior VP, APAC Head of Transformation & Innovation BU', 'Northern Trust Corporation', 4),
('11111111-1111-1111-1111-000000000006', 'Deepak Vijayaragavan', 'Senior Vice President - Digital Technologies', 'Datamatics', 5),
('11111111-1111-1111-1111-000000000006', 'Gauraav Thakar', 'SVP & Global Head', 'QualityKiosk Technologies', 6),
('11111111-1111-1111-1111-000000000006', 'Sainath Sreenivasan', 'Vice President - People & Culture', 'Kovaion Consulting', 7),
('11111111-1111-1111-1111-000000000006', 'Pawan Sachdeva', 'Managing Director - Digital and Health Services', 'Carelon', 8),
('11111111-1111-1111-1111-000000000006', 'Rajesh Puneyani', 'Vice President & Managing Director', 'Kenvue GCC', 9),
('11111111-1111-1111-1111-000000000006', 'Srinivas Sampath', 'VP R&D and Site Leader', 'Upland India', 10),
('11111111-1111-1111-1111-000000000006', 'Jinya Suzuki', 'CEO', 'MUFG Global Services', 11),
('11111111-1111-1111-1111-000000000006', 'Rohit Kaila', 'Head of Technology and Site Leader', 'Wayfair India TDC', 12),
('11111111-1111-1111-1111-000000000006', 'Soumitra Saha', 'Managing Director & Country Head', 'Lumen Technologies', 13),
('11111111-1111-1111-1111-000000000006', 'Tilak Banerjee', 'Head, Innovation Capability Centre', 'Takeda India', 14),
('11111111-1111-1111-1111-000000000006', 'Joyce Rodriguez', 'Head, Digital Cybersecurity', 'Airbus India', 15),
('11111111-1111-1111-1111-000000000006', 'George Inasu', 'MD & Country Head', 'Fidelity National Financial India', 16),
('11111111-1111-1111-1111-000000000006', 'Aparna Rao', 'VP & MD/Site Lead CBS India', 'Cencora', 17),
('11111111-1111-1111-1111-000000000006', 'Prakash Bala', 'Executive Vice President', 'Ascendion', 18),
('11111111-1111-1111-1111-000000000006', 'Snigdha Ray', 'VP, Banking & Payment, India R&D Hub Lead', 'Diebold Nixdorf', 19),
('11111111-1111-1111-1111-000000000006', 'Utkarsh Sawant', 'Global Head of Cyber Strategy', 'Diageo', 20),
('11111111-1111-1111-1111-000000000006', 'Nitesh Ambuj', 'Head of Chapter Node, AI & Intelligent Automation', 'Ericsson', 21),
('11111111-1111-1111-1111-000000000006', 'Chandan NS', 'Sr. Director & Site Head', 'Applied Materials India', 22);


-- =========================================================================
-- SPEAKERS — 7th Asia Leadership Awards - Kuala Lumpur
-- =========================================================================

insert into speakers (event_id, name, designation, company, sort_order) values
('11111111-1111-1111-1111-000000000007', 'Robin Joffe', 'Partner & Managing Director, Middle East, Africa & South Asia', 'Frost & Sullivan', 1),
('11111111-1111-1111-1111-000000000007', 'Puneet Chopra', 'Telecom CTO', 'HPE India', 2),
('11111111-1111-1111-1111-000000000007', 'Uma Mahesh', 'Co-Founder & President Americas', 'CamCom.AI', 3),
('11111111-1111-1111-1111-000000000007', 'Srinivas Ganji', 'Solution Delivery Director', 'Arcadis', 4),
('11111111-1111-1111-1111-000000000007', 'Rajeev Jha', 'Head of Security', 'Comviva', 5),
('11111111-1111-1111-1111-000000000007', 'Megha Paradkar', 'VP of Customer Engagement', 'Aavenir', 6),
('11111111-1111-1111-1111-000000000007', 'Devendrasingh Rajput', 'Chief Business Officer', 'Indira IVF', 7),
('11111111-1111-1111-1111-000000000007', 'Payal Nanjiani', 'CEO & Founder', 'The Payal Nanjiani Company', 8),
('11111111-1111-1111-1111-000000000007', 'Vaishali Wagle', 'Founder & CEO', 'Zenesse', 9);


-- =========================================================================
-- SPEAKERS — 5th Asia Leadership Awards - Mumbai
-- =========================================================================

insert into speakers (event_id, name, designation, company, sort_order) values
('11111111-1111-1111-1111-000000000008', 'Dr. Ajay Prabhakar', 'Award-winning Author and Senior Consultant', 'United Nations', 1),
('11111111-1111-1111-1111-000000000008', 'Megha Paradkar', 'VP Customer Engagement', 'Aavenir', 2),
('11111111-1111-1111-1111-000000000008', 'Devendrasingh Rajput', 'CBO', 'Indira IVF', 3),
('11111111-1111-1111-1111-000000000008', 'Tentu Venkataramana', 'CEO', 'JR Group of Industries', 4),
('11111111-1111-1111-1111-000000000008', 'Payal Nanjiani', 'CEO & Founder', 'The Payal Nanjiani Company', 5),
('11111111-1111-1111-1111-000000000008', 'Vaishali Wagle', 'Founder & CEO', 'Zenesse', 6);


-- =========================================================================
-- SPEAKERS — 4th Asia Leadership Awards - Bangkok
-- =========================================================================

insert into speakers (event_id, name, designation, company, sort_order) values
('11111111-1111-1111-1111-000000000009', 'Radhakrishnan Mahalingam', 'President & Honorary Advisory Committee - Blockchain Legal Institute', NULL, 1),
('11111111-1111-1111-1111-000000000009', 'Dhiraj Poojara', 'Managing Director', 'Royal Technosoft', 2),
('11111111-1111-1111-1111-000000000009', 'Sumit Sawhney', 'Global HR, Talent Leader and Author', NULL, 3),
('11111111-1111-1111-1111-000000000009', 'Kinjal Choudhary', 'President - HR', 'Cadila', 4),
('11111111-1111-1111-1111-000000000009', 'Himanshi Jain', 'AVP Organizational Effectiveness and Transformation', 'Cadila', 5),
('11111111-1111-1111-1111-000000000009', 'Marvin Chris Zoilo', 'Chairman - ASEAN HR Leader Circle', NULL, 6),
('11111111-1111-1111-1111-000000000009', 'Sundara Rajan', 'Founder and Director', 'People Metrics', 7),
('11111111-1111-1111-1111-000000000009', 'Sanjey Pawah', 'Founder', 'Precisio', 8);


-- =========================================================================
-- SPEAKERS — 2nd Bharat Leadership Excellence Awards - New Delhi
-- =========================================================================

insert into speakers (event_id, name, designation, company, sort_order) values
('11111111-1111-1111-1111-000000000012', 'Lt Gen Suresh Sharma', 'Former Engineer-in-Chief & Former Director General Border Roads', 'Ministry of Defence', 1),
('11111111-1111-1111-1111-000000000012', 'Colonel Ajai Lal', 'Founder - Forward Consulting, TEDx Speaker', NULL, 2),
('11111111-1111-1111-1111-000000000012', 'Dr. Rajeev Jha', 'Head of Security', 'Comviva', 3),
('11111111-1111-1111-1111-000000000012', 'Dr. Ankoor Dasgupta', 'Advisory Board Member, CMO', NULL, 4),
('11111111-1111-1111-1111-000000000012', 'Uma Mahesh', 'Co-Founder & President Americas', 'CamCom.AI', 5),
('11111111-1111-1111-1111-000000000012', 'Puneet Chopra', 'Telecom CTO', 'HPE India', 6),
('11111111-1111-1111-1111-000000000012', 'Parthiban Ramasamy', 'Director - Vertical', 'T-Systems ICT India', 7),
('11111111-1111-1111-1111-000000000012', 'Srinivas Ganji', 'Solution Delivery Director', 'Arcadis', 8);


-- =========================================================================
-- SPONSORS — 6th GCC Leadership Conclave - Bengaluru (17)
-- =========================================================================

insert into sponsors (event_id, name, tier, sort_order) values
('11111111-1111-1111-1111-000000000001', 'GIFT City', 'partner', 1),
('11111111-1111-1111-1111-000000000001', 'ADP', 'partner', 2),
('11111111-1111-1111-1111-000000000001', 'E-Solutions', 'partner', 3),
('11111111-1111-1111-1111-000000000001', 'RBL Bank', 'partner', 4),
('11111111-1111-1111-1111-000000000001', 'BITSoM', 'partner', 5),
('11111111-1111-1111-1111-000000000001', 'Orcapod', 'partner', 6),
('11111111-1111-1111-1111-000000000001', 'ColorTokens', 'partner', 7),
('11111111-1111-1111-1111-000000000001', 'DevRev', 'partner', 8),
('11111111-1111-1111-1111-000000000001', 'CoreStack', 'partner', 9),
('11111111-1111-1111-1111-000000000001', 'AMICORP', 'partner', 10),
('11111111-1111-1111-1111-000000000001', 'HSAG', 'partner', 11),
('11111111-1111-1111-1111-000000000001', 'Progress', 'partner', 12),
('11111111-1111-1111-1111-000000000001', 'RST Solutions', 'partner', 13),
('11111111-1111-1111-1111-000000000001', 'Silver Oak Health', 'partner', 14),
('11111111-1111-1111-1111-000000000001', 'Edutech', 'partner', 15),
('11111111-1111-1111-1111-000000000001', 'Vidushi Infotech', 'partner', 16),
('11111111-1111-1111-1111-000000000001', 'Peregrine Guarding', 'partner', 17);


-- =========================================================================
-- SPONSORS — Global AI Leadership Summit - Hyderabad (14)
-- =========================================================================

insert into sponsors (event_id, name, tier, sort_order) values
('11111111-1111-1111-1111-000000000002', 'E-Solutions', 'partner', 1),
('11111111-1111-1111-1111-000000000002', 'Regalia Business Park', 'partner', 2),
('11111111-1111-1111-1111-000000000002', 'CloudFulcrum', 'partner', 3),
('11111111-1111-1111-1111-000000000002', 'BITSoM', 'partner', 4),
('11111111-1111-1111-1111-000000000002', 'DWP Global Corp', 'partner', 5),
('11111111-1111-1111-1111-000000000002', 'Ascendion', 'partner', 6),
('11111111-1111-1111-1111-000000000002', 'Ionic Wealth', 'partner', 7),
('11111111-1111-1111-1111-000000000002', 'Quarks Technosoft', 'partner', 8),
('11111111-1111-1111-1111-000000000002', 'Progress', 'partner', 9),
('11111111-1111-1111-1111-000000000002', 'CommScope', 'partner', 10),
('11111111-1111-1111-1111-000000000002', 'Shyena Corporate', 'partner', 11),
('11111111-1111-1111-1111-000000000002', 'Purechase', 'partner', 12),
('11111111-1111-1111-1111-000000000002', 'Edutech Emerging Tech Labs', 'partner', 13),
('11111111-1111-1111-1111-000000000002', 'Clarity Consulting', 'partner', 14);


-- =========================================================================
-- SPONSORS — 5th GCC Leadership Conclave - Pune (11)
-- =========================================================================

insert into sponsors (event_id, name, tier, sort_order) values
('11111111-1111-1111-1111-000000000003', 'Regalia Business Parks', 'partner', 1),
('11111111-1111-1111-1111-000000000003', 'ACKO', 'partner', 2),
('11111111-1111-1111-1111-000000000003', 'Orcapod', 'partner', 3),
('11111111-1111-1111-1111-000000000003', 'IDFC FIRST Bank', 'partner', 4),
('11111111-1111-1111-1111-000000000003', 'BITS Pilani', 'partner', 5),
('11111111-1111-1111-1111-000000000003', 'Business Core Solutions', 'partner', 6),
('11111111-1111-1111-1111-000000000003', 'Guidance Tamil Nadu', 'partner', 7),
('11111111-1111-1111-1111-000000000003', 'Incentivate Solutions', 'partner', 8),
('11111111-1111-1111-1111-000000000003', 'Xoxoday', 'partner', 9),
('11111111-1111-1111-1111-000000000003', 'TRC', 'partner', 10),
('11111111-1111-1111-1111-000000000003', 'Lighthouse Learning', 'partner', 11);


-- =========================================================================
-- SPONSORS — 4th GCC Leadership Conclave - Hyderabad (17)
-- =========================================================================

insert into sponsors (event_id, name, tier, sort_order) values
('11111111-1111-1111-1111-000000000004', 'Orcapod', 'partner', 1),
('11111111-1111-1111-1111-000000000004', 'V3 Staffing', 'partner', 2),
('11111111-1111-1111-1111-000000000004', 'Kerala IT', 'partner', 3),
('11111111-1111-1111-1111-000000000004', 'Thapar Institute of Engineering & Technology', 'partner', 4),
('11111111-1111-1111-1111-000000000004', 'ORIX India', 'partner', 5),
('11111111-1111-1111-1111-000000000004', 'Intellect Design', 'partner', 6),
('11111111-1111-1111-1111-000000000004', 'KNA Advisors', 'partner', 7),
('11111111-1111-1111-1111-000000000004', 'CloudLeap', 'partner', 8),
('11111111-1111-1111-1111-000000000004', 'Guidance Tamil Nadu', 'partner', 9),
('11111111-1111-1111-1111-000000000004', 'Planview', 'partner', 10),
('11111111-1111-1111-1111-000000000004', 'Government of Chhattisgarh', 'partner', 11),
('11111111-1111-1111-1111-000000000004', 'Adroitent.ai', 'partner', 12),
('11111111-1111-1111-1111-000000000004', 'C Ahead Digital', 'partner', 13),
('11111111-1111-1111-1111-000000000004', 'iVueverse', 'partner', 14),
('11111111-1111-1111-1111-000000000004', 'Infojini', 'partner', 15),
('11111111-1111-1111-1111-000000000004', 'AQM Corporate', 'partner', 16),
('11111111-1111-1111-1111-000000000004', 'BITS Pilani', 'partner', 17);


-- =========================================================================
-- NOTE ON SPONSOR TIERS:
-- The source websites did not differentiate sponsors by tier (title/platinum/
-- gold/silver/bronze). All are listed as 'partner' which is the default.
-- Update individual tiers once the actual tier data is confirmed.
-- =========================================================================


-- =========================================================================
-- ADVISORY BOARD MEMBERS (reference data - not a DB table in current schema)
-- Stored as a comment block for reference.
-- =========================================================================
/*
ADVISORY BOARD & JURY MEMBERS (from theleadershipfederation.com/advisoryboardandjury):

1.  Mohammed Al Mashroom | Founder & CEO | Dubai Euro Group
2.  Colonel Ajai Lal | Leadership and Executive Coach, TEDx Speaker, Author | Former Chief Business Officer, Colonel in Indian Army (Veteran), Former Senior Military Observer at United Nations
3.  Robin (Arthur) Joffe | Partner, Managing Director, Middle East, Africa and South Asia | Frost & Sullivan
4.  Devendrasingh Rajput | Chief Business Officer | Indira IVF (20+ years diagnostics/healthcare)
5.  Sandip Patnaik | Sr. Managing Director and Board Director | JLL India (26+ years, 18 with JLL)
6.  Dr. Rajesh Puneyani | Vice President for Technology and Site Leader | Kenvue India GCC (28+ years global leadership)
7.  Kaushik Das | Managing Director | JCPenney India (25+ years transformation/strategy)
8.  Srinivas Sampath | Vice President R&D and Site Leader | Upland India (~30 years building global tech orgs)
9.  Monica Pirgal | Chief Executive Officer | Bhartiya Converge (Qualified lawyer, 25 years industry, formerly Neiman Marcus Group)
10. Neel Pandya | Chief Executive Officer - EMEA, APAC & Global Partnerships | Pixis (ex-L'oreal, Vodafone, Unilever)
11. Dr. Ishha Farha Quraishy | Founder | IFQ Technologies (AI/Metaverse evangelist, 14+ years tech)
12. Jai Mulani | CEO | IBT (Built 1000+ employee company in Dubai valued $150M+)
13. Radhakrishnan Mahalingam | Chief IT Transformations Leader | (23 years ICT, smart security, e-governance)
14. Ms. Vaishali Wagle | Founder and CEO | Zenesse (20+ years banking tech at Citi & JPMorgan)

JURY MEMBERS (Asia Leadership Awards):
- Mr. Yaseen Sahar | Channel Head / Assistant VP | SBI Funds Management Limited
- Dr. Rama Moondra | Dean | Adani Institute of Digital Technology Management
- Mr. Dipen Tamboli | Project Control Manager | The Newtron Group, USA
- Mr. Radhakrishnan Mahalingam | Chief IT Transformations Leader
- Mr. Neel Pandya | CEO - EMEA, APAC & Global Partnerships | Pixis
- Mr. Gautam Sikka | Software Engineer | META

JURY MEMBERS (5th Asia Leadership Awards - Mumbai):
- Pavan Joshi | VP Software Engineering | Fiserv
- Rajesh Kotha | Software Development Engineering Advisor | Fiserv
- Vijayshekar Duvur | Software Systems Modernization Specialist | 3i Infotech
- Navtej Paul Singh | GenAI and Senior Data Analyst Leader | AustralianSuper
- Vijitha Uppuluri | Senior Manager Data Science | CVS Health
- Yaseen Sahar | Assistant VP | SBI Funds Management Limited
- Santosh Kumar Singu | Sr. Solution Specialist | Deloitte
- Nilesh Yadav | Senior Finance Leader | Collabera Inc.
*/


-- =========================================================================
-- ORGANIZATION & CONTACT DATA (reference)
-- =========================================================================
/*
THE LEADERSHIP FEDERATION
- Founded: 2016
- Mission: "Empowering Tomorrow's Leaders Today" - inspire, educate, and connect leaders globally
- HQ: Office no 44-43, Building of Dubai Municipality, Bur Dubai - Al Fahidi, Dubai, UAE
- Email: register@theleadershipfederation.com

TEAM CONTACTS:
- Harshal Patel | Sponsorship & Exhibitor | Harshal@theleadershipfederation.com | +917227993338
- Ovais Kapadia | Award Nomination & Speaker | Ovais@theleadershipfederation.com | +919106033979
- Manan Desai | Award Nomination & Speaker | Manan@theleadershipfederation.com | +919978257508
- Jessica Morgan | VP Marketing | Hello@theleadershipfederation.com
- WhatsApp Support: +919327471565

BRAND PARTNERS (displayed on main site):
Axis Bank, Tata, Reliance Jio, HCLTech, Atos, Apollo, Barclays, Ernst & Young, ICICI Bank,
Philips, Cadila Pharmaceuticals, SIBAE, H&M, State Bank of India, Gulf News, Frost & Sullivan
*/
