import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { CountdownBar } from "@/components/site/CountdownBar"

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Fetch nearest upcoming published event for the countdown bar
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("title, slug, start_date")
    .eq("status", "published")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(1)

  const nextEvent = upcomingEvents?.[0] ?? undefined

  return (
    <div className="bg-[#F4F8FF] text-[#1a1a2e] min-h-screen">
      <Navbar />
      {children}
      <Footer />
      <CountdownBar event={nextEvent} />
    </div>
  )
}
