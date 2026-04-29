import { cache } from "react"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { normalizeSlug } from "@/lib/slug"

/**
 * Request-scoped cached fetch of an event by slug.
 *
 * Tolerance strategy (lots of 404 complaints were failing at the
 * first step — this now works much harder before giving up):
 *
 *   1. Anon/cookie client, exact slug match, no status filter.
 *   2. Service-role admin client (bypasses events RLS) exact match.
 *   3. Admin client case-insensitive ILIKE match (slug punctuation
 *      drift, trailing slash, etc.).
 *   4. Admin substring ILIKE (`%slug%`) — catches short/hand-typed
 *      slugs like `mumbai` → `gcc-leadership-conclave-mumbai-7th-edition`.
 *      Picks the most recent matching event.
 *   5. Return null — caller renders a helpful "event not found"
 *      page that shows the attempted slug.
 */
export const getEvent = cache(async (slug: string) => {
  // Step 0: decode + normalise. Strips trailing whitespace, %20, mixed
  // case — every fix-up that the route-level redirect (page.tsx) also
  // performs, so direct callers (sitemap, OG image) get the same
  // tolerance as URL-driven loads.
  const decoded = (() => {
    try { return decodeURIComponent(slug ?? "") } catch { return slug ?? "" }
  })()
  const trimmed = decoded.trim()
  const canonical = normalizeSlug(trimmed)
  // Try the canonical form first when it differs — most "mumbai " 404s
  // are the canonical "mumbai" anyway.
  if (canonical && canonical !== trimmed) {
    try {
      const cookieStore = await cookies()
      const supabase = createClient(cookieStore)
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("slug", canonical)
        .maybeSingle()
      if (data) return data
    } catch (err) {
      console.error("[getEvent] canonical lookup threw:", err)
    }
  }

  // 1. Anon client, exact match
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", trimmed)
      .maybeSingle()
    if (error) console.error("[getEvent] anon lookup error:", slug, error.message)
    if (data) return data
  } catch (err) {
    console.error("[getEvent] anon lookup threw:", err)
  }

  // 1b. Anon client, whitespace-tolerant match. Stored slugs sometimes pick
  //     up leading/trailing spaces from form input (e.g. "mumbai "); the
  //     URL param always arrives trimmed, so exact .eq() misses. We use
  //     ILIKE with an exact-content guard (trim + case-insensitive compare)
  //     so we only accept if exactly one row differs by whitespace alone.
  if (trimmed) {
    try {
      const cookieStore = await cookies()
      const supabase = createClient(cookieStore)
      const safe = trimmed.replace(/[%_]/g, "")
      const { data } = await supabase
        .from("events")
        .select("*")
        .ilike("slug", `%${safe}%`)
        .limit(5)
      const canon = (data ?? []).filter(
        (e) => (e.slug ?? "").trim().toLowerCase() === trimmed.toLowerCase(),
      )
      if (canon.length === 1) {
        console.warn(
          `[getEvent] slug matched via whitespace-tolerant anon lookup: requested="${slug}" matched="${canon[0].slug}"`,
        )
        return canon[0]
      }
    } catch (err) {
      console.error("[getEvent] anon ws-tolerant lookup threw:", err)
    }
  }

  // 2. Admin exact
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("events")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
    if (data) {
      console.warn(
        `[getEvent] slug "${slug}" only reachable via admin client ` +
        `(status=${data.status}). Check events RLS if this is unexpected.`,
      )
      return data
    }
  } catch (err) {
    console.error("[getEvent] admin exact lookup threw:", err)
  }

  // 3. Admin ILIKE fallback — catches small slug drift
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("events")
      .select("*")
      .ilike("slug", slug)
      .maybeSingle()
    if (data) {
      console.warn(
        `[getEvent] slug matched case-insensitively only: requested="${slug}" matched="${data.slug}"`,
      )
      return data
    }
  } catch (err) {
    console.error("[getEvent] admin ILIKE threw:", err)
  }

  // 4. Admin substring ILIKE — catches short hand-typed slugs
  //    (e.g. "mumbai" → "gcc-leadership-conclave-mumbai-7th-edition").
  //    Guard: require ≥ 3 chars so we don't match indiscriminately.
  if (slug.length >= 3) {
    try {
      const admin = createAdminClient()
      const safe = slug.replace(/[%_]/g, "")
      const { data } = await admin
        .from("events")
        .select("*")
        .ilike("slug", `%${safe}%`)
        .order("start_date", { ascending: false, nullsFirst: false })
        .limit(1)
      const match = data && data[0]
      if (match) {
        console.warn(
          `[getEvent] slug matched via substring: requested="${slug}" matched="${match.slug}"`,
        )
        return match
      }
    } catch (err) {
      console.error("[getEvent] admin substring ILIKE threw:", err)
    }

    // 4b. Also try matching against the event title (e.g. "mumbai" in
    //     "GCC Leadership Conclave - Mumbai - 7th Edition").
    try {
      const admin = createAdminClient()
      const safe = slug.replace(/[%_]/g, " ")
      const { data } = await admin
        .from("events")
        .select("*")
        .ilike("title", `%${safe}%`)
        .order("start_date", { ascending: false, nullsFirst: false })
        .limit(1)
      const match = data && data[0]
      if (match) {
        console.warn(
          `[getEvent] slug matched via title substring: requested="${slug}" matched="${match.slug}" title="${match.title}"`,
        )
        return match
      }
    } catch (err) {
      console.error("[getEvent] admin title ILIKE threw:", err)
    }
  }

  console.warn(`[getEvent] slug "${slug}" not found in events table at all.`)
  return null
})

export const getEventForFeedback = cache(async (eventSlug: string) => {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data } = await supabase
    .from("events")
    .select("id, title, slug, venue, start_date, cover_image_url")
    .eq("slug", eventSlug)
    .maybeSingle()
  return data
})

export const getEventForDelegates = cache(async (slug: string) => {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data } = await supabase
    .from("events")
    .select("id, title, slug, show_delegate_directory, start_date")
    .eq("slug", slug)
    .maybeSingle()
  return data
})
