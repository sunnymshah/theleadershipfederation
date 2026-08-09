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
};

export const IMAGES = {
  conferenceHall: {
    src: '/events/tlf_mumbai_taj_lands_end_cxo_dinner.jpg',
    alt: 'A tiered conference hall set with round tables ahead of a leadership programme.',
  },
  audience: {
    src: '/events/tlf_dubai_ritz_carlton_roundtable.jpg',
    alt: 'A seated audience watching a session in a darkened auditorium.',
  },
  stageMic: {
    src: '/events/tlf_hyderabad_stage_panel.jpg',
    alt: 'A stage microphone in close focus with the room lights behind it.',
  },
  boardroom: {
    src: '/events/tlf_chatham_house_breakfast_table.jpg',
    alt: 'Colleagues talking across a boardroom table mid-discussion.',
  },
  workingSession: {
    src: '/events/tlf_singapore_cxo_networking.jpg',
    alt: 'A working session around a shared table with open laptops.',
  },
} satisfies Record<string, LibraryImage>;

export const ALL_IMAGES = Object.values(IMAGES);
