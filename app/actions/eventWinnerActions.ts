"use server"

/**
 * ─── EVENT WINNER ACTIONS ───────────────────────────────────────────────
 *
 * Server actions for the `event_winners` table — award winners shown
 * inline on each event's public page. Replaces the old
 * `award_editions` / `award_winners` tables from the legacy standalone
 * /winners page.
 *
 * Shape: { success, error?, winners?, winner? }
 */

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createStaticClient } from "@/utils/supabase/static"

async function getAuthedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return supabase
}

async function invalidate(eventId: string) {
  revalidatePath(`/admin/events/${eventId}`)
  const supabase = createStaticClient()
  const { data: event } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .single()
  if (event?.slug) revalidatePath(`/events/${event.slug}`)
}

export interface EventWinner {
  id: string
  event_id: string
  name: string
  company: string | null
  designation: string | null
  award_category: string | null
  image_url: string | null
  linkedin_url: string | null
  sort_order: number
  created_at: string
}

export async function listEventWinners(eventId: string) {
  try {
    // Public reads use cookie-free client so this stays cache-friendly.
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from("event_winners")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    if (error) return { success: false, error: error.message, winners: [] }
    return { success: true, winners: (data ?? []) as EventWinner[] }
  } catch (err) {
    return { success: false, error: (err as Error).message, winners: [] }
  }
}

function str(fd: FormData, key: string): string | null {
  const raw = fd.get(key)
  if (raw === null || raw === undefined) return null
  const s = String(raw).trim()
  return s.length === 0 ? null : s
}

function int(fd: FormData, key: string, fallback = 0): number {
  const raw = fd.get(key)
  if (raw === null || raw === undefined) return fallback
  const n = parseInt(String(raw), 10)
  return Number.isFinite(n) ? n : fallback
}

export async function createEventWinner(formData: FormData) {
  try {
    const supabase = await getAuthedClient()
    const event_id = str(formData, "event_id")
    const name = str(formData, "name")
    if (!event_id || !name) return { success: false, error: "Event and name are required." }

    const { data, error } = await supabase
      .from("event_winners")
      .insert({
        event_id,
        name,
        company: str(formData, "company"),
        designation: str(formData, "designation"),
        award_category: str(formData, "award_category"),
        image_url: str(formData, "image_url"),
        linkedin_url: str(formData, "linkedin_url"),
        sort_order: int(formData, "sort_order", 0),
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    await invalidate(event_id)
    return { success: true, winner: data as EventWinner }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateEventWinner(id: string, formData: FormData) {
  try {
    const supabase = await getAuthedClient()
    const event_id = str(formData, "event_id")
    const name = str(formData, "name")
    if (!event_id || !name) return { success: false, error: "Event and name are required." }

    const { data, error } = await supabase
      .from("event_winners")
      .update({
        name,
        company: str(formData, "company"),
        designation: str(formData, "designation"),
        award_category: str(formData, "award_category"),
        image_url: str(formData, "image_url"),
        linkedin_url: str(formData, "linkedin_url"),
        sort_order: int(formData, "sort_order", 0),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    await invalidate(event_id)
    return { success: true, winner: data as EventWinner }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteEventWinner(id: string, eventId: string) {
  try {
    const supabase = await getAuthedClient()
    const { error } = await supabase.from("event_winners").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    await invalidate(eventId)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
