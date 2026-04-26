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

function slugifyPageSlug(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

async function ensureSeeded(eventId: string): Promise<void> {
  const admin = createAdminClient()
  const { count } = await admin
    .from("event_standard_pages")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
  if ((count ?? 0) > 0) return
  const rows = STANDARD_PAGE_KINDS.map((kind) => ({
    event_id: eventId,
    kind,
    label: DEFAULT_PAGE_LABELS[kind],
    slug: DEFAULT_PAGE_SLUGS[kind],
    sort_order: DEFAULT_PAGE_ORDER[kind],
    visible: DEFAULT_PAGE_VISIBLE[kind],
    settings: {},
  }))
  await admin.from("event_standard_pages").upsert(rows, {
    onConflict: "event_id,kind",
    ignoreDuplicates: true,
  })
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

/** Public read — only visible pages, anon-bound (RLS enforces). */
export async function listVisibleStandardPagesPublic(
  eventId: string,
): Promise<Array<Pick<StandardPageRow, "id" | "kind" | "label" | "slug" | "sort_order">>> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data } = await supabase
      .from("event_standard_pages")
      .select("id, kind, label, slug, sort_order")
      .eq("event_id", eventId)
      .eq("visible", true)
      .order("sort_order", { ascending: true })
    return (data ?? []) as Array<Pick<StandardPageRow, "id" | "kind" | "label" | "slug" | "sort_order">>
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
