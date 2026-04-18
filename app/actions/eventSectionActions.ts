"use server"

/**
 * ── EVENT SECTIONS (Page Builder) ─────────────────────────────────────
 *
 * CRUD for the event_sections table. Every admin mutation is gated
 * behind requirePermission("events", "create|edit|delete") so the
 * profile permission system governs page-builder access.
 */

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission } from "@/lib/server-permissions"
import { SECTION_KINDS, type EventSection, type SectionKind } from "@/lib/event-sections"

/**
 * Revalidate the PUBLIC event page after a section mutation so edits are
 * "real-time" on /events/[slug]. We deliberately do NOT revalidate the admin
 * builder path — that page is a fully-client component, so revalidating it
 * only forces a visible RSC re-render that remounts the client tree and
 * wipes transient state (open popovers, focus, scroll). In practice that
 * looked like the builder was "constantly refreshing" after every keystroke.
 *
 * Wrapped in try/catch per Next 16 guidance — a render failure must not
 * fail the mutation.
 */
async function revalidateEvent(eventId: string, slug?: string | null) {
  if (slug) {
    try { revalidatePath(`/events/${slug}`) } catch { /* ignore */ }
    return
  }
  // Look up the slug so we can revalidate the public page too.
  try {
    const admin = createAdminClient()
    const { data } = await admin.from("events").select("slug").eq("id", eventId).maybeSingle()
    if (data?.slug) {
      try { revalidatePath(`/events/${data.slug}`) } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

/* ── Read: public + admin ────────────────────────────────────────────── */

export async function getEventSections(
  eventId: string,
): Promise<{ success: boolean; sections: EventSection[]; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data, error } = await supabase
      .from("event_sections")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
    if (error) return { success: false, sections: [], error: error.message }
    return { success: true, sections: (data ?? []) as EventSection[] }
  } catch (err) {
    return { success: false, sections: [], error: (err as Error).message }
  }
}

export async function getEventSectionsBySlug(
  slug: string,
): Promise<{ success: boolean; sections: EventSection[]; eventId: string | null }> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()
    if (!event) return { success: true, sections: [], eventId: null }
    const res = await getEventSections(event.id as string)
    return { success: res.success, sections: res.sections, eventId: event.id as string }
  } catch {
    return { success: false, sections: [], eventId: null }
  }
}

/* ── Admin: create ───────────────────────────────────────────────────── */

export async function createEventSection(input: {
  eventId: string
  kind: SectionKind
  title?: string
  subtitle?: string
  body?: string
  imageUrl?: string
  videoUrl?: string
  ctaLabel?: string
  ctaUrl?: string
  data?: Record<string, unknown>
}): Promise<{ success: boolean; section?: EventSection; error?: string }> {
  try {
    await requirePermission("events", "edit")
    if (!SECTION_KINDS.includes(input.kind)) {
      return { success: false, error: `Unknown section kind "${input.kind}"` }
    }

    const admin = createAdminClient()

    // Append to end: find current max sort_order + 1
    const { data: existing } = await admin
      .from("event_sections")
      .select("sort_order")
      .eq("event_id", input.eventId)
      .order("sort_order", { ascending: false })
      .limit(1)
    const nextOrder = existing && existing[0] ? (existing[0].sort_order as number) + 1 : 0

    const { data, error } = await admin
      .from("event_sections")
      .insert({
        event_id:  input.eventId,
        kind:      input.kind,
        title:     input.title ?? null,
        subtitle:  input.subtitle ?? null,
        body:      input.body ?? null,
        image_url: input.imageUrl ?? null,
        video_url: input.videoUrl ?? null,
        cta_label: input.ctaLabel ?? null,
        cta_url:   input.ctaUrl ?? null,
        data:      input.data ?? {},
        sort_order: nextOrder,
        is_active: true,
      })
      .select()
      .single()
    if (error) return { success: false, error: error.message }

    const { data: ev } = await admin.from("events").select("slug").eq("id", input.eventId).maybeSingle()
    await revalidateEvent(input.eventId, ev?.slug as string | null | undefined)

    return { success: true, section: data as EventSection }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Admin: update ───────────────────────────────────────────────────── */

export async function updateEventSection(
  id: string,
  patch: Partial<{
    title: string
    subtitle: string
    body: string
    imageUrl: string
    videoUrl: string
    ctaLabel: string
    ctaUrl: string
    data: Record<string, unknown>
    isActive: boolean
  }>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (patch.title !== undefined) update.title = patch.title
    if (patch.subtitle !== undefined) update.subtitle = patch.subtitle
    if (patch.body !== undefined) update.body = patch.body
    if (patch.imageUrl !== undefined) update.image_url = patch.imageUrl
    if (patch.videoUrl !== undefined) update.video_url = patch.videoUrl
    if (patch.ctaLabel !== undefined) update.cta_label = patch.ctaLabel
    if (patch.ctaUrl !== undefined) update.cta_url = patch.ctaUrl
    if (patch.data !== undefined) update.data = patch.data
    if (patch.isActive !== undefined) update.is_active = patch.isActive

    const { data: row } = await admin
      .from("event_sections")
      .select("event_id, events(slug)")
      .eq("id", id)
      .maybeSingle()

    const { error } = await admin.from("event_sections").update(update).eq("id", id)
    if (error) return { success: false, error: error.message }

    if (row?.event_id) {
      const slug = (row as unknown as { events?: { slug?: string } }).events?.slug
      await revalidateEvent(row.event_id as string, slug)
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Admin: delete ───────────────────────────────────────────────────── */

export async function deleteEventSection(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "delete")
    const admin = createAdminClient()
    const { data: row } = await admin
      .from("event_sections")
      .select("event_id")
      .eq("id", id)
      .maybeSingle()

    const { error } = await admin.from("event_sections").delete().eq("id", id)
    if (error) return { success: false, error: error.message }

    if (row?.event_id) {
      await revalidateEvent(row.event_id as string)
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Admin: reorder (move up/down) ──────────────────────────────────── */

export async function moveEventSection(
  id: string,
  direction: "up" | "down",
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()

    const { data: me } = await admin
      .from("event_sections")
      .select("id, event_id, sort_order")
      .eq("id", id)
      .maybeSingle()
    if (!me) return { success: false, error: "Section not found" }

    // Find neighbour in the requested direction
    const { data: neighbour } = await admin
      .from("event_sections")
      .select("id, sort_order")
      .eq("event_id", me.event_id)
      .order("sort_order", { ascending: direction === "down" })
      .gt("sort_order", direction === "down" ? me.sort_order : -1)
      .lt("sort_order", direction === "up" ? me.sort_order : 10000)
      .limit(1)

    const swap = neighbour?.[0]
    if (!swap) return { success: true } // already at end/start

    // Swap sort_order values
    await admin
      .from("event_sections")
      .update({ sort_order: swap.sort_order })
      .eq("id", me.id)
    await admin
      .from("event_sections")
      .update({ sort_order: me.sort_order })
      .eq("id", swap.id)

    await revalidateEvent(me.event_id as string)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Admin: batch reorder (drag-and-drop) ───────────────────────────── */

export async function reorderEventSections(
  eventId: string,
  orderedIds: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()

    // Confirm every id belongs to this event before we write anything.
    const { data: existing } = await admin
      .from("event_sections")
      .select("id")
      .eq("event_id", eventId)
    const validIds = new Set((existing ?? []).map((r) => r.id as string))
    for (const id of orderedIds) {
      if (!validIds.has(id)) return { success: false, error: "Unknown section id in reorder" }
    }

    // Write new sort_order per id. Keep it simple — one update per row; the
    // event section count is bounded (usually < 30), and this avoids the
    // need for a Postgres function.
    for (let i = 0; i < orderedIds.length; i++) {
      await admin
        .from("event_sections")
        .update({ sort_order: i })
        .eq("id", orderedIds[i])
    }

    await revalidateEvent(eventId)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Admin: duplicate ───────────────────────────────────────────────── */

export async function duplicateEventSection(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data: src, error: readErr } = await admin
      .from("event_sections")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (readErr || !src) return { success: false, error: readErr?.message ?? "Not found" }

    const { data: existing } = await admin
      .from("event_sections")
      .select("sort_order")
      .eq("event_id", src.event_id)
      .order("sort_order", { ascending: false })
      .limit(1)
    const nextOrder = existing && existing[0] ? (existing[0].sort_order as number) + 1 : 0

    const { error } = await admin.from("event_sections").insert({
      event_id:   src.event_id,
      kind:       src.kind,
      title:      src.title,
      subtitle:   src.subtitle,
      body:       src.body,
      image_url:  src.image_url,
      video_url:  src.video_url,
      cta_label:  src.cta_label,
      cta_url:    src.cta_url,
      data:       src.data,
      sort_order: nextOrder,
      is_active:  true,
    })
    if (error) return { success: false, error: error.message }

    await revalidateEvent(src.event_id as string)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
