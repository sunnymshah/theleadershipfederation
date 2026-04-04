"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

/**
 * Look up an attendee by their unique QR token.
 * Returns attendee details, event name, and ticket name.
 */
export async function lookupByQrToken(qrToken: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: attendee, error } = await supabase
      .from("attendees")
      .select("*, events(title, venue, start_date), tickets(name)")
      .eq("qr_token", qrToken)
      .single()

    if (error || !attendee) {
      return { success: false, error: "Invalid QR code. No registration found.", attendee: null }
    }

    return { success: true, attendee, error: null }
  } catch (err) {
    return { success: false, error: (err as Error).message, attendee: null }
  }
}

/**
 * Mark an attendee as checked in.
 * Sets check_in_at to now and updates status to 'checked_in'.
 * Returns error if the attendee is already checked in.
 */
export async function checkInAttendee(attendeeId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch current status
    const { data: existing, error: fetchError } = await supabase
      .from("attendees")
      .select("id, event_id, status, check_in_at")
      .eq("id", attendeeId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: "Attendee not found." }
    }

    if (existing.status === "checked_in") {
      return {
        success: false,
        error: `Already checked in at ${new Date(existing.check_in_at).toLocaleString("en-IN")}`,
      }
    }

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("attendees")
      .update({
        status: "checked_in",
        check_in_at: now,
        updated_at: now,
      })
      .eq("id", attendeeId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // Invalidate relevant caches
    revalidatePath("/admin/check-in", "page")
    revalidatePath("/admin/attendees", "page")
    revalidatePath("/admin", "page")
    if (existing.event_id) {
      revalidatePath(`/admin/events/${existing.event_id}`, "page")
    }

    return { success: true, attendee: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Get check-in statistics for a given event.
 * Returns { total, checkedIn, pending }.
 */
export async function getCheckInStats(eventId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { count: total } = await supabase
      .from("attendees")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)

    const { count: checkedIn } = await supabase
      .from("attendees")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "checked_in")

    return {
      success: true,
      stats: {
        total: total ?? 0,
        checkedIn: checkedIn ?? 0,
        pending: (total ?? 0) - (checkedIn ?? 0),
      },
    }
  } catch (err) {
    return { success: false, error: (err as Error).message, stats: { total: 0, checkedIn: 0, pending: 0 } }
  }
}

/**
 * Get active/published events for the event selector dropdown.
 */
export async function getActiveEvents() {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("events")
      .select("id, title, slug, start_date, status")
      .in("status", ["published", "draft"])
      .order("start_date", { ascending: false })

    if (error) return { success: false, error: error.message, events: [] }

    return { success: true, events: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, events: [] }
  }
}

/**
 * Get recent check-ins for an event (last 10).
 */
export async function getRecentCheckIns(eventId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("attendees")
      .select("id, name, email, company, check_in_at, tickets(name)")
      .eq("event_id", eventId)
      .eq("status", "checked_in")
      .order("check_in_at", { ascending: false })
      .limit(10)

    if (error) return { success: false, error: error.message, checkIns: [] }

    return { success: true, checkIns: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, checkIns: [] }
  }
}
