/* ═══════════════════════════════════════════════════════════════════════════
 *  PUBLIC LANDING PAGE — Server Component
 *
 *  Fetches upcoming published events from Supabase. If the database returns
 *  0 events, renders a hardcoded "Placeholder Event" so the UI never looks
 *  broken to the public.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { HeroSection } from "@/components/sections/HeroSection"
import { LogoMarquee } from "@/components/sections/LogoMarquee"
import { FeaturedEventCallout } from "@/components/sections/FeaturedEventCallout"
import { EcosystemGrid } from "@/components/sections/EcosystemGrid"
import { FeaturedEvents } from "@/components/sections/FeaturedEvents"

/* ─── Hardcoded fallback so the site never looks empty ─────────────────── */
const PLACEHOLDER_EVENT = {
  id: "placeholder-001",
  title: "6th GCC Leadership Conclave — Bengaluru",
  slug: "6th-gcc-leadership-conclave-bengaluru",
  start_date: "2026-04-07T08:00:00+05:30",
  end_date: "2026-04-08T17:00:00+05:30",
  venue: "JW Marriott Hotel Bengaluru, India",
  description:
    "India's largest and most influential gathering of GCC leaders. 650+ CXOs, innovators, and policymakers discussing AI integration, cyber strategy, talent transformation, and sustainability.",
  cover_image_url: null,
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

  /* Use DB events if available, otherwise show the placeholder */
  const events = dbEvents && dbEvents.length > 0 ? dbEvents : [PLACEHOLDER_EVENT]
  const featuredEvent = events[0]

  return (
    <main>
      {/* 1. Hero — 50/50 parallax + floating action bar */}
      <HeroSection />

      {/* 2. Black logo marquee strip */}
      <LogoMarquee />

      {/* 3. Bento ecosystem grid */}
      <EcosystemGrid />

      {/* 4. Dark #000 featured event callout */}
      <FeaturedEventCallout event={featuredEvent} />

      {/* 5. Upcoming event cards */}
      <FeaturedEvents events={events} />
    </main>
  )
}
