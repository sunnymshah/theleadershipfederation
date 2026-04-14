"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

/* ── Auth helper ───────────────────────────────────────────────────────── */

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

function invalidateCaches() {
  revalidatePath("/admin/winners")
  revalidatePath("/winners")
  revalidatePath("/", "layout")
}

/* ── Public reads ──────────────────────────────────────────────────────── */

/**
 * Fetch all award editions ordered by sort_order.
 */
export async function getAwardEditions() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
      .from("award_editions")
      .select("*")
      .order("sort_order", { ascending: true })

    if (error) return { success: false, error: error.message }
    return { success: true, editions: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Fetch award winners, optionally filtered by edition_id.
 */
export async function getAwardWinners(editionId?: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    let query = supabase
      .from("award_winners")
      .select("*, award_editions(name, slug, event_name, year, city, country)")
      .order("sort_order", { ascending: true })

    if (editionId) {
      query = query.eq("edition_id", editionId)
    }

    const { data, error } = await query

    if (error) return { success: false, error: error.message }
    return { success: true, winners: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Admin mutations ───────────────────────────────────────────────────── */

/**
 * Create a new award edition.
 */
export async function addAwardEdition(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const name      = formData.get("name") as string
    const slug      = formData.get("slug") as string
    const eventName = formData.get("eventName") as string
    const year      = parseInt(formData.get("year") as string) || new Date().getFullYear()
    const city      = formData.get("city") as string
    const country   = formData.get("country") as string
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0

    if (!name || !slug || !eventName) {
      return { success: false, error: "Name, slug, and event name are required." }
    }

    const { data, error } = await supabase
      .from("award_editions")
      .insert({
        name,
        slug,
        event_name: eventName,
        year,
        city: city || null,
        country: country || null,
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true, edition: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Update an existing award edition.
 */
export async function updateAwardEdition(editionId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const name      = formData.get("name") as string
    const slug      = formData.get("slug") as string
    const eventName = formData.get("eventName") as string
    const year      = parseInt(formData.get("year") as string) || new Date().getFullYear()
    const city      = formData.get("city") as string
    const country   = formData.get("country") as string
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0

    if (!name || !slug || !eventName) {
      return { success: false, error: "Name, slug, and event name are required." }
    }

    const { data, error } = await supabase
      .from("award_editions")
      .update({
        name,
        slug,
        event_name: eventName,
        year,
        city: city || null,
        country: country || null,
        sort_order: sortOrder,
      })
      .eq("id", editionId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true, edition: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Delete an award edition and all its winners.
 */
export async function deleteAwardEdition(editionId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { error } = await supabase
      .from("award_editions")
      .delete()
      .eq("id", editionId)

    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Create a new award winner.
 */
export async function addAwardWinner(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const editionId     = formData.get("editionId") as string
    const name          = formData.get("name") as string
    const company       = formData.get("company") as string
    const designation   = formData.get("designation") as string
    const awardCategory = formData.get("awardCategory") as string
    const imageUrl      = formData.get("imageUrl") as string
    const linkedinUrl   = formData.get("linkedinUrl") as string
    const sortOrder     = parseInt(formData.get("sortOrder") as string) || 0

    if (!editionId || !name) {
      return { success: false, error: "Edition and winner name are required." }
    }

    // Handle file upload if a photo file was provided
    const photo = formData.get("photo") as File | null
    let finalImageUrl = imageUrl || null

    if (photo && photo.size > 0) {
      const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg"
      const safeName = photo.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .toLowerCase()
        .slice(0, 50)
      const path = `winners/${safeName}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("public_images")
        .upload(path, photo, { cacheControl: "3600", upsert: false })

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from("public_images")
          .getPublicUrl(path)
        finalImageUrl = publicUrl
      }
    }

    const { data, error } = await supabase
      .from("award_winners")
      .insert({
        edition_id: editionId,
        name,
        company: company || null,
        designation: designation || null,
        award_category: awardCategory || null,
        image_url: finalImageUrl,
        linkedin_url: linkedinUrl || null,
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true, winner: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Update an existing award winner.
 */
export async function updateAwardWinner(winnerId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const name          = formData.get("name") as string
    const company       = formData.get("company") as string
    const designation   = formData.get("designation") as string
    const awardCategory = formData.get("awardCategory") as string
    const imageUrl      = formData.get("imageUrl") as string
    const linkedinUrl   = formData.get("linkedinUrl") as string
    const sortOrder     = parseInt(formData.get("sortOrder") as string) || 0

    if (!name) return { success: false, error: "Winner name is required." }

    // Fetch existing to preserve image
    const { data: existing } = await supabase
      .from("award_winners")
      .select("image_url")
      .eq("id", winnerId)
      .single()

    let finalImageUrl = imageUrl || existing?.image_url || null

    // Handle file upload
    const photo = formData.get("photo") as File | null
    if (photo && photo.size > 0) {
      const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg"
      const safeName = photo.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .toLowerCase()
        .slice(0, 50)
      const path = `winners/${safeName}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("public_images")
        .upload(path, photo, { cacheControl: "3600", upsert: false })

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from("public_images")
          .getPublicUrl(path)
        finalImageUrl = publicUrl
      }
    }

    const { data, error } = await supabase
      .from("award_winners")
      .update({
        name,
        company: company || null,
        designation: designation || null,
        award_category: awardCategory || null,
        image_url: finalImageUrl,
        linkedin_url: linkedinUrl || null,
        sort_order: sortOrder,
      })
      .eq("id", winnerId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true, winner: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Delete an award winner.
 */
export async function deleteAwardWinner(winnerId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Clean up image from storage if present
    const { data: existing } = await supabase
      .from("award_winners")
      .select("image_url")
      .eq("id", winnerId)
      .single()

    if (existing?.image_url?.includes("public_images/winners/")) {
      const match = existing.image_url.match(/\/public_images\/(.+)$/)
      if (match) {
        await supabase.storage.from("public_images").remove([match[1]])
      }
    }

    const { error } = await supabase
      .from("award_winners")
      .delete()
      .eq("id", winnerId)

    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
