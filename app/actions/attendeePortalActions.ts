"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

async function getPublicClient() {
  const cookieStore = await cookies()
  return createClient(cookieStore)
}

/* ── 1. Lookup attendee by email ─────────────────────────────────────── */

export async function lookupAttendee(email: string, eventId?: string) {
  try {
    if (!email) {
      return { success: false, error: "Email is required.", attendee: null }
    }

    const supabase = await getPublicClient()

    let query = supabase
      .from("attendees")
      .select(
        `
        id, name, email, phone, company, designation,
        dietary_preference, linkedin_url, show_in_directory,
        status, registration_date, check_in_at,
        events(id, title, slug, start_date, end_date, venue, status)
      `
      )
      .eq("email", email.toLowerCase().trim())
      .in("status", ["registered", "confirmed", "checked_in"])

    if (eventId) {
      query = query.eq("event_id", eventId)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message, attendee: null }
    }

    if (!data || data.length === 0) {
      return { success: false, error: "No attendee found with this email.", attendee: null }
    }

    // Return first match if eventId was provided, otherwise return all
    if (eventId) {
      return { success: true, attendee: data[0], attendees: data }
    }

    return { success: true, attendee: data[0], attendees: data }
  } catch (err) {
    return { success: false, error: (err as Error).message, attendee: null }
  }
}

/* ── 2. Get attendee agenda (bookmarked sessions) ────────────────────── */

export async function getAttendeeAgenda(attendeeId: string) {
  try {
    if (!attendeeId) {
      return { success: false, error: "Attendee ID is required.", sessions: [] }
    }

    const supabase = await getPublicClient()

    const { data, error } = await supabase
      .from("session_bookmarks")
      .select(
        `
        id, created_at,
        sessions(id, title, description, start_time, end_time, track, room, session_type)
      `
      )
      .eq("attendee_id", attendeeId)
      .order("created_at", { ascending: true })

    if (error) {
      return { success: false, error: error.message, sessions: [] }
    }

    const sessions = (data ?? []).map((row) => {
      const s = row.sessions as unknown as {
        id: string
        title: string
        description: string | null
        start_time: string
        end_time: string
        track: string | null
        room: string | null
        session_type: string | null
      }
      return {
        bookmarkId: row.id,
        bookmarkedAt: row.created_at,
        ...s,
      }
    }).filter(Boolean)

    return { success: true, sessions }
  } catch (err) {
    return { success: false, error: (err as Error).message, sessions: [] }
  }
}

/* ── 3. Bookmark a session ───────────────────────────────────────────── */

export async function bookmarkSession(attendeeId: string, sessionId: string) {
  try {
    if (!attendeeId || !sessionId) {
      return { success: false, error: "Attendee ID and session ID are required." }
    }

    const supabase = await getPublicClient()

    const { data, error } = await supabase
      .from("session_bookmarks")
      .insert({
        attendee_id: attendeeId,
        session_id: sessionId,
      })
      .select()
      .single()

    if (error) {
      // Handle duplicate bookmark gracefully
      if (error.code === "23505") {
        return { success: false, error: "Session is already bookmarked." }
      }
      return { success: false, error: error.message }
    }

    revalidatePath("/attendee-portal", "page")
    return { success: true, bookmark: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 4. Remove a bookmark ────────────────────────────────────────────── */

export async function removeBookmark(attendeeId: string, sessionId: string) {
  try {
    if (!attendeeId || !sessionId) {
      return { success: false, error: "Attendee ID and session ID are required." }
    }

    const supabase = await getPublicClient()

    const { error } = await supabase
      .from("session_bookmarks")
      .delete()
      .eq("attendee_id", attendeeId)
      .eq("session_id", sessionId)

    if (error) return { success: false, error: error.message }

    revalidatePath("/attendee-portal", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 5. Update attendee profile ──────────────────────────────────────── */

export async function updateAttendeeProfile(
  attendeeId: string,
  data: {
    name?: string
    company?: string
    designation?: string
    phone?: string
    dietary_preference?: string
    linkedin_url?: string
    show_in_directory?: boolean
  }
) {
  try {
    if (!attendeeId) {
      return { success: false, error: "Attendee ID is required." }
    }

    const supabase = await getPublicClient()

    // Build update payload with only provided fields
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (data.name !== undefined) updatePayload.name = data.name
    if (data.company !== undefined) updatePayload.company = data.company || null
    if (data.designation !== undefined) updatePayload.designation = data.designation || null
    if (data.phone !== undefined) updatePayload.phone = data.phone || null
    if (data.dietary_preference !== undefined) updatePayload.dietary_preference = data.dietary_preference || null
    if (data.linkedin_url !== undefined) updatePayload.linkedin_url = data.linkedin_url || null
    if (data.show_in_directory !== undefined) updatePayload.show_in_directory = data.show_in_directory

    const { data: attendee, error } = await supabase
      .from("attendees")
      .update(updatePayload)
      .eq("id", attendeeId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath("/attendee-portal", "page")
    revalidatePath("/admin/attendees", "page")
    return { success: true, attendee }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 6. Send networking request ──────────────────────────────────────── */

export async function sendNetworkingRequest(data: {
  eventId: string
  fromAttendeeId: string
  toAttendeeId: string
  message?: string
}) {
  try {
    if (!data.eventId || !data.fromAttendeeId || !data.toAttendeeId) {
      return { success: false, error: "Event ID, sender, and recipient are required." }
    }

    if (data.fromAttendeeId === data.toAttendeeId) {
      return { success: false, error: "Cannot send a networking request to yourself." }
    }

    const supabase = await getPublicClient()

    // Check for existing pending request between these two attendees
    const { data: existing } = await supabase
      .from("networking_requests")
      .select("id")
      .eq("event_id", data.eventId)
      .eq("from_attendee_id", data.fromAttendeeId)
      .eq("to_attendee_id", data.toAttendeeId)
      .eq("status", "pending")
      .maybeSingle()

    if (existing) {
      return { success: false, error: "A pending request already exists." }
    }

    const { data: request, error } = await supabase
      .from("networking_requests")
      .insert({
        event_id: data.eventId,
        from_attendee_id: data.fromAttendeeId,
        to_attendee_id: data.toAttendeeId,
        message: data.message || null,
        status: "pending",
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath("/attendee-portal", "page")
    return { success: true, request }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 7. Respond to networking request ────────────────────────────────── */

export async function respondToNetworkingRequest(
  requestId: string,
  response: "accepted" | "declined",
  meetingTime?: string,
  meetingLocation?: string
) {
  try {
    if (!requestId || !response) {
      return { success: false, error: "Request ID and response are required." }
    }

    const supabase = await getPublicClient()

    const updatePayload: Record<string, unknown> = {
      status: response,
      responded_at: new Date().toISOString(),
    }

    if (meetingTime) updatePayload.meeting_time = meetingTime
    if (meetingLocation) updatePayload.meeting_location = meetingLocation

    const { data, error } = await supabase
      .from("networking_requests")
      .update(updatePayload)
      .eq("id", requestId)
      .eq("status", "pending")
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath("/attendee-portal", "page")
    return { success: true, request: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 8. Get networking requests ──────────────────────────────────────── */

export async function getNetworkingRequests(attendeeId: string) {
  try {
    if (!attendeeId) {
      return { success: false, error: "Attendee ID is required.", incoming: [], outgoing: [] }
    }

    const supabase = await getPublicClient()

    // Incoming requests (where this attendee is the recipient)
    const { data: incoming, error: inErr } = await supabase
      .from("networking_requests")
      .select(
        `
        id, event_id, message, status, meeting_time, meeting_location,
        created_at, responded_at,
        from_attendee:attendees!networking_requests_from_attendee_id_fkey(id, name, company, designation, linkedin_url)
      `
      )
      .eq("to_attendee_id", attendeeId)
      .order("created_at", { ascending: false })

    if (inErr) {
      return { success: false, error: inErr.message, incoming: [], outgoing: [] }
    }

    // Outgoing requests (where this attendee is the sender)
    const { data: outgoing, error: outErr } = await supabase
      .from("networking_requests")
      .select(
        `
        id, event_id, message, status, meeting_time, meeting_location,
        created_at, responded_at,
        to_attendee:attendees!networking_requests_to_attendee_id_fkey(id, name, company, designation, linkedin_url)
      `
      )
      .eq("from_attendee_id", attendeeId)
      .order("created_at", { ascending: false })

    if (outErr) {
      return { success: false, error: outErr.message, incoming: [], outgoing: [] }
    }

    return {
      success: true,
      incoming: incoming ?? [],
      outgoing: outgoing ?? [],
    }
  } catch (err) {
    return { success: false, error: (err as Error).message, incoming: [], outgoing: [] }
  }
}

/* ── 9. Get event directory ──────────────────────────────────────────── */

export async function getEventDirectory(eventId: string) {
  try {
    if (!eventId) {
      return { success: false, error: "Event ID is required.", delegates: [] }
    }

    const supabase = await getPublicClient()

    const { data, error } = await supabase
      .from("attendees")
      .select("id, name, company, designation, linkedin_url")
      .eq("event_id", eventId)
      .eq("show_in_directory", true)
      .in("status", ["registered", "confirmed", "checked_in"])
      .order("name")

    if (error) {
      return { success: false, error: error.message, delegates: [] }
    }

    return { success: true, delegates: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, delegates: [] }
  }
}

/* ── 10. Get session materials ───────────────────────────────────────── */

export async function getSessionMaterials(sessionId: string) {
  try {
    if (!sessionId) {
      return { success: false, error: "Session ID is required.", materials: [] }
    }

    const supabase = await getPublicClient()

    const { data, error } = await supabase
      .from("sessions")
      .select("id, title, materials")
      .eq("id", sessionId)
      .single()

    if (error) {
      return { success: false, error: error.message, materials: [] }
    }

    return {
      success: true,
      sessionTitle: data.title,
      materials: (data.materials as unknown[]) ?? [],
    }
  } catch (err) {
    return { success: false, error: (err as Error).message, materials: [] }
  }
}
