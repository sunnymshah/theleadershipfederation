import { cache } from "react"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

/**
 * Request-scoped cached fetch of an event by slug.
 *
 * React `cache()` deduplicates calls with the same arguments within a
 * single server render, so `generateMetadata` and the page component
 * share one DB round-trip instead of two.
 */
export const getEvent = cache(async (slug: string) => {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .in("status", ["published", "completed"])
    .single()
  return data
})

/**
 * Request-scoped cached fetch for feedback page event data.
 */
export const getEventForFeedback = cache(async (eventSlug: string) => {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data } = await supabase
    .from("events")
    .select("id, title, slug, venue, start_date, cover_image_url")
    .eq("slug", eventSlug)
    .single()
  return data
})

/**
 * Request-scoped cached fetch for delegate directory page.
 */
export const getEventForDelegates = cache(async (slug: string) => {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data } = await supabase
    .from("events")
    .select("id, title, slug, show_delegate_directory, start_date")
    .eq("slug", slug)
    .in("status", ["published", "completed"])
    .single()
  return data
})
