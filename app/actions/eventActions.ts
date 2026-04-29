"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission } from "@/lib/server-permissions"
import { normalizeSlug } from "@/lib/slug"

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

/**
 * Upload a cover image to Supabase Storage.
 *
 * Returns { url, error }. On failure `url` is null and `error` is set
 * to something actionable (bucket missing, RLS block, size-too-big,
 * timeout, etc.) so the caller can surface it to the UI instead of
 * silently saving the event with no image.
 *
 * Uses the service-role admin client to bypass storage.objects RLS —
 * the caller has already been gated by requirePermission on the events
 * module, so we don't lose any auth here.
 *
 * Wrapped in a 30s timeout so a slow upload can't hang the server
 * action indefinitely (Vercel function timeout is 10s on Hobby, 60s on
 * Pro — we error earlier with a clearer message).
 */
async function uploadCoverImage(file: File): Promise<{ url: string | null; error: string | null }> {
  if (!file || file.size === 0) return { url: null, error: null }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase()
    .slice(0, 50) || "cover"
  const path = `events/${safeName}-${Date.now()}.${ext}`

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
        () => reject(new Error("Image upload timed out after 30s. Try a smaller file.")),
        30_000,
      ),
    )

    const result = await Promise.race([uploadPromise, timeoutPromise])
    const error = result.error

    if (error) {
      console.error("[uploadCoverImage] storage.upload failed:", error)
      // Surface the real Supabase error so the admin can fix it (bucket
      // missing, invalid MIME, RLS block, etc.)
      const msg = error.message || "Unknown storage error"
      if (/bucket/i.test(msg) && /not.*found|does.*not.*exist/i.test(msg)) {
        return {
          url: null,
          error: "Storage bucket 'public_images' does not exist. Create it in Supabase → Storage → New bucket (public).",
        }
      }
      return { url: null, error: `Image upload failed: ${msg}` }
    }

    const { data: { publicUrl } } = admin.storage
      .from("public_images")
      .getPublicUrl(path)

    return { url: publicUrl, error: null }
  } catch (err) {
    console.error("[uploadCoverImage] exception:", err)
    return { url: null, error: (err as Error).message }
  }
}

export async function createEvent(formData: FormData) {
  try {
    await requirePermission("events", "create")
    const { supabase, user } = await getAuthenticatedClient()

    const title       = formData.get("title") as string
    // Every slug write passes through normalizeSlug — kebab-case, lower-
    // case, no whitespace, no exotic characters. This is what makes
    // /events/<slug> URL lookups always match the DB row.
    const slug        = normalizeSlug((formData.get("slug") as string) ?? "")
    if (!slug) {
      return { success: false, error: "Slug is required and must contain at least one letter or digit." }
    }
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
      const { url, error: uploadErr } = await uploadCoverImage(coverFile)
      if (uploadErr) {
        // Bail early — don't silently save the event with no image when
        // the upload failed. Otherwise the user wonders why the cover
        // never appears on the site.
        return { success: false, error: uploadErr }
      }
      if (url) finalCoverUrl = url
    }

    const statusValue = (formData.get("status") as string) || "published"

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
        status: statusValue,
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
    await requirePermission("events", "edit")
    const { supabase } = await getAuthenticatedClient()

    const { data: current } = await supabase
      .from("events")
      .select("slug, cover_image_url")
      .eq("id", eventId)
      .single()

    const title       = formData.get("title") as string
    // Slug always passes through normalizeSlug — see createEvent.
    const slug        = normalizeSlug((formData.get("slug") as string) ?? "")
    if (!slug) {
      return { success: false, error: "Slug is required and must contain at least one letter or digit." }
    }
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
    const show_delegate_directory = formData.get("show_delegate_directory") === "on" || formData.get("show_delegate_directory") === "true"
    const requires_approval = formData.get("requires_approval") === "on" || formData.get("requires_approval") === "true"
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
      const { url, error: uploadErr } = await uploadCoverImage(coverFile)
      if (uploadErr) {
        return { success: false, error: uploadErr }
      }
      if (url) finalCoverUrl = url
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
        show_delegate_directory,
        requires_approval,
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
    await requirePermission("events", "delete")
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

/**
 * Clone an event with all its related data (speakers, sessions, tickets, sponsors, promo codes).
 * The cloned event is created as a draft with new title and slug.
 * Speaker-session links are preserved by mapping old IDs to new ones.
 */
export async function cloneEvent(eventId: string, newTitle: string, newSlugRaw: string) {
  try {
    await requirePermission("events", "create")
    const { supabase, user } = await getAuthenticatedClient()

    const newSlug = normalizeSlug(newSlugRaw)
    if (!newTitle || !newSlug) {
      return { success: false, error: "New title and a valid slug are required." }
    }

    // 1. Fetch the source event
    const { data: source, error: sourceError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()

    if (sourceError || !source) {
      return { success: false, error: sourceError?.message ?? "Source event not found." }
    }

    // 2. Create new event with same fields but new title/slug, status=draft
    const { data: newEvent, error: eventError } = await supabase
      .from("events")
      .insert({
        title: newTitle,
        slug: newSlug,
        start_date: source.start_date,
        end_date: source.end_date,
        venue: source.venue,
        description: source.description,
        cover_image_url: source.cover_image_url,
        status: "draft",
        created_by: user.id,
        tagline: source.tagline,
        venue_address: source.venue_address,
        registration_deadline: source.registration_deadline,
        highlights: source.highlights,
        is_featured: false,
        max_attendees: source.max_attendees,
        contact_email: source.contact_email,
        social_links: source.social_links,
        requires_approval: source.requires_approval ?? false,
      })
      .select()
      .single()

    if (eventError || !newEvent) {
      return { success: false, error: eventError?.message ?? "Failed to create cloned event." }
    }

    const newEventId = newEvent.id

    // 3. Clone speakers (build old->new ID map for session_speakers links)
    const speakerIdMap: Record<string, string> = {}
    const { data: speakers } = await supabase
      .from("speakers")
      .select("*")
      .eq("event_id", eventId)

    if (speakers && speakers.length > 0) {
      for (const speaker of speakers) {
        const { data: newSpeaker } = await supabase
          .from("speakers")
          .insert({
            event_id: newEventId,
            name: speaker.name,
            designation: speaker.designation,
            company: speaker.company,
            bio: speaker.bio,
            image_url: speaker.image_url,
            sort_order: speaker.sort_order,
          })
          .select("id")
          .single()

        if (newSpeaker) {
          speakerIdMap[speaker.id] = newSpeaker.id
        }
      }
    }

    // 4. Clone sessions (build old->new ID map for session_speakers)
    const sessionIdMap: Record<string, string> = {}
    const { data: sessions } = await supabase
      .from("sessions")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order")

    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        const { data: newSession } = await supabase
          .from("sessions")
          .insert({
            event_id: newEventId,
            title: session.title,
            description: session.description,
            start_time: session.start_time,
            end_time: session.end_time,
            track: session.track,
            session_type: session.session_type,
            room: session.room,
            capacity: session.capacity,
            sort_order: session.sort_order,
          })
          .select("id")
          .single()

        if (newSession) {
          sessionIdMap[session.id] = newSession.id
        }
      }
    }

    // 5. Clone session_speakers links using the ID maps
    const { data: sessionSpeakers } = await supabase
      .from("session_speakers")
      .select("*")
      .in("session_id", Object.keys(sessionIdMap))

    if (sessionSpeakers && sessionSpeakers.length > 0) {
      const newLinks = sessionSpeakers
        .filter(link => sessionIdMap[link.session_id] && speakerIdMap[link.speaker_id])
        .map(link => ({
          session_id: sessionIdMap[link.session_id],
          speaker_id: speakerIdMap[link.speaker_id],
        }))

      if (newLinks.length > 0) {
        await supabase.from("session_speakers").insert(newLinks)
      }
    }

    // 6. Clone tickets (sold=0)
    const { data: tickets } = await supabase
      .from("tickets")
      .select("*")
      .eq("event_id", eventId)

    if (tickets && tickets.length > 0) {
      const newTickets = tickets.map(t => ({
        event_id: newEventId,
        name: t.name,
        description: t.description,
        price_inr: t.price_inr,
        inventory_limit: t.inventory_limit,
        sold: 0,
        status: t.status,
      }))
      await supabase.from("tickets").insert(newTickets)
    }

    // 7. Clone sponsors
    const { data: sponsors } = await supabase
      .from("sponsors")
      .select("*")
      .eq("event_id", eventId)

    if (sponsors && sponsors.length > 0) {
      const newSponsors = sponsors.map(s => ({
        event_id: newEventId,
        name: s.name,
        tier: s.tier,
        logo_url: s.logo_url,
        website: s.website,
        description: s.description,
        sort_order: s.sort_order,
      }))
      await supabase.from("sponsors").insert(newSponsors)
    }

    // 8. Clone promo codes (used_count=0)
    const { data: promoCodes } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("event_id", eventId)

    if (promoCodes && promoCodes.length > 0) {
      const newPromos = promoCodes.map(p => ({
        event_id: newEventId,
        code: p.code,
        discount_type: p.discount_type,
        discount_value: p.discount_value,
        max_uses: p.max_uses,
        used_count: 0,
        valid_from: p.valid_from,
        valid_until: p.valid_until,
        active: p.active,
      }))
      await supabase.from("promo_codes").insert(newPromos)
    }

    invalidateEventCaches(newSlug)
    return { success: true, event: newEvent }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
