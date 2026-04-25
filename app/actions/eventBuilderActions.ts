"use server"

/**
 * ── EVENT BUILDER (Puck) SERVER ACTIONS ───────────────────────────────
 *
 * Thin CRUD + publish over the Puck editor `Data` object stored on the
 * `events` table. Two columns:
 *
 *   events.builder_draft        — work-in-progress; autosaved from editor
 *   events.builder_data         — published snapshot; rendered on public page
 *   events.builder_published_at — timestamp of last publish
 *
 * Reads go through the anon client (RLS permits anon SELECT on events
 * when the event is published). Writes go through the service-role admin
 * client, gated by requirePermission("events", ...).
 *
 * Related:
 *   - supabase/migrations/add-events-builder-data.sql
 *   - components/admin/puck/PuckEventBuilder.tsx
 *   - app/(site)/events/[slug]/page.tsx (renders builder_data when set)
 */

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission } from "@/lib/server-permissions"
import { legacyToPuck, type PuckDataLike } from "@/lib/event-puck-migrate"
import type { BuilderPagesMap, BuilderPage } from "@/lib/event-builder-pages"
import { slugifyPage } from "@/lib/event-builder-pages"

/* ── Read: admin editor ───────────────────────────────────────────────── */

/**
 * Load the draft (editor state) for an event. If no draft exists but the
 * event has legacy `event_sections` rows, convert them to Puck format on
 * the fly so the admin lands on a pre-populated canvas rather than a
 * blank page.
 */
export async function getBuilderDraft(
  eventId: string,
): Promise<{ success: boolean; data: PuckDataLike | null; publishedAt: string | null; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()

    const { data: ev, error } = await admin
      .from("events")
      .select("id, title, builder_draft, builder_data, builder_published_at")
      .eq("id", eventId)
      .maybeSingle()
    if (error) return { success: false, data: null, publishedAt: null, error: error.message }
    if (!ev)   return { success: false, data: null, publishedAt: null, error: "Event not found" }

    const draft = (ev.builder_draft ?? ev.builder_data ?? null) as PuckDataLike | null

    // First-time migration: if no draft and no published data, attempt
    // to seed from legacy event_sections.
    if (!draft) {
      const { data: sections } = await admin
        .from("event_sections")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true })

      if (sections && sections.length > 0) {
        const seeded = legacyToPuck(sections as unknown as Parameters<typeof legacyToPuck>[0], {
          title: (ev.title as string) ?? "Event",
        })
        return {
          success: true,
          data: seeded,
          publishedAt: (ev.builder_published_at as string | null) ?? null,
        }
      }
    }

    return {
      success: true,
      data: draft,
      publishedAt: (ev.builder_published_at as string | null) ?? null,
    }
  } catch (err) {
    return { success: false, data: null, publishedAt: null, error: (err as Error).message }
  }
}

/**
 * Public-side read: returns the *published* Puck data only. Called from
 * /events/[slug]/page.tsx. Never returns the draft.
 */
export async function getPublishedBuilderData(
  eventId: string,
): Promise<{ success: boolean; data: PuckDataLike | null }> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data } = await supabase
      .from("events")
      .select("builder_data")
      .eq("id", eventId)
      .maybeSingle()
    return { success: true, data: (data?.builder_data ?? null) as PuckDataLike | null }
  } catch {
    return { success: false, data: null }
  }
}

/* ── Write: save draft (autosave) ─────────────────────────────────────── */

export async function saveBuilderDraft(
  eventId: string,
  data: PuckDataLike,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    if (!data || typeof data !== "object") {
      return { success: false, error: "Invalid builder data." }
    }
    const admin = createAdminClient()
    const { error } = await admin
      .from("events")
      .update({ builder_draft: data, updated_at: new Date().toISOString() })
      .eq("id", eventId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Write: publish (copy draft → live) ──────────────────────────────── */

export async function publishBuilder(
  eventId: string,
  data?: PuckDataLike,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()

    // If an explicit payload isn't provided, read the current draft.
    let payload: PuckDataLike | null = data ?? null
    if (!payload) {
      const { data: row } = await admin
        .from("events")
        .select("builder_draft")
        .eq("id", eventId)
        .maybeSingle()
      payload = (row?.builder_draft ?? null) as PuckDataLike | null
    }
    if (!payload) return { success: false, error: "No draft to publish." }

    const { data: row, error } = await admin
      .from("events")
      .update({
        builder_data: payload,
        builder_draft: payload,
        builder_published_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .select("slug")
      .single()
    if (error) return { success: false, error: error.message }

    // Revalidate the public page so the publish shows up immediately.
    if (row?.slug) {
      try { revalidatePath(`/events/${row.slug as string}`) } catch { /* ignore */ }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Write: revert draft to last published snapshot ──────────────────── */

export async function revertBuilderDraft(
  eventId: string,
): Promise<{ success: boolean; data: PuckDataLike | null; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data: row } = await admin
      .from("events")
      .select("builder_data")
      .eq("id", eventId)
      .maybeSingle()
    const live = (row?.builder_data ?? null) as PuckDataLike | null
    const { error } = await admin
      .from("events")
      .update({ builder_draft: live })
      .eq("id", eventId)
    if (error) return { success: false, data: null, error: error.message }
    return { success: true, data: live }
  } catch (err) {
    return { success: false, data: null, error: (err as Error).message }
  }
}

/* ── Reference data loaders (for Puck external fields) ───────────────── */

/**
 * Speakers attached to this event. Used by the SpeakerPicker external
 * field so admins can pick speakers from the event's own list.
 */
export async function listEventSpeakersForBuilder(
  eventId: string,
): Promise<Array<{ id: string; name: string; designation: string | null; company: string | null; image_url: string | null }>> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data } = await admin
      .from("speakers")
      .select("id, name, designation, company, image_url")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    return (data ?? []).map((r) => ({
      id: r.id as string,
      name: (r.name as string) ?? "",
      designation: (r.designation as string | null) ?? null,
      company: (r.company as string | null) ?? null,
      image_url: (r.image_url as string | null) ?? null,
    }))
  } catch {
    return []
  }
}

export async function listEventSessionsForBuilder(
  eventId: string,
): Promise<Array<{ id: string; title: string; start_time: string; end_time: string | null; track: string | null; room: string | null }>> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data } = await admin
      .from("sessions")
      .select("id, title, start_time, end_time, track, room")
      .eq("event_id", eventId)
      .order("start_time", { ascending: true })
    return (data ?? []).map((r) => ({
      id: r.id as string,
      title: (r.title as string) ?? "",
      start_time: (r.start_time as string) ?? "",
      end_time: (r.end_time as string | null) ?? null,
      track: (r.track as string | null) ?? null,
      room: (r.room as string | null) ?? null,
    }))
  } catch {
    return []
  }
}

export async function listEventSponsorsForBuilder(
  eventId: string,
): Promise<Array<{ id: string; name: string; logo_url: string | null; tier: string | null; website: string | null }>> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data } = await admin
      .from("sponsors")
      .select("id, name, logo_url, tier, website_url")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    return (data ?? []).map((r) => ({
      id: r.id as string,
      name: (r.name as string) ?? "",
      logo_url: (r.logo_url as string | null) ?? null,
      tier: (r.tier as string | null) ?? null,
      website: (r.website_url as string | null) ?? null,
    }))
  } catch {
    return []
  }
}

export async function listEventTicketsForBuilder(
  eventId: string,
): Promise<Array<{ id: string; name: string; description: string | null; price_inr: number }>> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data } = await admin
      .from("tickets")
      .select("id, name, description, price_inr")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    return (data ?? []).map((r) => ({
      id: r.id as string,
      name: (r.name as string) ?? "",
      description: (r.description as string | null) ?? null,
      price_inr: Number(r.price_inr ?? 0),
    }))
  } catch {
    return []
  }
}

/* ═════════════════════════════════════════════════════════════════════
 * MULTI-PAGE SUPPORT
 * ─────────────────────────────────────────────────────────────────────
 * Home page continues to live in builder_data / builder_draft. Sub-pages
 * live in builder_pages / builder_pages_draft as a map of slug → { title,
 * data, order? }. Reads and writes use the same admin client + perm gate
 * as the home-page equivalents above.                                   */

/** Read the full DRAFT pages map for the editor. Returns {} when the
 *  event has none yet. */
export async function getBuilderPagesDraft(
  eventId: string,
): Promise<{ success: boolean; pages: BuilderPagesMap; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("events")
      .select("builder_pages_draft, builder_pages")
      .eq("id", eventId)
      .maybeSingle()
    if (error) return { success: false, pages: {}, error: error.message }
    const draft = (data?.builder_pages_draft ?? data?.builder_pages ?? {}) as BuilderPagesMap
    return { success: true, pages: draft }
  } catch (err) {
    return { success: false, pages: {}, error: (err as Error).message }
  }
}

/** Autosave ONE sub-page. Title is optional — if omitted, the existing
 *  title is preserved. */
export async function saveBuilderPageDraft(
  eventId: string,
  pageSlug: string,
  data: PuckDataLike,
  title?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const slug = slugifyPage(pageSlug)
    if (!slug) return { success: false, error: "Invalid page slug." }
    const admin = createAdminClient()

    const { data: row } = await admin
      .from("events")
      .select("builder_pages_draft")
      .eq("id", eventId)
      .maybeSingle()
    const map = ((row?.builder_pages_draft ?? {}) as BuilderPagesMap)
    const existing = map[slug]
    if (!existing) return { success: false, error: "Page not found. Add it first." }

    const next: BuilderPagesMap = {
      ...map,
      [slug]: {
        ...existing,
        data,
        title: title ?? existing.title,
      },
    }
    const { error } = await admin
      .from("events")
      .update({ builder_pages_draft: next, updated_at: new Date().toISOString() })
      .eq("id", eventId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/** Add a new blank sub-page. Fails on duplicate slug. Returns the final
 *  slug (post-slugify) so the caller can switch to it. */
export async function addBuilderPage(
  eventId: string,
  title: string,
  desiredSlug?: string,
): Promise<{ success: boolean; slug?: string; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const slug = slugifyPage(desiredSlug || title)
    if (!slug) return { success: false, error: "Enter a page title." }

    const { data: row } = await admin
      .from("events")
      .select("builder_pages_draft")
      .eq("id", eventId)
      .maybeSingle()
    const map = ((row?.builder_pages_draft ?? {}) as BuilderPagesMap)
    if (map[slug]) return { success: false, error: "A page with that URL already exists." }

    const blank: BuilderPage = {
      title: title.trim() || slug,
      data: {
        content: [],
        root: { props: { title: title.trim() || slug } },
        zones: {},
      },
      order: Object.keys(map).length,
    }
    const next: BuilderPagesMap = { ...map, [slug]: blank }
    const { error } = await admin
      .from("events")
      .update({ builder_pages_draft: next, updated_at: new Date().toISOString() })
      .eq("id", eventId)
    if (error) return { success: false, error: error.message }
    return { success: true, slug }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/** Rename a sub-page (label AND slug). If `newSlug` resolves to the same
 *  slugified value as `oldSlug`, only the title changes.
 *
 *  When the slug DOES change, we record a redirect (oldKey → nextKey) on
 *  events.builder_pages_redirects so old shared links keep working. */
export async function renameBuilderPage(
  eventId: string,
  oldSlug: string,
  newTitle: string,
  newSlug?: string,
): Promise<{ success: boolean; slug?: string; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const oldKey = slugifyPage(oldSlug)
    const nextKey = slugifyPage(newSlug || newTitle)
    if (!oldKey || !nextKey) return { success: false, error: "Invalid slug." }

    const { data: row } = await admin
      .from("events")
      .select("builder_pages_draft, builder_pages_redirects")
      .eq("id", eventId)
      .maybeSingle()
    const map = ((row?.builder_pages_draft ?? {}) as BuilderPagesMap)
    const existing = map[oldKey]
    if (!existing) return { success: false, error: "Page not found." }

    const copy: BuilderPagesMap = { ...map }
    let redirects = (row?.builder_pages_redirects ?? {}) as Record<string, string>
    if (oldKey !== nextKey) {
      if (copy[nextKey]) return { success: false, error: "That URL is already in use." }
      delete copy[oldKey]
      // Record old → new. Also collapse transitive chains: if some
      // earlier slug X already pointed at oldKey, retarget X → nextKey
      // so we don't bounce visitors twice.
      const updated: Record<string, string> = {}
      for (const [k, v] of Object.entries(redirects)) {
        updated[k] = v === oldKey ? nextKey : v
      }
      updated[oldKey] = nextKey
      // Don't keep self-redirects (nextKey → nextKey).
      delete updated[nextKey]
      redirects = updated
    }
    copy[nextKey] = { ...existing, title: newTitle.trim() || existing.title }

    const { error } = await admin
      .from("events")
      .update({
        builder_pages_draft: copy,
        builder_pages_redirects: redirects,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
    if (error) return { success: false, error: error.message }
    return { success: true, slug: nextKey }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/** Reorder sub-pages — sets `order` on each entry to match the index in
 *  `slugs[]`. Slugs missing from the array keep their existing relative
 *  order pushed to the end. Used by the drag-reorder tab strip. */
export async function reorderBuilderPages(
  eventId: string,
  slugs: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data: row } = await admin
      .from("events")
      .select("builder_pages_draft")
      .eq("id", eventId)
      .maybeSingle()
    const map = ((row?.builder_pages_draft ?? {}) as BuilderPagesMap)
    const normalised = slugs.map((s) => slugifyPage(s)).filter(Boolean)
    const seen = new Set<string>(normalised)
    const trailing = Object.keys(map).filter((k) => !seen.has(k))

    const next: BuilderPagesMap = {}
    let i = 0
    for (const slug of [...normalised, ...trailing]) {
      const existing = map[slug]
      if (!existing) continue
      next[slug] = { ...existing, order: i++ }
    }
    const { error } = await admin
      .from("events")
      .update({ builder_pages_draft: next, updated_at: new Date().toISOString() })
      .eq("id", eventId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/** Public-side read: look up a redirect target for a missing sub-page
 *  slug. Returns null when no redirect exists. */
export async function getBuilderPageRedirect(
  eventId: string,
  fromSlug: string,
): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data } = await supabase
      .from("events")
      .select("builder_pages_redirects")
      .eq("id", eventId)
      .maybeSingle()
    const map = (data?.builder_pages_redirects ?? {}) as Record<string, string>
    const target = map[slugifyPage(fromSlug)] ?? null
    return target ? slugifyPage(target) : null
  } catch {
    return null
  }
}

/** Remove a sub-page entirely. Also removes it from the PUBLISHED map so
 *  it disappears from the public nav on next render. */
export async function deleteBuilderPage(
  eventId: string,
  pageSlug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const slug = slugifyPage(pageSlug)
    if (!slug) return { success: false, error: "Invalid slug." }

    const { data: row } = await admin
      .from("events")
      .select("builder_pages_draft, builder_pages, slug")
      .eq("id", eventId)
      .maybeSingle()
    const draftMap = ((row?.builder_pages_draft ?? {}) as BuilderPagesMap)
    const liveMap  = ((row?.builder_pages       ?? {}) as BuilderPagesMap)
    const nextDraft: BuilderPagesMap = { ...draftMap }
    const nextLive:  BuilderPagesMap = { ...liveMap }
    delete nextDraft[slug]
    delete nextLive[slug]

    const { error } = await admin
      .from("events")
      .update({
        builder_pages_draft: nextDraft,
        builder_pages: nextLive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
    if (error) return { success: false, error: error.message }

    // Keep public caches honest — both the event home and the sub-page path.
    if (row?.slug) {
      try { revalidatePath(`/events/${row.slug as string}`) } catch { /* ignore */ }
      try { revalidatePath(`/events/${row.slug as string}/p/${slug}`) } catch { /* ignore */ }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/** Publish ALL pages — flushes builder_pages_draft → builder_pages in a
 *  single write. Called alongside publishBuilder() from the editor's
 *  single Publish button so home + sub-pages go live together. */
export async function publishBuilderPages(
  eventId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data: row } = await admin
      .from("events")
      .select("builder_pages_draft, slug")
      .eq("id", eventId)
      .maybeSingle()
    const draft = (row?.builder_pages_draft ?? {}) as BuilderPagesMap
    const { error } = await admin
      .from("events")
      .update({
        builder_pages: draft,
        builder_published_at: new Date().toISOString(),
      })
      .eq("id", eventId)
    if (error) return { success: false, error: error.message }
    // Revalidate every published sub-page on this event.
    if (row?.slug) {
      for (const s of Object.keys(draft)) {
        try { revalidatePath(`/events/${row.slug as string}/p/${s}`) } catch { /* ignore */ }
      }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/** Public-side read: one sub-page's published data + the list of all
 *  published pages (for the minimal event-page nav). */
export async function getPublishedPageAndNav(
  eventId: string,
  pageSlug: string,
): Promise<{
  success: boolean
  page: BuilderPage | null
  nav: Array<{ slug: string; title: string }>
}> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data } = await supabase
      .from("events")
      .select("builder_pages")
      .eq("id", eventId)
      .maybeSingle()
    const map = (data?.builder_pages ?? {}) as BuilderPagesMap
    const page = map[slugifyPage(pageSlug)] ?? null
    const nav = Object.entries(map)
      .sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0))
      .map(([slug, p]) => ({ slug, title: p.title }))
    return { success: true, page, nav }
  } catch {
    return { success: false, page: null, nav: [] }
  }
}

/** Public-side read: just the nav list. Used by the minimal event-page
 *  layout to render the links next to "Home". */
export async function getPublicBuilderNav(
  eventId: string,
): Promise<Array<{ slug: string; title: string }>> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data } = await supabase
      .from("events")
      .select("builder_pages")
      .eq("id", eventId)
      .maybeSingle()
    const map = (data?.builder_pages ?? {}) as BuilderPagesMap
    return Object.entries(map)
      .sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0))
      .map(([slug, p]) => ({ slug, title: p.title }))
  } catch {
    return []
  }
}
