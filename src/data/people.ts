/**
 * Advisory Board & Jury.
 *
 * Intentionally EMPTY until names are cleared for publication — the page
 * renders an "to be announced" state while this array is empty and switches to
 * portrait cards the moment entries are added. Never publish a person here
 * without their consent to be listed.
 */
export type BoardMember = {
  name: string;
  title: string;
  organisation: string;
  /** Optional headshot in /public/board. */
  portrait?: string;
  /** 'board' sets standards; 'jury' scores award submissions. */
  role: 'board' | 'jury';
};

export const BOARD: BoardMember[] = [];

/** Seat categories the board is composed from. */
export const BOARD_COMPOSITION = [
  {
    seat: 'GCC Heads & Site Leaders',
    detail:
      'Leaders accountable for a centre’s P&L, mandate and headcount — the people the programming is built for.',
  },
  {
    seat: 'Enterprise CXOs',
    detail:
      'Group-level technology, operations and people leadership who sponsor capability from the parent side.',
  },
  {
    seat: 'Policy & Institutional',
    detail:
      'Voices from industry bodies and academia who keep the agenda honest about the wider system.',
  },
  {
    seat: 'Operator Alumni',
    detail:
      'Leaders who have built and exited centres, retained for judgement rather than currency.',
  },
] as const;

/** How award submissions are scored by the jury. */
export const JURY_CRITERIA = [
  {
    criterion: 'Evidence',
    weight: '40%',
    detail:
      'Verifiable outcomes over narrative. Submissions without measurement do not advance.',
  },
  {
    criterion: 'Transferability',
    weight: '25%',
    detail: 'Whether another centre could adopt the approach and expect a result.',
  },
  {
    criterion: 'Durability',
    weight: '20%',
    detail: 'Held for more than one reporting cycle, through a leadership change.',
  },
  {
    criterion: 'Originality',
    weight: '15%',
    detail: 'Genuinely new practice rather than a well-executed standard.',
  },
] as const;
