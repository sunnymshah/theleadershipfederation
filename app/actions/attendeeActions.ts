"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { sendConfirmationEmail } from "@/app/actions/emailActions"
import { autoPromoteNext } from "@/app/actions/waitlistActions"

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

async function invalidateCaches(supabase: ReturnType<typeof createClient>, eventId: string) {
  revalidatePath("/admin/attendees", "page")
  revalidatePath("/admin/events", "page")
  revalidatePath("/admin", "page")
  revalidatePath(`/admin/events/${eventId}`, "page")

  const { data: event } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .single()

  if (event?.slug) {
    revalidatePath(`/events/${event.slug}`, "page")
  }
  revalidatePath("/events", "page")
  revalidatePath("/", "layout")
}

export async function createAttendee(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const eventId           = formData.get("eventId") as string
    const ticketId          = formData.get("ticketId") as string
    const name              = formData.get("name") as string
    const email             = formData.get("email") as string
    const phone             = formData.get("phone") as string
    const company           = formData.get("company") as string
    const designation       = formData.get("designation") as string
    const notes             = formData.get("notes") as string
    const tagsRaw           = formData.get("tags") as string
    const internalNotes     = formData.get("internal_notes") as string
    const dietaryPreference = formData.get("dietary_preference") as string
    const vipLevel          = formData.get("vip_level") as string

    if (!eventId || !name || !email) {
      return { success: false, error: "Event, name, and email are required." }
    }

    const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : []

    const { data, error } = await supabase
      .from("attendees")
      .insert({
        event_id: eventId,
        ticket_id: ticketId || null,
        name,
        email,
        phone: phone || null,
        company: company || null,
        designation: designation || null,
        notes: notes || null,
        tags: tags.length > 0 ? tags : [],
        internal_notes: internalNotes || null,
        dietary_preference: dietaryPreference || null,
        vip_level: vipLevel || null,
        status: "registered",
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    if (ticketId) {
      const { data: ticket } = await supabase.from("tickets").select("sold").eq("id", ticketId).single()
      if (ticket) {
        await supabase.from("tickets").update({ sold: ticket.sold + 1 }).eq("id", ticketId)
      }
    }

    await invalidateCaches(supabase, eventId)
    return { success: true, attendee: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateAttendee(attendeeId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: existing } = await supabase
      .from("attendees")
      .select("event_id, ticket_id, status")
      .eq("id", attendeeId)
      .single()

    const name              = formData.get("name") as string
    const email             = formData.get("email") as string
    const phone             = formData.get("phone") as string
    const company           = formData.get("company") as string
    const designation       = formData.get("designation") as string
    const status            = formData.get("status") as string
    const notes             = formData.get("notes") as string
    const tagsRaw           = formData.get("tags") as string
    const internalNotes     = formData.get("internal_notes") as string
    const dietaryPreference = formData.get("dietary_preference") as string
    const vipLevel          = formData.get("vip_level") as string
    const linkedinUrl       = formData.get("linkedin_url") as string

    if (!name || !email) return { success: false, error: "Name and email are required." }

    const newStatus = status || "registered"
    const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : []

    const { data, error } = await supabase
      .from("attendees")
      .update({
        name,
        email,
        phone: phone || null,
        company: company || null,
        designation: designation || null,
        status: newStatus,
        notes: notes || null,
        tags: tags,
        internal_notes: internalNotes || null,
        dietary_preference: dietaryPreference || null,
        vip_level: vipLevel || null,
        linkedin_url: linkedinUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attendeeId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // If status changed to 'cancelled' and attendee had a ticket,
    // decrement sold count and auto-promote next from waitlist
    if (
      newStatus === "cancelled" &&
      existing?.status !== "cancelled" &&
      existing?.ticket_id
    ) {
      const { data: ticket } = await supabase
        .from("tickets")
        .select("sold")
        .eq("id", existing.ticket_id)
        .single()

      if (ticket && ticket.sold > 0) {
        await supabase
          .from("tickets")
          .update({ sold: ticket.sold - 1 })
          .eq("id", existing.ticket_id)
      }

      try {
        await autoPromoteNext(existing.ticket_id)
      } catch {
        console.error("[Waitlist] Auto-promote failed after status change to cancelled")
      }
    }

    if (existing?.event_id) await invalidateCaches(supabase, existing.event_id)
    return { success: true, attendee: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function checkInAttendee(attendeeId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: existing } = await supabase
      .from("attendees")
      .select("event_id")
      .eq("id", attendeeId)
      .single()

    const { data, error } = await supabase
      .from("attendees")
      .update({ status: "checked_in", check_in_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", attendeeId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    if (existing?.event_id) await invalidateCaches(supabase, existing.event_id)
    return { success: true, attendee: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteAttendee(attendeeId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: existing } = await supabase
      .from("attendees")
      .select("event_id, ticket_id, status")
      .eq("id", attendeeId)
      .single()

    const { error } = await supabase.from("attendees").delete().eq("id", attendeeId)
    if (error) return { success: false, error: error.message }

    // If the deleted attendee was registered/confirmed/checked_in and had a ticket,
    // decrement ticket sold and auto-promote next waitlisted person
    if (
      existing?.ticket_id &&
      existing.status !== "cancelled" &&
      existing.status !== "waitlisted"
    ) {
      const { data: ticket } = await supabase
        .from("tickets")
        .select("sold")
        .eq("id", existing.ticket_id)
        .single()

      if (ticket && ticket.sold > 0) {
        await supabase
          .from("tickets")
          .update({ sold: ticket.sold - 1 })
          .eq("id", existing.ticket_id)
      }

      // Auto-promote next waitlisted person
      try {
        await autoPromoteNext(existing.ticket_id)
      } catch {
        // Non-critical: log but don't fail the delete
        console.error("[Waitlist] Auto-promote failed after delete")
      }
    }

    if (existing?.event_id) await invalidateCaches(supabase, existing.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function sendAttendeeConfirmation(attendeeId: string) {
  try {
    const result = await sendConfirmationEmail(attendeeId)

    if (result.success) {
      // Revalidate attendee pages so the confirmation_sent_at timestamp is reflected
      revalidatePath("/admin/attendees", "page")
      revalidatePath("/admin", "page")
    }

    return result
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Bulk Actions ──────────────────────────────────────────────────── */

export async function bulkCheckIn(attendeeIds: string[]) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const now = new Date().toISOString()
    const { error } = await supabase
      .from("attendees")
      .update({ status: "checked_in", check_in_at: now, updated_at: now })
      .in("id", attendeeIds)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/attendees", "page")
    revalidatePath("/admin", "page")
    return { success: true, count: attendeeIds.length }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function bulkSendEmail(attendeeIds: string[]) {
  try {
    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const id of attendeeIds) {
      const result = await sendConfirmationEmail(id)
      if (result.success) {
        sent++
      } else {
        failed++
        errors.push(result.error || `Failed for ${id}`)
      }
      // Small delay to respect rate limits
      if (attendeeIds.length > 5) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    revalidatePath("/admin/attendees", "page")
    revalidatePath("/admin", "page")
    return { success: failed === 0, sent, failed, errors }
  } catch (err) {
    return { success: false, sent: 0, failed: 0, errors: [(err as Error).message] }
  }
}

export async function bulkDelete(attendeeIds: string[]) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch attendees to decrement ticket counts
    const { data: attendeesToDelete } = await supabase
      .from("attendees")
      .select("id, event_id, ticket_id, status")
      .in("id", attendeeIds)

    if (!attendeesToDelete) {
      return { success: false, error: "No attendees found." }
    }

    // Compute ticket decrements for active (non-cancelled/non-waitlisted) attendees
    const ticketDecrements: Record<string, number> = {}
    for (const a of attendeesToDelete) {
      if (a.ticket_id && a.status !== "cancelled" && a.status !== "waitlisted") {
        ticketDecrements[a.ticket_id] = (ticketDecrements[a.ticket_id] || 0) + 1
      }
    }

    // Delete attendees
    const { error } = await supabase
      .from("attendees")
      .delete()
      .in("id", attendeeIds)

    if (error) return { success: false, error: error.message }

    // Decrement ticket sold counts
    for (const [ticketId, count] of Object.entries(ticketDecrements)) {
      const { data: ticket } = await supabase
        .from("tickets")
        .select("sold")
        .eq("id", ticketId)
        .single()

      if (ticket && ticket.sold > 0) {
        await supabase
          .from("tickets")
          .update({ sold: Math.max(0, ticket.sold - count) })
          .eq("id", ticketId)
      }
    }

    // Invalidate caches for all affected events
    const eventIds = [...new Set(attendeesToDelete.map(a => a.event_id))]
    for (const eid of eventIds) {
      await invalidateCaches(supabase, eid)
    }

    return { success: true, count: attendeesToDelete.length }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function bulkUpdateStatus(attendeeIds: string[], status: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { error } = await supabase
      .from("attendees")
      .update({ status, updated_at: new Date().toISOString() })
      .in("id", attendeeIds)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/attendees", "page")
    revalidatePath("/admin", "page")
    return { success: true, count: attendeeIds.length }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function exportAttendeesCSV(eventId?: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    let query = supabase
      .from("attendees")
      .select("*, events(title), tickets(name)")
      .order("registration_date", { ascending: false })

    if (eventId) {
      query = query.eq("event_id", eventId)
    }

    const { data, error } = await query

    if (error) return { success: false, error: error.message, csv: "" }

    const headers = ["Name", "Email", "Phone", "Company", "Designation", "Event", "Ticket", "Status", "VIP Level", "Tags", "Check-in", "Registration Date"]
    const rows = (data || []).map((a: Record<string, unknown>) => {
      const events = a.events as { title: string } | null
      const tickets = a.tickets as { name: string } | null
      return [
        a.name as string || "",
        a.email as string || "",
        (a.phone as string) ?? "",
        (a.company as string) ?? "",
        (a.designation as string) ?? "",
        events?.title ?? "",
        tickets?.name ?? "",
        a.status as string || "",
        (a.vip_level as string) ?? "",
        Array.isArray(a.tags) ? (a.tags as string[]).join("; ") : "",
        (a.check_in_at as string) ?? "",
        (a.registration_date as string) ?? "",
      ]
    })

    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    return { success: true, csv }
  } catch (err) {
    return { success: false, error: (err as Error).message, csv: "" }
  }
}
