/**
 * Advisory Board & Jury — the real roster, published with the members' own
 * photographs and titles. Portraits mirrored into /public/board.
 * Source: theleadershipfederation.com/advisoryboardandjury
 */
export type BoardMember = { name: string; title: string; bio: string; photo: string | null };
export type JuryMember = { name: string; title: string; country: string; photo: string | null };

export const ADVISORY_BOARD: BoardMember[] = [
  { name: 'Mohammed Al Mashroom', title: 'Founder & CEO - Dubai Euro Group', bio: 'An experienced entrepreneur with a track record of success in the international commerce and development sector. Mr. Mashroom worked in government on housing issues as well as in the industrial sector, focusing on medium and high voltage systems, including switchgear panel design and assembly, along with providing technical assistance to companies in medium and high voltage systems.', photo: '/board/mohammed-al-mashroom.png' },
  { name: 'Colonel Ajai Lal', title: 'Leadership and Executive Coach · TEDx Speaker · Author', bio: 'Former Chief Business Officer, Colonel in the Indian Army (Veteran) and former Senior Military Observer with the United Nations. International radio host with extensive transition and transformational leadership development expertise.', photo: '/board/colonel-ajai-lal.png' },
  { name: 'Robin (Arthur) Joffe', title: 'Partner, Managing Director — Middle East, Africa and South Asia, Frost & Sullivan', bio: 'Growth strategist and visionary thinker with extensive on-the-ground experience building companies and businesses globally, with a focus on the Asia Pacific region.', photo: '/board/robin-arthur-joffe.png' },
  { name: 'Devendrasingh Rajput', title: 'Chief Business Officer at Indira IVF', bio: '20+ years in diagnostics and healthcare with P&L responsibility. Proven track record scaling up and turning around business units across domestic and international geographies, with deep expertise in M&A, franchising and asset-light expansion.', photo: '/board/devendrasingh-rajput.png' },
  { name: 'Sandip Patnaik', title: 'Sr. Managing Director, JLL India | Board of Directors, JLL India', bio: 'Over 26 years of professional experience, including 18 with JLL India. He has played a defining role in driving business growth and market leadership across office, retail, residential, land, warehousing and industrial asset classes.', photo: '/board/sandip-patnaik.png' },
  { name: 'Dr. Rajesh Puneyani', title: 'Vice President for Technology and Site Leader at Kenvue', bio: '28+ years of global leadership. Instrumental in establishing and scaling Centres of Excellence, Global Delivery Centres and GCCs, with prior roles at Lowe\'s, Wells Fargo, Oracle, IBM and Dell. A certified professional coach.', photo: '/board/dr-rajesh-puneyani.png' },
  { name: 'Kaushik Das', title: 'Managing Director at JCPenney India', bio: '25+ years of global experience in transformation, strategy, operations and change management across retail, fintech, financial services and consulting. Specialises in building and scaling complex GCC capabilities from the ground up.', photo: '/board/kaushik-das.png' },
  { name: 'Srinivas Sampath', title: 'Vice President R&D and Site Leader at Upland India', bio: 'Close to three decades building, scaling and transforming global technology and product organizations. Recognised as GCC Leader of the Year in R&D and Site Leadership by the Leadership Federation.', photo: '/board/srinivas-sampath.png' },
  { name: 'Monica Pirgal', title: 'Chief Executive Officer at Bhartiya Converge', bio: 'A qualified lawyer overseeing the strategic direction of the GCC business across India. Twenty-five years of industry experience, previously Country Head, India for the Neiman Marcus Group in Bengaluru.', photo: '/board/monica-pirgal.png' },
  { name: 'Neel Pandya', title: 'Chief Executive Officer — EMEA, APAC & Global Partnerships at Pixis', bio: 'Focused on putting India on the global map for AI and innovation in marketing. Extensive experience across FMCG, telecom, marketing and advertising with L\'Oréal, Vodafone and Unilever.', photo: '/board/neel-pandya.png' },
  { name: 'Dr. Ishha Farha Quraishy', title: 'Founder — IFQ Technologies', bio: 'An AI and Metaverse innovation evangelist with over 14 years in technology, leading a firm specialising in advanced R&D within artificial intelligence.', photo: '/board/dr-ishha-farha-quraishy.png' },
  { name: 'Jai Mulani', title: 'CEO at IBT', bio: 'A leader transforming the BPO industry in the Middle East, having built a company that employs 1000+ people in Dubai and is valued at more than USD 150 million.', photo: '/board/jai-mulani.png' },
  { name: 'Radhakrishnan Mahalingam', title: 'Chief IT Transformations Leader — Enterprise & Large Scale Applications', bio: '23 years across ICT smart security, master system integration, smart cities, e-governance, IoT portfolio management and enterprise architecture, spanning BFSI, healthcare, energy and life sciences.', photo: '/board/radhakrishnan-mahalingam.png' },
  { name: 'Ms. Vaishali Wagle', title: 'Founder and CEO at Zenesse', bio: 'A leadership strategist and peak performance coach to Fortune 500s. A banking technologist for over two decades with Citi and JPMorgan, now leading a people and business transformation coaching and research firm.', photo: '/board/ms-vaishali-wagle.png' },
];

export const JURY: JuryMember[] = [
  { name: 'Dr. Rama Mundra', title: 'Dean at The Adani Institute of Digital Technology Management', country: 'India', photo: '/board/dr-rama-mundra.png' },
  { name: 'Yaseen Sahar', title: 'Channel Head — SBI Mutual Funds', country: 'India', photo: '/board/yaseen-sahar.png' },
  { name: 'Aniruddh Tiwari', title: 'Data Analytics Leader and Evangelist', country: 'USA', photo: '/board/aniruddh-tiwari.png' },
  { name: 'Rupal Jain', title: 'Semi-Conductor Industry Leader', country: 'USA', photo: '/board/rupal-jain.png' },
  { name: 'Prashant Kumar', title: 'Data Scientist and Generative AI Evangelist at BOLD', country: 'USA', photo: '/board/prashant-kumar.png' },
  { name: 'Suneeta Modekurty', title: 'Business Analytics, Data Science and GenAI Leader', country: 'USA', photo: '/board/suneeta-modekurty.png' },
  { name: 'Dipen Tamboli', title: 'Project Control Manager at Newtron Group', country: 'USA', photo: '/board/dipen-tamboli.png' },
  { name: 'Anil Sood', title: 'AI Governance & Data Management Leader at EY', country: 'Canada & US', photo: '/board/anil-sood.png' },
  { name: 'Gaurav Shah', title: 'Director of Software Development at EG4 Electronics', country: 'USA', photo: '/board/gaurav-shah.png' },
  { name: 'Ankur Mehra', title: 'Advisory Board Member and Author', country: '', photo: '/board/ankur-mehra.png' },
  { name: 'Harish Padmanabhan', title: 'Vice President — SRE at JP Morgan Chase', country: 'USA', photo: '/board/harish-padmanabhan.png' },
  { name: 'Punit Panjwani', title: 'Manager, Control System Integration at Barry-Wehmiller Design Group', country: 'USA', photo: '/board/punit-panjwani.png' },
  { name: 'Pavan Joshi', title: 'Vice President of Software Engineering at Fiserv', country: 'USA', photo: '/board/pavan-joshi.png' },
  { name: 'Arpil Mehta', title: 'AVP — Fraud Analytics & Innovation Sr. Analyst at Bank of America', country: 'USA', photo: '/board/arpil-mehta.png' },
  { name: 'Sabyasachi Mondal', title: 'Senior Software Engineer at Apple', country: 'USA', photo: '/board/sabyasachi-mondal.png' },
  { name: 'Shreerang Tarte', title: 'Head HR and Business Strategy at JSM Consulting Inc.', country: 'USA', photo: '/board/shreerang-tarte.png' },
  { name: 'Bhashwanth Kadapagunta', title: 'Specialist Leader (Senior Manager) — Deloitte', country: 'USA', photo: '/board/bhashwanth-kadapagunta.png' },
  { name: 'Sanjay Jain', title: 'Machine Learning Engineer at Atlanta Journal-Constitution', country: 'USA', photo: '/board/sanjay-jain.png' },
  { name: 'Santosh Kumar Singu', title: 'Sr. Solution Specialist at Deloitte', country: 'USA', photo: '/board/santosh-kumar-singu.png' },
  { name: 'Ramesh Babu Potla', title: 'ERP SAP Delivery Manager / Digital Transformation COE at Corning, Inc.', country: 'USA', photo: '/board/ramesh-babu-potla.png' },
  { name: 'Anu Shivaraj', title: 'Lead Data Scientist at E. & J. Gallo Winery', country: 'USA', photo: '/board/anu-shivaraj.jpg' },
  { name: 'Ravi Shankar', title: 'Machine Learning Manager at Overstock', country: 'USA', photo: '/board/ravi-shankar.jpg' },
  { name: 'Vijitha Uppuluri', title: 'Sr. Manager Data Science at CVS Health', country: 'USA', photo: '/board/vijitha-uppuluri.png' },
  { name: 'Ravi Kumar Vallemoni', title: 'Sr. Data Architect at Bank of America', country: 'USA', photo: '/board/ravi-kumar-vallemoni.png' },
  { name: 'Anjan G.', title: 'Sr. Software Engineer at Optum', country: 'USA', photo: '/board/anjan-g.png' },
  { name: 'Ashmitha Nagraj', title: 'Senior Full Stack Engineer at Fidelity', country: 'USA', photo: '/board/ashmitha-nagraj.png' },
  { name: 'Sunil Karthik Kota', title: 'Sr. Software Engineer & Technology Leader at Cisco', country: 'USA', photo: '/board/sunil-karthik-kota.png' },
  { name: 'Jagadeeswar Alampally', title: 'Software Development Manager at IQVIA', country: 'USA', photo: '/board/jagadeeswar-alampally.png' },
];

/** How a seat is earned — the process, compressed to four steps. */
export const BOARD_PROCESS = [
  { step: 'Nomination', detail: 'A member, an existing board seat or the programme committee puts a name forward. Self-nomination counts the same.' },
  { step: 'Review', detail: 'The committee weighs the mandate carried, the evidence behind it, and the balance of the board across regions and sectors.' },
  { step: 'Conversation', detail: 'A short call on what you would bring to the room. No pitch deck.' },
  { step: 'Seat', detail: 'Two-year terms. Jurors recuse themselves from their own organisation\'s submissions.' },
];

/** What the jury scores award submissions against. */
export const JURY_CRITERIA = [
  { weight: '40%', criterion: 'Evidence', detail: 'Verifiable outcomes over narrative. Submissions without measurement do not advance.' },
  { weight: '25%', criterion: 'Transferability', detail: 'Whether another centre could adopt the approach and expect a result.' },
  { weight: '20%', criterion: 'Durability', detail: 'Held for more than one reporting cycle, through a leadership change.' },
  { weight: '15%', criterion: 'Originality', detail: 'Genuinely new practice rather than a well-executed standard.' },
];
