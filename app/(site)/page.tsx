import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import dynamic from "next/dynamic"
import { LogoMarquee } from "@/components/sections/LogoMarquee"
import { EcosystemGrid } from "@/components/sections/EcosystemGrid"
import { TestimonialTicker } from "@/components/sections/TestimonialTicker"
import { NumbersReveal } from "@/components/sections/NumbersReveal"
import { SpeakerMarquee } from "@/components/sections/SpeakerMarquee"
import { FeaturedEventCallout } from "@/components/sections/FeaturedEventCallout"
import { ExclusivityCTA } from "@/components/sections/ExclusivityCTA"

const HeroSection = dynamic(
  () => import("@/components/sections/HeroSection").then(mod => ({ default: mod.HeroSection })),
  { ssr: true }
)

export const revalidate = 60

export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Fetch nearest upcoming published event for the featured callout
  const { data: dbEvents } = await supabase
    .from("events")
    .select("id, title, slug, start_date, end_date, venue, description")
    .eq("status", "published")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(1)

  const featuredEvent = dbEvents?.[0] ?? undefined

  // Fetch all speakers for the marquee
  const { data: dbSpeakers } = await supabase
    .from("speakers")
    .select("id, name, designation, company, image_url")
    .order("sort_order")
    .limit(40)

  const speakers = (dbSpeakers ?? []).map((s: { id: string; name: string; designation: string | null; company: string | null; image_url: string | null }) => ({
    name: s.name,
    role: [s.designation, s.company].filter(Boolean).join(", ") || "Speaker",
    initials: s.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
    imageUrl: s.image_url,
  }))

  return (
    <main>
      {/* Hero — light bg, typewriter + parallax image */}
      <HeroSection />

      {/* Trust bar — logos scrolling */}
      <LogoMarquee />

      {/* Ecosystem — bento grid, 3 pillars */}
      <EcosystemGrid />

      {/* Testimonials — dark, large rotating quotes */}
      <TestimonialTicker />

      {/* Numbers — dark, animated counters */}
      <NumbersReveal />

      {/* Featured event — cinematic full-bleed */}
      <FeaturedEventCallout event={featuredEvent} />

      {/* Speaker network — dark, two-row marquee */}
      <SpeakerMarquee speakers={speakers} />

      {/* CTA + press logos — light, closing section */}
      <ExclusivityCTA />
    </main>
  )
}
