/**
 * What the federation offers, as one list.
 *
 * This replaces the old split between "services" and "five formats", which
 * described the same five things in two places with different words.
 */
import { IMAGES, type LibraryImage } from './images';
import { JURY } from './board';
import { INNER_CIRCLE_URL } from '@/config/site';

export type Service = {
  n: string;
  name: string;
  /** The one line that tells a visitor whether this row is theirs. */
  who: string;
  what: string;
  scale: string;
  image: LibraryImage;
  href: string;
  external?: boolean;
};

export const SERVICES: Service[] = [
  {
    n: '01',
    name: 'Conclaves & Summits',
    who: 'For GCC heads and enterprise CXOs',
    what: 'Main-stage programmes covering how centres move from delivery to ownership. Includes the flagship conclave and the BFSI and AI sector summits.',
    scale: '150–400 delegates',
    image: IMAGES.conferenceHall,
    href: '/conclaves',
  },
  {
    n: '02',
    name: 'CXO Round Tables',
    who: 'For leaders working through a specific problem',
    what: 'Closed-door and non-attributable, held under the Chatham House Rule. Each table works through a single operating question, circulated in advance.',
    scale: '12–20 seats',
    image: IMAGES.boardroom,
    href: '/roundtables',
  },
  {
    n: '03',
    name: 'Awards & Recognition',
    who: 'For teams with measurable results',
    what: 'Submissions are scored blind on evidence, transferability and durability by a jury of serving operators.',
    scale: `${JURY.length}-member jury`,
    image: IMAGES.stageMic,
    href: '/advisory-board',
  },
  {
    n: '04',
    name: 'Sponsorship & Speaking',
    who: 'For enterprises that work with GCCs',
    what: 'Brand presence across a programme, with speaking slots assessed against the same standard as every other session.',
    scale: 'Per programme',
    image: IMAGES.audience,
    href: '/register',
  },
  {
    n: '05',
    name: 'The Inner Circle',
    who: 'For senior leaders seeking year-round access',
    what: 'Invitation-only membership covering a standing seat at regional programmes, the full archive, and introductions to other members.',
    scale: 'By invitation',
    image: IMAGES.workingSession,
    href: INNER_CIRCLE_URL,
    external: true,
  },
];
