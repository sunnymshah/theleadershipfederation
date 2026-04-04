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
  revalidatePath("/admin/speakers", "page")
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

/**
 * Upload a speaker headshot to Supabase Storage.
 * Accepts FormData with a "headshot" file field.
 * Returns the public URL.
 */
async function uploadSpeakerHeadshot(
  supabase: ReturnType<typeof createClient>,
  file: File
): Promise<string | null> {
  if (!file || file.size === 0) return null

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase()
    .slice(0, 50)
  const path = `speakers/${safeName}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from("public_images")
    .upload(path, file, { cacheControl: "3600", upsert: false })

  if (error) return null

  const { data: { publicUrl } } = supabase.storage
    .from("public_images")
    .getPublicUrl(path)

  return publicUrl
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

    // Handle file upload if a headshot file was provided
    const headshot = formData.get("headshot") as File | null
    let finalImageUrl = imageUrl || null

    if (headshot && headshot.size > 0) {
      const uploadedUrl = await uploadSpeakerHeadshot(supabase, headshot)
      if (uploadedUrl) finalImageUrl = uploadedUrl
    }

    if (!eventId || !name) {
      return { success: false, error: "Event and speaker name are required." }
    }

    const { data, error } = await supabase
      .from("speakers")
      .insert({
        event_id: eventId,
        name,
        designation: designation || null,
        company: company || null,
        bio: bio || null,
        image_url: finalImageUrl,
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    await invalidateCaches(supabase, eventId)
    return { success: true, speaker: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateSpeaker(speakerId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: existing } = await supabase
      .from("speakers")
      .select("event_id, image_url")
      .eq("id", speakerId)
      .single()

    const name        = formData.get("name") as string
    const designation = formData.get("designation") as string
    const company     = formData.get("company") as string
    const bio         = formData.get("bio") as string
    const imageUrl    = formData.get("imageUrl") as string
    const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0

    // Handle file upload
    const headshot = formData.get("headshot") as File | null
    let finalImageUrl = imageUrl || existing?.image_url || null

    if (headshot && headshot.size > 0) {
      const uploadedUrl = await uploadSpeakerHeadshot(supabase, headshot)
      if (uploadedUrl) finalImageUrl = uploadedUrl
    }

    if (!name) return { success: false, error: "Speaker name is required." }

    const { data, error } = await supabase
      .from("speakers")
      .update({
        name,
        designation: designation || null,
        company: company || null,
        bio: bio || null,
        image_url: finalImageUrl,
        sort_order: sortOrder,
        updated_at: new Date().toISOString(),
      })
      .eq("id", speakerId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    if (existing?.event_id) await invalidateCaches(supabase, existing.event_id)
    return { success: true, speaker: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteSpeaker(speakerId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: existing } = await supabase
      .from("speakers")
      .select("event_id, image_url")
      .eq("id", speakerId)
      .single()

    // Delete the headshot from storage if it's in our bucket
    if (existing?.image_url?.includes("public_images/speakers/")) {
      const match = existing.image_url.match(/\/public_images\/(.+)$/)
      if (match) {
        await supabase.storage.from("public_images").remove([match[1]])
      }
    }

    const { error } = await supabase.from("speakers").delete().eq("id", speakerId)
    if (error) return { success: false, error: error.message }
    if (existing?.event_id) await invalidateCaches(supabase, existing.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
