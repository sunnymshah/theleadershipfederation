/**
 * Motion proof — the room, on film.
 *
 * Three tiers, mirroring how the brand publishes them:
 *   FEATURE_FILMS  — headline reels, linked out to the original LinkedIn post.
 *   ARCHIVE_FILMS  — self-playing event films (mounted only on click).
 *   TESTIMONIAL_REELS — Instagram embeds, also mounted only on click.
 *
 * Video and poster files stay on the publisher's CDN rather than being copied
 * into the repo: the six archive films alone are ~115MB. If a CDN URL ever
 * expires, the card degrades to its poster instead of breaking the page.
 */
export type FeatureFilm = { tag: string; title: string; blurb: string; href: string };
export type ArchiveFilm = { tag: string; title: string; src: string; poster: string };
export type TestimonialReel = { tag: string; title: string; src: string };

export const FEATURE_FILMS: FeatureFilm[] = [
  { tag: 'NEW · PRIVATE FORMAT', title: 'Inside the GCC CXO Dinner Roundtable', blurb: 'An invitation-only Bengaluru gathering, delivered with Ascendion — candid dialogue, senior decision-makers and no sales decks.', href: 'https://www.linkedin.com/company/leadership-federation/posts/' },
  { tag: 'SHOWREEL · BFSI', title: 'Global BFSI Leadership Summit 2026', blurb: 'A look back at the Mumbai summit: leadership, innovation and meaningful connections across banking, financial services, insurance and fintech.', href: 'https://www.linkedin.com/feed/update/urn:li:activity:7489578540154212353/' },
  { tag: 'TESTIMONIALS · GCC', title: 'Hyderabad Conclave — Day One', blurb: 'Leader testimonials and the energy of an ecosystem gathering built around high-value conversations and opportunity.', href: 'https://www.linkedin.com/feed/update/urn:li:activity:7489188347798511616/' },
  { tag: 'SHOWREEL · GCC', title: 'Bengaluru Conclave — 3rd Edition', blurb: 'India’s GCC leaders and decision-makers under one roof — a cinematic look at the September 2025 edition.', href: 'https://www.linkedin.com/feed/update/urn:li:activity:7371155193423544320/' },
];

export const ARCHIVE_FILMS: ArchiveFilm[] = [
  { tag: 'Pune · Event film', title: 'GCC Leadership Conclave — 5th Edition', src: 'https://dms.licdn.com/playlist/vid/v2/D4D05AQGq7mjg-IV7zQ/mp4-720p-30fp-crf28/B4DZwTBvWQIsCI-/0/1769845782656?e=2147483647&v=beta&t=ZdPXl-TMgTTAtXJFJBfX_bz9msquMtA3FvSevOLU4uQ', poster: 'https://media.licdn.com/dms/image/v2/D4D05AQGq7mjg-IV7zQ/videocover-high/B4DZwTBvWQIsBY-/0/1769845759276?e=2147483647&v=beta&t=bjseOjoY_kF7tU8BoR1twWSt8OO3MIskcr99ojNEjrg' },
  { tag: 'Bengaluru · Day one', title: 'GCC Leadership Conclave — 6th Edition', src: 'https://dms.licdn.com/playlist/vid/v2/D5605AQGojuNvfjHdeA/mp4-720p-30fp-crf28/B56Z2MnDcpKQCM-/0/1776180554442?e=2147483647&v=beta&t=_KnObXzjjqfVAgDq2H9K8PzpWpGPFC8LHrb5FqwBnCQ', poster: 'https://media.licdn.com/dms/image/v2/D5605AQGojuNvfjHdeA/videocover-high/B56Z2MnDcpKQBc-/0/1776180544808?e=2147483647&v=beta&t=ifXlEXK7TM49Rtwo8Czl8eZLF1LZTmYYDiEW-widhP8' },
  { tag: 'Bengaluru · Day two', title: 'GCC Leadership Conclave — 6th Edition', src: 'https://dms.licdn.com/playlist/vid/v2/D5605AQEUgI3bjlUr4A/mp4-640p-30fp-crf28/B56Z2pD57EIABw-/0/1776657882976?e=2147483647&v=beta&t=jgvMwebBYp5tRMd73kXiTQPjTnfUBIFwLHecRa27yJk', poster: 'https://media.licdn.com/dms/image/v2/D5605AQEUgI3bjlUr4A/videocover-high/B56Z2pD57EIABY-/0/1776657873779?e=2147483647&v=beta&t=tWYXKDg8RN7Kb_33-QYMeNxMIlxKyo6h9ZtZL0XvWiY' },
  { tag: 'Bengaluru · Teaser', title: 'GCC Leadership Conclave — 6th Edition', src: 'https://dms.licdn.com/playlist/vid/v2/D4D05AQEArymjLL1Nsw/mp4-720p-30fp-crf28/B4DZ1rkPR0IECI-/0/1775626160101?e=2147483647&v=beta&t=QXLJ6ZGFfS_YNKxpn7qOC1Hws2ShX15yc_Y2o6PxGoQ', poster: 'https://media.licdn.com/dms/image/v2/D4D05AQEArymjLL1Nsw/videocover-high/B4DZ1rkPR0IEBY-/0/1775626157516?e=2147483647&v=beta&t=Vv_kVvGpaiSqMClTg8Jzy7gTWi2C5EKnVrPuuXdxyL8' },
  { tag: 'Mumbai · Event film', title: 'GCC Leadership Conclave — 7th Edition', src: 'https://dms.licdn.com/playlist/vid/v2/D4D05AQEsGSBDZ3qgkQ/mp4-640p-30fp-crf28/B4DZ6sQbbLKsBk-/0/1781006515055?e=2147483647&v=beta&t=HYd-TRoRNE1Kj9tG3ia9rbaYALOR6XOnym2-aco1MkQ', poster: 'https://media.licdn.com/dms/image/v2/D4D05AQEsGSBDZ3qgkQ/videocover-high/B4DZ6sQbbLKsBM-/0/1781006487998?e=2147483647&v=beta&t=jqYR7Z5g5Bz4pjfgZdRJSBCOC1SwEVEJuwxwvL_REDY' },
  { tag: 'Dubai · Private format', title: 'GCC CXO Round Table', src: 'https://dms.licdn.com/playlist/vid/v2/D5605AQEgmrngZuUzDg/mp4-720p-30fp-crf28/B56Z.EdaPBKACQ-/0/1784633748564?e=2147483647&v=beta&t=Tqy130IXiWZQyyc-8y7321rgRmT1mThB97Sr_fprYGo', poster: 'https://media.licdn.com/dms/image/v2/D5605AQEgmrngZuUzDg/videocover-high/B56Z.EdaPBKABU-/0/1784633738985?e=2147483647&v=beta&t=D4DMw_NbzUPI5aeODR0Fcjd2e4Q6xRldMVnNEHCOaiQ' },
];

export const TESTIMONIAL_REELS: TestimonialReel[] = [
  { tag: 'Bengaluru · Leader testimonial', title: 'Voices from the 6th GCC Leadership Conclave', src: 'https://www.instagram.com/reel/DZUJvdFyClr/embed/' },
  { tag: 'Bengaluru · Leader testimonial', title: 'What leaders experienced in the room', src: 'https://www.instagram.com/reel/DZRZJNQKYZg/embed/' },
];
