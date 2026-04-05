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

async function invalidateCaches(supabase: ReturnType<typeof createClient>, eventId: string) {
  revalidatePath("/admin/sessions", "page")
  revalidatePath("/admin/events", "page")
  revalidatePath("/admin", "page")
  revalidatePath(`/admin/events/${eventId}`, "page")

  const { data: event } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .single()

  if (event?.slug) revalidatePath(`/events/${event.slug}`, "page")
  revalidatePath("/events", "page")
  revalidatePath("/", "layout")
}

export async function createSession(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const eventId     = formData.get("eventId") as string
    const title       = formData.get("title") as string
    const description = formData.get("description") as string
    const startTime   = formData.get("startTime") as string
    const endTime     = formData.get("endTime") as string
    const track       = formData.get("track") as string
    const sessionType = formData.get("sessionType") as string
    const room        = formData.get("room") as string
    const capacity    = parseInt(formData.get("capacity") as string) || null
    const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0

    if (!eventId || !title || !startTime || !endTime) {
      return { success: false, error: "Event, title, start time and end time are required." }
    }

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        event_id: eventId,
        title,
        description: description || null,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        track: track || null,
        session_type: sessionType || "session",
        room: room || null,
        capacity,
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    await invalidateCaches(supabase, eventId)
    return { success: true, session: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateSession(sessionId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: existing } = await supabase
      .from("sessions")
      .select("event_id")
      .eq("id", sessionId)
      .single()

    const title       = formData.get("title") as string
    const description = formData.get("description") as string
    const startTime   = formData.get("startTime") as string
    const endTime     = formData.get("endTime") as string
    const track       = formData.get("track") as string
    const sessionType = formData.get("sessionType") as string
    const room        = formData.get("room") as string
    const capacity    = parseInt(formData.get("capacity") as string) || null
    const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0

    if (!title || !startTime || !endTime) {
      return { success: false, error: "Title, start and end time are required." }
    }

    const { data, error } = await supabase
      .from("sessions")
      .update({
        title,
        description: description || null,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        track: track || null,
        session_type: sessionType || "session",
        room: room || null,
        capacity,
        sort_order: sortOrder,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    if (existing?.event_id) await invalidateCaches(supabase, existing.event_id)
    return { success: true, session: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteSession(sessionId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: existing } = await supabase
      .from("sessions")
      .select("event_id")
      .eq("id", sessionId)
      .single()

    const { error } = await supabase.from("sessions").delete().eq("id", sessionId)
    if (error) return { success: false, error: error.message }
    if (existing?.event_id) await invalidateCaches(supabase, existing.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Link speakers to a session. Replaces all existing links for that session.
 */
export async function linkSpeakersToSession(sessionId: string, speakerIds: string[]) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Get event_id for cache invalidation
    const { data: session } = await supabase
      .from("sessions")
      .select("event_id")
      .eq("id", sessionId)
      .single()

    // Delete existing links for this session
    await supabase
      .from("session_speakers")
      .delete()
      .eq("session_id", sessionId)

    // Insert new links
    if (speakerIds.length > 0) {
      const links = speakerIds.map(speakerId => ({
        session_id: sessionId,
        speaker_id: speakerId,
      }))

      const { error } = await supabase
        .from("session_speakers")
        .insert(links)

      if (error) return { success: false, error: error.message }
    }

    if (session?.event_id) await invalidateCaches(supabase, session.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Fetch speakers linked to a specific session.
 */
export async function getSessionSpeakers(sessionId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("session_speakers")
      .select("speaker_id, speakers(id, name, image_url, designation, company)")
      .eq("session_id", sessionId)

    if (error) return { success: false, error: error.message, speakers: [] }

    const speakers = (data ?? []).map(row => {
      const s = row.speakers as unknown as { id: string; name: string; image_url: string | null; designation: string | null; company: string | null }
      return s
    }).filter(Boolean)

    return { success: true, speakers }
  } catch (err) {
    return { success: false, error: (err as Error).message, speakers: [] }
  }
}
