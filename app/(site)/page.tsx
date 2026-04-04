import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { HeroSection } from "@/components/sections/HeroSection"
import { LogoMarquee } from "@/components/sections/LogoMarquee"
import { FeaturedEventCallout } from "@/components/sections/FeaturedEventCallout"
import { EcosystemGrid } from "@/components/sections/EcosystemGrid"
import { FeaturedEvents } from "@/components/sections/FeaturedEvents"

export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: events } = await supabase
    .from("events")
    .select("id, title, slug, start_date, end_date, venue, description, cover_image_url")
    .eq("status", "published")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(3)

  const featuredEvent = events?.[0] ?? null

  return (
    <main>
      <HeroSection />
      <LogoMarquee />
      <EcosystemGrid />
      <FeaturedEventCallout event={featuredEvent} />
      <FeaturedEvents events={events ?? []} />
    </main>
  )
}
