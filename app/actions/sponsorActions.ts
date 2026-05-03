"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission } from "@/lib/server-permissions"

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
    await requirePermission("sponsors", "create")
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

    const featured = formData.get("featured") === "on" || formData.get("featured") === "true"
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
        featured,
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
    await requirePermission("sponsors", "edit")
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

    const featured = formData.get("featured") === "on" || formData.get("featured") === "true"
    const { data, error } = await supabase
      .from("sponsors")
      .update({
        name,
        tier: tier || "gold",
        logo_url: finalLogoUrl,
        website: website || null,
        description: description || null,
        sort_order: sortOrder,
        featured,
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
    await requirePermission("sponsors", "delete")
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

/* ── Manager parity helpers ─────────────────────────────────────── */

export type SponsorRow = {
  id: string
  event_id: string
  name: string
  tier: string | null
  logo_url: string | null
  website: string | null
  description: string | null
  featured: boolean
  sort_order: number
  created_at: string
}

export async function listSponsorsFull(eventId: string): Promise<{ success: boolean; rows: SponsorRow[]; error?: string }> {
  try {
    await requirePermission("sponsors", "view")
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("sponsors")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    if (error) return { success: false, rows: [], error: error.message }
    return { success: true, rows: (data ?? []) as SponsorRow[] }
  } catch (err) {
    return { success: false, rows: [], error: (err as Error).message }
  }
}

export async function setSponsorFeatured(sponsorId: string, featured: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("sponsors", "edit")
    const admin = createAdminClient()
    const { error } = await admin
      .from("sponsors")
      .update({ featured, updated_at: new Date().toISOString() })
      .eq("id", sponsorId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Sponsor tiers (event_sponsor_tiers) ────────────────────────── */

export type SponsorTier = {
  id: string
  event_id: string
  name: string
  color: string | null
  sort_order: number
  created_at: string
}

export async function listSponsorTiers(eventId: string): Promise<{ success: boolean; rows: SponsorTier[]; error?: string }> {
  try {
    await requirePermission("sponsors", "view")
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("event_sponsor_tiers")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    if (error) return { success: false, rows: [], error: error.message }
    return { success: true, rows: (data ?? []) as SponsorTier[] }
  } catch (err) {
    return { success: false, rows: [], error: (err as Error).message }
  }
}

export async function upsertSponsorTier(
  eventId: string,
  patch: { id?: string; name: string; color?: string | null; sort_order?: number },
): Promise<{ success: boolean; row?: SponsorTier; error?: string }> {
  try {
    await requirePermission("sponsors", "edit")
    const admin = createAdminClient()
    const payload = {
      event_id: eventId,
      name: patch.name.trim(),
      color: patch.color ?? null,
      sort_order: patch.sort_order ?? 0,
    }
    if (patch.id) {
      const { data, error } = await admin
        .from("event_sponsor_tiers")
        .update(payload)
        .eq("id", patch.id)
        .eq("event_id", eventId)
        .select()
        .maybeSingle()
      if (error) return { success: false, error: error.message }
      return { success: true, row: (data as SponsorTier | null) ?? undefined }
    }
    const { data, error } = await admin
      .from("event_sponsor_tiers")
      .insert(payload)
      .select()
      .maybeSingle()
    if (error) return { success: false, error: error.message }
    return { success: true, row: (data as SponsorTier | null) ?? undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteSponsorTier(eventId: string, tierId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("sponsors", "edit")
    const admin = createAdminClient()
    const { error } = await admin
      .from("event_sponsor_tiers")
      .delete()
      .eq("id", tierId)
      .eq("event_id", eventId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function reorderSponsorTiers(eventId: string, idsInOrder: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("sponsors", "edit")
    const admin = createAdminClient()
    await Promise.all(idsInOrder.map((id, idx) =>
      Promise.resolve(admin.from("event_sponsor_tiers").update({ sort_order: idx * 10 }).eq("id", id).eq("event_id", eventId)),
    ))
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
