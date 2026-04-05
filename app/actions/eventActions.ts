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

function invalidateEventCaches(slug?: string) {
  revalidatePath("/", "layout")
  revalidatePath("/events", "page")
  revalidatePath("/admin/events", "page")
  revalidatePath("/admin", "page")
  if (slug) revalidatePath(`/events/${slug}`, "page")
}

async function uploadCoverImage(
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
  const path = `events/${safeName}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from("public_images")
    .upload(path, file, { cacheControl: "3600", upsert: false })

  if (error) return null

  const { data: { publicUrl } } = supabase.storage
    .from("public_images")
    .getPublicUrl(path)

  return publicUrl
}

export async function createEvent(formData: FormData) {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    const title       = formData.get("title") as string
    const slug        = formData.get("slug") as string
    const startDate   = formData.get("startDate") as string
    const endDate     = formData.get("endDate") as string
    const venue       = formData.get("venue") as string
    const description = formData.get("description") as string

    if (!title || !slug || !startDate || !endDate || !venue) {
      return { success: false, error: "All required fields must be filled." }
    }

    // New enhanced fields
    const tagline              = formData.get("tagline") as string
    const venue_address        = formData.get("venue_address") as string
    const registration_deadline = formData.get("registration_deadline") as string
    const highlightsRaw        = formData.get("highlights") as string
    const is_featured          = formData.get("is_featured") === "on" || formData.get("is_featured") === "true"
    const max_attendees_raw    = formData.get("max_attendees") as string
    const contact_email        = formData.get("contact_email") as string

    // Parse highlights: comma-separated or newline-separated string -> JSON array
    const highlights = highlightsRaw
      ? highlightsRaw.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean)
      : []

    const max_attendees = max_attendees_raw ? parseInt(max_attendees_raw, 10) || null : null

    // Handle cover image upload
    const coverFile = formData.get("coverImage") as File | null
    const coverUrl  = formData.get("coverImageUrl") as string
    let finalCoverUrl = coverUrl || null

    if (coverFile && coverFile.size > 0) {
      const uploadedUrl = await uploadCoverImage(supabase, coverFile)
      if (uploadedUrl) finalCoverUrl = uploadedUrl
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        title,
        slug,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        venue,
        description: description || null,
        cover_image_url: finalCoverUrl,
        status: "draft",
        created_by: user.id,
        tagline: tagline || null,
        venue_address: venue_address || null,
        registration_deadline: registration_deadline ? new Date(registration_deadline).toISOString() : null,
        highlights,
        is_featured,
        max_attendees,
        contact_email: contact_email || null,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateEventCaches(slug)
    return { success: true, event: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateEvent(eventId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: current } = await supabase
      .from("events")
      .select("slug, cover_image_url")
      .eq("id", eventId)
      .single()

    const title       = formData.get("title") as string
    const slug        = formData.get("slug") as string
    const startDate   = formData.get("startDate") as string
    const endDate     = formData.get("endDate") as string
    const venue       = formData.get("venue") as string
    const description = formData.get("description") as string
    const status      = formData.get("status") as string

    if (!title || !slug || !startDate || !endDate || !venue) {
      return { success: false, error: "All required fields must be filled." }
    }

    // New enhanced fields
    const tagline              = formData.get("tagline") as string
    const venue_address        = formData.get("venue_address") as string
    const registration_deadline = formData.get("registration_deadline") as string
    const highlightsRaw        = formData.get("highlights") as string
    const is_featured          = formData.get("is_featured") === "on" || formData.get("is_featured") === "true"
    const max_attendees_raw    = formData.get("max_attendees") as string
    const contact_email        = formData.get("contact_email") as string

    // Parse highlights: comma-separated or newline-separated string -> JSON array
    const highlights = highlightsRaw
      ? highlightsRaw.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean)
      : []

    const max_attendees = max_attendees_raw ? parseInt(max_attendees_raw, 10) || null : null

    // Handle cover image upload
    const coverFile = formData.get("coverImage") as File | null
    const coverUrl  = formData.get("coverImageUrl") as string
    let finalCoverUrl = coverUrl || current?.cover_image_url || null

    if (coverFile && coverFile.size > 0) {
      const uploadedUrl = await uploadCoverImage(supabase, coverFile)
      if (uploadedUrl) finalCoverUrl = uploadedUrl
    }

    const { data, error } = await supabase
      .from("events")
      .update({
        title,
        slug,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        venue,
        description: description || null,
        cover_image_url: finalCoverUrl,
        status: status || "draft",
        updated_at: new Date().toISOString(),
        tagline: tagline || null,
        venue_address: venue_address || null,
        registration_deadline: registration_deadline ? new Date(registration_deadline).toISOString() : null,
        highlights,
        is_featured,
        max_attendees,
        contact_email: contact_email || null,
      })
      .eq("id", eventId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    invalidateEventCaches(slug)
    if (current?.slug && current.slug !== slug) {
      revalidatePath(`/events/${current.slug}`, "page")
    }
    revalidatePath(`/admin/events/${eventId}`, "page")

    return { success: true, event: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: event } = await supabase
      .from("events")
      .select("slug")
      .eq("id", eventId)
      .single()

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId)

    if (error) return { success: false, error: error.message }
    invalidateEventCaches(event?.slug)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
