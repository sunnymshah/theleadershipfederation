/**
 * Shared renderer for any standard page (home + 11 sub-pages).
 * Loads the reference data the Puck blocks need (speakers, sessions,
 * sponsors, tickets) and dispatches to PuckPublicRenderer.
 *
 * Server component — pulls data via the cookie-bound supabase client
 * so RLS is enforced.
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { PuckPublicRenderer } from "@/components/admin/puck/PuckPublicRenderer"
import { EventTopNav } from "@/components/site/event-pages/EventTopNav"
import { EventStructuredData } from "@/components/site/event-pages/EventStructuredData"
import type { StandardPageKind } from "@/lib/standard-pages"
import type { Data as PuckData } from "@measured/puck"

type EventLite = {
  id: string
  slug: string
  title: string
  start_date: string
  end_date: string
  venue: string
  description: string | null
  cover_image_url: string | null
}

export async function StandardPageRender({
  event,
  pageKind,
  data,
}: {
  event: EventLite
  pageKind: StandardPageKind
  data: PuckData
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const [speakersRes, sessionsRes, sponsorsRes, ticketsRes] = await Promise.all([
    supabase.from("speakers").select("*").eq("event_id", event.id).order("sort_order"),
    supabase.from("sessions").select("*").eq("event_id", event.id).order("start_time"),
    supabase.from("sponsors").select("*").eq("event_id", event.id).order("sort_order"),
    supabase
      .from("tickets")
      .select("id, name, description, price_inr, sold, inventory_limit, features, early_bird_ends_at")
      .eq("event_id", event.id)
      .order("sort_order"),
  ])
  const speakers = speakersRes.data ?? []
  const sessions = sessionsRes.data ?? []
  const sponsors = sponsorsRes.data ?? []
  const tickets = ticketsRes.data ?? []

  return (
    <>
      <EventTopNav eventId={event.id} eventSlug={event.slug} currentKind={pageKind} />
      {pageKind === "home" ? (
        <EventStructuredData
          event={event}
          speakers={speakers as Array<Record<string, unknown>>}
          sponsors={sponsors as Array<Record<string, unknown>>}
          tickets={tickets as Array<Record<string, unknown>>}
        />
      ) : null}
      <PuckPublicRenderer
        data={data}
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
          },
          speakers: speakers.map((s) => ({
            id: s.id,
            name: s.name,
            designation: s.designation ?? null,
            company: s.company ?? null,
            image_url: s.image_url ?? null,
            slug: s.slug ?? null,
          })),
          sessions: sessions.map((s) => ({
            id: s.id,
            title: s.title,
            starts_at: s.start_time,
            ends_at: s.end_time ?? null,
            speaker_names: null,
            track: s.track ?? null,
            slug: s.slug ?? null,
          })),
          sponsors: sponsors.map((s) => ({
            id: s.id,
            name: s.name,
            logo_url: s.logo_url ?? null,
            tier: s.tier ?? null,
            website: s.website_url ?? null,
          })),
          tickets: tickets.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description ?? null,
            price_inr: t.price_inr,
            sold: t.sold ?? 0,
            inventory_limit: t.inventory_limit ?? null,
            features: t.features ?? null,
            early_bird_ends_at: t.early_bird_ends_at ?? null,
          })),
        }}
      />
    </>
  )
}
