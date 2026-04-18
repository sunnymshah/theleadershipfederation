/**
 * ── (event-page) layout — minimal chrome for event detail pages ──────
 *
 * This route group isolates /events/[slug]/* from the rest of the public
 * site's marketing chrome (main navbar, footer, WhatsApp button, countdown
 * bar). When an admin clicks "View" on an event card the page should feel
 * like a stand-alone microsite for THAT event — not a sub-page of the TLF
 * marketing site.
 *
 * What ships here:
 *   - A thin top bar with just: "Home" (back to /events/[slug]) and any
 *     custom pages the admin has built via the Puck multi-page feature
 *     (from events.builder_pages).
 *   - Nothing else — no Navbar, no Footer, no CountdownBar. The event page
 *     itself (from the Puck renderer) provides its own visual identity.
 *
 * The nav is rendered by EventPageNav, a CLIENT component that reads the
 * pages list and the current pathname to highlight the active tab.
 */

import { EventPageNav } from "@/components/site/EventPageNav"
import { getEvent } from "@/lib/get-event"
import { getPublicBuilderNav } from "@/app/actions/eventBuilderActions"
import { headers } from "next/headers"

/** Pull the event slug out of the current pathname so the layout can
 *  fetch the right event's nav. We inject `x-pathname` in `proxy.ts`.    */
async function currentEventSlug(): Promise<string | null> {
  const h = await headers()
  const path = h.get("x-pathname") ?? ""
  // Matches /events/<slug>(/...)? — the segment after /events/.
  const m = path.match(/^\/events\/([^/]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export default async function EventPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const slug = await currentEventSlug()

  let eventTitle: string | null = null
  let pages: Array<{ slug: string; title: string }> = []
  if (slug) {
    const event = await getEvent(slug)
    if (event) {
      eventTitle = event.title
      pages = await getPublicBuilderNav(event.id)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1a1a2e]">
      <EventPageNav eventSlug={slug} eventTitle={eventTitle} pages={pages} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
