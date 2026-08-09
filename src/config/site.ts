/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SINGLE SOURCE OF TRUTH FOR THE SITE STRUCTURE
 * ─────────────────────────────────────────────────────────────────────────
 *  To add a page:
 *    1. Add an entry to NAV (or FOOTER_LINKS for a non-nav page).
 *    2. Create src/app/<href>/page.tsx — compose it from <PageShell> and the
 *       primitives in src/components/sections.
 *  Navigation, the mobile menu, the footer and the sitemap all read from
 *  here, so nothing else needs touching.
 */

export type NavItem = {
  /** Full label. Shown in the top bar from 2xl up, where the row has room. */
  label: string;
  href: string;
  /** Condensed label used in the top bar below 2xl so the row never wraps. */
  shortLabel: string;
  /** One-line description surfaced in the menu overlay. */
  blurb?: string;
};

export const NAV: NavItem[] = [
  {
    label: 'Upcoming Conclaves',
    shortLabel: 'Conclaves',
    href: '/conclaves',
    blurb: 'Flagship GCC leadership summits across global hubs.',
  },
  {
    label: 'CXO Roundtables',
    shortLabel: 'Roundtables',
    href: '/roundtables',
    blurb: 'Closed-door, Chatham House dialogues for 12–20 leaders.',
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
    blurb: 'The operators who set our standards and judge our awards.',
  },
  {
    label: 'Past Events',
    shortLabel: 'Past Events',
    href: '/past-events',
    blurb: 'Films, photography and proceedings from the archive.',
  },
  {
    label: 'Inner Circle',
    shortLabel: 'Inner Circle',
    href: '/inner-circle',
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
   * Set NEXT_PUBLIC_SITE_URL in Vercel to override without a code change;
   * update the fallback when a custom domain is attached.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://theleadershipfederation-ochre.vercel.app',
  tagline: 'Global platform for GCC leaders & executive decision makers.',
  description:
    'The Leadership Federation convenes GCC leaders, CXOs, policymakers and enterprise solution providers across global hubs through conclaves, closed-door roundtables and an invitation-only inner circle.',
  email: 'connect@theleadershipfederation.com',
  verticalStripText: 'Global Network',
} as const;

/** Hero proof strip. Figures come from the brand's stage metrics. */
export const STAGE_METRICS = [
  { value: '341', label: 'Photographed Leaders' },
  { value: '853', label: 'Stage Appearances' },
  { value: '17', label: 'Event Programmes' },
] as const;

/** Every route that should appear in the generated sitemap. */
export const SITEMAP_ROUTES = [
  '/',
  ...NAV.map((item) => item.href),
  PRIMARY_CTA.href,
];
