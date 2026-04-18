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
import { getBuilderDraft } from "@/app/actions/eventBuilderActions"
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

  if (!canAccessWithProfile(profilePermissions, "events", "edit") && teamMember.role !== "super_admin") {
    redirect("/admin/denied?from=/admin/builder")
  }

  /* ── Load event + reference data in parallel ───────────────────────── */
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

  if (!eventRes.data) notFound()
  const event = eventRes.data

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
