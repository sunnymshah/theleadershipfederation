import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export const revalidate = 3600

export default async function Mumbai2026Redirect() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Find the latest published event
  const { data: event } = await supabase
    .from("events")
    .select("slug")
    .eq("status", "published")
    .order("start_date", { ascending: false })
    .limit(1)
    .single()

  if (event) {
    redirect(`/events/${event.slug}`)
  } else {
    redirect("/events")
  }
}
