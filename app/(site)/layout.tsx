import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { CountdownBar } from "@/components/site/CountdownBar"
import { WhatsAppButton } from "@/components/ui/WhatsAppButton"
import { createStaticClient } from "@/utils/supabase/static"

// Cache the next-event lookup for an hour so the site layout stays static.
export const revalidate = 3600

async function getNextEvent() {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from("events")
    .select("title, slug, start_date")
    .eq("status", "published")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(1)
  return data?.[0]
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const nextEvent = await getNextEvent()

  return (
    <div className="text-[#1a1a2e] min-h-screen relative">
      <Navbar />
      {children}
      <Footer />
      <WhatsAppButton />
      <CountdownBar event={nextEvent} />
    </div>
  )
}
