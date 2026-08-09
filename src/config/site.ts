/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SINGLE SOURCE OF TRUTH FOR THE SITE STRUCTURE
 * ─────────────────────────────────────────────────────────────────────────
 *  To add a page:
 *    1. Add an entry to NAV (or BROWSE_LINKS in data/contact.ts for a
 *       footer-only page).
 *    2. Create src/app/<href>/page.tsx from <PageShell>.
 *  Navigation, the menu overlay, the footer and the sitemap all read from
 *  here. Dropdown children are derived from the live EDITIONS data, so a new
 *  event appears in the nav the moment it is added there.
 */

import { EDITIONS, type Edition } from '@/data/editions';

export type NavChild = {
  label: string;
  href: string;
  /** e.g. "Bengaluru · 09–10 Sep 2026" */
  meta?: string;
  external?: boolean;
};

export type NavItem = {
  /** Full label. Shown in the top bar from 2xl up, where the row has room. */
  label: string;
  href: string;
  /** Condensed label used in the top bar below 2xl so the row never wraps. */
  shortLabel: string;
  /** One-line description surfaced in the menu overlay. */
  blurb?: string;
  /** Renders a dropdown; the parent href stays clickable. */
  children?: NavChild[];
  external?: boolean;
};

const toChild = (edition: Edition): NavChild => ({
  label: edition.title,
  href: edition.href,
  meta: `${edition.city} · ${edition.date}`,
  external: true,
});

/** Upcoming main-stage programmes — conclaves, summits and forums. */
export const UPCOMING_CONCLAVE_LINKS = EDITIONS.filter(
  (e) => e.status === 'Upcoming' && e.kind !== 'Round Tables'
).map(toChild);

/** Upcoming closed-door round tables. */
export const UPCOMING_ROUNDTABLE_LINKS = EDITIONS.filter(
  (e) => e.status === 'Upcoming' && e.kind === 'Round Tables'
).map(toChild);

/** Everything already convened, newest first. */
export const PAST_EVENT_LINKS = EDITIONS.filter((e) => e.status === 'Past').map(
  toChild
);

export const INNER_CIRCLE_URL = 'https://innercircle.theleadershipfederation.com';

export const NAV: NavItem[] = [
  {
    label: 'Upcoming Conclaves',
    shortLabel: 'Conclaves',
    href: '/conclaves',
    blurb: 'Flagship GCC leadership summits across global hubs.',
    children: UPCOMING_CONCLAVE_LINKS,
  },
  {
    label: 'CXO Roundtables',
    shortLabel: 'Roundtables',
    href: '/roundtables',
    blurb: 'Closed-door, Chatham House dialogues for 12–20 leaders.',
    children: UPCOMING_ROUNDTABLE_LINKS,
  },
  {
    label: 'About',
    shortLabel: 'About',
    href: '/about',
    blurb: 'The federation, the thesis, and the people behind it.',
  },
  {
    label: 'Advisory Board & Jury',
    shortLabel: 'Advisory',
    href: '/advisory-board',
    blurb: 'The operators who set our standards and score the awards.',
  },
  {
    label: 'Register Now',
    shortLabel: 'Register',
    href: '/register',
    blurb: 'Nominate, attend as a delegate, speak or sponsor.',
  },
  {
    label: 'Past Events',
    shortLabel: 'Past Events',
    href: '/past-events',
    blurb: 'Films, photography and proceedings from the archive.',
    children: PAST_EVENT_LINKS,
  },
  {
    label: 'Join our Inner Circle',
    shortLabel: 'Inner Circle',
    href: INNER_CIRCLE_URL,
    external: true,
    blurb: 'Membership for senior GCC and enterprise leadership.',
  },
];

/** The pill CTA that sits at the end of the top navigation. */
export const PRIMARY_CTA = {
  label: 'Inquire',
  href: '/inquire',
} as const;

export const SITE = {
  name: 'The Leadership Federation',
  shortName: 'TLF',
  /**
   * Canonical origin — drives metadataBase, sitemap.xml and robots.txt.
   * Set NEXT_PUBLIC_SITE_URL in Vercel to override without a code change.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://theleadershipfederation.vercel.app',
  tagline: 'Global platform for GCC leaders & executive decision makers.',
  description:
    'The Leadership Federation convenes GCC leaders, CXOs, policymakers and enterprise solution providers across global hubs through conclaves, closed-door roundtables and an invitation-only inner circle.',
  email: 'register@theleadershipfederation.com',
  verticalStripText: 'Global Network',
} as const;

/** Hero proof strip. Figures come from the brand's stage metrics. */
export const STAGE_METRICS = [
  { value: '341', label: 'Photographed Leaders' },
  { value: '853', label: 'Stage Appearances' },
  { value: '17', label: 'Event Programmes' },
] as const;

/** Every internal route that should appear in the generated sitemap. */
export const SITEMAP_ROUTES = [
  '/',
  ...NAV.filter((item) => !item.external).map((item) => item.href),
  PRIMARY_CTA.href,
];
