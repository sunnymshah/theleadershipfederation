/**
 * ── /events/[slug]/[pageSlug] ────────────────────────────────────────
 *
 * Public renderer for any STANDARD page (event_standard_pages row with
 * visible=true). Static segments tickets/schedule/live/delegates/
 * speakers/sessions take precedence in Next.js routing — those keep
 * their hand-built renderers. This catches everything else: sponsors,
 * venue, gallery, networking, exhibitors, register-now, discussions, …
 *
 * Falls back to the legacy /p/<slug> redirect for sub-pages built in
 * the older multi-page system.
 */

import { notFound, redirect } from "next/navigation"
import { getEvent } from "@/lib/get-event"
import { StandardPageRender } from "@/components/site/event-pages/StandardPageRender"
import { getStandardPageBySlugPublic } from "@/app/actions/standardPageActions"
import {
  getBuilderPageRedirect,
  getPublishedPageAndNav,
} from "@/app/actions/eventBuilderActions"
import { defaultPuckDataForKind } from "@/lib/standard-page-defaults"
import type { StandardPageKind } from "@/lib/standard-pages"
import { normalizeSlug } from "@/lib/slug"
import type { Data as PuckData } from "@measured/puck"

interface Props {
  params: Promise<{ slug: string; pageSlug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug, pageSlug } = await params
  const event = await getEvent(slug)
  if (!event) return { title: "Not Found" }
  const row = await getStandardPageBySlugPublic(event.id, pageSlug)
  if (row) {
    return { title: `${row.label} · ${event.title} | The Leadership Federation` }
  }
  const { page } = await getPublishedPageAndNav(event.id, pageSlug)
  if (page) {
    return { title: `${page.title} · ${event.title} | The Leadership Federation` }
  }
  return { title: `${event.title} | The Leadership Federation` }
}

export default async function EventStandardPage({ params }: Props) {
  const { slug, pageSlug } = await params

  // Slug whitespace fix (Layout-Fix Section 5c): redirect uncanonical
  // /events/<slug>/<pageSlug> to the canonical form before lookup.
  const decodedSlug = (() => { try { return decodeURIComponent(slug) } catch { return slug } })()
  const decodedPage = (() => { try { return decodeURIComponent(pageSlug) } catch { return pageSlug } })()
  const canonicalSlug = normalizeSlug(decodedSlug)
  const canonicalPage = normalizeSlug(decodedPage)
  if (
    (canonicalSlug && canonicalSlug !== decodedSlug) ||
    (canonicalPage && canonicalPage !== decodedPage)
  ) {
    redirect(`/events/${canonicalSlug}/${canonicalPage}`)
  }

  const event = await getEvent(slug)
  if (!event) notFound()

  const stdRow = await getStandardPageBySlugPublic(event.id, pageSlug)
  if (stdRow) {
    const stored = (stdRow.settings as Record<string, unknown> | null)?.puckData as PuckData | undefined
    const data =
      stored && Array.isArray(stored.content) && stored.content.length > 0
        ? stored
        : defaultPuckDataForKind(stdRow.kind as StandardPageKind)
    return (
      <StandardPageRender
        event={{
          id: event.id,
          slug: event.slug,
          title: event.title,
          start_date: event.start_date,
          end_date: event.end_date,
          venue: event.venue,
          description: event.description,
          cover_image_url: event.cover_image_url,
        }}
        pageKind={stdRow.kind as StandardPageKind}
        data={data}
      />
    )
  }

  const { page } = await getPublishedPageAndNav(event.id, pageSlug)
  if (page && page.data) {
    redirect(`/events/${event.slug}/p/${pageSlug}`)
  }

  const target = await getBuilderPageRedirect(event.id, pageSlug)
  if (target) redirect(`/events/${event.slug}/${target}`)

  notFound()
}
