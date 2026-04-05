import { unstable_cache } from "next/cache"
import { createStaticClient } from "@/utils/supabase/static"

/* ------------------------------------------------------------------ */
/*  Generic helper                                                     */
/* ------------------------------------------------------------------ */

/**
 * Wrap any async function with `unstable_cache` (Next.js data cache).
 *
 * The wrapped function **must not** call `cookies()` or `headers()`.
 * For public-data Supabase reads use `createStaticClient()` instead of
 * the cookie-based server client.
 */
export function getCachedQuery<T>(
  queryFn: () => Promise<T>,
  keyParts: string[],
  options?: { revalidate?: number; tags?: string[] },
): Promise<T> {
  return unstable_cache(queryFn, keyParts, {
    revalidate: options?.revalidate ?? 3600, // default 1 hour
    tags: options?.tags,
  })()
}

/* ------------------------------------------------------------------ */
/*  Pre-built cached queries for common data                          */
/* ------------------------------------------------------------------ */

/** Fetch a single published/completed event by slug (public). */
export const getCachedEvent = (slug: string) =>
  getCachedQuery(
    async () => {
      const supabase = createStaticClient()
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .in("status", ["published", "completed"])
        .single()
      return data
    },
    ["event", slug],
    { revalidate: 300, tags: [`event-${slug}`] },
  )

/** Fetch event metadata (title, description, venue) by slug. */
export const getCachedEventMeta = (slug: string) =>
  getCachedQuery(
    async () => {
      const supabase = createStaticClient()
      const { data } = await supabase
        .from("events")
        .select("title, description, venue")
        .eq("slug", slug)
        .single()
      return data
    },
    ["event-meta", slug],
    { revalidate: 300, tags: [`event-${slug}`] },
  )

/** Fetch published events list. */
export const getCachedEventsList = () =>
  getCachedQuery(
    async () => {
      const supabase = createStaticClient()
      const { data } = await supabase
        .from("events")
        .select("*")
        .in("status", ["published", "completed"])
        .order("start_date", { ascending: false })
      return data ?? []
    },
    ["events-list"],
    { revalidate: 300, tags: ["events"] },
  )

/** Fetch speakers for an event. */
export const getCachedSpeakers = (eventId: string) =>
  getCachedQuery(
    async () => {
      const supabase = createStaticClient()
      const { data } = await supabase
        .from("speakers")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order")
      return data ?? []
    },
    ["speakers", eventId],
    { revalidate: 600, tags: [`event-${eventId}-speakers`] },
  )

/** Fetch published tickets for an event. */
export const getCachedTickets = (eventId: string) =>
  getCachedQuery(
    async () => {
      const supabase = createStaticClient()
      const { data } = await supabase
        .from("tickets")
        .select("*")
        .eq("event_id", eventId)
        .eq("status", "published")
        .order("price_inr")
      return data ?? []
    },
    ["tickets", eventId],
    { revalidate: 120, tags: [`event-${eventId}-tickets`] },
  )

/** Fetch sessions for an event. */
export const getCachedSessions = (eventId: string) =>
  getCachedQuery(
    async () => {
      const supabase = createStaticClient()
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("event_id", eventId)
        .order("start_time")
      return data ?? []
    },
    ["sessions", eventId],
    { revalidate: 600, tags: [`event-${eventId}-sessions`] },
  )

/** Fetch sponsors for an event. */
export const getCachedSponsors = (eventId: string) =>
  getCachedQuery(
    async () => {
      const supabase = createStaticClient()
      const { data } = await supabase
        .from("sponsors")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order")
      return data ?? []
    },
    ["sponsors", eventId],
    { revalidate: 600, tags: [`event-${eventId}-sponsors`] },
  )

/** Fetch custom fields for an event. */
export const getCachedCustomFields = (eventId: string) =>
  getCachedQuery(
    async () => {
      const supabase = createStaticClient()
      const { data } = await supabase
        .from("custom_fields")
        .select("id, field_label, field_name, field_type, options, is_required, sort_order")
        .eq("event_id", eventId)
        .order("sort_order")
      return data ?? []
    },
    ["custom-fields", eventId],
    { revalidate: 3600, tags: [`event-${eventId}-custom-fields`] },
  )
