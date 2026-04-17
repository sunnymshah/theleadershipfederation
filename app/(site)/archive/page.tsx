import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import Image from "next/image"
import {
  Calendar,
  MapPin,
  ArrowRight,
  Globe,
  Users,
  Handshake,
} from "lucide-react"
import { GoldStarburst } from "@/components/ui/GoldPattern"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"

export const revalidate = 3600

export const metadata = {
  title: "Archive — Past Events | The Leadership Federation",
  description:
    "Browse the legacy of The Leadership Federation's past events — GCC Leadership Conclaves, Asia Leadership Awards, and Bharat Leadership Summits across 30+ countries.",
}

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/* ── Series color accents ─────────────────────────────────────────── */
const seriesColors: Record<string, { bg: string; text: string; border: string }> = {
  "GCC Leadership Conclave": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  "Asia Leadership Awards": { bg: "bg-[#e7ab1c]/10", text: "text-[#e7ab1c]", border: "border-[#e7ab1c]/20" },
  "Middle East Asia Leadership Awards": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  "Bharat Leadership Excellence Awards": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  "Innovation & Startup Summit": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
}

/* ── Unified card type for rendering ──────────────────────────────── */
interface ArchiveCard {
  id: string
  title: string
  date: string
  sortDate: string
  venue: string
  city: string
  series: string
  edition: string
  description: string
  coverImage?: string
  /** External URL → opens in new tab (old events). Null → internal /events/[slug] */
  externalUrl?: string
  /** Internal slug for DB events */
  slug?: string
}

/** Try to extract an edition string like "6th", "5th" from a title */
function extractEdition(title: string): string | null {
  const match = title.match(/(\d+(?:st|nd|rd|th))/i)
  return match ? match[1] : null
}

export default async function ArchivePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  /* Fetch the latest published event for the "Next Event" banner */
  const { data: nextEvent } = await supabase
    .from("events")
    .select("id, title, slug, start_date, end_date, venue")
    .eq("status", "published")
    .order("start_date", { ascending: false })
    .limit(1)
    .single()

  /* Fetch completed events from database (new events created via admin
   * PLUS the 20 legacy rows seeded by seed-legacy-past-events.sql). */
  const { data: dbEvents } = await supabase
    .from("events")
    .select("id, title, slug, start_date, end_date, venue, description, cover_image_url, status, series, external_url")
    .eq("status", "completed")
    .order("start_date", { ascending: false })

  /* Live stat counts — honest empty state when tables have no rows yet */
  const [{ count: partnerCount }, { count: attendeeCount }] = await Promise.all([
    supabase.from("partners").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("attendees").select("*", { count: "exact", head: true }),
  ])

  /* Convert DB events to ArchiveCard format. Each event may be either:
   *   - a legacy event (external_url set) → card links to old TLF site
   *   - a native event (external_url null) → card links to /events/[slug] */
  const dbCards: ArchiveCard[] = (dbEvents ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    date: fmtDate(e.start_date),
    sortDate: e.start_date,
    venue: e.venue || "",
    city: e.venue || "",
    series: (e.series as string | null) ?? "The Leadership Federation",
    edition: extractEdition(e.title) ?? "",
    description: e.description || "",
    coverImage: e.cover_image_url || undefined,
    slug: e.slug,
    externalUrl: (e.external_url as string | null) ?? undefined,
  }))

  /* Sort DB events by date descending */
  const allCards = [...dbCards].sort(
    (a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
  )

  /* Derive unique series names from DB events for filter pills */
  const seriesNames = Array.from(new Set(allCards.map(c => c.series).filter(Boolean)))

  /* Count unique cities */
  const uniqueCities = new Set(allCards.map((e) => e.city).filter(Boolean))

  return (
    <main className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative pt-20 sm:pt-24 pb-10 sm:pb-14 px-4 sm:px-6 overflow-hidden">
        <GoldStarburst />

        {/* Gold gradient line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e7ab1c] to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5 px-4 py-1.5 rounded-full bg-[#e7ab1c]/8 border border-[#e7ab1c]/15">
              Legacy Events
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={120}>
            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-bold text-[#1a1a2e] mb-4 sm:mb-6 tracking-tight"
              style={sfFont}
            >
              Event{" "}
              <span className="bg-gradient-to-r from-[#e7ab1c] to-[#d49c10] bg-clip-text text-transparent">
                Archive
              </span>
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={240}>
            <p className="text-base sm:text-lg text-[#1a1a2e]/75 max-w-2xl mx-auto leading-relaxed px-2">
              Explore the journey of The Leadership Federation — every conclave,
              summit, and awards ceremony that has shaped global leadership
              discourse across 30+ countries.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Next Event Banner (dynamic from Supabase) ── */}
      {nextEvent && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-10 sm:mb-16">
          <Link
            href={`/events/${nextEvent.slug}`}
            className="group block relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1a1a2e] to-[#16213e] p-6 sm:p-8 md:p-12 border border-[#e7ab1c]/20 hover:border-[#e7ab1c]/40 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#e7ab1c]/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#e7ab1c]/3 blur-3xl" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
              <div>
                <span className="inline-flex items-center gap-2 text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.2em] mb-2 sm:mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Next Event
                </span>
                <h2
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2"
                  style={sfFont}
                >
                  {nextEvent.title}
                </h2>
                <p className="text-white/85 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#e7ab1c]/60" />{" "}
                    {fmtDate(nextEvent.start_date)}
                    {nextEvent.end_date &&
                      ` — ${fmtDate(nextEvent.end_date)}`}
                  </span>
                  {nextEvent.venue && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#e7ab1c]/60" />{" "}
                      {nextEvent.venue}
                    </span>
                  )}
                </p>
              </div>
              <span className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm font-semibold bg-[#e7ab1c] text-white group-hover:bg-[#d49c10] transition-colors shadow-[0_2px_12px_rgba(231,171,28,0.3)] w-full sm:w-auto">
                View Event <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* ── Series Filter Pills ── */}
      {seriesNames.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-6">
          <div className="flex flex-wrap gap-2">
            {seriesNames.map((series) => {
              const count = allCards.filter((e) => e.series === series).length
              const colors = seriesColors[series] ?? { bg: "bg-[#1a1a2e]/5", text: "text-[#1a1a2e]/40", border: "border-[#1a1a2e]/10" }
              return (
                <span
                  key={series}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${colors.bg} ${colors.text} border ${colors.border}`}
                >
                  {series}
                  <span className="opacity-60">({count})</span>
                </span>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Archive Grid ── */}
      {allCards.length > 0 && (
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 sm:pb-16">
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <h2 className="text-xs font-bold text-[#1a1a2e]/65 uppercase tracking-[0.2em]">
            Past Editions ({allCards.length} events)
          </h2>
        </div>

        <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6" animation="fade-up" stagger={80}>
          {allCards.map((event) => {
            const colors = seriesColors[event.series] ?? { bg: "bg-[#1a1a2e]/5", text: "text-[#1a1a2e]/40", border: "border-[#1a1a2e]/10" }

            const card = (
              <div className="relative flex flex-col rounded-2xl overflow-hidden bg-white border border-[#1a1a2e]/[0.06] hover:shadow-[0_12px_40px_rgba(26, 26, 46,0.08)] transition-all duration-300 h-full">
                {/* Cover area — gradient with city name */}
                <div className="relative h-44 sm:h-48 overflow-hidden">
                  {event.coverImage ? (
                    <Image
                      src={event.coverImage}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                      }}
                    >
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-2">
                        {event.series}
                      </span>
                      <span
                        className="text-3xl font-bold text-white/10"
                        style={sfFont}
                      >
                        {event.city.split(",")[0]}
                      </span>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/30 via-transparent to-transparent" />

                  {/* Edition badge */}
                  {event.edition && (
                    <div className="absolute top-3 left-3 bg-[#e7ab1c] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {event.edition} Edition
                    </div>
                  )}

                  {/* Series badge */}
                  <div className={`absolute top-3 right-3 backdrop-blur-sm text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {event.series.split(" ").map((w) => w[0]).join("")}
                  </div>

                  {/* City overlay at bottom of image */}
                  {event.venue && (
                    <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-[#1a1a2e]/60 to-transparent">
                      <span className="flex items-center gap-1.5 text-xs text-white/80 font-medium">
                        <MapPin size={12} className="text-[#e7ab1c]" />
                        {event.venue}{event.venue !== event.city ? `, ${event.city}` : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Gold bottom border accent */}
                <div className="h-[3px] bg-gradient-to-r from-[#e7ab1c]/60 via-[#e7ab1c] to-[#e7ab1c]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Content */}
                <div className="flex flex-col flex-1 p-5 sm:p-6">
                  <h3
                    className="text-base sm:text-lg font-bold text-[#1a1a2e] mb-2 group-hover:text-[#e7ab1c] transition-colors leading-snug"
                    style={sfFont}
                  >
                    {event.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#1a1a2e]/65 mb-3">
                    <Calendar size={13} className="shrink-0 text-[#e7ab1c]" />
                    {event.date}
                  </div>

                  {event.description && (
                    <p className="text-xs sm:text-sm text-[#1a1a2e]/70 line-clamp-2 mb-4 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  <div className="mt-auto pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#e7ab1c] group-hover:text-[#d49c10] transition-colors">
                      View Details{" "}
                      <ArrowRight
                        size={13}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </span>
                  </div>
                </div>
              </div>
            )

            /* Old events → external link (looks like internal). New DB events → internal page */
            if (event.externalUrl) {
              return (
                <a
                  key={event.id}
                  href={event.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  {card}
                </a>
              )
            }

            return (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="block group"
              >
                {card}
              </Link>
            )
          })}
        </StaggerChildren>
      </section>
      )}

      {/* ── Stats Summary Bar ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border border-[#e7ab1c]/15">
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#e7ab1c]/8 blur-3xl rounded-full" />

          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 p-8 sm:p-10 md:p-12">
            {[
              { icon: Calendar,  count: allCards.length,       label: "Past Events" },
              { icon: Globe,     count: uniqueCities.size,     label: "Cities" },
              { icon: Users,     count: attendeeCount ?? 0,    label: "CXOs" },
              { icon: Handshake, count: partnerCount ?? 0,     label: "Global Partners" },
            ].filter((s) => s.count > 0).map((stat) => {
              const value = `${stat.count}+`
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#e7ab1c]/10 border border-[#e7ab1c]/20 flex items-center justify-center mx-auto mb-3">
                    <Icon
                      size={20}
                      className="text-[#e7ab1c]"
                    />
                  </div>
                  <div
                    className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1"
                    style={sfFont}
                  >
                    {value}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-white/85 uppercase tracking-[0.15em]">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Gold accent line at bottom */}
          <div className="h-1 bg-gradient-to-r from-transparent via-[#e7ab1c] to-transparent" />
        </div>
      </section>
    </main>
  )
}
