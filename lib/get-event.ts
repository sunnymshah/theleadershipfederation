import { cache } from "react"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

/**
 * Request-scoped cached fetch of an event by slug. Uses maybeSingle() so
 * a missing row returns null cleanly (single() throws on 0-rows under
 * some Supabase/PostgREST combos, which used to surface as a generic
 * 404 with no log).
 *
 * If the cookie-scoped client returns nothing (anon RLS on events may
 * block draft / completed rows in some projects), we fall back to the
 * service-role admin client so admins previewing draft events can
 * still see them on the public URL.
 */
export const getEvent = cache(async (slug: string) => {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .in("status", ["published", "completed"])
    .maybeSingle()

  if (error) console.error("[getEvent] cookie-client lookup failed:", slug, error.message)

  if (!data) {
    // Fallback: admin client (bypasses RLS) — log so we can see that
    // the public fetch would have 404'd without this.
    try {
      const admin = createAdminClient()
      const { data: fallback } = await admin
        .from("events")
        .select("*")
        .eq("slug", slug)
        .maybeSingle()
      if (fallback) {
        console.warn(
          `[getEvent] slug "${slug}" returned via admin fallback (status=${fallback.status}). ` +
            "Check RLS on events if this is unexpected.",
        )
        return fallback
      }
      console.warn(`[getEvent] slug "${slug}" not found in events table.`)
    } catch (err) {
      console.error("[getEvent] admin fallback threw:", err)
    }
  }

  return data
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
    .in("status", ["published", "completed"])
    .maybeSingle()
  return data
})
