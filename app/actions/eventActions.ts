"use server"

/**
 * ─── EVENT SERVER ACTIONS ─────────────────────────────────────────────────
 *
 * All database mutations for events go through these Server Actions.
 * Every action calls revalidatePath() after writing to Supabase so
 * the public website reflects changes instantly — no stale cache.
 */

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

// ── Helper: get authenticated Supabase client ───────────────────────────
async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  return { supabase, user }
}

// ── Helper: invalidate all event-related caches ─────────────────────────
function invalidateEventCaches(slug?: string) {
  revalidatePath("/", "page")                // Homepage (featured events)
  revalidatePath("/events", "page")          // Public events listing
  revalidatePath("/admin/events", "page")    // Admin events table

  if (slug) {
    revalidatePath(`/events/${slug}`, "page") // Individual event page
  }
}

// ─── CREATE EVENT ────────────────────────────────────────────────────────

export async function createEvent(formData: FormData) {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    const title       = formData.get("title") as string
    const slug        = formData.get("slug") as string
    const startDate   = formData.get("startDate") as string
    const endDate     = formData.get("endDate") as string
    const venue       = formData.get("venue") as string
    const description = formData.get("description") as string

    if (!title || !slug || !startDate || !endDate || !venue) {
      return { success: false, error: "All required fields must be filled." }
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        title,
        slug,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        venue,
        description: description || null,
        status: "draft",
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    invalidateEventCaches(slug)
    return { success: true, event: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ─── UPDATE EVENT ────────────────────────────────────────────────────────

export async function updateEvent(eventId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Get old slug for cache invalidation if slug changed
    const { data: current } = await supabase
      .from("events")
      .select("slug")
      .eq("id", eventId)
      .single()

    const title       = formData.get("title") as string
    const slug        = formData.get("slug") as string
    const startDate   = formData.get("startDate") as string
    const endDate     = formData.get("endDate") as string
    const venue       = formData.get("venue") as string
    const description = formData.get("description") as string
    const status      = formData.get("status") as string

    if (!title || !slug || !startDate || !endDate || !venue) {
      return { success: false, error: "All required fields must be filled." }
    }

    const { data, error } = await supabase
      .from("events")
      .update({
        title,
        slug,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        venue,
        description: description || null,
        status: status || "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // Invalidate both old and new slugs if changed
    invalidateEventCaches(slug)
    if (current?.slug && current.slug !== slug) {
      revalidatePath(`/events/${current.slug}`, "page")
    }

    return { success: true, event: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ─── DELETE EVENT ────────────────────────────────────────────────────────

export async function deleteEvent(eventId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Get slug before deleting for cache invalidation
    const { data: event } = await supabase
      .from("events")
      .select("slug")
      .eq("id", eventId)
      .single()

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId)

    if (error) return { success: false, error: error.message }

    invalidateEventCaches(event?.slug)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
