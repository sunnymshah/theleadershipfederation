/**
 * ── EventPageNav (in-route, server component) ────────────────────────
 *
 * Sticky sub-nav rendered ABOVE the Puck-rendered event page content.
 * Shows "Home" + each published sub-page so visitors can navigate
 * between the home page and any sub-pages built in the editor.
 *
 * Server component: fetches its own list via `getPublicBuilderNav`. The
 * caller passes `currentPageSlug = null` for the home route, or the
 * sub-page slug for a /p/<slug> route — used to underline the active tab.
 *
 * Mobile menu (the hamburger) lives in `EventPageNavMobile.tsx` because
 * it needs `useState`. Desktop links stay server-rendered.
 *
 * Different from `components/site/EventPageNav.tsx` — that one is the
 * outer layout's brand chrome with the TLF logo and escape link. THIS
 * one is content-level, lives inside the route, and is unaware of the
 * outer chrome.
 */

import Link from "next/link"
import { getPublicBuilderNav } from "@/app/actions/eventBuilderActions"
import { EventPageNavMobile } from "./EventPageNavMobile"

export async function EventPageNav({
  eventId,
  eventSlug,
  currentPageSlug = null,
}: {
  eventId: string
  eventSlug: string
  /** null → "Home" tab is active. Otherwise the sub-page slug. */
  currentPageSlug?: string | null
}) {
  const pages = await getPublicBuilderNav(eventId)

  // Don't render at all if there are no sub-pages — the home tab alone
  // is just noise. Most events without an admin-built nav stay clean.
  if (pages.length === 0) return null

  const items: Array<{ slug: string | null; title: string; href: string }> = [
    { slug: null, title: "Home", href: `/events/${eventSlug}` },
    ...pages.map((p) => ({
      slug: p.slug,
      title: p.title,
      href: `/events/${eventSlug}/p/${p.slug}`,
    })),
  ]

  return (
    <nav
      aria-label="Event sub-pages"
      className="sticky top-0 z-30 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-[#1a1a2e]/[0.08]"
    >
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center">
        {/* Desktop tab strip */}
        <ul className="hidden sm:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
          {items.map((it) => {
            const active = (it.slug ?? null) === (currentPageSlug ?? null)
            return (
              <li key={it.slug ?? "_home"} className="shrink-0">
                <Link
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center px-3 h-12 -mb-px text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                    active
                      ? "border-[var(--lf-primary,#e7ab1c)] text-[#1a1a2e]"
                      : "border-transparent text-[#1a1a2e]/65 hover:text-[#1a1a2e] hover:border-[#1a1a2e]/20"
                  }`}
                >
                  {it.title}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Mobile menu (client) */}
        <div className="sm:hidden flex-1 -mx-2">
          <EventPageNavMobile items={items} currentPageSlug={currentPageSlug ?? null} />
        </div>
      </div>
    </nav>
  )
}
