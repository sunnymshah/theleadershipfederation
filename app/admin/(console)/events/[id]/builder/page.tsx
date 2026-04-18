/**
 * ── /admin/events/[id]/builder ────────────────────────────────────────
 *
 * Thin server wrapper that loads everything the Puck editor needs —
 * event, speakers, sessions, sponsors, tickets, and the current draft —
 * then mounts `<PuckEventBuilder>` on the client.
 *
 * The actual editor lives in `components/admin/puck/PuckEventBuilder.tsx`;
 * this file just bridges server-fetched data into client props.
 *
 * Replaces the legacy custom canvas builder. For historical reference,
 * that implementation wrote to the `event_sections` table — data from
 * there is migrated on-the-fly by `getBuilderDraft` via `legacyToPuck`
 * so existing events open with a pre-populated canvas.
 */

import { notFound } from "next/navigation"
import { createAdminClient } from "@/utils/supabase/admin"
import { getBuilderDraft } from "@/app/actions/eventBuilderActions"
import { PuckEventBuilder } from "@/components/admin/puck/PuckEventBuilder"
import { emptyBuilderSeed } from "@/lib/event-puck-migrate"
import type { BuilderMetadata } from "@/components/admin/puck/blocks"
import type { Data } from "@measured/puck"

export const dynamic = "force-dynamic"

export default async function EventBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()

  // Load event + reference data in parallel. These all go through the
  // service-role client so the builder works regardless of RLS state on
  // the admin tables (the layout already auth-gates the route).
  const [
    eventRes,
    speakersRes,
    sessionsRes,
    sponsorsRes,
    ticketsRes,
    draftRes,
  ] = await Promise.all([
    admin
      .from("events")
      .select("id, slug, title, start_date, end_date, venue, description, cover_image_url")
      .eq("id", id)
      .maybeSingle(),
    admin
      .from("speakers")
      .select("id, name, designation, company, image_url")
      .eq("event_id", id)
      .order("sort_order", { ascending: true }),
    admin
      .from("sessions")
      .select("id, title, start_time, end_time, track")
      .eq("event_id", id)
      .order("start_time", { ascending: true }),
    admin
      .from("sponsors")
      .select("id, name, logo_url, tier, website_url")
      .eq("event_id", id)
      .order("sort_order", { ascending: true }),
    admin
      .from("tickets")
      .select("id, name, description, price_inr, sold, inventory_limit")
      .eq("event_id", id)
      .order("sort_order", { ascending: true }),
    getBuilderDraft(id),
  ])

  if (!eventRes.data) {
    notFound()
  }
  const event = eventRes.data

  // Shape the reference data exactly the way blocks.tsx expects it.
  const metadata: BuilderMetadata = {
    event: {
      id: event.id as string,
      slug: (event.slug as string) ?? "",
      title: (event.title as string) ?? "",
      start_date: (event.start_date as string) ?? "",
      end_date: (event.end_date as string | null) ?? null,
      venue: (event.venue as string | null) ?? null,
      description: (event.description as string | null) ?? null,
      cover_image_url: (event.cover_image_url as string | null) ?? null,
    },
    speakers: (speakersRes.data ?? []).map((s) => ({
      id: s.id as string,
      name: (s.name as string) ?? "",
      designation: (s.designation as string | null) ?? null,
      company: (s.company as string | null) ?? null,
      image_url: (s.image_url as string | null) ?? null,
    })),
    sessions: (sessionsRes.data ?? []).map((s) => ({
      id: s.id as string,
      title: (s.title as string) ?? "",
      starts_at: (s.start_time as string) ?? "",
      ends_at: (s.end_time as string | null) ?? null,
      speaker_names: null,
      track: (s.track as string | null) ?? null,
    })),
    sponsors: (sponsorsRes.data ?? []).map((s) => ({
      id: s.id as string,
      name: (s.name as string) ?? "",
      logo_url: (s.logo_url as string | null) ?? null,
      tier: (s.tier as string | null) ?? null,
      website: (s.website_url as string | null) ?? null,
    })),
    tickets: (ticketsRes.data ?? []).map((t) => ({
      id: t.id as string,
      name: (t.name as string) ?? "",
      description: (t.description as string | null) ?? null,
      price_inr: Number(t.price_inr ?? 0),
      sold: Number(t.sold ?? 0),
      inventory_limit: (t.inventory_limit as number | null) ?? null,
    })),
  }

  const initialData = (draftRes.success && draftRes.data
    ? draftRes.data
    : emptyBuilderSeed((event.title as string) ?? "Event")) as unknown as Data

  return (
    <PuckEventBuilder
      eventId={event.id as string}
      eventTitle={(event.title as string) ?? "Event"}
      eventSlug={(event.slug as string) ?? ""}
      initialData={initialData}
      metadata={metadata}
    />
  )
}
