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

function invalidateGalleryCaches(eventId: string) {
  revalidatePath(`/admin/events/${eventId}`, "page")
  revalidatePath("/admin/events", "page")
}

export async function uploadGalleryImage(eventId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const file = formData.get("file") as File
    const caption = formData.get("caption") as string
    const photographer = formData.get("photographer") as string

    if (!file || file.size === 0) {
      return { success: false, error: "No file provided." }
    }

    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: "File must be under 10MB." }
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      return { success: false, error: "Only JPEG, PNG, WebP, and GIF files are allowed." }
    }

    // Upload to storage
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase()
      .slice(0, 50)
    const path = `gallery/${eventId}/${safeName}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("public_images")
      .upload(path, file, { cacheControl: "3600", upsert: false })

    if (uploadError) return { success: false, error: uploadError.message }

    const { data: { publicUrl } } = supabase.storage
      .from("public_images")
      .getPublicUrl(path)

    // Get current max sort_order
    const { data: existing } = await supabase
      .from("event_gallery")
      .select("sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: false })
      .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

    // Create gallery record
    const { data, error } = await supabase
      .from("event_gallery")
      .insert({
        event_id: eventId,
        image_url: publicUrl,
        caption: caption || null,
        photographer: photographer || null,
        sort_order: nextOrder,
        is_featured: false,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    invalidateGalleryCaches(eventId)
    return { success: true, image: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteGalleryImage(imageId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Get image record first to delete from storage
    const { data: image } = await supabase
      .from("event_gallery")
      .select("image_url, event_id")
      .eq("id", imageId)
      .single()

    if (image?.image_url) {
      const match = image.image_url.match(/\/public_images\/(.+)$/)
      if (match) {
        await supabase.storage.from("public_images").remove([match[1]])
      }
    }

    const { error } = await supabase
      .from("event_gallery")
      .delete()
      .eq("id", imageId)

    if (error) return { success: false, error: error.message }

    if (image?.event_id) invalidateGalleryCaches(image.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateGalleryImage(
  imageId: string,
  data: { caption?: string; photographer?: string; sort_order?: number; is_featured?: boolean }
) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const updateData: Record<string, unknown> = {}
    if (data.caption !== undefined) updateData.caption = data.caption || null
    if (data.photographer !== undefined) updateData.photographer = data.photographer || null
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order
    if (data.is_featured !== undefined) updateData.is_featured = data.is_featured

    const { data: updated, error } = await supabase
      .from("event_gallery")
      .update(updateData)
      .eq("id", imageId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    if (updated?.event_id) invalidateGalleryCaches(updated.event_id)
    return { success: true, image: updated }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function getGalleryImages(eventId: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
      .from("event_gallery")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order")

    if (error) return { success: false, error: error.message, images: [] }
    return { success: true, images: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, images: [] }
  }
}

export async function bulkUploadGallery(eventId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const files = formData.getAll("files") as File[]
    if (!files || files.length === 0) {
      return { success: false, error: "No files provided.", uploaded: 0 }
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]

    // Get current max sort_order
    const { data: existing } = await supabase
      .from("event_gallery")
      .select("sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: false })
      .limit(1)

    let nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0
    let uploaded = 0
    const errors: string[] = []

    for (const file of files) {
      if (file.size === 0) continue
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File too large (max 10MB)`)
        continue
      }
      if (!allowed.includes(file.type)) {
        errors.push(`${file.name}: Unsupported file type`)
        continue
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const safeName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .toLowerCase()
        .slice(0, 50)
      const path = `gallery/${eventId}/${safeName}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("public_images")
        .upload(path, file, { cacheControl: "3600", upsert: false })

      if (uploadError) {
        errors.push(`${file.name}: ${uploadError.message}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from("public_images")
        .getPublicUrl(path)

      const { error: dbError } = await supabase
        .from("event_gallery")
        .insert({
          event_id: eventId,
          image_url: publicUrl,
          sort_order: nextOrder,
          is_featured: false,
        })

      if (dbError) {
        errors.push(`${file.name}: ${dbError.message}`)
        continue
      }

      nextOrder++
      uploaded++
    }

    invalidateGalleryCaches(eventId)
    return {
      success: errors.length === 0,
      uploaded,
      errors,
    }
  } catch (err) {
    return { success: false, error: (err as Error).message, uploaded: 0 }
  }
}
