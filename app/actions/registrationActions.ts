"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { randomBytes } from "crypto"

export async function registerForEvent(formData: FormData) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const eventId     = formData.get("eventId") as string
    const ticketId    = formData.get("ticketId") as string
    const name        = formData.get("name") as string
    const email       = formData.get("email") as string
    const phone       = formData.get("phone") as string
    const company     = formData.get("company") as string
    const designation = formData.get("designation") as string

    if (!eventId || !name || !email) {
      return { success: false, error: "Name and email are required." }
    }

    // Check ticket availability
    if (ticketId) {
      const { data: ticket } = await supabase
        .from("tickets")
        .select("sold, inventory_limit")
        .eq("id", ticketId)
        .single()

      if (ticket && ticket.sold >= ticket.inventory_limit) {
        return { success: false, error: "Sorry, this ticket is sold out." }
      }
    }

    // Check for duplicate registration
    const { data: existing } = await supabase
      .from("attendees")
      .select("id")
      .eq("event_id", eventId)
      .eq("email", email)
      .single()

    if (existing) {
      return { success: false, error: "You are already registered for this event." }
    }

    // Generate unique QR token
    const qrToken = randomBytes(24).toString("hex")

    // Create attendee
    const { data: attendee, error: insertError } = await supabase
      .from("attendees")
      .insert({
        event_id: eventId,
        ticket_id: ticketId || null,
        name,
        email,
        phone: phone || null,
        company: company || null,
        designation: designation || null,
        qr_token: qrToken,
        status: "registered",
      })
      .select()
      .single()

    if (insertError) return { success: false, error: insertError.message }

    // Increment ticket sold count
    if (ticketId) {
      const { data: ticket } = await supabase
        .from("tickets")
        .select("sold")
        .eq("id", ticketId)
        .single()

      if (ticket) {
        await supabase
          .from("tickets")
          .update({ sold: ticket.sold + 1 })
          .eq("id", ticketId)
      }
    }

    // Revalidate pages
    revalidatePath("/events", "page")
    revalidatePath("/admin/attendees", "page")
    revalidatePath("/admin", "page")

    return { success: true, attendee }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function verifyQrToken(qrToken: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: attendee, error } = await supabase
      .from("attendees")
      .select("*, events(title, venue, start_date), tickets(name)")
      .eq("qr_token", qrToken)
      .single()

    if (error || !attendee) {
      return { success: false, error: "Invalid QR code. No registration found." }
    }

    if (attendee.status === "checked_in") {
      return {
        success: false,
        error: `Already checked in at ${new Date(attendee.check_in_at).toLocaleString("en-IN")}`,
        attendee,
      }
    }

    if (attendee.status === "cancelled") {
      return { success: false, error: "This registration has been cancelled.", attendee }
    }

    // Check in the attendee
    const { error: updateError } = await supabase
      .from("attendees")
      .update({
        status: "checked_in",
        check_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", attendee.id)

    if (updateError) return { success: false, error: updateError.message }

    revalidatePath("/admin/attendees", "page")
    revalidatePath("/admin", "page")

    return { success: true, attendee: { ...attendee, status: "checked_in" } }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
