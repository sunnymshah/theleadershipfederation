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
