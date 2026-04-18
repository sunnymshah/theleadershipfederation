/**
 * Shared types + helpers for the event builder's MULTI-PAGE feature.
 *
 * Every event has:
 *   - 1 home page    → lives in events.builder_data / builder_draft
 *   - 0..N sub-pages → live in events.builder_pages / builder_pages_draft
 *
 * Sub-pages are keyed by a URL-safe slug and rendered at
 * /events/[eventSlug]/p/[pageSlug]. The `/p/` prefix prevents collisions
 * with fixed child routes like /tickets, /schedule, /live.
 *
 * Types alone live here (not inside a "use server" file) because Next 16
 * forbids non-async runtime exports from "use server" modules and slugify
 * is a plain sync helper used in both the editor and the server actions.
 */

import type { PuckDataLike } from "@/lib/event-puck-migrate"

export type BuilderPage = {
  title: string
  data: PuckDataLike
  /** Optional explicit ordering (0..N). If absent, insertion order wins. */
  order?: number
}
export type BuilderPagesMap = Record<string, BuilderPage>

/** Conservative URL-safe slug — lowercase ASCII letters/digits/hyphens.
 *  Strips anything else, collapses repeat hyphens, trims hyphens at the ends.
 *  Returns "" for empty input (caller should reject). */
export function slugifyPage(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

/** Reserved sub-page slugs (would collide with real routes or builder UI). */
export const RESERVED_SUBPAGE_SLUGS = new Set<string>([
  "home", "tickets", "schedule", "live", "delegates",
  "register", "checkout", "api", "admin", "new",
])

/** Sort pages for display in the editor + public nav. Stable. */
export function sortPages(pages: BuilderPagesMap): Array<[string, BuilderPage]> {
  const entries = Object.entries(pages)
  return entries.sort((a, b) => {
    const oa = a[1].order ?? Number.MAX_SAFE_INTEGER
    const ob = b[1].order ?? Number.MAX_SAFE_INTEGER
    if (oa !== ob) return oa - ob
    return a[0].localeCompare(b[0])
  })
}
