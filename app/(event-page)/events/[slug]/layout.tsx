/**
 * ── /events/[slug] layout ──────────────────────────────────────────────
 *
 * Renders the minimal per-event chrome (EventPageNav) around every route
 * under /events/[slug]/*. Lives one level DEEPER than the (event-page)
 * route-group layout because Next.js 16 gives dynamic-segment layouts
 * native access to `params`; the outer layout would need a hack
 * (x-pathname header) that only works for /admin/* thanks to proxy.ts.
 *
 * Why this layout exists at all:
 *   - The (event-page) route group escapes the marketing navbar/footer.
 *   - THIS file supplies the lightweight replacement nav with
 *     Home + any published sub-pages + a TLF escape link.
 *   - Works for /events/[slug], /events/[slug]/tickets, /events/[slug]/p/*,
 *     /events/[slug]/schedule, /events/[slug]/live, /events/[slug]/delegates.
 *
 * If the event can't be resolved (bad slug), EventPageNav falls back to a
 * bare "← TLF" bar so visitors still have an exit.
 */

import { getEvent } from "@/lib/get-event"
import { getPublicBuilderNav } from "@/app/actions/eventBuilderActions"
import { EventPageNav } from "@/components/site/EventPageNav"

export default async function EventSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await getEvent(slug)

  // Resolve nav pages only when the slug maps to a real event. No event =>
  // EventPageNav renders its fallback state (bare brand + exit link).
  const pages = event ? await getPublicBuilderNav(event.id) : []

  // Trim stored slug — legacy rows sometimes have a trailing space
  // (e.g. "mumbai ") that would otherwise break every link.
  const safeSlug = event?.slug?.trim() ?? null

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <EventPageNav
        eventSlug={safeSlug}
        eventTitle={event?.title ?? null}
        pages={pages}
      />
      <main className="flex-1">{children}</main>
    </div>
  )
}
