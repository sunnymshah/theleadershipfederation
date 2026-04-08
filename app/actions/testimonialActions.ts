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

/**
 * Upload a testimonial photo to Supabase Storage.
 * Accepts a File object.
 * Returns the public URL.
 */
async function uploadTestimonialPhoto(
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
  const path = `testimonials/${safeName}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from("public_images")
    .upload(path, file, { cacheControl: "3600", upsert: false })

  if (error) return null

  const { data: { publicUrl } } = supabase.storage
    .from("public_images")
    .getPublicUrl(path)

  return publicUrl
}

export async function getTestimonials() {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true })

    if (error) return { success: false, error: error.message }
    return { success: true, testimonials: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function createTestimonial(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const name        = formData.get("name") as string
    const designation = formData.get("designation") as string
    const company     = formData.get("company") as string
    const quote       = formData.get("quote") as string
    const imageUrl    = formData.get("imageUrl") as string
    const isFeatured  = formData.get("isFeatured") === "true"
    const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0

    // Handle file upload if a photo file was provided
    const photo = formData.get("photo") as File | null
    let finalImageUrl = imageUrl || null

    if (photo && photo.size > 0) {
      const uploadedUrl = await uploadTestimonialPhoto(supabase, photo)
      if (uploadedUrl) finalImageUrl = uploadedUrl
    }

    if (!name || !quote) {
      return { success: false, error: "Name and quote are required." }
    }

    const { data, error } = await supabase
      .from("testimonials")
      .insert({
        name,
        designation: designation || null,
        company: company || null,
        quote,
        image_url: finalImageUrl,
        is_featured: isFeatured,
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/testimonials", "page")
    revalidatePath("/", "layout")

    return { success: true, testimonial: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateTestimonial(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const id = formData.get("id") as string
    if (!id) return { success: false, error: "Testimonial ID is required." }

    const { data: existing } = await supabase
      .from("testimonials")
      .select("image_url")
      .eq("id", id)
      .single()

    const name        = formData.get("name") as string
    const designation = formData.get("designation") as string
    const company     = formData.get("company") as string
    const quote       = formData.get("quote") as string
    const imageUrl    = formData.get("imageUrl") as string
    const isFeatured  = formData.get("isFeatured") === "true"
    const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0

    // Handle file upload
    const photo = formData.get("photo") as File | null
    let finalImageUrl = imageUrl || existing?.image_url || null

    if (photo && photo.size > 0) {
      const uploadedUrl = await uploadTestimonialPhoto(supabase, photo)
      if (uploadedUrl) finalImageUrl = uploadedUrl
    }

    if (!name || !quote) {
      return { success: false, error: "Name and quote are required." }
    }

    const { data, error } = await supabase
      .from("testimonials")
      .update({
        name,
        designation: designation || null,
        company: company || null,
        quote,
        image_url: finalImageUrl,
        is_featured: isFeatured,
        sort_order: sortOrder,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/testimonials", "page")
    revalidatePath("/", "layout")

    return { success: true, testimonial: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteTestimonial(id: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: existing } = await supabase
      .from("testimonials")
      .select("image_url")
      .eq("id", id)
      .single()

    // Delete the photo from storage if it's in our bucket
    if (existing?.image_url?.includes("public_images/testimonials/")) {
      const match = existing.image_url.match(/\/public_images\/(.+)$/)
      if (match) {
        await supabase.storage.from("public_images").remove([match[1]])
      }
    }

    const { error } = await supabase.from("testimonials").delete().eq("id", id)
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/testimonials", "page")
    revalidatePath("/", "layout")

    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
