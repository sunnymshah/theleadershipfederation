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
  revalidatePath("/admin/advisory-board")
  revalidatePath("/advisory-board")
}

/**
 * Upload an advisory board member photo to Supabase Storage.
 * Accepts a File and returns the public URL.
 */
async function uploadAdvisoryPhoto(
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
  const path = `advisory/${safeName}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from("public_images")
    .upload(path, file, { cacheControl: "3600", upsert: false })

  if (error) return null

  const { data: { publicUrl } } = supabase.storage
    .from("public_images")
    .getPublicUrl(path)

  return publicUrl
}

/**
 * Fetch all active advisory board members, ordered by sort_order.
 */
export async function getAdvisoryBoardMembers() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
      .from("advisory_board_members")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error) return { success: false, error: error.message }
    return { success: true, members: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Fetch all advisory board members (for admin), ordered by sort_order.
 */
export async function getAllAdvisoryBoardMembers() {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("advisory_board_members")
      .select("*")
      .order("sort_order", { ascending: true })

    if (error) return { success: false, error: error.message }
    return { success: true, members: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Create a new advisory board member.
 * Accepts FormData with fields: name, designation, company, bio, imageUrl, linkedin_url, sortOrder, is_active, photo (file).
 */
export async function createAdvisoryBoardMember(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const name        = formData.get("name") as string
    const designation = formData.get("designation") as string
    const company     = formData.get("company") as string
    const bio         = formData.get("bio") as string
    const imageUrl    = formData.get("imageUrl") as string
    const linkedinUrl = formData.get("linkedin_url") as string
    const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0
    const isActive    = formData.get("is_active") !== "false"

    // Handle file upload if a photo file was provided
    const photo = formData.get("photo") as File | null
    let finalImageUrl = imageUrl || null

    if (photo && photo.size > 0) {
      const uploadedUrl = await uploadAdvisoryPhoto(supabase, photo)
      if (uploadedUrl) finalImageUrl = uploadedUrl
    }

    if (!name) {
      return { success: false, error: "Name is required." }
    }

    const { data, error } = await supabase
      .from("advisory_board_members")
      .insert({
        name,
        designation: designation || null,
        company: company || null,
        bio: bio || null,
        image_url: finalImageUrl,
        linkedin_url: linkedinUrl || null,
        sort_order: sortOrder,
        is_active: isActive,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true, member: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Update an existing advisory board member.
 * Accepts FormData with fields: id, name, designation, company, bio, imageUrl, linkedin_url, sortOrder, is_active, photo (file).
 */
export async function updateAdvisoryBoardMember(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const id = formData.get("id") as string
    if (!id) return { success: false, error: "Member ID is required." }

    const { data: existing } = await supabase
      .from("advisory_board_members")
      .select("image_url")
      .eq("id", id)
      .single()

    const name        = formData.get("name") as string
    const designation = formData.get("designation") as string
    const company     = formData.get("company") as string
    const bio         = formData.get("bio") as string
    const imageUrl    = formData.get("imageUrl") as string
    const linkedinUrl = formData.get("linkedin_url") as string
    const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0
    const isActive    = formData.get("is_active") !== "false"

    // Handle file upload
    const photo = formData.get("photo") as File | null
    let finalImageUrl = imageUrl || existing?.image_url || null

    if (photo && photo.size > 0) {
      const uploadedUrl = await uploadAdvisoryPhoto(supabase, photo)
      if (uploadedUrl) finalImageUrl = uploadedUrl
    }

    if (!name) return { success: false, error: "Name is required." }

    const { data, error } = await supabase
      .from("advisory_board_members")
      .update({
        name,
        designation: designation || null,
        company: company || null,
        bio: bio || null,
        image_url: finalImageUrl,
        linkedin_url: linkedinUrl || null,
        sort_order: sortOrder,
        is_active: isActive,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true, member: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Delete an advisory board member by ID.
 * Also removes the photo from storage if it was uploaded to our bucket.
 */
export async function deleteAdvisoryBoardMember(id: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: existing } = await supabase
      .from("advisory_board_members")
      .select("image_url")
      .eq("id", id)
      .single()

    // Delete the photo from storage if it's in our bucket
    if (existing?.image_url?.includes("public_images/advisory/")) {
      const match = existing.image_url.match(/\/public_images\/(.+)$/)
      if (match) {
        await supabase.storage.from("public_images").remove([match[1]])
      }
    }

    const { error } = await supabase
      .from("advisory_board_members")
      .delete()
      .eq("id", id)

    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
