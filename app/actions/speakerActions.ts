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
  // Next 16: for literal paths, OMIT the "page" type arg. Passing it
  // triggers a synchronous re-render that can throw a downstream error
  // and hang the entire action — that was making the speaker form
  // spin forever and (per user report) crash the tab. Each call is
  // also wrapped in try/catch so a render failure on one path can't
  // block the rest of the cache invalidation or the action's success
  // return value.
  const safe = (path: string, type?: "layout") => {
    try {
      type ? revalidatePath(path, type) : revalidatePath(path)
    } catch (e) {
      console.error(`[speakerActions] revalidatePath(${path}) failed:`, e)
    }
  }

  safe("/admin/speakers")
  safe("/admin/events")
  safe("/admin")
  safe(`/admin/events/${eventId}`)

  const { data: event } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .single()

  if (event?.slug) {
    safe(`/events/${event.slug}`)
  }
  safe("/events")
  // The home-page layout still uses "layout" intentionally so the
  // featured event swap propagates instantly to every public route.
  safe("/", "layout")
}

/**
 * Upload a speaker headshot to Supabase Storage.
 * Accepts FormData with a "headshot" file field.
 * Returns the public URL.
 */
/**
 * Upload a speaker headshot. Uses the service-role admin client so
 * storage.objects RLS can't silently block, wraps the call in a 30s
 * timeout so it can't hang the admin UI, and returns the real error
 * message to the caller so it surfaces in the form.
 */
async function uploadSpeakerHeadshot(
  file: File,
): Promise<{ url: string | null; error: string | null }> {
  if (!file || file.size === 0) return { url: null, error: null }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase()
    .slice(0, 50) || "speaker"
  const path = `speakers/${safeName}-${Date.now()}.${ext}`

  try {
    const admin = createAdminClient()
    const uploadPromise = admin.storage
      .from("public_images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      })
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Upload timed out after 30s. Try a smaller image.")),
        30_000,
      ),
    )
    const result = await Promise.race([uploadPromise, timeoutPromise])
    const error = result.error
    if (error) {
      console.error("[uploadSpeakerHeadshot] storage.upload failed:", error)
      const msg = error.message || "Unknown storage error"
      if (/bucket/i.test(msg) && /not.*found|does.*not.*exist/i.test(msg)) {
        return {
          url: null,
          error: "Storage bucket 'public_images' does not exist. Create it in Supabase → Storage (see setup-public-images-bucket.sql).",
        }
      }
      return { url: null, error: `Headshot upload failed: ${msg}` }
    }
    const { data: { publicUrl } } = admin.storage
      .from("public_images")
      .getPublicUrl(path)
    return { url: publicUrl, error: null }
  } catch (err) {
    console.error("[uploadSpeakerHeadshot] exception:", err)
    return { url: null, error: (err as Error).message }
  }
}

export async function createSpeaker(formData: FormData) {
  try {
    await requirePermission("speakers", "create")
    // Use admin client for the speakers insert — same RLS-lockdown
    // story as the CRM leads fix. requirePermission() above is the
    // gate; the DB is the storage layer. invalidateCaches() still
    // uses a cookie-backed read for the event slug lookup, which is
    // a SELECT and so works under any RLS policy.
    const { supabase } = await getAuthenticatedClient()
    const adminDb = createAdminClient()

    const eventId     = formData.get("eventId") as string
    const name        = formData.get("name") as string
    const designation = formData.get("designation") as string
    const company     = formData.get("company") as string
    const country     = formData.get("country") as string
    const bio         = formData.get("bio") as string
    const imageUrl    = formData.get("imageUrl") as string
    const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0
    const featured    = formData.get("featured") === "on" || formData.get("featured") === "true"

    // Handle file upload if a headshot file was provided
    const headshot = formData.get("headshot") as File | null
    let finalImageUrl = imageUrl || null

    if (headshot && headshot.size > 0) {
      const { url, error: uploadErr } = await uploadSpeakerHeadshot(headshot)
      if (uploadErr) return { success: false, error: uploadErr }
      if (url) finalImageUrl = url
    }

    if (!eventId || !name) {
      return { success: false, error: "Event and speaker name are required." }
    }

    const { data, error } = await adminDb
      .from("speakers")
      .insert({
        event_id: eventId,
        name,
        designation: designation || null,
        company: company || null,
        country: country || null,
        bio: bio || null,
        image_url: finalImageUrl,
        sort_order: sortOrder,
        featured,
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
    await requirePermission("speakers", "edit")
    const { supabase } = await getAuthenticatedClient()
    const adminDb = createAdminClient()

    const { data: existing } = await adminDb
      .from("speakers")
      .select("event_id, image_url")
      .eq("id", speakerId)
      .single()

    const name        = formData.get("name") as string
    const designation = formData.get("designation") as string
    const company     = formData.get("company") as string
    const country     = formData.get("country") as string
    const bio         = formData.get("bio") as string
    const imageUrl    = formData.get("imageUrl") as string
    const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0
    const featured    = formData.get("featured") === "on" || formData.get("featured") === "true"

    // Handle file upload
    const headshot = formData.get("headshot") as File | null
    let finalImageUrl = imageUrl || existing?.image_url || null

    if (headshot && headshot.size > 0) {
      const { url, error: uploadErr } = await uploadSpeakerHeadshot(headshot)
      if (uploadErr) return { success: false, error: uploadErr }
      if (url) finalImageUrl = url
    }

    if (!name) return { success: false, error: "Speaker name is required." }

    const { data, error } = await adminDb
      .from("speakers")
      .update({
        name,
        designation: designation || null,
        company: company || null,
        country: country || null,
        bio: bio || null,
        image_url: finalImageUrl,
        sort_order: sortOrder,
        featured,
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

export async function bulkCreateSpeakers(
  eventId: string,
  rows: { name: string; designation?: string; company?: string; bio?: string; image_url?: string }[]
) {
  try {
    await requirePermission("speakers", "create")
    const { supabase } = await getAuthenticatedClient()
    const adminDb = createAdminClient()
    if (!eventId || !rows.length) return { success: false, error: "No data provided." }

    const inserts = rows.map((r, i) => ({
      event_id: eventId,
      name: r.name.trim(),
      designation: r.designation?.trim() || null,
      company: r.company?.trim() || null,
      bio: r.bio?.trim() || null,
      image_url: r.image_url?.trim() || null,
      sort_order: i,
    })).filter(r => r.name)

    if (!inserts.length) return { success: false, error: "No valid rows found." }

    const { data, error } = await adminDb
      .from("speakers")
      .insert(inserts)
      .select()

    if (error) return { success: false, error: error.message }
    await invalidateCaches(supabase, eventId)
    return { success: true, count: data.length }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteSpeaker(speakerId: string) {
  try {
    await requirePermission("speakers", "delete")
    const { supabase } = await getAuthenticatedClient()
    const adminDb = createAdminClient()

    const { data: existing } = await adminDb
      .from("speakers")
      .select("event_id, image_url")
      .eq("id", speakerId)
      .single()

    // Delete the headshot from storage if it's in our bucket. The
    // storage delete also goes through the admin client so storage.objects
    // RLS can't silently block.
    if (existing?.image_url?.includes("public_images/speakers/")) {
      const match = existing.image_url.match(/\/public_images\/(.+)$/)
      if (match) {
        await adminDb.storage.from("public_images").remove([match[1]])
      }
    }

    const { error } = await adminDb.from("speakers").delete().eq("id", speakerId)
    if (error) return { success: false, error: error.message }
    if (existing?.event_id) await invalidateCaches(supabase, existing.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Manager parity helpers (full row + featured toggle) ─────────── */

export type SpeakerRow = {
  id: string
  event_id: string
  name: string
  designation: string | null
  company: string | null
  country: string | null
  bio: string | null
  image_url: string | null
  slug: string | null
  featured: boolean
  sort_order: number
  linkedin_url: string | null
  twitter_url: string | null
  email: string | null
  created_at: string
}

export async function listSpeakersFull(eventId: string): Promise<{ success: boolean; rows: SpeakerRow[]; error?: string }> {
  try {
    await requirePermission("speakers", "view")
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("speakers")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
    if (error) return { success: false, rows: [], error: error.message }
    return { success: true, rows: (data ?? []) as SpeakerRow[] }
  } catch (err) {
    return { success: false, rows: [], error: (err as Error).message }
  }
}

export async function setSpeakerFeatured(speakerId: string, featured: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("speakers", "edit")
    const admin = createAdminClient()
    const { error } = await admin
      .from("speakers")
      .update({ featured, updated_at: new Date().toISOString() })
      .eq("id", speakerId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
