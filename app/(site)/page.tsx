import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { HeroSection } from "@/components/sections/HeroSection"
import { LogoMarquee } from "@/components/sections/LogoMarquee"
import { EcosystemGrid } from "@/components/sections/EcosystemGrid"
import { FeaturedEventCallout } from "@/components/sections/FeaturedEventCallout"
import { FeaturedEvents } from "@/components/sections/FeaturedEvents"
import { WhyLeadersEngage } from "@/components/sections/WhyLeadersEngage"
import { ShowreelSection } from "@/components/sections/ShowreelSection"
import { ExclusivityCTA } from "@/components/sections/ExclusivityCTA"

const PLACEHOLDER_EVENT = {
  id: "placeholder-001",
  title: "6th GCC Leadership Conclave — Bengaluru",
  slug: "6th-gcc-leadership-conclave-bengaluru",
  start_date: "2026-04-07T08:00:00+05:30",
  end_date: "2026-04-08T17:00:00+05:30",
  venue: "JW Marriott Hotel Bengaluru, India",
  description:
    "India's largest and most influential gathering of GCC leaders. 650+ CXOs, innovators, and policymakers discussing AI integration, cyber strategy, talent transformation, and sustainability.",
  badge: "Flagship",
}

export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: dbEvents } = await supabase
    .from("events")
    .select("id, title, slug, start_date, end_date, venue, description, cover_image_url")
    .eq("status", "published")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(3)

  const events = dbEvents && dbEvents.length > 0 ? dbEvents : [PLACEHOLDER_EVENT]
  const featuredEvent = events[0]

  return (
    <main>
      {/* 1. Hero — parallax image + word stagger + floating action bar */}
      <HeroSection />

      {/* 2. Social proof — partner logo marquee */}
      <LogoMarquee />

      {/* 3. Platform pillars — conclaves, inner circle, media */}
      <EcosystemGrid />

      {/* 4. Featured event — dark section callout */}
      <FeaturedEventCallout event={featuredEvent} />

      {/* 5. Upcoming event cards */}
      <FeaturedEvents events={events} />

      {/* 6. Why leaders engage — value proposition grid */}
      <WhyLeadersEngage />

      {/* 7. Showreel / featured video */}
      <ShowreelSection />

      {/* 8. Final CTA — explore, join, partner */}
      <ExclusivityCTA />
    </main>
  )
}
