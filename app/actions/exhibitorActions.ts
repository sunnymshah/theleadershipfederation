"use server"

/**
 * Exhibitor + category CRUD (ITEM 6).
 *
 * Server actions called from the ExhibitorsManager panel inside the
 * event builder. Both tables enable RLS + grant anon SELECT, so reads
 * for the public site go through the cookie-bound supabase client; the
 * admin path uses the service-role client to bypass RLS for writes.
 */

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission } from "@/lib/server-permissions"

export type Exhibitor = {
  id: string
  event_id: string
  name: string
  logo_url: string | null
  category: string | null
  booth: string | null
  description: string | null
  website: string | null
  sort_order: number
  created_at: string
}

export type ExhibitorCategory = {
  id: string
  event_id: string
  name: string
  color: string | null
  sort_order: number
  created_at: string
}

async function eventSlug(eventId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from("events").select("slug").eq("id", eventId).maybeSingle()
  return (data?.slug as string | null) ?? null
}

function safeRevalidate(path: string) {
  try { revalidatePath(path) } catch {}
}

/* ── reads ────────────────────────────────────────────────────────── */

export async function listExhibitors(eventId: string): Promise<{ success: boolean; rows: Exhibitor[]; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("exhibitors")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    if (error) return { success: false, rows: [], error: error.message }
    return { success: true, rows: (data ?? []) as Exhibitor[] }
  } catch (err) {
    return { success: false, rows: [], error: (err as Error).message }
  }
}

export async function listExhibitorCategories(eventId: string): Promise<{ success: boolean; rows: ExhibitorCategory[]; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("event_exhibitor_categories")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    if (error) return { success: false, rows: [], error: error.message }
    return { success: true, rows: (data ?? []) as ExhibitorCategory[] }
  } catch (err) {
    return { success: false, rows: [], error: (err as Error).message }
  }
}

/* ── writes ───────────────────────────────────────────────────────── */

export async function upsertExhibitorCategory(
  eventId: string,
  patch: { id?: string; name: string; color?: string | null; sort_order?: number },
): Promise<{ success: boolean; row?: ExhibitorCategory; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const payload = {
      event_id: eventId,
      name: patch.name.trim(),
      color: patch.color ?? null,
      sort_order: patch.sort_order ?? 0,
    }
    if (patch.id) {
      const { data, error } = await admin
        .from("event_exhibitor_categories")
        .update(payload)
        .eq("id", patch.id)
        .eq("event_id", eventId)
        .select()
        .maybeSingle()
      if (error) return { success: false, error: error.message }
      const slug = await eventSlug(eventId)
      if (slug) safeRevalidate(`/events/${slug}`)
      return { success: true, row: (data as ExhibitorCategory | null) ?? undefined }
    }
    const { data, error } = await admin
      .from("event_exhibitor_categories")
      .insert(payload)
      .select()
      .maybeSingle()
    if (error) return { success: false, error: error.message }
    const slug = await eventSlug(eventId)
    if (slug) safeRevalidate(`/events/${slug}`)
    return { success: true, row: (data as ExhibitorCategory | null) ?? undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteExhibitorCategory(
  eventId: string, id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { error } = await admin
      .from("event_exhibitor_categories")
      .delete()
      .eq("id", id)
      .eq("event_id", eventId)
    if (error) return { success: false, error: error.message }
    const slug = await eventSlug(eventId)
    if (slug) safeRevalidate(`/events/${slug}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function upsertExhibitor(
  eventId: string,
  patch: {
    id?: string
    name: string
    logo_url?: string | null
    category?: string | null
    booth?: string | null
    description?: string | null
    website?: string | null
    sort_order?: number
  },
): Promise<{ success: boolean; row?: Exhibitor; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const payload = {
      event_id: eventId,
      name: patch.name.trim(),
      logo_url: patch.logo_url ?? null,
      category: patch.category ?? null,
      booth: patch.booth ?? null,
      description: patch.description ?? null,
      website: patch.website ?? null,
      sort_order: patch.sort_order ?? 0,
    }
    if (patch.id) {
      const { data, error } = await admin
        .from("exhibitors")
        .update(payload)
        .eq("id", patch.id)
        .eq("event_id", eventId)
        .select()
        .maybeSingle()
      if (error) return { success: false, error: error.message }
      const slug = await eventSlug(eventId)
      if (slug) safeRevalidate(`/events/${slug}`)
      return { success: true, row: (data as Exhibitor | null) ?? undefined }
    }
    const { data, error } = await admin
      .from("exhibitors")
      .insert(payload)
      .select()
      .maybeSingle()
    if (error) return { success: false, error: error.message }
    const slug = await eventSlug(eventId)
    if (slug) safeRevalidate(`/events/${slug}`)
    return { success: true, row: (data as Exhibitor | null) ?? undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteExhibitor(
  eventId: string, id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { error } = await admin
      .from("exhibitors")
      .delete()
      .eq("id", id)
      .eq("event_id", eventId)
    if (error) return { success: false, error: error.message }
    const slug = await eventSlug(eventId)
    if (slug) safeRevalidate(`/events/${slug}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function reorderExhibitors(
  eventId: string,
  idsInOrder: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    await Promise.all(
      idsInOrder.map((id, idx) =>
        Promise.resolve(
          admin.from("exhibitors")
            .update({ sort_order: idx * 10 })
            .eq("id", id)
            .eq("event_id", eventId),
        ),
      ),
    )
    const slug = await eventSlug(eventId)
    if (slug) safeRevalidate(`/events/${slug}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
