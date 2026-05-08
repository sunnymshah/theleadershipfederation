/**
 * ── Placeholder-content detector (ITEM 5) ─────────────────────────────
 *
 * Walks a block's props and returns true when the section still carries
 * the seed copy from `lib/standard-page-defaults.ts`. Powers two surfaces:
 *
 *   1. Section toolbar — when a placeholder section is selected, an
 *      amber AlertTriangle icon shows with tooltip "This section has
 *      placeholder content".
 *   2. Publish dropdown — an entry "Review N placeholder sections
 *      before publishing" lets the admin jump to the first offending
 *      section before they go live with sample text.
 *
 * Heuristic: store the exact strings every default tree seeds + a list
 * of "seed-but-empty" hints (e.g. RichText.body equals one of the seeds,
 * Hero.subtitle matches a stock line, etc.). Anything that doesn't
 * match is considered edited. This is intentionally conservative —
 * false negatives (missed placeholders) are far preferable to false
 * positives that would cry wolf on real content the admin wrote.
 */

/** Strings the seed templates plant verbatim. Mirrored from
 *  lib/standard-page-defaults.ts. */
export const PLACEHOLDER_TEXTS: ReadonlySet<string> = new Set([
  // Hero subtitles
  "Two days of unmissable keynotes, debates, and the kind of conversations that change companies.",
  "Two days of curated programming.",
  "The minds you came for.",
  "Pick a track and dive in.",
  "Choose the experience that fits.",
  "The hallway is the conference.",
  "Partners who make this possible.",
  "How to get there, where to stay.",
  "Discover the brands shaping the year ahead.",
  "Captured moments.",
  "Reserve your seat in under two minutes.",
  "Sign in to access your tickets, badge and event materials.",
  // Countdown
  "Doors open in",
  // RichText bodies
  "A carefully curated room of operators, founders and investors. " +
    "Every session is on-record, every conversation is off. We optimise for signal — short " +
    "talks, long lunches, and the rare permission to think out loud.",
  "Curated meetups, an opt-in delegate directory, and the old-school equivalent " +
    "— a private speakers' lounge open to every paid delegate.",
  "The venue is a 25-minute drive from the international airport. " +
    "Recommended hotels within walking distance are listed below.",
  "Booth visits, product demos, and a lounge open through the day. Pick up a map at registration.",
  "© The Leadership Federation. " +
    "All rights reserved. For sponsorship and partnership enquiries, write to partnerships@leadershipfederation.com.",
  // FAQ defaults (tickets page)
  "What's included?",
  "Full access to keynotes, breakouts, networking lounges, lunch and tea service.",
  "Can I get a refund?",
  "Yes — a full refund up to 14 days before the event. After that, transfers only.",
  "Do you support invoicing?",
  "Yes. Choose 'Pay by invoice' at checkout and we'll email a 14-day invoice.",
  // Discussions tab default copy
  "Operator-led conversations on growth, focus and resilience.",
  "How money is moving in 2026 — and what it means for builders.",
  "Real-world AI deployments, infra trade-offs, and the talent question.",
  // StatsRow seeded label/value pairs (kept short — we match exact-equal)
  "Delegates", "Speakers", "Sessions", "Sponsors",
  "500+", "60+", "30+", "20+",
  // Form defaults
  "Tell us a little about yourself.",
  "Thanks — you'll get a confirmation by email.",
  // CTA defaults
  "Go to admin sign-in",
  // PART C4 — ListBlock seed items
  "First item", "Second item", "Third item",
  "Short description.",
])

/** Block-prop pairs that we inspect when looking for placeholder text.
 *  Keep this scoped — we don't want to false-flag, e.g., a SpeakersGrid
 *  with `title="Featured Speakers"` (that's standard copy admins keep). */
const FIELDS_BY_TYPE: Record<string, string[]> = {
  Hero:             ["subtitle"],
  RichText:         ["body", "title", "subtitle"],
  Countdown:        ["title"],
  StatsRow:         ["__statsArray"],
  Faqs:             ["__faqsArray"],
  TabsBlock:        ["__tabsArray"],
  FormBlock:        ["subtitle", "successMessage"],
  CtaButton:        ["ctaLabel"],
  // PART C4 + C5 — list / event-description blocks added in close-out.
  ListBlock:        ["__listArray"],
  EventDescription: ["override"],
}

function arrayHasPlaceholder(items: unknown, keys: string[]): boolean {
  if (!Array.isArray(items)) return false
  for (const it of items) {
    if (!it || typeof it !== "object") continue
    const obj = it as Record<string, unknown>
    for (const k of keys) {
      const v = obj[k]
      if (typeof v === "string" && PLACEHOLDER_TEXTS.has(v.trim())) return true
    }
  }
  return false
}

/** True when this single block still carries seed copy. */
export function isPlaceholderBlock(
  type: string,
  props: Record<string, unknown> | undefined | null,
): boolean {
  if (!props) return false
  const fields = FIELDS_BY_TYPE[type]
  if (!fields) return false
  for (const f of fields) {
    if (f === "__statsArray") {
      if (arrayHasPlaceholder(props.stats, ["value", "label"])) return true
      continue
    }
    if (f === "__faqsArray") {
      if (arrayHasPlaceholder(props.faqs, ["q", "a"])) return true
      continue
    }
    if (f === "__tabsArray") {
      if (arrayHasPlaceholder(props.items, ["title", "body"])) return true
      continue
    }
    if (f === "__listArray") {
      if (arrayHasPlaceholder(props.items, ["label", "body"])) return true
      continue
    }
    const v = props[f]
    if (typeof v === "string" && PLACEHOLDER_TEXTS.has(v.trim())) return true
  }
  return false
}

/** Walk a Puck content array and tally placeholder blocks (with their
 *  ids so the publish menu can jump to the first one). */
export function findPlaceholderBlocks(
  content: ReadonlyArray<{ type?: string; props?: Record<string, unknown> }> | undefined | null,
): Array<{ id: string; type: string }> {
  if (!Array.isArray(content)) return []
  const out: Array<{ id: string; type: string }> = []
  for (const b of content) {
    if (!b || typeof b !== "object") continue
    const type = b.type
    const id = (b.props as { id?: string } | undefined)?.id
    if (!type || !id) continue
    if (isPlaceholderBlock(type, b.props ?? null)) {
      out.push({ id, type })
    }
  }
  return out
}
