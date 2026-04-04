"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

/**
 * Server Action: Create Event
 *
 * Creates a new event in Supabase and immediately invalidates related
 * Next.js caches to ensure the change appears instantly on the website.
 *
 * @param formData - FormData containing event details
 * @returns {Promise<{ success: boolean; error?: string; event?: any }>}
 */
export async function createEvent(formData: FormData) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Extract form data
    const title = formData.get("title") as string
    const slug = formData.get("slug") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string
    const venue = formData.get("venue") as string
    const description = formData.get("description") as string

    // Validate required fields
    if (!title || !slug || !startDate || !endDate || !venue) {
      return { success: false, error: "Missing required fields" }
    }

    // Insert into Supabase
    const { data: event, error } = await supabase
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

    if (error) {
      console.error("Supabase insert error:", error)
      return { success: false, error: error.message }
    }

    // ─── CRITICAL: Invalidate caches ────────────────────────────────────
    // These revalidatePath calls are ESSENTIAL for instant live updates.
    // They clear the Next.js cache for these routes immediately after insert.

    // Invalidate admin events list
    revalidatePath("/admin/events", "page")

    // Invalidate public events page (if it exists)
    revalidatePath("/events", "page")

    // Invalidate dynamic event page
    revalidatePath(`/events/${slug}`, "page")

    // Invalidate homepage (events might be featured there)
    revalidatePath("/", "page")

    return {
      success: true,
      event,
    }
  } catch (error) {
    console.error("Create event error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Server Action: Update Event
 *
 * Updates an existing event and invalidates caches for instant propagation
 * to the public website and admin dashboard.
 *
 * @param eventId - UUID of the event to update
 * @param formData - FormData with updated event details
 * @returns {Promise<{ success: boolean; error?: string; event?: any }>}
 */
export async function updateEvent(eventId: string, formData: FormData) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Extract form data
    const title = formData.get("title") as string
    const slug = formData.get("slug") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string
    const venue = formData.get("venue") as string
    const description = formData.get("description") as string
    const status = formData.get("status") as string

    // Validate required fields
    if (!title || !slug || !startDate || !endDate || !venue) {
      return { success: false, error: "Missing required fields" }
    }

    // Fetch the current event to get the old slug (for revalidation)
    const { data: currentEvent, error: fetchError } = await supabase
      .from("events")
      .select("slug")
      .eq("id", eventId)
      .single()

    if (fetchError) {
      return { success: false, error: "Event not found" }
    }

    const oldSlug = currentEvent.slug

    // Update in Supabase
    const { data: event, error } = await supabase
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

    if (error) {
      console.error("Supabase update error:", error)
      return { success: false, error: error.message }
    }

    // ─── CRITICAL: Invalidate all affected caches ───────────────────────
    // These cover both old and new slugs in case the slug changed.

    revalidatePath("/admin/events", "page")
    revalidatePath("/admin/events/[id]", "page")
    revalidatePath("/events", "page")

    // Invalidate both old and new slug routes
    if (oldSlug !== slug) {
      revalidatePath(`/events/${oldSlug}`, "page")
    }
    revalidatePath(`/events/${slug}`, "page")

    revalidatePath("/", "page")

    return {
      success: true,
      event,
    }
  } catch (error) {
    console.error("Update event error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Server Action: Delete Event
 *
 * Soft-delete or hard-delete an event (note: RLS policies allow authenticated
 * admins to delete). Cascade delete removes all associated tickets/speakers.
 *
 * @param eventId - UUID of the event to delete
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
export async function deleteEvent(eventId: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Fetch the event to get its slug for cache invalidation
    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("slug")
      .eq("id", eventId)
      .single()

    if (fetchError) {
      return { success: false, error: "Event not found" }
    }

    // Delete from Supabase
    const { error } = await supabase.from("events").delete().eq("id", eventId)

    if (error) {
      console.error("Supabase delete error:", error)
      return { success: false, error: error.message }
    }

    // ─── Invalidate affected caches ────────────────────────────────────

    revalidatePath("/admin/events", "page")
    revalidatePath("/events", "page")
    revalidatePath(`/events/${event.slug}`, "page")
    revalidatePath("/", "page")

    return { success: true }
  } catch (error) {
    console.error("Delete event error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
