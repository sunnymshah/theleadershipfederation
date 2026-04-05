"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

function invalidateAll() {
  revalidatePath("/admin/attendees", "page")
  revalidatePath("/admin/events", "page")
  revalidatePath("/admin", "page")
  revalidatePath("/events", "page")
}

/**
 * Promote a specific waitlisted attendee to registered status.
 * - Changes status from 'waitlisted' to 'registered'
 * - Clears waitlist_position
 * - Sets promoted_at
 * - Increments ticket.sold
 */
export async function promoteFromWaitlist(attendeeId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch attendee
    const { data: attendee, error: fetchErr } = await supabase
      .from("attendees")
      .select("id, status, ticket_id, name, email, event_id")
      .eq("id", attendeeId)
      .single()

    if (fetchErr || !attendee) {
      return { success: false, error: "Attendee not found." }
    }

    if (attendee.status !== "waitlisted") {
      return { success: false, error: "Attendee is not on the waitlist." }
    }

    // Update attendee: promote
    const { error: updateErr } = await supabase
      .from("attendees")
      .update({
        status: "registered",
        waitlist_position: null,
        promoted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", attendeeId)

    if (updateErr) return { success: false, error: updateErr.message }

    // Increment ticket sold count
    if (attendee.ticket_id) {
      const { data: ticket } = await supabase
        .from("tickets")
        .select("sold")
        .eq("id", attendee.ticket_id)
        .single()

      if (ticket) {
        await supabase
          .from("tickets")
          .update({ sold: ticket.sold + 1 })
          .eq("id", attendee.ticket_id)
      }
    }

    // TODO: Replace with real notification (email/SMS)
    console.log(
      `[Waitlist] Promoted attendee "${attendee.name}" (${attendee.email}) from waitlist to registered.`
    )

    invalidateAll()

    return { success: true, attendee }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * When a spot opens up for a ticket, automatically promote the
 * next person in line (lowest waitlist_position).
 */
export async function autoPromoteNext(ticketId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Find the next waitlisted attendee for this ticket
    const { data: next, error: fetchErr } = await supabase
      .from("attendees")
      .select("id, name, email, ticket_id, event_id")
      .eq("ticket_id", ticketId)
      .eq("status", "waitlisted")
      .order("waitlist_position", { ascending: true })
      .limit(1)
      .single()

    if (fetchErr || !next) {
      // No one on waitlist — that's fine
      return { success: true, promoted: null }
    }

    // Promote them
    const result = await promoteFromWaitlist(next.id)

    if (result.success) {
      return { success: true, promoted: next }
    }

    return result
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Get all waitlisted attendees for an event, ordered by position.
 */
export async function getWaitlist(eventId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("attendees")
      .select("*, tickets(name)")
      .eq("event_id", eventId)
      .eq("status", "waitlisted")
      .order("waitlist_position", { ascending: true })

    if (error) return { success: false, error: error.message, data: [] }

    return { success: true, data: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, data: [] }
  }
}

/**
 * Cancel an attendee and auto-promote the next waitlisted person
 * for the same ticket.
 */
export async function cancelAndPromote(attendeeId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch attendee to get ticket_id
    const { data: attendee, error: fetchErr } = await supabase
      .from("attendees")
      .select("id, ticket_id, status, event_id")
      .eq("id", attendeeId)
      .single()

    if (fetchErr || !attendee) {
      return { success: false, error: "Attendee not found." }
    }

    if (attendee.status === "cancelled") {
      return { success: false, error: "Attendee is already cancelled." }
    }

    // Cancel the attendee
    const { error: updateErr } = await supabase
      .from("attendees")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", attendeeId)

    if (updateErr) return { success: false, error: updateErr.message }

    // Decrement ticket sold count
    if (attendee.ticket_id) {
      const { data: ticket } = await supabase
        .from("tickets")
        .select("sold")
        .eq("id", attendee.ticket_id)
        .single()

      if (ticket && ticket.sold > 0) {
        await supabase
          .from("tickets")
          .update({ sold: ticket.sold - 1 })
          .eq("id", attendee.ticket_id)
      }
    }

    // Auto-promote next in line
    let promoted: { id: string; name: string; email: string } | null = null
    if (attendee.ticket_id) {
      const promoResult = await autoPromoteNext(attendee.ticket_id)
      if (promoResult.success && "promoted" in promoResult && promoResult.promoted) {
        promoted = promoResult.promoted
      }
    }

    invalidateAll()

    return { success: true, promoted }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
