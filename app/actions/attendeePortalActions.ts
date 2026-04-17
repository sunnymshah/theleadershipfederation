"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { isValidUUID } from "@/lib/security"

async function getPublicClient() {
  const cookieStore = await cookies()
  return createClient(cookieStore)
}

/**
 * Verify that the caller owns `attendeeId` by presenting the matching
 * qr_token. This is the capability check for every mutation in this
 * file — without it any client-supplied attendee UUID could take over
 * the row (edit the profile, respond to networking requests as the
 * victim, etc.). The qr_token is 24 random bytes issued per attendee
 * and delivered by email at registration, so knowledge of the token
 * is treated as proof of control of the mailbox.
 */
async function assertAttendeeOwnership(
  attendeeId: string,
  qrToken: string | null | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!attendeeId || !isValidUUID(attendeeId)) {
    return { ok: false, error: "Attendee ID is required." }
  }
  if (!qrToken || typeof qrToken !== "string" || qrToken.length < 8 || qrToken.length > 128) {
    return { ok: false, error: "Unauthorized." }
  }
  const supabase = await getPublicClient()
  const { data } = await supabase
    .from("attendees")
    .select("id, qr_token")
    .eq("id", attendeeId)
    .maybeSingle()
  if (!data || !data.qr_token || data.qr_token !== qrToken) {
    return { ok: false, error: "Unauthorized." }
  }
  return { ok: true }
}

/* ── 1. Lookup attendee by email ─────────────────────────────────────── */

export async function lookupAttendee(email: string, eventId?: string) {
  try {
    if (!email || typeof email !== "string") {
      return { success: false, error: "Email is required.", attendee: null }
    }
    // Validate shape + reject ILIKE wildcards. The column is queried with
    // `.eq()` here so `%`/`_` are literal, but we also pass this email
    // back to the client and any downstream `ilike()` elsewhere would
    // be vulnerable to enumeration.
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Please enter a valid email address.", attendee: null }
    }
    if (/[%_\\]/.test(email)) {
      return { success: false, error: "Please enter a valid email address.", attendee: null }
    }

    const supabase = await getPublicClient()

    let query = supabase
      .from("attendees")
      .select(
        `
        id, name, email, phone, company, designation,
        dietary_preference, linkedin_url, show_in_directory,
        status, registration_date, check_in_at, qr_token,
        events(id, title, slug, start_date, end_date, venue, status)
      `
      )
      .eq("email", email.toLowerCase().trim())
      .in("status", ["registered", "confirmed", "checked_in"])

    if (eventId) {
      if (!isValidUUID(eventId)) {
        return { success: false, error: "Invalid event ID.", attendee: null }
      }
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

export async function getAttendeeAgenda(attendeeId: string, qrToken: string) {
  try {
    const auth = await assertAttendeeOwnership(attendeeId, qrToken)
    if (!auth.ok) return { success: false, error: auth.error, sessions: [] }

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

export async function bookmarkSession(
  attendeeId: string,
  sessionId: string,
  qrToken: string,
) {
  try {
    const auth = await assertAttendeeOwnership(attendeeId, qrToken)
    if (!auth.ok) return { success: false, error: auth.error }
    if (!sessionId || !isValidUUID(sessionId)) {
      return { success: false, error: "Session ID is required." }
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

export async function removeBookmark(
  attendeeId: string,
  sessionId: string,
  qrToken: string,
) {
  try {
    const auth = await assertAttendeeOwnership(attendeeId, qrToken)
    if (!auth.ok) return { success: false, error: auth.error }
    if (!sessionId || !isValidUUID(sessionId)) {
      return { success: false, error: "Session ID is required." }
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
  qrToken: string,
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
    const auth = await assertAttendeeOwnership(attendeeId, qrToken)
    if (!auth.ok) return { success: false, error: auth.error }

    const supabase = await getPublicClient()

    // Build update payload with only provided fields. Only the fields
    // explicitly allowed here may be written — an attacker supplying
    // extra keys in `data` can't escalate to writing status, qr_token,
    // payment_status, etc.
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (data.name !== undefined) updatePayload.name = String(data.name).slice(0, 200)
    if (data.company !== undefined) updatePayload.company = data.company ? String(data.company).slice(0, 200) : null
    if (data.designation !== undefined) updatePayload.designation = data.designation ? String(data.designation).slice(0, 200) : null
    if (data.phone !== undefined) updatePayload.phone = data.phone ? String(data.phone).slice(0, 50) : null
    if (data.dietary_preference !== undefined) updatePayload.dietary_preference = data.dietary_preference ? String(data.dietary_preference).slice(0, 100) : null
    if (data.linkedin_url !== undefined) {
      const raw = data.linkedin_url ? String(data.linkedin_url).trim() : ""
      if (raw && !/^https:\/\/([a-z]{2,3}\.)?linkedin\.com\//i.test(raw)) {
        return { success: false, error: "LinkedIn URL must start with https://linkedin.com/ or https://www.linkedin.com/." }
      }
      updatePayload.linkedin_url = raw || null
    }
    if (data.show_in_directory !== undefined) updatePayload.show_in_directory = Boolean(data.show_in_directory)

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
  fromQrToken: string
  toAttendeeId: string
  message?: string
}) {
  try {
    if (!data.eventId || !data.fromAttendeeId || !data.toAttendeeId) {
      return { success: false, error: "Event ID, sender, and recipient are required." }
    }
    if (!isValidUUID(data.eventId) || !isValidUUID(data.fromAttendeeId) || !isValidUUID(data.toAttendeeId)) {
      return { success: false, error: "Invalid ID." }
    }

    if (data.fromAttendeeId === data.toAttendeeId) {
      return { success: false, error: "Cannot send a networking request to yourself." }
    }

    const auth = await assertAttendeeOwnership(data.fromAttendeeId, data.fromQrToken)
    if (!auth.ok) return { success: false, error: auth.error }

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
        message: data.message ? String(data.message).slice(0, 500) : null,
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
  attendeeId: string,
  qrToken: string,
  response: "accepted" | "declined",
  meetingTime?: string,
  meetingLocation?: string
) {
  try {
    if (!requestId || !isValidUUID(requestId) || !response) {
      return { success: false, error: "Request ID and response are required." }
    }
    if (response !== "accepted" && response !== "declined") {
      return { success: false, error: "Invalid response." }
    }
    const auth = await assertAttendeeOwnership(attendeeId, qrToken)
    if (!auth.ok) return { success: false, error: auth.error }

    const supabase = await getPublicClient()

    const updatePayload: Record<string, unknown> = {
      status: response,
      responded_at: new Date().toISOString(),
    }

    if (meetingTime) updatePayload.meeting_time = meetingTime
    if (meetingLocation) updatePayload.meeting_location = String(meetingLocation).slice(0, 200)

    const { data, error } = await supabase
      .from("networking_requests")
      .update(updatePayload)
      .eq("id", requestId)
      // Scope the update to requests addressed TO this attendee. Without
      // this clause a holder of any valid (attendeeId, qr_token) pair
      // could resolve strangers' pending requests.
      .eq("to_attendee_id", attendeeId)
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

export async function getNetworkingRequests(attendeeId: string, qrToken: string) {
  try {
    const auth = await assertAttendeeOwnership(attendeeId, qrToken)
    if (!auth.ok) return { success: false, error: auth.error, incoming: [], outgoing: [] }

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
    if (!eventId || !isValidUUID(eventId)) {
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
    if (!sessionId || !isValidUUID(sessionId)) {
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
