"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export async function getPublicDirectory(eventSlug: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // First get the event and check if directory is enabled
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, show_delegate_directory")
      .eq("slug", eventSlug)
      .in("status", ["published", "completed"])
      .single()

    if (eventError || !event) {
      return { success: false, error: "Event not found.", event: null, delegates: [] }
    }

    if (!event.show_delegate_directory) {
      return { success: false, error: "Delegate directory is not enabled for this event.", event: null, delegates: [] }
    }

    // Fetch delegates - only public info, NO email or phone
    const { data: delegates, error: delegateError } = await supabase
      .from("attendees")
      .select("id, name, company, designation, linkedin_url")
      .eq("event_id", event.id)
      .eq("show_in_directory", true)
      .in("status", ["registered", "confirmed", "checked_in"])
      .order("name")

    if (delegateError) {
      return { success: false, error: delegateError.message, event: null, delegates: [] }
    }

    return {
      success: true,
      event: { id: event.id, title: event.title },
      delegates: delegates ?? [],
    }
  } catch (err) {
    return { success: false, error: (err as Error).message, event: null, delegates: [] }
  }
}

export async function toggleDirectoryVisibility(attendeeId: string, show: boolean) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { error } = await supabase
      .from("attendees")
      .update({ show_in_directory: show })
      .eq("id", attendeeId)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/attendees", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
