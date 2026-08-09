/**
 * Photography library.
 *
 * NOTE: the files currently in /public/events are stock photographs supplied
 * with the brief. Their filenames reference specific venues, but the frames do
 * not show those venues — so `alt` here describes what is actually pictured.
 * When real event photography is cleared, replace the files and update `alt`.
 */
export type LibraryImage = {
  src: string;
  alt: string;
  /** Editorial treatment prescribed by the design system. */
  treatment?: 'full-colour' | 'sepia' | 'grayscale';
};

export const IMAGES = {
  conferenceHall: {
    src: '/events/tlf_mumbai_taj_lands_end_cxo_dinner.jpg',
    alt: 'A tiered conference hall set with round tables ahead of a leadership programme.',
    treatment: 'full-colour',
  },
  audience: {
    src: '/events/tlf_dubai_ritz_carlton_roundtable.jpg',
    alt: 'A seated audience watching a session in a darkened auditorium.',
    treatment: 'full-colour',
  },
  stageMic: {
    src: '/events/tlf_hyderabad_stage_panel.jpg',
    alt: 'A stage microphone in close focus with the room lights behind it.',
    treatment: 'sepia',
  },
  boardroom: {
    src: '/events/tlf_chatham_house_breakfast_table.jpg',
    alt: 'Colleagues talking across a boardroom table mid-discussion.',
    treatment: 'grayscale',
  },
  workingSession: {
    src: '/events/tlf_singapore_cxo_networking.jpg',
    alt: 'A working session around a shared table with open laptops.',
    treatment: 'grayscale',
  },
} satisfies Record<string, LibraryImage>;

export const ALL_IMAGES = Object.values(IMAGES);
