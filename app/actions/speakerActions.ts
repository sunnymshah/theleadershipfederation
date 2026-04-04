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

function invalidateCaches() {
  revalidatePath("/admin/speakers", "page")
  revalidatePath("/admin/events", "page")
  revalidatePath("/admin", "page")
}

export async function createSpeaker(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const eventId     = formData.get("eventId") as string
    const name        = formData.get("name") as string
    const designation = formData.get("designation") as string
    const company     = formData.get("company") as string
    const bio         = formData.get("bio") as string
    const imageUrl    = formData.get("imageUrl") as string
    const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0

    if (!eventId || !name) {
      return { success: false, error: "Event and speaker name are required." }
    }

    const { data, error } = await supabase
      .from("speakers")
      .insert({ event_id: eventId, name, designation: designation || null, company: company || null, bio: bio || null, image_url: imageUrl || null, sort_order: sortOrder })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true, speaker: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateSpeaker(speakerId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const name        = formData.get("name") as string
    const designation = formData.get("designation") as string
    const company     = formData.get("company") as string
    const bio         = formData.get("bio") as string
    const imageUrl    = formData.get("imageUrl") as string
    const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0

    if (!name) return { success: false, error: "Speaker name is required." }

    const { data, error } = await supabase
      .from("speakers")
      .update({ name, designation: designation || null, company: company || null, bio: bio || null, image_url: imageUrl || null, sort_order: sortOrder, updated_at: new Date().toISOString() })
      .eq("id", speakerId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true, speaker: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteSpeaker(speakerId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.from("speakers").delete().eq("id", speakerId)
    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
