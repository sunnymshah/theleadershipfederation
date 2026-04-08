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

export const revalidate = 0

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

/* ══════════════════════════════════════════════════════════════════════════
 *  HARDCODED PAST EVENTS — all editions with their original website links
 * ══════════════════════════════════════════════════════════════════════════ */

interface PastEvent {
  id: string
  title: string
  date: string          // display date string
  sortDate: string      // ISO for sorting (YYYY-MM-DD)
  venue: string
  city: string
  series: string        // event series name
  edition: string       // e.g. "1st", "5th"
  url: string           // original external link
  description: string
  coverImage?: string
}

const PAST_EVENTS: PastEvent[] = [
  // ── GCC Leadership Conclave ──────────────────────────────────────────
  {
    id: "gcc-5",
    title: "5th GCC Leadership Conclave — Pune",
    date: "21–22 January 2026",
    sortDate: "2026-01-21",
    venue: "Hyatt Pune",
    city: "Pune, India",
    series: "GCC Leadership Conclave",
    edition: "5th",
    url: "https://gcc.theleadershipfederation.com/pune",
    description: "1,000+ CXOs gathered in Pune for two days of leadership discourse, innovation showcases, and cross-industry networking.",
  },
  {
    id: "gcc-ai",
    title: "Global AI Leadership Summit — India Edition",
    date: "12 March 2026",
    sortDate: "2026-03-12",
    venue: "Hyderabad",
    city: "Hyderabad, India",
    series: "GCC Leadership Conclave",
    edition: "Special",
    url: "https://gcc.theleadershipfederation.com/ai",
    description: "A focused summit on AI-driven leadership, bringing together technology leaders and enterprise CXOs to shape the future of AI adoption.",
  },
  {
    id: "gcc-4",
    title: "4th GCC Leadership Conclave — Hyderabad",
    date: "13–14 November 2025",
    sortDate: "2025-11-13",
    venue: "ITC Kohenur",
    city: "Hyderabad, India",
    series: "GCC Leadership Conclave",
    edition: "4th",
    url: "https://gcc.theleadershipfederation.com/",
    description: "1,000+ attendees over two days at ITC Kohenur, featuring keynotes, panel discussions, and the GCC Excellence Awards.",
  },
  {
    id: "gcc-3",
    title: "3rd GCC Leadership Conclave — Bengaluru",
    date: "3 September 2025",
    sortDate: "2025-09-03",
    venue: "Bengaluru",
    city: "Bengaluru, India",
    series: "GCC Leadership Conclave",
    edition: "3rd",
    url: "https://theleadershipfederation.com/gccleadershipconclavebengaluru3rdseptember",
    description: "300+ CXOs convened in Bengaluru to discuss innovation, leadership excellence, and global capability center strategies.",
  },
  {
    id: "gcc-2",
    title: "2nd GCC Leadership Conclave — Hyderabad",
    date: "30 July 2025",
    sortDate: "2025-07-30",
    venue: "Hyderabad",
    city: "Hyderabad, India",
    series: "GCC Leadership Conclave",
    edition: "2nd",
    url: "https://gcc2.theleadershipfederation.com/",
    description: "The second edition brought GCC leaders from across India to Hyderabad for a day of strategic insights and networking.",
  },
  {
    id: "gcc-1",
    title: "1st GCC Leadership Conclave — Bengaluru",
    date: "14 May 2025",
    sortDate: "2025-05-14",
    venue: "Novotel Bengaluru Outer Ring Road",
    city: "Bengaluru, India",
    series: "GCC Leadership Conclave",
    edition: "1st",
    url: "https://gcc1.theleadershipfederation.com/",
    description: "The inaugural GCC Leadership Conclave — a landmark gathering of global capability center leaders in India's tech capital.",
  },

  // ── Asia Leadership Awards ───────────────────────────────────────────
  {
    id: "ala-7",
    title: "7th Asia Leadership Awards — Kuala Lumpur",
    date: "4 July 2025",
    sortDate: "2025-07-04",
    venue: "Aloft KL Sentral",
    city: "Kuala Lumpur, Malaysia",
    series: "Asia Leadership Awards",
    edition: "7th",
    url: "https://www.theleadershipfederation.com/7th-asia-leadership-awards-kuala-lumpur-malaysia",
    description: "Recognising outstanding leaders across Asia at the prestigious Aloft KL Sentral in Malaysia's capital.",
  },
  {
    id: "ala-6",
    title: "6th Asia Leadership Awards — Bangkok",
    date: "12 April 2025",
    sortDate: "2025-04-12",
    venue: "Pullman Bangkok Hotel G",
    city: "Bangkok, Thailand",
    series: "Asia Leadership Awards",
    edition: "6th",
    url: "https://theleadershipfederation.com/6thasialeadershipawardsbangkok",
    description: "The 6th edition returned to Bangkok to honour visionary leaders shaping Asia's business landscape.",
  },
  {
    id: "ala-5",
    title: "5th Asia Leadership Awards — Mumbai",
    date: "5 December 2024",
    sortDate: "2024-12-05",
    venue: "Radisson Blu International Airport Hotel",
    city: "Mumbai, India",
    series: "Asia Leadership Awards",
    edition: "5th",
    url: "https://www.theleadershipfederation.com/5th-asia-leadership-awards-mumbai",
    description: "Celebrating leadership excellence in India's financial capital with 200+ CXOs and industry trailblazers.",
  },
  {
    id: "ala-4",
    title: "4th Asia Leadership Awards — Bangkok",
    date: "26 July 2024",
    sortDate: "2024-07-26",
    venue: "Pullman G Hotel Bangkok",
    city: "Bangkok, Thailand",
    series: "Asia Leadership Awards",
    edition: "4th",
    url: "https://theleadershipfederation.com/winners-4th-asia-leadership-awards-bangkok",
    description: "A grand ceremony at Pullman G Hotel honouring Asia's most impactful leaders across industries.",
  },
  {
    id: "ala-3",
    title: "3rd Asia Leadership Awards — Mumbai",
    date: "30 May 2024",
    sortDate: "2024-05-30",
    venue: "Radisson Blu Mumbai International Airport Hotel",
    city: "Mumbai, India",
    series: "Asia Leadership Awards",
    edition: "3rd",
    url: "https://theleadershipfederation.com/pastwinners-asia-leadership-3rd-edition-mumbai",
    description: "The 3rd edition brought together senior executives and entrepreneurs for an evening of recognition and networking.",
  },
  {
    id: "ala-2",
    title: "2nd Asia Leadership Awards — Mumbai",
    date: "27 November 2019",
    sortDate: "2019-11-27",
    venue: "Taj Lands End",
    city: "Mumbai, India",
    series: "Asia Leadership Awards",
    edition: "2nd",
    url: "https://theleadershipfederation.com/winners-2nd-edition-asia-leadership-awards-2019-mumbai",
    description: "The second edition at the iconic Taj Lands End, recognising Asia's finest leaders before the global pandemic pause.",
  },

  // ── Middle East Asia Leadership Awards ───────────────────────────────
  {
    id: "meala-3",
    title: "3rd Middle East Asia Leadership Awards — Dubai",
    date: "5 October 2024",
    sortDate: "2024-10-05",
    venue: "Marriott Hotel",
    city: "Dubai, UAE",
    series: "Middle East Asia Leadership Awards",
    edition: "3rd",
    url: "https://theleadershipfederation.com/winners-3rd-edition-middleeastasiaawards-dubai",
    description: "200+ leaders from the Middle East and Asia gathered in Dubai to celebrate excellence in leadership and innovation.",
  },
  {
    id: "meala-2",
    title: "2nd Middle East Asia Leadership Awards — Dubai",
    date: "20 January 2024",
    sortDate: "2024-01-20",
    venue: "Dubai",
    city: "Dubai, UAE",
    series: "Middle East Asia Leadership Awards",
    edition: "2nd",
    url: "https://theleadershipfederation.com/winner-2nd-edition-middle-east-asia-leadership",
    description: "The second edition recognising exceptional leadership across the Middle East and Asia regions.",
  },

  // ── Bharat Leadership Excellence Awards ──────────────────────────────
  {
    id: "blea-2",
    title: "2nd Bharat Leadership Excellence Awards — Delhi",
    date: "1 February 2025",
    sortDate: "2025-02-01",
    venue: "Aloft by Marriott",
    city: "New Delhi, India",
    series: "Bharat Leadership Excellence Awards",
    edition: "2nd",
    url: "https://theleadershipfederation.com/2ndbharatleadershipawards",
    description: "Honouring India's most impactful leaders across government, business, and social sectors at the national capital.",
  },
  {
    id: "blea-1",
    title: "1st Bharat Leadership Excellence Awards — Delhi",
    date: "30 August 2024",
    sortDate: "2024-08-30",
    venue: "Roseate House Hotel, Aerocity",
    city: "New Delhi, India",
    series: "Bharat Leadership Excellence Awards",
    edition: "1st",
    url: "https://theleadershipfederation.com/bharatleadershipexcellenceawards",
    description: "The inaugural Bharat Leadership Excellence Awards — 200+ attendees celebrating India's leadership legacy.",
  },

  // ── Innovation & Startup Summit & Awards ─────────────────────────────
  {
    id: "issa-2",
    title: "2nd Innovation & Startup Summit & Awards — Mumbai",
    date: "17 April 2025",
    sortDate: "2025-04-17",
    venue: "Radisson Blu Mumbai International Airport",
    city: "Mumbai, India",
    series: "Innovation & Startup Summit",
    edition: "2nd",
    url: "https://theleadershipfederation.com/2ndinnovationandstartupsummitandawardsmumbai",
    description: "Startups, investors, and innovation leaders came together for a day of showcases, pitches, and awards.",
  },
  {
    id: "issa-1",
    title: "1st Innovation & Startup Summit & Awards — Dubai",
    date: "18 April 2024",
    sortDate: "2024-04-18",
    venue: "DoubleTree by Hilton — Al Jadaf",
    city: "Dubai, UAE",
    series: "Innovation & Startup Summit",
    edition: "1st",
    url: "https://theleadershipfederation.com/innovationandstartupsummitandawards",
    description: "The first-ever Innovation & Startup Summit bringing together entrepreneurs and investors in Dubai.",
  },
]

/* ── Series color accents ─────────────────────────────────────────── */
const seriesColors: Record<string, { bg: string; text: string; border: string }> = {
  "GCC Leadership Conclave": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  "Asia Leadership Awards": { bg: "bg-[#e7ab1c]/10", text: "text-[#e7ab1c]", border: "border-[#e7ab1c]/20" },
  "Middle East Asia Leadership Awards": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  "Bharat Leadership Excellence Awards": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  "Innovation & Startup Summit": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
}

/* ── Series badge for the dark stat bar ──────────────────────────── */
const seriesNames = [
  "GCC Leadership Conclave",
  "Asia Leadership Awards",
  "Middle East Asia Leadership Awards",
  "Bharat Leadership Excellence Awards",
  "Innovation & Startup Summit",
]

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

  /* Fetch completed events from database (new events created via admin) */
  const { data: dbEvents } = await supabase
    .from("events")
    .select("id, title, slug, start_date, end_date, venue, description, cover_image_url, status")
    .eq("status", "completed")
    .order("start_date", { ascending: false })

  /* Convert DB events to ArchiveCard format — these get internal pages */
  const dbCards: ArchiveCard[] = (dbEvents ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    date: fmtDate(e.start_date),
    sortDate: e.start_date,
    venue: e.venue || "",
    city: e.venue || "",
    series: "The Leadership Federation",
    edition: extractEdition(e.title) ?? "",
    description: e.description || "",
    coverImage: e.cover_image_url || undefined,
    slug: e.slug,
  }))

  /* Convert hardcoded old events to ArchiveCard format — these get external links */
  const legacyCards: ArchiveCard[] = PAST_EVENTS.map((e) => ({
    ...e,
    externalUrl: e.url,
    coverImage: e.coverImage,
  }))

  /* Merge and sort by date descending (DB events appear alongside legacy) */
  const allCards = [...dbCards, ...legacyCards].sort(
    (a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
  )

  /* Count unique cities */
  const uniqueCities = new Set(allCards.map((e) => e.city).filter(Boolean))

  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      {/* ── Hero ── */}
      <section className="relative pt-28 sm:pt-36 pb-14 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        <GoldStarburst />

        {/* Gold gradient line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e7ab1c] to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5 px-4 py-1.5 rounded-full bg-[#e7ab1c]/8 border border-[#e7ab1c]/15">
            Legacy Events
          </span>
          <h1
            className="text-4xl sm:text-5xl md:text-7xl font-bold text-black mb-4 sm:mb-6 tracking-tight"
            style={sfFont}
          >
            Event{" "}
            <span className="bg-gradient-to-r from-[#e7ab1c] to-[#d49c10] bg-clip-text text-transparent">
              Archive
            </span>
          </h1>
          <p className="text-base sm:text-lg text-black/40 max-w-2xl mx-auto leading-relaxed px-2">
            Explore the journey of The Leadership Federation — every conclave,
            summit, and awards ceremony that has shaped global leadership
            discourse across 30+ countries.
          </p>
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
                <p className="text-white/40 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
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
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-6">
        <div className="flex flex-wrap gap-2">
          {seriesNames.map((series) => {
            const count = PAST_EVENTS.filter((e) => e.series === series).length
            const colors = seriesColors[series] ?? { bg: "bg-black/5", text: "text-black/40", border: "border-black/10" }
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

      {/* ── Archive Grid ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 sm:pb-16">
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <h2 className="text-xs font-bold text-black/25 uppercase tracking-[0.2em]">
            Past Editions ({allCards.length} events)
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {allCards.map((event) => {
            const colors = seriesColors[event.series] ?? { bg: "bg-black/5", text: "text-black/40", border: "border-black/10" }

            const card = (
              <div className="relative flex flex-col rounded-2xl overflow-hidden bg-white border border-black/[0.06] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 h-full">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

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
                    <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent">
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
                    className="text-base sm:text-lg font-bold text-black mb-2 group-hover:text-[#e7ab1c] transition-colors leading-snug"
                    style={sfFont}
                  >
                    {event.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-black/35 mb-3">
                    <Calendar size={13} className="shrink-0 text-black/20" />
                    {event.date}
                  </div>

                  {event.description && (
                    <p className="text-xs sm:text-sm text-black/30 line-clamp-2 mb-4 leading-relaxed">
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
        </div>
      </section>

      {/* ── Stats Summary Bar ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border border-[#e7ab1c]/15">
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#e7ab1c]/8 blur-3xl rounded-full" />

          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 p-8 sm:p-10 md:p-12">
            {[
              {
                icon: Calendar,
                value: `${allCards.length}+`,
                label: "Past Events",
              },
              { icon: Globe, value: `${uniqueCities.size}+`, label: "Cities" },
              { icon: Users, value: "700+", label: "CXOs" },
              { icon: Handshake, value: "50+", label: "Global Partners" },
            ].map((stat) => {
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
                    {stat.value}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-white/30 uppercase tracking-[0.15em]">
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
