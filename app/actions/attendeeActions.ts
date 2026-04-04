"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { sendConfirmationEmail } from "@/app/actions/emailActions"

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

    const eventId     = formData.get("eventId") as string
    const ticketId    = formData.get("ticketId") as string
    const name        = formData.get("name") as string
    const email       = formData.get("email") as string
    const phone       = formData.get("phone") as string
    const company     = formData.get("company") as string
    const designation = formData.get("designation") as string
    const notes       = formData.get("notes") as string

    if (!eventId || !name || !email) {
      return { success: false, error: "Event, name, and email are required." }
    }

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
      .select("event_id")
      .eq("id", attendeeId)
      .single()

    const name        = formData.get("name") as string
    const email       = formData.get("email") as string
    const phone       = formData.get("phone") as string
    const company     = formData.get("company") as string
    const designation = formData.get("designation") as string
    const status      = formData.get("status") as string
    const notes       = formData.get("notes") as string

    if (!name || !email) return { success: false, error: "Name and email are required." }

    const { data, error } = await supabase
      .from("attendees")
      .update({
        name,
        email,
        phone: phone || null,
        company: company || null,
        designation: designation || null,
        status: status || "registered",
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
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
      .select("event_id")
      .eq("id", attendeeId)
      .single()

    const { error } = await supabase.from("attendees").delete().eq("id", attendeeId)
    if (error) return { success: false, error: error.message }
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
