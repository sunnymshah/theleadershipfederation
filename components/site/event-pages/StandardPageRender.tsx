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
import { Breadcrumbs } from "@/components/site/event-pages/Breadcrumbs"
import { ABExposureRecorder } from "@/components/site/event-pages/ABExposureRecorder"
import type { StandardPageKind } from "@/lib/standard-pages"
import { DEFAULT_PAGE_LABELS } from "@/lib/standard-pages"
import { listActiveTestsForEvent, applyVariantOverrides } from "@/lib/ab-testing"
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
  /** A2: optional event logo (with optional ?fp= focal-point suffix). */
  logo_url?: string | null
}

export async function StandardPageRender({
  event,
  pageKind,
  data,
  locale,
}: {
  event: EventLite
  pageKind: StandardPageKind
  data: PuckData
  /** Optional locale — when set, EventTopNav links rewrite to /[lang]. */
  locale?: string
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Resolve A/B tests scoped to this event + page kind. The server-side
  // bucket pick uses a per-visitor cookie ("lf-vid") so SSR + client agree.
  const visitorCookie = cookieStore.get("lf-vid")?.value
  // Anonymous visitors with no cookie get a stable per-request id derived
  // from the page key — same visitor always sees the same variant on a
  // given page. The client-side ABExposureRecorder upgrades this to a
  // long-lived localStorage id once it loads.
  const visitorId =
    visitorCookie && visitorCookie.length >= 8
      ? visitorCookie
      : `v_anon_${event.id}_${pageKind}`
  const allTests = await listActiveTestsForEvent(event.id)
  const tests = allTests.filter((t) => t.page_kind === pageKind)
  const exposures: Array<{ test_id: string; variant: string }> = []
  let renderedData = data
  if (tests.length > 0 && Array.isArray(data.content)) {
    const overridden = applyVariantOverrides(
      data.content as Array<{ type: string; props: Record<string, unknown> }>,
      visitorId,
      tests,
    )
    for (const b of overridden) {
      if ((b as { __ab?: { test_id: string; variant: string } }).__ab) {
        exposures.push((b as { __ab: { test_id: string; variant: string } }).__ab)
      }
    }
    // Strip the __ab annotation before handing to Puck (it's not a valid Puck prop).
    const cleaned = overridden.map((b) => ({ type: b.type, props: b.props })) as PuckData["content"]
    renderedData = { ...data, content: cleaned }
  }

  const [speakersRes, sessionsRes, sponsorsRes, ticketsRes, builderRes, exhibRes, catRes, hotelRes] = await Promise.all([
    supabase.from("speakers").select("*").eq("event_id", event.id).order("sort_order"),
    supabase.from("sessions").select("*").eq("event_id", event.id).order("start_time"),
    supabase.from("sponsors").select("*").eq("event_id", event.id).order("sort_order"),
    supabase
      .from("tickets")
      .select("id, name, description, price_inr, sold, inventory_limit, features, early_bird_ends_at")
      .eq("event_id", event.id)
      .order("sort_order"),
    // ITEM 2.4 — pull socialHandles + ITEM 10 settings from builder_settings.
    // ITEM 4.4 — also read text_overrides + default_locale so blocks resolve
    // locale-aware strings via the metaString helper.
    supabase
      .from("events")
      .select("builder_settings, text_overrides, default_locale")
      .eq("id", event.id)
      .maybeSingle(),
    // ITEM 6 — exhibitors + categories are anon-readable per RLS.
    supabase.from("exhibitors").select("*").eq("event_id", event.id).order("sort_order"),
    supabase.from("event_exhibitor_categories").select("*").eq("event_id", event.id).order("sort_order"),
    // ITEM 7 — hotels.
    supabase.from("event_hotels").select("*").eq("event_id", event.id).order("sort_order"),
  ])
  const speakers = speakersRes.data ?? []
  const sessions = sessionsRes.data ?? []
  const sponsors = sponsorsRes.data ?? []
  const tickets = ticketsRes.data ?? []
  const builderSettings = (builderRes.data?.builder_settings ?? {}) as Record<string, unknown>
  const general = (builderSettings.general ?? {}) as Record<string, unknown>
  const socialHandles = (general.socialHandles ?? {}) as Record<string, string>
  const timeFormat = (builderSettings.timeFormat ?? {}) as Record<string, unknown>
  const mapSettings = (builderSettings.map ?? {}) as Record<string, unknown>
  // ITEM 4.4 — text overrides + default locale. The current locale comes
  // from the [lang] route segment when present, else the event default.
  const textOverrides = ((builderRes.data as { text_overrides?: unknown } | null)?.text_overrides
    ?? {}) as Record<string, Record<string, string>>
  const defaultLocale =
    ((builderRes.data as { default_locale?: string | null } | null)?.default_locale)
    ?? "en"
  const currentLocale = locale ?? defaultLocale
  const exhibitors = (exhibRes.data ?? []) as Array<Record<string, unknown>>
  const exhibitorCategories = (catRes.data ?? []) as Array<Record<string, unknown>>
  const hotels = (hotelRes.data ?? []) as Array<Record<string, unknown>>

  return (
    <>
      <EventTopNav eventId={event.id} eventSlug={event.slug} currentKind={pageKind} locale={locale} />
      {pageKind === "home" ? (
        <EventStructuredData
          event={event}
          speakers={speakers as Array<Record<string, unknown>>}
          sponsors={sponsors as Array<Record<string, unknown>>}
          tickets={tickets as Array<Record<string, unknown>>}
        />
      ) : (
        <Breadcrumbs
          eventSlug={event.slug}
          eventTitle={event.title}
          pageLabel={DEFAULT_PAGE_LABELS[pageKind]}
        />
      )}
      {exposures.length > 0 && <ABExposureRecorder exposures={exposures} />}
      <PuckPublicRenderer
        data={renderedData}
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
            logo_url: event.logo_url ?? null,
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
            // PART C3 — featured flag drives the FeaturedSessions block.
            featured: (s as { featured?: boolean | null }).featured ?? false,
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
          socialHandles,
          exhibitors: exhibitors.map((e) => ({
            id: e.id as string,
            name: (e.name as string) ?? "",
            logo_url: (e.logo_url as string | null) ?? null,
            category: (e.category as string | null) ?? null,
            booth: (e.booth as string | null) ?? null,
            description: (e.description as string | null) ?? null,
            website: (e.website as string | null) ?? null,
          })),
          exhibitorCategories: exhibitorCategories.map((c) => ({
            id: c.id as string,
            name: (c.name as string) ?? "",
            color: (c.color as string | null) ?? null,
          })),
          hotels: hotels.map((h) => ({
            id: h.id as string,
            name: (h.name as string) ?? "",
            image_url: (h.image_url as string | null) ?? null,
            address: (h.address as string | null) ?? null,
            distance_km: (h.distance_km as number | null) ?? null,
            price_range: (h.price_range as string | null) ?? null,
            booking_url: (h.booking_url as string | null) ?? null,
            description: (h.description as string | null) ?? null,
          })),
          timeFormat: {
            dateFormat: typeof timeFormat.dateFormat === "string" ? timeFormat.dateFormat : undefined,
            timeFormat: typeof timeFormat.timeFormat === "string" ? timeFormat.timeFormat : undefined,
            showTimezone: timeFormat.showTimezone !== false,
          },
          mapSettings: {
            provider: (mapSettings.provider === "openstreetmap" ? "openstreetmap" : "google") as "google" | "openstreetmap",
            defaultZoom: Number(mapSettings.defaultZoom ?? 14),
            showDirectionsButton: mapSettings.showDirectionsButton !== false,
          },
          // ITEM 4.4 — pass text-overrides through so blocks (Hero CTAs,
          // Footer copyright, Agenda day label, etc.) resolve via getString.
          textOverrides,
          defaultLocale: currentLocale,
        }}
      />
    </>
  )
}
