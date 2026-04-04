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
  revalidatePath("/admin/sponsors", "page")
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

async function uploadSponsorLogo(
  supabase: ReturnType<typeof createClient>,
  file: File
): Promise<string | null> {
  if (!file || file.size === 0) return null

  const ext = file.name.split(".").pop()?.toLowerCase() || "png"
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase()
    .slice(0, 50)
  const path = `sponsors/${safeName}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from("public_images")
    .upload(path, file, { cacheControl: "3600", upsert: false })

  if (error) return null

  const { data: { publicUrl } } = supabase.storage
    .from("public_images")
    .getPublicUrl(path)

  return publicUrl
}

export async function createSponsor(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const eventId     = formData.get("eventId") as string
    const name        = formData.get("name") as string
    const tier        = formData.get("tier") as string
    const logoUrl     = formData.get("logoUrl") as string
    const website     = formData.get("website") as string
    const description = formData.get("description") as string
    const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0

    const logoFile = formData.get("logo") as File | null
    let finalLogoUrl = logoUrl || null

    if (logoFile && logoFile.size > 0) {
      const uploadedUrl = await uploadSponsorLogo(supabase, logoFile)
      if (uploadedUrl) finalLogoUrl = uploadedUrl
    }

    if (!eventId || !name) {
      return { success: false, error: "Event and sponsor name are required." }
    }

    const { data, error } = await supabase
      .from("sponsors")
      .insert({
        event_id: eventId,
        name,
        tier: tier || "gold",
        logo_url: finalLogoUrl,
        website: website || null,
        description: description || null,
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    await invalidateCaches(supabase, eventId)
    return { success: true, sponsor: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateSponsor(sponsorId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: existing } = await supabase
      .from("sponsors")
      .select("event_id, logo_url")
      .eq("id", sponsorId)
      .single()

    const name        = formData.get("name") as string
    const tier        = formData.get("tier") as string
    const logoUrl     = formData.get("logoUrl") as string
    const website     = formData.get("website") as string
    const description = formData.get("description") as string
    const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0

    const logoFile = formData.get("logo") as File | null
    let finalLogoUrl = logoUrl || existing?.logo_url || null

    if (logoFile && logoFile.size > 0) {
      const uploadedUrl = await uploadSponsorLogo(supabase, logoFile)
      if (uploadedUrl) finalLogoUrl = uploadedUrl
    }

    if (!name) return { success: false, error: "Sponsor name is required." }

    const { data, error } = await supabase
      .from("sponsors")
      .update({
        name,
        tier: tier || "gold",
        logo_url: finalLogoUrl,
        website: website || null,
        description: description || null,
        sort_order: sortOrder,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sponsorId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    if (existing?.event_id) await invalidateCaches(supabase, existing.event_id)
    return { success: true, sponsor: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteSponsor(sponsorId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: existing } = await supabase
      .from("sponsors")
      .select("event_id, logo_url")
      .eq("id", sponsorId)
      .single()

    if (existing?.logo_url?.includes("public_images/sponsors/")) {
      const match = existing.logo_url.match(/\/public_images\/(.+)$/)
      if (match) {
        await supabase.storage.from("public_images").remove([match[1]])
      }
    }

    const { error } = await supabase.from("sponsors").delete().eq("id", sponsorId)
    if (error) return { success: false, error: error.message }
    if (existing?.event_id) await invalidateCaches(supabase, existing.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
