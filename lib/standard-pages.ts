/**
 * Canonical 12 standard pages every event auto-gets.
 * Plain module (not "use server") so types + constants can be imported
 * from both client + server code.
 */

export const STANDARD_PAGE_KINDS = [
  "home",
  "agenda",
  "speakers",
  "discussions",
  "tickets",
  "networking",
  "sponsors",
  "venue",
  "exhibitors",
  "gallery",
  "register",
  "signin",
] as const

export type StandardPageKind = (typeof STANDARD_PAGE_KINDS)[number]

export type StandardPageRow = {
  id: string
  event_id: string
  kind: StandardPageKind
  label: string
  slug: string
  sort_order: number
  visible: boolean
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

/** Pages that show in the top-right pinned slot rather than the main nav. */
export const RAIL_PAGE_KINDS = new Set<StandardPageKind>(["register", "signin"])

/** Default labels — shown in nav, editable by admin. */
export const DEFAULT_PAGE_LABELS: Record<StandardPageKind, string> = {
  home: "Home",
  agenda: "Agenda",
  speakers: "Speakers",
  discussions: "Discussions",
  tickets: "Tickets",
  networking: "Networking",
  sponsors: "Sponsors",
  venue: "Venue",
  exhibitors: "Exhibitors",
  gallery: "Gallery",
  register: "Register Now",
  signin: "Sign In",
}

export const DEFAULT_PAGE_SLUGS: Record<StandardPageKind, string> = {
  home: "home",
  agenda: "agenda",
  speakers: "speakers",
  discussions: "discussions",
  tickets: "tickets",
  networking: "networking",
  sponsors: "sponsors",
  venue: "venue",
  exhibitors: "exhibitors",
  gallery: "gallery",
  register: "register-now",
  signin: "sign-in",
}

export const DEFAULT_PAGE_VISIBLE: Record<StandardPageKind, boolean> = {
  home: true,
  agenda: true,
  speakers: true,
  discussions: false,
  tickets: true,
  networking: false,
  sponsors: true,
  venue: true,
  exhibitors: false,
  gallery: true,
  register: true,
  signin: true,
}

export const DEFAULT_PAGE_ORDER: Record<StandardPageKind, number> = {
  home: 0,
  agenda: 10,
  speakers: 20,
  discussions: 30,
  tickets: 40,
  networking: 50,
  sponsors: 60,
  venue: 70,
  exhibitors: 80,
  gallery: 90,
  register: 100,
  signin: 110,
}

/**
 * URL helper — builds /events/{slug}/{pageSlug} with the home special-case.
 * For the home page, we DROP the trailing /home so /events/foo and
 * /events/foo/home both resolve to the same canonical URL.
 */
export function publicPageHref(eventSlug: string, page: { kind: StandardPageKind; slug: string }): string {
  if (page.kind === "home") return `/events/${eventSlug}`
  if (page.kind === "register") return `/events/${eventSlug}/${page.slug}`
  if (page.kind === "signin") return `/admin/login?next=/events/${eventSlug}`
  return `/events/${eventSlug}/${page.slug}`
}

export function isStandardPageKind(s: string): s is StandardPageKind {
  return (STANDARD_PAGE_KINDS as readonly string[]).includes(s)
}

/* ── Per-kind UX rules for the editor ───────────────────────────────
 *
 * `allowedOptionalSections`  — block types the user is allowed to add
 *                              into a standard page via the "+ Add
 *                              optional section" affordance. Empty
 *                              means the page is locked (e.g. agenda,
 *                              register, signin — those have a single
 *                              canonical purpose).
 *
 * `coreSections`             — block types that are part of the page's
 *                              canonical structure. The editor hides
 *                              the trash icon, drag handle, and Move/
 *                              Delete menu entries for them, and
 *                              shows a small Lock badge instead.
 *                              Eye / Gear / Copy / Save-as-template /
 *                              A-B-test remain available.
 */
export const ALLOWED_OPTIONAL_SECTIONS: Record<StandardPageKind, string[]> = {
  home:        ["Carousel", "Testimonial", "CtaWithImage", "RichText", "VenueMap", "Faqs", "StatsRow"],
  speakers:    ["RichText", "CtaWithImage", "Testimonial"],
  venue:       ["Gallery", "RichText", "CtaWithImage"],
  agenda:      [],          // locked
  tickets:     ["RichText", "Faqs", "Testimonial"],
  sponsors:    ["RichText", "CtaWithImage", "LogosStrip"],
  discussions: ["RichText", "TabsBlock", "Faqs"],
  networking:  ["RichText", "CtaWithImage", "SocialBar"],
  exhibitors:  ["RichText", "LogosStrip", "CtaWithImage"],
  gallery:     ["RichText"],
  register:    [],          // locked
  signin:      [],          // locked
}

export const CORE_SECTIONS: Record<StandardPageKind, string[]> = {
  home:        ["Hero", "Countdown"],
  speakers:    ["Hero", "SpeakersGrid"],
  agenda:      ["Hero", "Agenda"],
  tickets:     ["Hero", "TicketsPricing"],
  sponsors:    ["Hero", "SponsorsGrid"],
  venue:       ["Hero", "VenueMap"],
  gallery:     ["Hero", "Gallery"],
  register:    ["Hero", "FormBlock"],
  discussions: ["Hero"],
  networking:  ["Hero"],
  exhibitors:  ["Hero"],
  signin:      ["Hero"],
}

/** Convenience — true when the block type can't be deleted/moved on
 *  the given standard page. */
export function isCoreSection(pageKind: StandardPageKind, blockType: string): boolean {
  return (CORE_SECTIONS[pageKind] ?? []).includes(blockType)
}

/** Convenience — true when the block type is allowed as an optional
 *  add on the given standard page. */
export function isAllowedOptionalSection(pageKind: StandardPageKind, blockType: string): boolean {
  return (ALLOWED_OPTIONAL_SECTIONS[pageKind] ?? []).includes(blockType)
}
