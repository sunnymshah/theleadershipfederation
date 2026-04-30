"use server"

/**
 * Event Hotels CRUD (ITEM 7).
 *
 * Companion to the HotelsManager + HotelsListing block. Same pattern
 * as exhibitorActions: anon SELECT via RLS, super_admin writes.
 */

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission } from "@/lib/server-permissions"

export type EventHotel = {
  id: string
  event_id: string
  name: string
  image_url: string | null
  address: string | null
  distance_km: number | null
  price_range: string | null
  booking_url: string | null
  description: string | null
  sort_order: number
  created_at: string
}

async function eventSlug(eventId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from("events").select("slug").eq("id", eventId).maybeSingle()
  return (data?.slug as string | null) ?? null
}

function safeRevalidate(path: string) { try { revalidatePath(path) } catch {} }

export async function listHotels(eventId: string): Promise<{ success: boolean; rows: EventHotel[]; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("event_hotels")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    if (error) return { success: false, rows: [], error: error.message }
    return { success: true, rows: (data ?? []) as EventHotel[] }
  } catch (err) {
    return { success: false, rows: [], error: (err as Error).message }
  }
}

export async function upsertHotel(
  eventId: string,
  patch: {
    id?: string
    name: string
    image_url?: string | null
    address?: string | null
    distance_km?: number | null
    price_range?: string | null
    booking_url?: string | null
    description?: string | null
    sort_order?: number
  },
): Promise<{ success: boolean; row?: EventHotel; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const payload = {
      event_id: eventId,
      name: patch.name.trim(),
      image_url: patch.image_url ?? null,
      address: patch.address ?? null,
      distance_km: patch.distance_km ?? null,
      price_range: patch.price_range ?? null,
      booking_url: patch.booking_url ?? null,
      description: patch.description ?? null,
      sort_order: patch.sort_order ?? 0,
    }
    if (patch.id) {
      const { data, error } = await admin
        .from("event_hotels")
        .update(payload)
        .eq("id", patch.id)
        .eq("event_id", eventId)
        .select()
        .maybeSingle()
      if (error) return { success: false, error: error.message }
      const slug = await eventSlug(eventId)
      if (slug) safeRevalidate(`/events/${slug}`)
      return { success: true, row: (data as EventHotel | null) ?? undefined }
    }
    const { data, error } = await admin
      .from("event_hotels")
      .insert(payload)
      .select()
      .maybeSingle()
    if (error) return { success: false, error: error.message }
    const slug = await eventSlug(eventId)
    if (slug) safeRevalidate(`/events/${slug}`)
    return { success: true, row: (data as EventHotel | null) ?? undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteHotel(
  eventId: string, id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { error } = await admin
      .from("event_hotels")
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
