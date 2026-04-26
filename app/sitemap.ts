/**
 * Dynamic sitemap.xml — emits the marketing pages plus every published
 * event microsite (home + each visible standard page slug).
 */

import type { MetadataRoute } from "next"
import { createAdminClient } from "@/utils/supabase/admin"

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.leadershipfederation.com").replace(/\/$/, "")

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The admin client throws if SUPABASE_SERVICE_ROLE_KEY is missing,
  // which happens during local builds without secrets. Degrade to a
  // marketing-only sitemap rather than failing the prerender.
  let admin: ReturnType<typeof createAdminClient> | null = null
  try { admin = createAdminClient() } catch { admin = null }

  const staticPaths = [
    "", "about", "platforms", "memberships", "events", "archive",
    "contact", "partners", "advisory-board", "media", "inner-circle",
    "terms", "privacy-policy", "refund-policy",
  ]
  const out: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${SITE_URL}/${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }))

  if (!admin) return out

  let eventRows: Array<{ id: string; slug: string; builder_published_at: string | null }> = []
  try {
    const { data } = await admin
      .from("events")
      .select("id, slug, builder_published_at")
      .in("status", ["published", "live", "completed"])
    eventRows = (data ?? []) as Array<{ id: string; slug: string; builder_published_at: string | null }>
  } catch {
    // Fall back to nothing — never break the sitemap.
  }

  if (eventRows.length === 0) return out

  const ids = eventRows.map((e) => e.id)
  let pageRows: Array<{ event_id: string; slug: string; kind: string }> = []
  try {
    const { data } = await admin
      .from("event_standard_pages")
      .select("event_id, slug, kind")
      .in("event_id", ids)
      .eq("visible", true)
    pageRows = (data ?? []) as Array<{ event_id: string; slug: string; kind: string }>
  } catch {}

  const byEvent = new Map<string, Array<{ slug: string; kind: string }>>()
  for (const r of pageRows) {
    const arr = byEvent.get(r.event_id) ?? []
    arr.push({ slug: r.slug, kind: r.kind })
    byEvent.set(r.event_id, arr)
  }

  for (const ev of eventRows) {
    const lastModified = ev.builder_published_at ? new Date(ev.builder_published_at) : undefined
    out.push({
      url: `${SITE_URL}/events/${ev.slug}`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    })
    const pages = byEvent.get(ev.id) ?? []
    for (const p of pages) {
      if (p.kind === "home" || p.kind === "signin") continue
      out.push({
        url: `${SITE_URL}/events/${ev.slug}/${p.slug}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.6,
      })
    }
  }

  return out
}
