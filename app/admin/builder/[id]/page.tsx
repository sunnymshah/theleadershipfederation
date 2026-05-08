/**
 * ── /admin/builder/[id] ───────────────────────────────────────────────
 *
 * FULLSCREEN Puck editor for the event page builder. Lives OUTSIDE the
 * `(console)` route group so it doesn't inherit `AdminLayoutShell`
 * (sidebar + 52px top bar). The builder owns the entire viewport.
 *
 * Auth is inlined here — same three-layer gate as (console)/layout.tsx
 * (authenticated → team member row → events.edit permission), just
 * redirected to a deep /admin path on failure.
 *
 * Replaces the legacy /admin/events/[id]/builder route which sat inside
 * the console shell and couldn't go edge-to-edge.
 */

import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { getBuilderDraft, getBuilderPagesDraft } from "@/app/actions/eventBuilderActions"
import { PuckEventBuilder } from "@/components/admin/puck/PuckEventBuilder"
import { emptyBuilderSeed } from "@/lib/event-puck-migrate"
import { canAccessWithProfile } from "@/lib/permissions"
import type { BuilderMetadata } from "@/components/admin/puck/blocks"
import type { ProfilePermissions } from "@/app/actions/profileActions"
import type { Data } from "@measured/puck"

export const dynamic = "force-dynamic"

export default async function FullscreenBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  /* ── Auth gate (inline — we're outside (console)) ──────────────────── */
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect(`/admin/login?next=${encodeURIComponent(`/admin/builder/${id}`)}`)
  }

  const admin = createAdminClient()
  const { data: teamMember } = await admin
    .from("team_members")
    .select("role, profile_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!teamMember?.role) {
    await supabase.auth.signOut()
    redirect("/admin/login?error=access-denied")
  }

  let profilePermissions: ProfilePermissions | null = null
  if (teamMember.role !== "super_admin" && teamMember.profile_id) {
    const { data: profile } = await admin
      .from("access_profiles")
      .select("permissions")
      .eq("id", teamMember.profile_id)
      .eq("is_active", true)
      .maybeSingle()
    profilePermissions = (profile?.permissions as ProfilePermissions) ?? null
  }

  /* ── Row-level access ─────────────────────────────────────────────
   * Three sufficient conditions to edit a specific event's builder:
   *   (a) super_admin — unconditional
   *   (b) the user created the event (events.created_by = user.id)
   *   (c) the user is a member of event_team_members for this event
   * Otherwise punt to /admin/denied. The events.edit profile permission
   * (the legacy gate) is no longer enough on its own — it would let any
   * editor touch any event regardless of ownership. */
  if (teamMember.role !== "super_admin") {
    let allowed = false

    // (b) creator?
    const { data: ownership } = await admin
      .from("events")
      .select("created_by")
      .eq("id", id)
      .maybeSingle()
    if (ownership?.created_by && ownership.created_by === user.id) allowed = true

    // (c) listed in event_team_members for this event?
    if (!allowed) {
      try {
        const { data: etm } = await admin
          .from("event_team_members")
          .select("user_id")
          .eq("event_id", id)
          .eq("user_id", user.id)
          .maybeSingle()
        if (etm) allowed = true
      } catch {
        // event_team_members may not exist in older deployments — fall
        // through to deny. Migration adds the table.
      }
    }

    if (!allowed) {
      redirect("/admin/denied?from=/admin/builder")
    }

    // Belt-and-braces: if the team-member profile doesn't grant events.edit
    // either (e.g. they were given creator-only rights), still deny.
    if (!canAccessWithProfile(profilePermissions, "events", "edit")) {
      redirect("/admin/denied?from=/admin/builder")
    }
  }

  /* ── Load event + reference data + builder state in parallel ──────── */
  // Defensive read: select * so columns added by un-applied migrations
  // (logo_url, thumbnail_url, favicon_url, nav_extra_links, locales,
  // default_locale, builder_settings) don't blow up the SELECT on prod
  // DBs where the migration hasn't run yet — Postgres rejects the whole
  // query if any named column is missing, which would have us hand back
  // null data + an error and mistakenly call notFound() below.
  const [
    eventRes,
    speakersRes,
    sessionsRes,
    sponsorsRes,
    ticketsRes,
    exhibitorsRes,
    exhibitorCategoriesRes,
    hotelsRes,
    draftRes,
    pagesRes,
  ] = await Promise.all([
    admin
      .from("events")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    admin
      .from("speakers")
      .select("id, name, designation, company, image_url, slug")
      .eq("event_id", id)
      .order("sort_order", { ascending: true }),
    admin
      .from("sessions")
      .select("id, title, start_time, end_time, track, slug, featured")
      .eq("event_id", id)
      .order("start_time", { ascending: true }),
    admin
      .from("sponsors")
      .select("id, name, logo_url, tier, website_url")
      .eq("event_id", id)
      .order("sort_order", { ascending: true }),
    admin
      .from("tickets")
      .select("id, name, description, price_inr, sold, inventory_limit, features, early_bird_ends_at")
      .eq("event_id", id)
      .order("sort_order", { ascending: true }),
    // ITEM 6 — exhibitors + categories. Tables are added by the gap-pass
    // migration; on un-migrated DBs the rows array stays empty.
    admin
      .from("exhibitors")
      .select("id, name, logo_url, category, booth, description, website")
      .eq("event_id", id)
      .order("sort_order", { ascending: true })
      .then((r) => r, () => ({ data: [] as Array<Record<string, unknown>>, error: null })),
    admin
      .from("event_exhibitor_categories")
      .select("id, name, color")
      .eq("event_id", id)
      .order("sort_order", { ascending: true })
      .then((r) => r, () => ({ data: [] as Array<Record<string, unknown>>, error: null })),
    // ITEM 7 — hotels.
    admin
      .from("event_hotels")
      .select("id, name, image_url, address, distance_km, price_range, booking_url, description")
      .eq("event_id", id)
      .order("sort_order", { ascending: true })
      .then((r) => r, () => ({ data: [] as Array<Record<string, unknown>>, error: null })),
    getBuilderDraft(id),
    getBuilderPagesDraft(id),
  ])

  if (!eventRes.data) {
    // Distinguish "event genuinely missing" from "Supabase rejected the
    // SELECT (e.g. RLS, missing column)". Logging the underlying error
    // gives Vercel runtime logs something to point at the next time
    // someone hits a builder 404.
    if (eventRes.error) {
      console.error(
        "[builder/[id]] events SELECT failed for id=", id,
        "— message:", eventRes.error.message,
        "— code:", eventRes.error.code,
      )
    }
    notFound()
  }
  const event = eventRes.data as Record<string, unknown>
  // Cast through Record<string, unknown> below so optional columns
  // missing from older databases don't trip the type checker.

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
      logo_url: (event.logo_url as string | null) ?? null,
    },
    speakers: (speakersRes.data ?? []).map((s) => ({
      id: s.id as string,
      name: (s.name as string) ?? "",
      designation: (s.designation as string | null) ?? null,
      company: (s.company as string | null) ?? null,
      image_url: (s.image_url as string | null) ?? null,
      slug: (s.slug as string | null) ?? null,
    })),
    sessions: (sessionsRes.data ?? []).map((s) => ({
      id: s.id as string,
      title: (s.title as string) ?? "",
      starts_at: (s.start_time as string) ?? "",
      ends_at: (s.end_time as string | null) ?? null,
      speaker_names: null,
      track: (s.track as string | null) ?? null,
      slug: (s.slug as string | null) ?? null,
      // PART C3 — featured flag for FeaturedSessions block.
      featured: ((s as { featured?: boolean | null }).featured) ?? false,
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
      features: (t.features as string[] | null) ?? null,
      early_bird_ends_at: (t.early_bird_ends_at as string | null) ?? null,
    })),
    socialHandles: (() => {
      const general = ((event.builder_settings as Record<string, unknown> | null)?.general ?? {}) as Record<string, unknown>
      return (general.socialHandles ?? {}) as Record<string, string>
    })(),
    timeFormat: (() => {
      const tf = ((event.builder_settings as Record<string, unknown> | null)?.timeFormat ?? {}) as Record<string, unknown>
      return { dateFormat: typeof tf.dateFormat === "string" ? tf.dateFormat : undefined,
               timeFormat: typeof tf.timeFormat === "string" ? tf.timeFormat : undefined,
               showTimezone: tf.showTimezone !== false }
    })(),
    mapSettings: (() => {
      const ms = ((event.builder_settings as Record<string, unknown> | null)?.map ?? {}) as Record<string, unknown>
      return { provider: (ms.provider === "openstreetmap" ? "openstreetmap" : "google") as "google" | "openstreetmap",
               defaultZoom: Number(ms.defaultZoom ?? 14),
               showDirectionsButton: ms.showDirectionsButton !== false }
    })(),
    exhibitors: ((exhibitorsRes.data ?? []) as Array<Record<string, unknown>>).map((e) => ({
      id: e.id as string,
      name: (e.name as string) ?? "",
      logo_url: (e.logo_url as string | null) ?? null,
      category: (e.category as string | null) ?? null,
      booth: (e.booth as string | null) ?? null,
      description: (e.description as string | null) ?? null,
      website: (e.website as string | null) ?? null,
    })),
    exhibitorCategories: ((exhibitorCategoriesRes.data ?? []) as Array<Record<string, unknown>>).map((c) => ({
      id: c.id as string,
      name: (c.name as string) ?? "",
      color: (c.color as string | null) ?? null,
    })),
    hotels: ((hotelsRes.data ?? []) as Array<Record<string, unknown>>).map((h) => ({
      id: h.id as string,
      name: (h.name as string) ?? "",
      image_url: (h.image_url as string | null) ?? null,
      address: (h.address as string | null) ?? null,
      distance_km: (h.distance_km as number | null) ?? null,
      price_range: (h.price_range as string | null) ?? null,
      booking_url: (h.booking_url as string | null) ?? null,
      description: (h.description as string | null) ?? null,
    })),
    // ITEM 4.4 — text overrides + default locale flow into Puck metadata
    // so the editor preview matches what the public renderer ships.
    textOverrides: (() => {
      const v = (event as { text_overrides?: unknown }).text_overrides
      return (v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, Record<string, string>>)
        : {})
    })(),
    defaultLocale: (() => {
      const v = (event as { default_locale?: unknown }).default_locale
      return typeof v === "string" && v.length > 0 ? v : "en"
    })(),
  }

  const initialData = (draftRes.success && draftRes.data
    ? draftRes.data
    : emptyBuilderSeed((event.title as string) ?? "Event")) as unknown as Data

  // Defensive read: locales/default_locale/builder_settings columns are
  // added by the standard-pages migration. If the migration hasn't run
  // yet we get null/undefined; pass safe fallbacks.
  const settings = (event.builder_settings ?? {}) as Record<string, unknown>
  const general = (settings.general ?? {}) as Record<string, unknown>
  const eventLocales = (() => {
    const v = (event as { locales?: unknown }).locales
    return Array.isArray(v) && v.every((x) => typeof x === "string")
      ? (v as string[])
      : ["en"]
  })()
  const defaultLocale = (() => {
    const v = (event as { default_locale?: unknown }).default_locale
    return typeof v === "string" && v.length > 0 ? v : "en"
  })()
  const eventStatus = (event.status as string | null) ?? "draft"
  const eventTimezone = typeof general.timezone === "string" && general.timezone.length > 0
    ? general.timezone
    : "Asia/Kolkata"

  return (
    <PuckEventBuilder
      eventId={event.id as string}
      eventTitle={(event.title as string) ?? "Event"}
      eventSlug={(event.slug as string) ?? ""}
      eventStatus={eventStatus}
      eventStartDate={(event.start_date as string) ?? null}
      eventEndDate={(event.end_date as string | null) ?? null}
      eventLocales={eventLocales}
      defaultLocale={defaultLocale}
      eventTimezone={eventTimezone}
      initialData={initialData}
      initialPages={pagesRes.success ? pagesRes.pages : {}}
      metadata={metadata}
    />
  )
}
