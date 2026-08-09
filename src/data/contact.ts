/**
 * Contact desks and footer content, as published on theleadershipfederation.com.
 */
export type Desk = {
  heading: string;
  note?: string;
  people: { name: string; role?: string; email: string; phones?: string[] }[];
};

export const DESKS: Desk[] = [
  {
    heading: 'For Sponsorship & Exhibitor Opportunity',
    people: [
      {
        name: 'Harsh Patel',
        email: 'Harsh@theleadershipfederation.com',
        phones: ['+91 77780 40505', '+91 72279 93338'],
      },
      {
        name: 'Sharik Tinwala',
        email: 'Sharik@theleadershipfederation.com',
        phones: ['+91 90334 25120'],
      },
    ],
  },
  {
    heading: 'Award Nomination & Speaker Opportunity',
    people: [
      {
        name: 'Ovais Kapadia',
        email: 'Ovais@theleadershipfederation.com',
        phones: ['+91 90334 25122'],
      },
      {
        name: 'Manan Desai',
        email: 'Manan@theleadershipfederation.com',
        phones: ['+91 90334 25203'],
      },
    ],
  },
  {
    heading: 'Marketing & Support',
    note: 'For any additional request, media coverage or special requests, email us on hello@theleadershipfederation.com or contact our marketing team below.',
    people: [
      {
        name: 'Jessica Morgan',
        role: 'VP Marketing',
        email: 'Hello@theleadershipfederation.com',
      },
    ],
  },
];

export const OFFICE = {
  address:
    'Office no 44-43, Building of Dubai Municipality, Bur Dubai — Al Fahidi, Dubai, United Arab Emirates',
  registerEmail: 'register@theleadershipfederation.com',
  helloEmail: 'hello@theleadershipfederation.com',
};

export const SOCIALS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/leadership-federation/' },
  { label: 'WhatsApp', href: 'https://wa.me/919033425120' },
  { label: 'Instagram', href: 'https://www.instagram.com/theleadershipfederation/' },
];

/** Footer "Browse our site" column. */
export const BROWSE_LINKS = [
  { label: 'Home page', href: '/' },
  { label: 'Become a Member', href: '/inner-circle' },
  {
    label: 'Join our Inner Circle',
    href: 'https://innercircle.theleadershipfederation.com',
    external: true,
  },
  { label: 'Nominate Now', href: '/register' },
  { label: 'Speaker', href: '/register?as=speaker' },
  { label: 'Jury', href: '/advisory-board' },
  { label: 'Sponsor an Event', href: '/register?as=sponsor' },
];

export const LEGAL_LINKS = [
  { label: 'Terms & Conditions', href: 'https://theleadershipfederation.com/terms' },
  { label: 'Refund Policy', href: 'https://theleadershipfederation.com/refund' },
  { label: 'Privacy Policy', href: 'https://theleadershipfederation.com/privacy' },
  { label: 'Investor Relations', href: 'https://theleadershipfederation.com/investors' },
];
