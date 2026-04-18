"use server"

/**
 * ── EVENT BUILDER (Puck) SERVER ACTIONS ───────────────────────────────
 *
 * Thin CRUD + publish over the Puck editor `Data` object stored on the
 * `events` table. Two columns:
 *
 *   events.builder_draft        — work-in-progress; autosaved from editor
 *   events.builder_data         — published snapshot; rendered on public page
 *   events.builder_published_at — timestamp of last publish
 *
 * Reads go through the anon client (RLS permits anon SELECT on events
 * when the event is published). Writes go through the service-role admin
 * client, gated by requirePermission("events", ...).
 *
 * Related:
 *   - supabase/migrations/add-events-builder-data.sql
 *   - components/admin/puck/PuckEventBuilder.tsx
 *   - app/(site)/events/[slug]/page.tsx (renders builder_data when set)
 */

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission } from "@/lib/server-permissions"
import { legacyToPuck, type PuckDataLike } from "@/lib/event-puck-migrate"

/* ── Read: admin editor ───────────────────────────────────────────────── */

/**
 * Load the draft (editor state) for an event. If no draft exists but the
 * event has legacy `event_sections` rows, convert them to Puck format on
 * the fly so the admin lands on a pre-populated canvas rather than a
 * blank page.
 */
export async function getBuilderDraft(
  eventId: string,
): Promise<{ success: boolean; data: PuckDataLike | null; publishedAt: string | null; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()

    const { data: ev, error } = await admin
      .from("events")
      .select("id, title, builder_draft, builder_data, builder_published_at")
      .eq("id", eventId)
      .maybeSingle()
    if (error) return { success: false, data: null, publishedAt: null, error: error.message }
    if (!ev)   return { success: false, data: null, publishedAt: null, error: "Event not found" }

    const draft = (ev.builder_draft ?? ev.builder_data ?? null) as PuckDataLike | null

    // First-time migration: if no draft and no published data, attempt
    // to seed from legacy event_sections.
    if (!draft) {
      const { data: sections } = await admin
        .from("event_sections")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true })

      if (sections && sections.length > 0) {
        const seeded = legacyToPuck(sections as unknown as Parameters<typeof legacyToPuck>[0], {
          title: (ev.title as string) ?? "Event",
        })
        return {
          success: true,
          data: seeded,
          publishedAt: (ev.builder_published_at as string | null) ?? null,
        }
      }
    }

    return {
      success: true,
      data: draft,
      publishedAt: (ev.builder_published_at as string | null) ?? null,
    }
  } catch (err) {
    return { success: false, data: null, publishedAt: null, error: (err as Error).message }
  }
}

/**
 * Public-side read: returns the *published* Puck data only. Called from
 * /events/[slug]/page.tsx. Never returns the draft.
 */
export async function getPublishedBuilderData(
  eventId: string,
): Promise<{ success: boolean; data: PuckDataLike | null }> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data } = await supabase
      .from("events")
      .select("builder_data")
      .eq("id", eventId)
      .maybeSingle()
    return { success: true, data: (data?.builder_data ?? null) as PuckDataLike | null }
  } catch {
    return { success: false, data: null }
  }
}

/* ── Write: save draft (autosave) ─────────────────────────────────────── */

export async function saveBuilderDraft(
  eventId: string,
  data: PuckDataLike,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    if (!data || typeof data !== "object") {
      return { success: false, error: "Invalid builder data." }
    }
    const admin = createAdminClient()
    const { error } = await admin
      .from("events")
      .update({ builder_draft: data, updated_at: new Date().toISOString() })
      .eq("id", eventId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Write: publish (copy draft → live) ──────────────────────────────── */

export async function publishBuilder(
  eventId: string,
  data?: PuckDataLike,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()

    // If an explicit payload isn't provided, read the current draft.
    let payload: PuckDataLike | null = data ?? null
    if (!payload) {
      const { data: row } = await admin
        .from("events")
        .select("builder_draft")
        .eq("id", eventId)
        .maybeSingle()
      payload = (row?.builder_draft ?? null) as PuckDataLike | null
    }
    if (!payload) return { success: false, error: "No draft to publish." }

    const { data: row, error } = await admin
      .from("events")
      .update({
        builder_data: payload,
        builder_draft: payload,
        builder_published_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .select("slug")
      .single()
    if (error) return { success: false, error: error.message }

    // Revalidate the public page so the publish shows up immediately.
    if (row?.slug) {
      try { revalidatePath(`/events/${row.slug as string}`) } catch { /* ignore */ }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Write: revert draft to last published snapshot ──────────────────── */

export async function revertBuilderDraft(
  eventId: string,
): Promise<{ success: boolean; data: PuckDataLike | null; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data: row } = await admin
      .from("events")
      .select("builder_data")
      .eq("id", eventId)
      .maybeSingle()
    const live = (row?.builder_data ?? null) as PuckDataLike | null
    const { error } = await admin
      .from("events")
      .update({ builder_draft: live })
      .eq("id", eventId)
    if (error) return { success: false, data: null, error: error.message }
    return { success: true, data: live }
  } catch (err) {
    return { success: false, data: null, error: (err as Error).message }
  }
}

/* ── Reference data loaders (for Puck external fields) ───────────────── */

/**
 * Speakers attached to this event. Used by the SpeakerPicker external
 * field so admins can pick speakers from the event's own list.
 */
export async function listEventSpeakersForBuilder(
  eventId: string,
): Promise<Array<{ id: string; name: string; designation: string | null; company: string | null; image_url: string | null }>> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data } = await admin
      .from("speakers")
      .select("id, name, designation, company, image_url")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    return (data ?? []).map((r) => ({
      id: r.id as string,
      name: (r.name as string) ?? "",
      designation: (r.designation as string | null) ?? null,
      company: (r.company as string | null) ?? null,
      image_url: (r.image_url as string | null) ?? null,
    }))
  } catch {
    return []
  }
}

export async function listEventSessionsForBuilder(
  eventId: string,
): Promise<Array<{ id: string; title: string; start_time: string; end_time: string | null; track: string | null; room: string | null }>> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data } = await admin
      .from("sessions")
      .select("id, title, start_time, end_time, track, room")
      .eq("event_id", eventId)
      .order("start_time", { ascending: true })
    return (data ?? []).map((r) => ({
      id: r.id as string,
      title: (r.title as string) ?? "",
      start_time: (r.start_time as string) ?? "",
      end_time: (r.end_time as string | null) ?? null,
      track: (r.track as string | null) ?? null,
      room: (r.room as string | null) ?? null,
    }))
  } catch {
    return []
  }
}

export async function listEventSponsorsForBuilder(
  eventId: string,
): Promise<Array<{ id: string; name: string; logo_url: string | null; tier: string | null; website: string | null }>> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data } = await admin
      .from("sponsors")
      .select("id, name, logo_url, tier, website_url")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    return (data ?? []).map((r) => ({
      id: r.id as string,
      name: (r.name as string) ?? "",
      logo_url: (r.logo_url as string | null) ?? null,
      tier: (r.tier as string | null) ?? null,
      website: (r.website_url as string | null) ?? null,
    }))
  } catch {
    return []
  }
}

export async function listEventTicketsForBuilder(
  eventId: string,
): Promise<Array<{ id: string; name: string; description: string | null; price_inr: number }>> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data } = await admin
      .from("tickets")
      .select("id, name, description, price_inr")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    return (data ?? []).map((r) => ({
      id: r.id as string,
      name: (r.name as string) ?? "",
      description: (r.description as string | null) ?? null,
      price_inr: Number(r.price_inr ?? 0),
    }))
  } catch {
    return []
  }
}
