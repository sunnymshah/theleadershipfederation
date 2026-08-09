/**
 * Event films.
 *
 * `provider` + `id` drive the embed. Leave `id` as an empty string and the
 * card renders as a poster-only "film coming soon" state rather than an empty
 * iframe — so this file is safe to ship before the edits are delivered.
 *
 * YouTube:  id = the 11-character video id (e.g. 'dQw4w9WgXcQ')
 * Vimeo:    id = the numeric id (e.g. '76979871')
 */

import { IMAGES, type LibraryImage } from './images';

export type Film = {
  slug: string;
  title: string;
  eyebrow: string;
  runtime: string;
  description: string;
  provider: 'youtube' | 'vimeo';
  /** Empty string = not yet published; the card degrades to a poster. */
  id: string;
  poster: LibraryImage;
};

export const FILMS: Film[] = [
  {
    slug: 'conclave-2025-film',
    title: 'The Conclave Film',
    eyebrow: 'Main Stage',
    runtime: '3:12',
    description:
      'The two-day flagship conclave, cut down to the arguments that mattered.',
    provider: 'youtube',
    id: '',
    poster: IMAGES.audience,
  },
  {
    slug: 'roundtable-series-film',
    title: 'Behind Closed Doors',
    eyebrow: 'Roundtable Series',
    runtime: '2:04',
    description:
      'What a non-attributable dialogue looks like when the cameras are allowed in for ninety seconds.',
    provider: 'youtube',
    id: '',
    poster: IMAGES.boardroom,
  },
  {
    slug: 'federation-manifesto',
    title: 'A Federation, Not a Conference',
    eyebrow: 'Manifesto',
    runtime: '1:38',
    description:
      'Why the platform is built around continuity between events rather than the events themselves.',
    provider: 'vimeo',
    id: '',
    poster: IMAGES.stageMic,
  },
];
