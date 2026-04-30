/**
 * ── /events/[slug]/p/[pageSlug] ──────────────────────────────────────
 *
 * Public render for a SECONDARY page built in the Puck multi-page editor.
 * The home page at /events/[slug] still renders from events.builder_data;
 * this route renders from events.builder_pages[pageSlug].data.
 *
 * Why /p/<slug> instead of /[slug]/[pageSlug]:
 *   - Prevents collision with existing child routes (tickets, schedule,
 *     live, delegates).
 *   - Reserves the top-level segment for future first-class features.
 */

import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getEvent } from "@/lib/get-event"
import { PuckPublicRenderer } from "@/components/admin/puck/PuckPublicRenderer"
import { EventPageNav } from "@/components/site/event-pages/EventPageNav"
import {
  getPublishedPageAndNav,
  getBuilderPageRedirect,
} from "@/app/actions/eventBuilderActions"
import type { Data as PuckData } from "@measured/puck"

export const revalidate = 10

interface Props {
  params: Promise<{ slug: string; pageSlug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug, pageSlug } = await params
  const event = await getEvent(slug)
  if (!event) return { title: "Not Found" }
  const { page } = await getPublishedPageAndNav(event.id, pageSlug)
  if (!page) return { title: `${event.title} | The Leadership Federation` }
  return {
    title: `${page.title} · ${event.title} | The Leadership Federation`,
    description: event.description ?? undefined,
  }
}

export default async function EventSubPage({ params }: Props) {
  const { slug, pageSlug } = await params
  const event = await getEvent(slug)
  if (!event) notFound()

  const { page } = await getPublishedPageAndNav(event.id, pageSlug)
  if (!page || !page.data) {
    // Check for a renamed-slug redirect before bailing out so old links
    // keep working as 301s.
    const redirectTo = await getBuilderPageRedirect(event.id, pageSlug)
    if (redirectTo) {
      redirect(`/events/${event.slug}/p/${redirectTo}`)
    }
    notFound()
  }

  /* ── Load the same reference data the home page uses so shared blocks
   *    (SpeakersGrid, Agenda, SponsorsGrid, TicketsCta) render with real
   *    event data on sub-pages too. */
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const [speakersRes, sessionsRes, sponsorsRes, ticketsRes] = await Promise.all([
    supabase.from("speakers").select("*").eq("event_id", event.id).order("sort_order"),
    supabase.from("sessions").select("*").eq("event_id", event.id).order("start_time"),
    supabase.from("sponsors").select("*").eq("event_id", event.id).order("sort_order"),
    supabase.from("tickets").select("id, name, description, price_inr, sold, inventory_limit, features, early_bird_ends_at").eq("event_id", event.id).order("sort_order"),
  ])
  const speakers = speakersRes.data ?? []
  const sessions = sessionsRes.data ?? []
  const sponsors = sponsorsRes.data ?? []
  const tickets  = ticketsRes.data ?? []

  return (
    <>
      <EventPageNav eventId={event.id} eventSlug={event.slug} currentPageSlug={pageSlug} />
      <PuckPublicRenderer
      data={page.data as unknown as PuckData}
      metadata={{
        event: {
          id: event.id,
          slug: event.slug,
          title: event.title,
          start_date: event.start_date,
          end_date: event.end_date,
          venue: event.venue,
          description: event.description,
          cover_image_url: event.cover_image_url,
          logo_url: (event as { logo_url?: string | null }).logo_url ?? null,
        },
        speakers: speakers.map((s) => ({
          id: s.id, name: s.name,
          designation: s.designation ?? null,
          company: s.company ?? null,
          image_url: s.image_url ?? null,
          slug: s.slug ?? null,
        })),
        sessions: sessions.map((s) => ({
          id: s.id, title: s.title,
          starts_at: s.start_time,
          ends_at: s.end_time ?? null,
          speaker_names: null,
          track: s.track ?? null,
          slug: s.slug ?? null,
        })),
        sponsors: sponsors.map((s) => ({
          id: s.id, name: s.name,
          logo_url: s.logo_url ?? null,
          tier: s.tier ?? null,
          website: s.website_url ?? null,
        })),
        tickets: tickets.map((t) => ({
          id: t.id, name: t.name,
          description: t.description ?? null,
          price_inr: t.price_inr,
          sold: t.sold ?? 0,
          inventory_limit: t.inventory_limit ?? null,
          features: t.features ?? null,
          early_bird_ends_at: t.early_bird_ends_at ?? null,
        })),
        socialHandles: (() => {
          const bs = (event as { builder_settings?: Record<string, unknown> | null }).builder_settings ?? {}
          const general = (bs.general ?? {}) as Record<string, unknown>
          return (general.socialHandles ?? {}) as Record<string, string>
        })(),
      }}
    />
    </>
  )
}
