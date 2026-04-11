import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { HeroSection } from "@/components/sections/HeroSection"
import { LogoMarquee } from "@/components/sections/LogoMarquee"
import { EcosystemGrid } from "@/components/sections/EcosystemGrid"
import { TestimonialTicker } from "@/components/sections/TestimonialTicker"
import { NumbersReveal } from "@/components/sections/NumbersReveal"
import { SpeakerMarquee } from "@/components/sections/SpeakerMarquee"
import { FeaturedEventCallout } from "@/components/sections/FeaturedEventCallout"
import { ExclusivityCTA } from "@/components/sections/ExclusivityCTA"

export const revalidate = 0

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

  // Fetch counts for hero stats
  const [{ count: eventCount }, { count: speakerCount }] = await Promise.all([
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("speakers").select("*", { count: "exact", head: true }),
  ])

  // Fetch testimonials for the ticker
  const { data: dbTestimonials } = await supabase
    .from("testimonials")
    .select("name, designation, company, quote")
    .eq("is_featured", true)
    .order("sort_order")
    .limit(10)

  const testimonials = (dbTestimonials ?? []).map((t: { name: string; designation: string | null; company: string | null; quote: string }) => ({
    quote: t.quote,
    author: t.name,
    role: t.designation ?? "",
    company: t.company ?? "",
  }))

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
      <HeroSection
        event={featuredEvent ? { title: featuredEvent.title, slug: featuredEvent.slug, start_date: featuredEvent.start_date, end_date: featuredEvent.end_date, venue: featuredEvent.venue } : undefined}
        stats={{ events: eventCount ?? 0, speakers: speakerCount ?? 0 }}
      />

      {/* Trust bar — logos scrolling */}
      <LogoMarquee />

      {/* Ecosystem — bento grid, 3 pillars */}
      <EcosystemGrid />

      {/* Testimonials — only renders when real testimonials exist in DB */}
      <TestimonialTicker testimonials={testimonials} />

      {/* Numbers — dark, animated counters */}
      <NumbersReveal />

      {/* Featured event — cinematic full-bleed */}
      <FeaturedEventCallout event={featuredEvent ? { title: featuredEvent.title, slug: featuredEvent.slug, start_date: featuredEvent.start_date, end_date: featuredEvent.end_date, venue: featuredEvent.venue, description: featuredEvent.description } : undefined} />

      {/* Speaker network — dark, two-row marquee */}
      <SpeakerMarquee speakers={speakers} />

      {/* CTA + press logos — light, closing section */}
      <ExclusivityCTA />
    </main>
  )
}
