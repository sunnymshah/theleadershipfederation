"use server"

/**
 * ─── PAGE CONTENT (GENERIC CMS) ─────────────────────────────────────────
 *
 * A single `page_content` table keyed by (page_slug, section_key) with a
 * JSONB `content` column. Lets us edit hero eyebrows, stats strips,
 * benefit cards, etc. from the admin without per-section DB tables.
 *
 * Content shapes (by convention — not enforced at the DB level):
 *   hero          { eyebrow, title, description }
 *   stats         { items: [{ value, label }, ...] }
 *   categories    { items: [{ slug, title }, ...] }
 *   benefits      { items: [{ icon, title, description }, ...] }
 *   value_props   { items: [{ icon, title, description }, ...] }
 *
 * Public reads use the cookie-free static client so they stay cacheable.
 */

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createStaticClient } from "@/utils/supabase/static"

export type PageContentRow = {
  page_slug: string
  section_key: string
  content: Record<string, unknown>
  updated_at: string
}

async function getAuthedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return supabase
}

/** Public read: one section by (page_slug, section_key). */
export async function getPageSection<T = Record<string, unknown>>(
  pageSlug: string,
  sectionKey: string
): Promise<{ content: T | null }> {
  try {
    const supabase = createStaticClient()
    const { data } = await supabase
      .from("page_content")
      .select("content")
      .eq("page_slug", pageSlug)
      .eq("section_key", sectionKey)
      .maybeSingle()
    return { content: (data?.content as T) ?? null }
  } catch {
    return { content: null }
  }
}

/** Public read: all sections for a given page, as a { section_key: content } map. */
export async function getPageSections(
  pageSlug: string
): Promise<{ sections: Record<string, Record<string, unknown>> }> {
  try {
    const supabase = createStaticClient()
    const { data } = await supabase
      .from("page_content")
      .select("section_key, content")
      .eq("page_slug", pageSlug)
    const sections: Record<string, Record<string, unknown>> = {}
    for (const row of data ?? []) {
      sections[row.section_key] = row.content as Record<string, unknown>
    }
    return { sections }
  } catch {
    return { sections: {} }
  }
}

/** Admin write: upsert one section's content. */
export async function savePageSection(
  pageSlug: string,
  sectionKey: string,
  content: Record<string, unknown>
) {
  try {
    const supabase = await getAuthedClient()
    const { error } = await supabase
      .from("page_content")
      .upsert(
        { page_slug: pageSlug, section_key: sectionKey, content, updated_at: new Date().toISOString() },
        { onConflict: "page_slug,section_key" }
      )
    if (error) return { success: false, error: error.message }

    // Revalidate whatever public page this lives on. Slug → path.
    const pathMap: Record<string, string> = {
      partners: "/partners",
      memberships: "/memberships",
      advisory_board: "/advisory-board",
    }
    const path = pathMap[pageSlug]
    if (path) revalidatePath(path)

    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
