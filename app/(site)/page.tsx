import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import dynamic from "next/dynamic"
import { LogoMarquee } from "@/components/sections/LogoMarquee"
import { EcosystemGrid } from "@/components/sections/EcosystemGrid"
import { FeaturedEventCallout } from "@/components/sections/FeaturedEventCallout"
import { ExclusivityCTA } from "@/components/sections/ExclusivityCTA"

const HeroSection = dynamic(
  () => import("@/components/sections/HeroSection").then(mod => ({ default: mod.HeroSection })),
  { ssr: true }
)

export const revalidate = 3600

export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: dbEvents } = await supabase
    .from("events")
    .select("id, title, slug, start_date, end_date, venue, description")
    .eq("status", "published")
    .eq("featured_on_homepage", true)
    .order("start_date", { ascending: true })
    .limit(1)

  const featuredEvent = dbEvents?.[0] ?? undefined

  return (
    <main>
      <HeroSection />
      <LogoMarquee />
      <EcosystemGrid />
      <FeaturedEventCallout event={featuredEvent} />
      <ExclusivityCTA />
    </main>
  )
}
