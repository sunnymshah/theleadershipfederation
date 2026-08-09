/**
 * "One community. Five powerful rooms." — the formats the federation runs.
 * Source: showcase.theleadershipfederation.com
 */
import { IMAGES, type LibraryImage } from './images';

export type Format = {
  index: string;
  scale: string;
  name: string;
  detail: string;
  /** Who the room is built for. */
  room: string;
  image: LibraryImage;
  href: string;
};

export const FORMATS: Format[] = [
  {
    index: '01',
    scale: 'Flagship',
    name: 'GCC Leadership Conclaves',
    detail:
      'The main stage. Two days of chaired sessions on scaling a centre’s mandate from delivery to ownership, with the whole ecosystem in one room.',
    room: '250–400 delegates',
    image: IMAGES.conferenceHall,
    href: 'https://gcc.theleadershipfederation.com/blr',
  },
  {
    index: '02',
    scale: 'Sector',
    name: 'Global BFSI Summit',
    detail:
      'Banking, financial services, insurance and fintech leadership, convened around the operating problems specific to regulated capability.',
    room: '180–250 delegates',
    image: IMAGES.audience,
    href: 'https://gcc.theleadershipfederation.com/bfsi',
  },
  {
    index: '03',
    scale: 'Frontier',
    name: 'Global AI Summit',
    detail:
      'Where AI stops being a keynote and becomes an operating decision — adoption, governance and the talent to run it.',
    room: '150–220 delegates',
    image: IMAGES.stageMic,
    href: 'https://gcc.theleadershipfederation.com/ai',
  },
  {
    index: '04',
    scale: 'Private',
    name: 'CXO Round Tables',
    detail:
      'Twelve to twenty leaders, one operating question, no attribution. Held under the Chatham House Rule, with no vendors at the table.',
    room: '12–20 seats',
    image: IMAGES.boardroom,
    href: 'https://gcc.theleadershipfederation.com/CXOSingapore',
  },
  {
    index: '05',
    scale: 'Intimate',
    name: 'GCC Leaders Networking Breakfasts',
    detail:
      'A focused morning format for peer exchange, customer conversations and introductions that would never happen on a conference floor.',
    room: '20–30 seats',
    image: IMAGES.workingSession,
    href: 'https://gcc.theleadershipfederation.com/',
  },
];
