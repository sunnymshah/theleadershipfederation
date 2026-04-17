"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
// NOTE: SVG is intentionally excluded. SVG files can contain inline
// <script> / event handlers that execute when the image is opened
// directly in a browser tab — and the public_images bucket serves
// content under the Supabase origin listed in our connect-src CSP, so
// a stored-XSS payload could fire against a same-origin iframe or a
// newly-opened tab. Rasterise before upload if SVG support is needed.
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"]

function makeSafePath(folder: string, originalName: string, ext: string) {
  const safeName = originalName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase()
    .slice(0, 50) || "image"
  return `${folder}/${safeName}-${Date.now()}.${ext}`
}

/**
 * Upload a raw File (e.g. from <input type="file">) to Supabase Storage.
 * Uses the service-role admin client so storage RLS can't silently block.
 */
export async function uploadImage(
  file: File,
  folder: "speakers" | "events" | "sponsors" | "sections" | "general"
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    // Auth gate (don't let anonymous callers burn bucket quota)
    await getAuthenticatedClient()

    if (!file || file.size === 0) return { success: false, error: "No file provided." }
    if (file.size > MAX_BYTES) {
      return { success: false, error: `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — max 5 MB.` }
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return { success: false, error: "Only JPEG, PNG, WebP, GIF, SVG are allowed." }
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const path = makeSafePath(folder, file.name, ext)

    const admin = createAdminClient()
    const timeoutP = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Upload timed out after 30s.")), 30_000),
    )
    const uploadP = admin.storage.from("public_images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    })
    const result = await Promise.race([uploadP, timeoutP])
    if (result.error) {
      const m = result.error.message || "upload failed"
      if (/bucket/i.test(m) && /not.*found|does.*not.*exist/i.test(m)) {
        return {
          success: false,
          error: "Storage bucket 'public_images' does not exist. Run setup-public-images-bucket.sql in Supabase.",
        }
      }
      return { success: false, error: m }
    }
    const { data: { publicUrl } } = admin.storage.from("public_images").getPublicUrl(path)
    return { success: true, url: publicUrl }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Upload a Base64 dataURL (e.g. the output of a client-side cropper).
 * Decodes the payload, writes it as a proper image blob, returns URL.
 */
export async function uploadImageDataUrl(
  dataUrl: string,
  folder: "speakers" | "events" | "sponsors" | "sections" | "general",
  originalName = "cropped",
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    await getAuthenticatedClient()

    const m = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i)
    if (!m) return { success: false, error: "Invalid data URL." }
    const mime = m[1]
    if (!ALLOWED_MIME.includes(mime)) {
      return { success: false, error: `MIME type ${mime} not allowed.` }
    }
    const bytes = Buffer.from(m[2], "base64")
    if (bytes.byteLength > MAX_BYTES) {
      return { success: false, error: `Image is ${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB — max 5 MB.` }
    }

    const ext = mime.split("/")[1].replace("jpeg", "jpg").replace("svg+xml", "svg")
    const path = makeSafePath(folder, originalName, ext)

    const admin = createAdminClient()
    const timeoutP = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Upload timed out after 30s.")), 30_000),
    )
    const uploadP = admin.storage.from("public_images").upload(path, bytes, {
      cacheControl: "3600",
      upsert: false,
      contentType: mime,
    })
    const result = await Promise.race([uploadP, timeoutP])
    if (result.error) {
      return { success: false, error: result.error.message || "upload failed" }
    }
    const { data: { publicUrl } } = admin.storage.from("public_images").getPublicUrl(path)
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
    await getAuthenticatedClient()
    const match = publicUrl.match(/\/public_images\/(.+)$/)
    if (!match) return { success: false, error: "Could not parse image path from URL." }
    const admin = createAdminClient()
    const { error } = await admin.storage.from("public_images").remove([match[1]])
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
