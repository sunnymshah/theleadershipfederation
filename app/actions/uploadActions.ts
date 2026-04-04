"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

/**
 * Upload an image file to Supabase Storage (public_images bucket).
 * Returns the public URL on success.
 *
 * @param file     - The File object from a form input
 * @param folder   - Storage subfolder: "speakers", "events", "sponsors"
 * @param filename - Optional custom filename (defaults to timestamp + original name)
 */
export async function uploadImage(
  file: File,
  folder: "speakers" | "events" | "sponsors"
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Validate file
    if (!file || file.size === 0) {
      return { success: false, error: "No file provided." }
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "File must be under 5MB." }
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
    if (!allowed.includes(file.type)) {
      return { success: false, error: "Only JPEG, PNG, WebP, GIF, and SVG files are allowed." }
    }

    // Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase()
      .slice(0, 50)
    const timestamp = Date.now()
    const path = `${folder}/${safeName}-${timestamp}.${ext}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("public_images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from("public_images")
      .getPublicUrl(path)

    return { success: true, url: publicUrl }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Delete an image from Supabase Storage by its full public URL.
 */
export async function deleteImage(publicUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Extract the path from the public URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/public_images/speakers/file.jpg
    const match = publicUrl.match(/\/public_images\/(.+)$/)
    if (!match) {
      return { success: false, error: "Could not parse image path from URL." }
    }

    const path = match[1]
    const { error } = await supabase.storage.from("public_images").remove([path])

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
