"use server"

/**
 * ── STANDARD PAGES (Phase 5) — server actions ─────────────────────────
 *
 * Every event has 12 fixed pages (kinds defined in lib/standard-pages.ts).
 * Admins can:
 *   - rename labels + slugs
 *   - toggle visibility (controls whether the page shows in public nav
 *     and renders at /events/{slug}/{pageSlug})
 *   - reorder
 *   - reset a page's Puck data back to the canonical default
 *   - update the per-page Puck data (called from the editor as the user
 *     switches pages — see PuckEventBuilder)
 *
 * No add/delete: the canonical 12 are fixed. Hide-from-nav handles
 * "remove from this event."
 */

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { requirePermission } from "@/lib/server-permissions"
import {
  STANDARD_PAGE_KINDS,
  DEFAULT_PAGE_LABELS,
  DEFAULT_PAGE_SLUGS,
  DEFAULT_PAGE_VISIBLE,
  DEFAULT_PAGE_ORDER,
  isStandardPageKind,
  type StandardPageKind,
  type StandardPageRow,
} from "@/lib/standard-pages"
import { defaultPuckDataForKind } from "@/lib/standard-page-defaults"
import type { Data as PuckData } from "@measured/puck"

/* ── helpers ──────────────────────────────────────────────────────── */

// Delegate to the canonical lib/slug.ts so every slug-writing action
// runs the same rules. Re-export at module scope for back-compat —
// existing call sites expect a sync function returning string.
import { normalizeSlug as canonicalNormalize } from "@/lib/slug"
function slugifyPageSlug(input: string): string {
  return canonicalNormalize(input)
}

async function ensureSeeded(eventId: string): Promise<void> {
  // A1: only Home is auto-seeded. The other kinds are added on demand
  // by the user via the "+ Add page" picker (addStandardPage action).
  const admin = createAdminClient()
  const { count } = await admin
    .from("event_standard_pages")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("kind", "home")
  if ((count ?? 0) > 0) return
  await admin.from("event_standard_pages").upsert(
    [{
      event_id: eventId,
      kind: "home",
      label: DEFAULT_PAGE_LABELS.home,
      slug: DEFAULT_PAGE_SLUGS.home,
      sort_order: DEFAULT_PAGE_ORDER.home,
      visible: true,
      settings: {},
    }],
    { onConflict: "event_id,kind", ignoreDuplicates: true },
  )
}

async function getEventSlug(eventId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .maybeSingle()
  return (data?.slug as string | null) ?? null
}

function revalidatePagePaths(eventSlug: string, pages: Array<{ kind: string; slug: string }>) {
  try { revalidatePath(`/events/${eventSlug}`) } catch {}
  for (const p of pages) {
    if (p.kind === "home") continue
    try { revalidatePath(`/events/${eventSlug}/${p.slug}`) } catch {}
  }
  try { revalidatePath(`/sitemap.xml`) } catch {}
}

/* ── reads ────────────────────────────────────────────────────────── */

export async function listStandardPages(
  eventId: string,
): Promise<{ success: boolean; pages: StandardPageRow[]; error?: string }> {
  try {
    await requirePermission("events", "edit")
    await ensureSeeded(eventId)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("event_standard_pages")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    if (error) return { success: false, pages: [], error: error.message }
    return { success: true, pages: (data ?? []) as StandardPageRow[] }
  } catch (err) {
    return { success: false, pages: [], error: (err as Error).message }
  }
}

/** Public read — only visible pages, anon-bound (RLS enforces).
 *  Includes settings.children for the Exhibitors dropdown in EventTopNav. */
export type PublicNavRow = Pick<StandardPageRow, "id" | "kind" | "label" | "slug" | "sort_order"> & {
  children?: Array<{ label: string; slug: string }>
}

export async function listVisibleStandardPagesPublic(
  eventId: string,
): Promise<PublicNavRow[]> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data } = await supabase
      .from("event_standard_pages")
      .select("id, kind, label, slug, sort_order, settings")
      .eq("event_id", eventId)
      .eq("visible", true)
      .order("sort_order", { ascending: true })
    return ((data ?? []) as Array<StandardPageRow>).map((r) => {
      const settings = (r.settings ?? {}) as Record<string, unknown>
      const rawChildren = Array.isArray(settings.children) ? settings.children as Array<Record<string, unknown>> : []
      const children = rawChildren
        .filter((c) => typeof c.label === "string" && typeof c.slug === "string")
        .map((c) => ({ label: c.label as string, slug: c.slug as string }))
      return {
        id: r.id, kind: r.kind, label: r.label, slug: r.slug, sort_order: r.sort_order,
        children: children.length > 0 ? children : undefined,
      }
    })
  } catch {
    return []
  }
}

export async function getStandardPageBySlugPublic(
  eventId: string,
  pageSlug: string,
): Promise<StandardPageRow | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data } = await supabase
      .from("event_standard_pages")
      .select("*")
      .eq("event_id", eventId)
      .eq("slug", pageSlug)
      .eq("visible", true)
      .maybeSingle()
    return (data as StandardPageRow | null) ?? null
  } catch {
    return null
  }
}

export async function getStandardPageByKind(
  eventId: string,
  kind: StandardPageKind,
): Promise<StandardPageRow | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("event_standard_pages")
      .select("*")
      .eq("event_id", eventId)
      .eq("kind", kind)
      .maybeSingle()
    return (data as StandardPageRow | null) ?? null
  } catch {
    return null
  }
}

/** Public read of a single page's published Puck data (with default fallback). */
export async function getStandardPagePublicData(
  eventId: string,
  kind: StandardPageKind,
): Promise<{ row: StandardPageRow | null; data: PuckData }> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: row } = await supabase
      .from("event_standard_pages")
      .select("*")
      .eq("event_id", eventId)
      .eq("kind", kind)
      .maybeSingle()
    const settings = (row?.settings ?? {}) as Record<string, unknown>
    const stored = settings.puckData as PuckData | undefined
    if (stored && Array.isArray((stored as PuckData).content) && (stored as PuckData).content.length > 0) {
      return { row: (row as StandardPageRow | null) ?? null, data: stored }
    }
    return { row: (row as StandardPageRow | null) ?? null, data: defaultPuckDataForKind(kind) }
  } catch {
    return { row: null, data: defaultPuckDataForKind(kind) }
  }
}

/* ── writes ───────────────────────────────────────────────────────── */

export async function updateStandardPage(
  eventId: string,
  kind: StandardPageKind,
  patch: { label?: string; slug?: string; visible?: boolean; sort_order?: number },
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    if (!isStandardPageKind(kind)) return { success: false, error: "Invalid page kind." }
    const admin = createAdminClient()
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (typeof patch.label === "string" && patch.label.trim().length > 0) {
      update.label = patch.label.trim().slice(0, 80)
    }
    if (typeof patch.slug === "string") {
      const slug = slugifyPageSlug(patch.slug)
      if (!slug) return { success: false, error: "Slug can't be empty." }
      update.slug = slug
    }
    if (typeof patch.visible === "boolean") update.visible = patch.visible
    if (typeof patch.sort_order === "number") update.sort_order = patch.sort_order
    const { error } = await admin
      .from("event_standard_pages")
      .update(update)
      .eq("event_id", eventId)
      .eq("kind", kind)
    if (error) return { success: false, error: error.message }
    const eventSlug = await getEventSlug(eventId)
    if (eventSlug) {
      const { data: rows } = await admin
        .from("event_standard_pages")
        .select("kind, slug")
        .eq("event_id", eventId)
      revalidatePagePaths(eventSlug, (rows ?? []) as Array<{ kind: string; slug: string }>)
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function reorderStandardPages(
  eventId: string,
  kindsInOrder: StandardPageKind[],
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    // Supabase query builders are Thenable but not Promise<unknown> per
    // strict TS — wrap via Promise.resolve() so the array type lines up.
    const updates: Promise<unknown>[] = []
    kindsInOrder.forEach((kind, idx) => {
      if (!isStandardPageKind(kind)) return
      updates.push(
        Promise.resolve(
          admin
            .from("event_standard_pages")
            .update({ sort_order: idx * 10, updated_at: new Date().toISOString() })
            .eq("event_id", eventId)
            .eq("kind", kind),
        ),
      )
    })
    await Promise.all(updates)
    const eventSlug = await getEventSlug(eventId)
    if (eventSlug) {
      try { revalidatePath(`/events/${eventSlug}`) } catch {}
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function resetStandardPage(
  eventId: string,
  kind: StandardPageKind,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    if (!isStandardPageKind(kind)) return { success: false, error: "Invalid page kind." }
    const admin = createAdminClient()
    const fresh = defaultPuckDataForKind(kind)
    const { error } = await admin
      .from("event_standard_pages")
      .update({
        settings: { puckData: fresh },
        label: DEFAULT_PAGE_LABELS[kind],
        slug: DEFAULT_PAGE_SLUGS[kind],
        visible: DEFAULT_PAGE_VISIBLE[kind],
        sort_order: DEFAULT_PAGE_ORDER[kind],
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", eventId)
      .eq("kind", kind)
    if (error) return { success: false, error: error.message }
    const eventSlug = await getEventSlug(eventId)
    if (eventSlug) {
      try { revalidatePath(`/events/${eventSlug}`) } catch {}
      const slug = DEFAULT_PAGE_SLUGS[kind]
      if (kind !== "home") {
        try { revalidatePath(`/events/${eventSlug}/${slug}`) } catch {}
      }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/** Save a page's Puck data into settings.puckData (autosave from editor). */
export async function saveStandardPagePuckData(
  eventId: string,
  kind: StandardPageKind,
  data: PuckData,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    if (!isStandardPageKind(kind)) return { success: false, error: "Invalid page kind." }
    if (!data || typeof data !== "object") return { success: false, error: "Invalid Puck data." }
    const admin = createAdminClient()

    const { data: row } = await admin
      .from("event_standard_pages")
      .select("settings")
      .eq("event_id", eventId)
      .eq("kind", kind)
      .maybeSingle()
    const settings = (row?.settings ?? {}) as Record<string, unknown>
    const next = { ...settings, puckData: data }

    const { error } = await admin
      .from("event_standard_pages")
      .update({ settings: next, updated_at: new Date().toISOString() })
      .eq("event_id", eventId)
      .eq("kind", kind)
    if (error) return { success: false, error: error.message }

    const eventSlug = await getEventSlug(eventId)
    if (eventSlug) {
      const slug = (await getStandardPageByKind(eventId, kind))?.slug ?? DEFAULT_PAGE_SLUGS[kind]
      try { revalidatePath(`/events/${eventSlug}`) } catch {}
      if (kind !== "home") {
        try { revalidatePath(`/events/${eventSlug}/${slug}`) } catch {}
      }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Optional sub-pages under Exhibitors (Phase 1.9) ─────────────── */

export async function addExhibitorChildPage(
  eventId: string,
  label: string,
): Promise<{ success: boolean; slug?: string; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const slug = slugifyPageSlug(label)
    if (!slug) return { success: false, error: "Enter a label." }
    const { data: row } = await admin
      .from("event_standard_pages")
      .select("settings")
      .eq("event_id", eventId)
      .eq("kind", "exhibitors")
      .maybeSingle()
    const settings = (row?.settings ?? {}) as Record<string, unknown>
    const children = Array.isArray(settings.children) ? (settings.children as Array<Record<string, unknown>>) : []
    if (children.find((c) => c.slug === slug)) return { success: false, error: "Slug already used." }
    children.push({ label: label.trim(), slug, content: { content: [], root: { props: {} }, zones: {} } })
    const next = { ...settings, children }
    const { error } = await admin
      .from("event_standard_pages")
      .update({ settings: next, updated_at: new Date().toISOString() })
      .eq("event_id", eventId)
      .eq("kind", "exhibitors")
    if (error) return { success: false, error: error.message }
    return { success: true, slug }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ─── A1: addStandardPage / deleteStandardPage ─────────────────────
 *
 * The pages model used to auto-seed all 12 canonical kinds. Now only
 * Home is seeded; the user adds Agenda / Speakers / etc. on demand
 * via the Pages rail. These actions back that flow.
 */

export async function addStandardPage(
  eventId: string,
  kind: StandardPageKind,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    if (!isStandardPageKind(kind)) return { success: false, error: "Invalid page kind." }
    if (kind === "home") return { success: false, error: "Home page is always present." }
    const admin = createAdminClient()
    // Pull current sort_order max to push the new page to the end.
    const { data: rows } = await admin
      .from("event_standard_pages")
      .select("sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: false })
      .limit(1)
    const nextOrder = ((rows?.[0]?.sort_order as number | undefined) ?? 0) + 10

    const { error } = await admin.from("event_standard_pages").insert({
      event_id: eventId,
      kind,
      label: DEFAULT_PAGE_LABELS[kind],
      slug: DEFAULT_PAGE_SLUGS[kind],
      sort_order: nextOrder,
      visible: true,
      settings: { puckData: defaultPuckDataForKind(kind) },
    })
    if (error) {
      // Conflict (kind already exists) — flip its visibility on instead
      // of failing.
      if (error.code === "23505") {
        await admin
          .from("event_standard_pages")
          .update({ visible: true, updated_at: new Date().toISOString() })
          .eq("event_id", eventId)
          .eq("kind", kind)
        return { success: true }
      }
      return { success: false, error: error.message }
    }
    const eventSlug = await getEventSlug(eventId)
    if (eventSlug) {
      try { revalidatePath(`/events/${eventSlug}`) } catch {}
      try { revalidatePath(`/events/${eventSlug}/${DEFAULT_PAGE_SLUGS[kind]}`) } catch {}
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/** Delete a non-home standard page. Home can't be removed. */
export async function deleteStandardPage(
  eventId: string,
  kind: StandardPageKind,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    if (kind === "home") return { success: false, error: "Home page can't be deleted." }
    const admin = createAdminClient()
    // Stash the slug for revalidation BEFORE the row goes away.
    const { data: row } = await admin
      .from("event_standard_pages")
      .select("slug")
      .eq("event_id", eventId)
      .eq("kind", kind)
      .maybeSingle()
    const slug = (row?.slug as string | undefined) ?? null
    const { error } = await admin
      .from("event_standard_pages")
      .delete()
      .eq("event_id", eventId)
      .eq("kind", kind)
    if (error) return { success: false, error: error.message }
    const eventSlug = await getEventSlug(eventId)
    if (eventSlug && slug) {
      try { revalidatePath(`/events/${eventSlug}`) } catch {}
      try { revalidatePath(`/events/${eventSlug}/${slug}`) } catch {}
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * C1: shallow-merge a settings patch into row.settings JSONB.
 * The page-settings modal uses this to save SEO + Banner sub-objects
 * without clobbering puckData (which lives at settings.puckData).
 */
export async function updateStandardPageSettings(
  eventId: string,
  kind: StandardPageKind,
  patch: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    if (!isStandardPageKind(kind)) return { success: false, error: "Invalid page kind." }
    const admin = createAdminClient()
    const { data: row } = await admin
      .from("event_standard_pages")
      .select("settings")
      .eq("event_id", eventId)
      .eq("kind", kind)
      .maybeSingle()
    const current = (row?.settings ?? {}) as Record<string, unknown>
    const next = { ...current, ...patch }
    const { error } = await admin
      .from("event_standard_pages")
      .update({ settings: next, updated_at: new Date().toISOString() })
      .eq("event_id", eventId)
      .eq("kind", kind)
    if (error) return { success: false, error: error.message }
    const eventSlug = await getEventSlug(eventId)
    if (eventSlug) {
      const slug = (await getStandardPageByKind(eventId, kind))?.slug ?? DEFAULT_PAGE_SLUGS[kind]
      try { revalidatePath(`/events/${eventSlug}`) } catch {}
      if (kind !== "home") {
        try { revalidatePath(`/events/${eventSlug}/${slug}`) } catch {}
      }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/** Returns the canonical kinds that can still be ADDED (not already
 *  on this event). Used by the "+ Add page" picker. */
export async function listAvailableStandardPageKinds(
  eventId: string,
): Promise<{ success: boolean; kinds: StandardPageKind[] }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data } = await admin
      .from("event_standard_pages")
      .select("kind")
      .eq("event_id", eventId)
    const existing = new Set<string>((data ?? []).map((r) => r.kind as string))
    const available = STANDARD_PAGE_KINDS.filter((k) => k !== "home" && !existing.has(k))
    return { success: true, kinds: available }
  } catch {
    return { success: false, kinds: [] }
  }
}
