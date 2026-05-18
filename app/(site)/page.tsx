import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { HeroSection } from "@/components/sections/HeroSection"
import { LogoMarquee } from "@/components/sections/LogoMarquee"
import { EcosystemGrid } from "@/components/sections/EcosystemGrid"
import { TestimonialTicker } from "@/components/sections/TestimonialTicker"
import { NumbersReveal } from "@/components/sections/NumbersReveal"
import { SpeakerMarquee } from "@/components/sections/SpeakerMarquee"
import { FeaturedEventCallout } from "@/components/sections/FeaturedEventCallout"
import { BeASpeaker } from "@/components/sections/BeASpeaker"
// ExclusivityCTA + NewsletterSection were the last two homepage
// sections — merged into one closing section, ClosingCTA.
import { ClosingCTA } from "@/components/sections/ClosingCTA"

export const revalidate = 60

export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Run all Supabase queries in parallel for faster page load
  const [
    { data: dbEvents },
    { count: eventCount },
    { count: speakerCount },
    { data: dbTestimonials },
    { data: dbSpeakers },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, slug, start_date, end_date, venue, description")
      .eq("status", "published")
      // Exclude seeded legacy events (those carry an external_url
      // pointing at the old TLF site). Per user request, the homepage
      // surfaces only the latest upcoming event managed in admin.
      .is("external_url", null)
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true })
      .limit(1),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .is("external_url", null),
    supabase.from("speakers").select("*", { count: "exact", head: true }),
    supabase
      .from("testimonials")
      .select("name, designation, company, quote")
      .eq("is_featured", true)
      .order("sort_order")
      .limit(10),
    supabase
      .from("speakers")
      .select("id, name, designation, company, image_url")
      .order("sort_order")
      .limit(40),
  ])

  const featuredEvent = dbEvents?.[0] ?? undefined

  const testimonials = (dbTestimonials ?? []).map((t: { name: string; designation: string | null; company: string | null; quote: string }) => ({
    quote: t.quote,
    author: t.name,
    role: t.designation ?? "",
    company: t.company ?? "",
  }))

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

      {/* Featured event — placed high, right under the hero + trust bar
          so the upcoming event gets prime real estate. */}
      <FeaturedEventCallout event={featuredEvent ? { title: featuredEvent.title, slug: featuredEvent.slug, start_date: featuredEvent.start_date, end_date: featuredEvent.end_date, venue: featuredEvent.venue, description: featuredEvent.description } : undefined} />

      {/* Ecosystem — bento grid, 3 pillars */}
      <EcosystemGrid />

      {/* Testimonials — only renders when real testimonials exist in DB */}
      <TestimonialTicker testimonials={testimonials} />

      {/* Numbers — dark, animated counters */}
      <NumbersReveal />

      {/* Speaker network — dark, two-row marquee */}
      <SpeakerMarquee speakers={speakers} />

      {/* Be a Speaker — dark, speaker application CTA */}
      <BeASpeaker eventCount={eventCount ?? 0} speakerCount={speakerCount ?? 0} />

      {/* Closing section — press strip + primary CTA + newsletter,
          merged into one dark band that flows into the footer. */}
      <ClosingCTA />
    </main>
  )
}
