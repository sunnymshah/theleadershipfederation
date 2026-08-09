/**
 * ─────────────────────────────────────────────────────────────────────────
 *  PLACEHOLDER PROGRAMME DATA — replace before going live.
 * ─────────────────────────────────────────────────────────────────────────
 *  Structure is final; the values are illustrative so the pages render with
 *  realistic density. Swap in confirmed dates, cities and venues.
 */

import { IMAGES, type LibraryImage } from './images';

export type Programme = {
  slug: string;
  title: string;
  /** e.g. "Conclave", "Roundtable", "Summit" */
  format: string;
  city: string;
  region: string;
  /** Human-readable date range. Keep the year explicit. */
  date: string;
  /** ISO date used for sorting. */
  isoDate: string;
  seats: string;
  summary: string;
  themes: string[];
  image: LibraryImage;
  status: 'open' | 'waitlist' | 'invitation' | 'closed';
};

export const UPCOMING_CONCLAVES: Programme[] = [
  {
    slug: 'gcc-leadership-conclave-hyderabad',
    title: 'GCC Leadership Conclave',
    format: 'Conclave',
    city: 'Hyderabad',
    region: 'India',
    date: '18–19 September 2026',
    isoDate: '2026-09-18',
    seats: '400 delegates',
    summary:
      'The flagship gathering of Global Capability Centre leadership — two days of main-stage dialogue on scaling mandates from delivery to ownership.',
    themes: ['Mandate expansion', 'Talent density', 'AI operating models'],
    image: IMAGES.conferenceHall,
    status: 'open',
  },
  {
    slug: 'enterprise-leadership-summit-bengaluru',
    title: 'Enterprise Leadership Summit',
    format: 'Summit',
    city: 'Bengaluru',
    region: 'India',
    date: '14 November 2026',
    isoDate: '2026-11-14',
    seats: '250 delegates',
    summary:
      'A single-day intensive for CXOs setting enterprise technology and operating strategy across multi-hub organisations.',
    themes: ['Platform consolidation', 'Cost-to-value', 'Governance'],
    image: IMAGES.audience,
    status: 'open',
  },
  {
    slug: 'global-capability-forum-dubai',
    title: 'Global Capability Forum',
    format: 'Forum',
    city: 'Dubai',
    region: 'Middle East',
    date: '4 February 2027',
    isoDate: '2027-02-04',
    seats: '180 delegates',
    summary:
      'Cross-border dialogue between GCC leadership in India and enterprise sponsors across the Gulf and Europe.',
    themes: ['Cross-border operating models', 'Sovereign capability', 'Risk'],
    image: IMAGES.stageMic,
    status: 'waitlist',
  },
];

export const ROUNDTABLES: Programme[] = [
  {
    slug: 'chatham-house-breakfast-mumbai',
    title: 'Chatham House Breakfast',
    format: 'Roundtable',
    city: 'Mumbai',
    region: 'India',
    date: '26 August 2026',
    isoDate: '2026-08-26',
    seats: '14 seats',
    summary:
      'A non-attributable breakfast dialogue on capability ownership, held under the Chatham House Rule.',
    themes: ['Capability ownership', 'Board reporting'],
    image: IMAGES.boardroom,
    status: 'invitation',
  },
  {
    slug: 'cxo-dinner-singapore',
    title: 'CXO Dinner',
    format: 'Roundtable',
    city: 'Singapore',
    region: 'APAC',
    date: '9 October 2026',
    isoDate: '2026-10-09',
    seats: '20 seats',
    summary:
      'An evening convening of regional decision-makers on APAC capability strategy and talent mobility.',
    themes: ['Talent mobility', 'APAC expansion'],
    image: IMAGES.workingSession,
    status: 'invitation',
  },
  {
    slug: 'closed-door-working-session-pune',
    title: 'Closed-Door Working Session',
    format: 'Roundtable',
    city: 'Pune',
    region: 'India',
    date: '3 December 2026',
    isoDate: '2026-12-03',
    seats: '12 seats',
    summary:
      'A structured working session where a single operating problem is taken apart by peers who have solved it.',
    themes: ['Operating design', 'Peer benchmarking'],
    image: IMAGES.workingSession,
    status: 'invitation',
  },
];

export const PAST_EVENTS: Programme[] = [
  {
    slug: 'gcc-leadership-conclave-2025',
    title: 'GCC Leadership Conclave 2025',
    format: 'Conclave',
    city: 'Hyderabad',
    region: 'India',
    date: 'September 2025',
    isoDate: '2025-09-12',
    seats: '380 delegates',
    summary:
      'Two days of main-stage programming on the shift from cost centres to capability centres.',
    themes: ['Capability centres', 'AI adoption'],
    image: IMAGES.audience,
    status: 'closed',
  },
  {
    slug: 'cxo-roundtable-series-2025',
    title: 'CXO Roundtable Series 2025',
    format: 'Roundtable Series',
    city: 'Six cities',
    region: 'Global',
    date: 'March – November 2025',
    isoDate: '2025-03-04',
    seats: '16 sittings',
    summary:
      'A travelling series of non-attributable dialogues across the federation’s hub cities.',
    themes: ['Non-attributable dialogue', 'Peer networks'],
    image: IMAGES.boardroom,
    status: 'closed',
  },
  {
    slug: 'enterprise-leadership-summit-2024',
    title: 'Enterprise Leadership Summit 2024',
    format: 'Summit',
    city: 'Bengaluru',
    region: 'India',
    date: 'November 2024',
    isoDate: '2024-11-08',
    seats: '220 delegates',
    summary:
      'The inaugural single-day summit for enterprise technology and operations leadership.',
    themes: ['Operating strategy', 'Vendor consolidation'],
    image: IMAGES.conferenceHall,
    status: 'closed',
  },
  {
    slug: 'global-capability-forum-2024',
    title: 'Global Capability Forum 2024',
    format: 'Forum',
    city: 'Dubai',
    region: 'Middle East',
    date: 'February 2024',
    isoDate: '2024-02-06',
    seats: '160 delegates',
    summary:
      'Cross-border programming connecting Indian GCC leadership with Gulf and European sponsors.',
    themes: ['Cross-border', 'Sovereign capability'],
    image: IMAGES.stageMic,
    status: 'closed',
  },
];

/** The federation's stated hub cities. */
export const HUBS = [
  'Hyderabad',
  'Bengaluru',
  'Mumbai',
  'Pune',
  'Chennai',
  'Delhi NCR',
  'Dubai',
  'Riyadh',
  'Singapore',
  'Kuala Lumpur',
  'London',
  'Amsterdam',
  'Warsaw',
  'New York',
] as const;
