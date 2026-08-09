/**
 * Every edition of the platform, newest first.
 * Sourced from the official event pages.
 */
export type Edition = {
  index: string;
  kind: string;
  title: string;
  city: string;
  date: string;
  status: 'Upcoming' | 'Past';
  href: string;
};

export const EDITIONS: Edition[] = [
  { index: '01', kind: 'Round Tables', title: 'CXO Round Table & Networking Dinner', city: 'Singapore', date: '20 Aug 2026', status: 'Upcoming' as Edition['status'], href: 'https://gcc.theleadershipfederation.com/CXOSingapore' },
  { index: '02', kind: 'Round Tables', title: 'CXO Round Table & Networking Dinner', city: 'Dubai', date: '26 Aug 2026', status: 'Upcoming' as Edition['status'], href: 'https://gcc.theleadershipfederation.com/Dubai2026' },
  { index: '03', kind: 'GCC Conclaves', title: 'GCC Leadership Conclave — 9th Edition', city: 'Bengaluru', date: '09–10 Sep 2026', status: 'Upcoming' as Edition['status'], href: 'https://gcc.theleadershipfederation.com/blr' },
  { index: '04', kind: 'Round Tables', title: 'CXO Round Table & Networking Dinner', city: 'Chicago', date: '16 Sep 2026', status: 'Upcoming' as Edition['status'], href: 'https://gcc.theleadershipfederation.com/CXORoundChicago' },
  { index: '05', kind: 'Round Tables', title: 'CXO Round Table & Networking Dinner', city: 'Dallas', date: '22 Sep 2026', status: 'Upcoming' as Edition['status'], href: 'https://gcc.theleadershipfederation.com/CXORoundTableDallas' },
  { index: '06', kind: 'Round Tables', title: 'CXO Round Table & Networking Dinner', city: 'Austin', date: '23 Sep 2026', status: 'Upcoming' as Edition['status'], href: 'https://gcc.theleadershipfederation.com/CXORoundTableAustin' },
  { index: '07', kind: 'BFSI Summit', title: 'Global BFSI GCC Leadership Summit', city: 'Mumbai', date: '30 Jul 2026', status: 'Past' as Edition['status'], href: 'https://gcc.theleadershipfederation.com/bfsi' },
  { index: '08', kind: 'Round Tables', title: 'CXO Round Table & Networking Dinner', city: 'Dubai', date: '15 Jul 2026', status: 'Past' as Edition['status'], href: 'https://gcc.theleadershipfederation.com/CXODubai' },
  { index: '09', kind: 'GCC Conclaves', title: 'GCC Leadership Conclave — 8th Edition', city: 'Hyderabad', date: '09 Jul 2026', status: 'Past' as Edition['status'], href: 'https://gcc.theleadershipfederation.com/hyd' },
  { index: '10', kind: 'GCC Conclaves', title: 'GCC Leadership Conclave — 7th Edition', city: 'Mumbai', date: '21 May 2026', status: 'Past' as Edition['status'], href: 'https://gcc.theleadershipfederation.com/mumbai' },
  { index: '11', kind: 'GCC Conclaves', title: 'GCC Leadership Conclave — 6th Edition', city: 'Bengaluru', date: '07 Apr 2026', status: 'Past' as Edition['status'], href: 'https://gcc.theleadershipfederation.com/bengaluru' },
  { index: '12', kind: 'AI Summit', title: 'Global AI Leadership Summit', city: 'Hyderabad', date: '12 Mar 2026', status: 'Past' as Edition['status'], href: 'https://gcc.theleadershipfederation.com/ai' },
  { index: '13', kind: 'GCC Conclaves', title: 'GCC Leadership Conclave — 5th Edition', city: 'Pune', date: '21 Jan 2026', status: 'Past' as Edition['status'], href: 'https://gcc.theleadershipfederation.com/pune' },
  { index: '14', kind: 'GCC Conclaves', title: 'GCC Leadership Conclave — 4th Edition', city: 'Hyderabad', date: '13 Nov 2025', status: 'Past' as Edition['status'], href: 'https://gcc4.theleadershipfederation.com/TheGCCLeadershipConclave-Hyderabad2' },
  { index: '15', kind: 'GCC Conclaves', title: 'GCC Leadership Conclave — 3rd Edition', city: 'Bengaluru', date: '03 Sep 2025', status: 'Past' as Edition['status'], href: 'https://gcc3.theleadershipfederation.com/TheGCCLeadershipConclaveBengaluruKarnatakaIndia3rdSeptember2025' },
  { index: '16', kind: 'GCC Conclaves', title: 'GCC Leadership Conclave — 2nd Edition', city: 'Hyderabad', date: '30 Jul 2025', status: 'Past' as Edition['status'], href: 'https://gcc2.theleadershipfederation.com/TheGCCLeadershipConclave-Hyderabad' },
  { index: '17', kind: 'GCC Conclaves', title: 'The GCC Leadership Conclave — 1st Edition', city: 'Bengaluru', date: '14 May 2025', status: 'Past' as Edition['status'], href: 'https://gcc1.theleadershipfederation.com/TheGCCLeadershipConclave' },
];

export const EDITION_KINDS = ['All', ...Array.from(new Set(EDITIONS.map((e) => e.kind)))];
