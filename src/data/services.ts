/**
 * What the federation offers, as one list.
 *
 * This replaces the old split between "services" and "five formats", which
 * described the same five things in two places with different words — the
 * single biggest source of confusion on the homepage.
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
    what: 'Main-stage programmes on scaling a centre from delivery to ownership — the flagship conclave plus BFSI and AI sector summits.',
    scale: '150–400 delegates',
    image: IMAGES.conferenceHall,
    href: '/conclaves',
  },
  {
    n: '02',
    name: 'CXO Round Tables',
    who: 'For leaders with one hard problem',
    what: 'Closed-door and non-attributable, under the Chatham House Rule. One operating question, no vendors at the table, no decks.',
    scale: '12–20 seats',
    image: IMAGES.boardroom,
    href: '/roundtables',
  },
  {
    n: '03',
    name: 'Awards & Recognition',
    who: 'For teams with results they can prove',
    what: 'Submissions scored blind on evidence, transferability and durability by a jury of operators — not a popularity vote.',
    scale: `${JURY.length}-member jury`,
    image: IMAGES.stageMic,
    href: '/advisory-board',
  },
  {
    n: '04',
    name: 'Sponsorship & Speaking',
    who: 'For enterprises selling into this room',
    what: 'Brand presence and a stage slot earned on the same evidence standard as everyone else. Sponsors fund the table; they do not buy the keynote.',
    scale: 'Per programme',
    image: IMAGES.audience,
    href: '/register',
  },
  {
    n: '05',
    name: 'The Inner Circle',
    who: 'For leaders who want continuity between events',
    what: 'Invitation-only membership: a standing seat, the full archive, and peer introductions made against a stated need.',
    scale: 'By invitation',
    image: IMAGES.workingSession,
    href: INNER_CIRCLE_URL,
    external: true,
  },
];
