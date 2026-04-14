import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import {
  Trophy,
  MapPin,
  Calendar,
  ArrowRight,
  Award,
  Star,
  Sparkles,
  Building2,
  ExternalLink,
} from "lucide-react"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"
import { WinnersFilter } from "./WinnersFilter"

export const revalidate = 3600

export const metadata = {
  title: "Award Winners | The Leadership Federation",
  description:
    "Celebrating excellence — browse past award winners from the Asia Leadership Awards, Middle East Asia Awards, Bharat Leadership Excellence Awards, and more.",
}

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

/* ── Types ─────────────────────────────────────────────────────────── */

interface AwardEdition {
  id: string
  name: string
  slug: string
  event_name: string
  year: number
  city: string | null
  country: string | null
  sort_order: number
}

interface AwardWinner {
  id: string
  edition_id: string
  name: string
  company: string | null
  designation: string | null
  award_category: string | null
  image_url: string | null
  linkedin_url: string | null
  sort_order: number
  award_editions: {
    name: string
    slug: string
    event_name: string
    year: number
    city: string | null
    country: string | null
  } | null
}

/* ── Series color map ──────────────────────────────────────────────── */

const seriesColors: Record<string, { bg: string; text: string; border: string }> = {
  "Asia Leadership Awards": { bg: "bg-[#e7ab1c]/10", text: "text-[#e7ab1c]", border: "border-[#e7ab1c]/20" },
  "Middle East Asia Leadership Awards": { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
  "Bharat Leadership Excellence Awards": { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20" },
  "Innovation & Start-up Summit": { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" },
  "Bharat Leadership Excellence Summit & Awards": { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20" },
}

function getSeriesColor(eventName: string) {
  return seriesColors[eventName] ?? { bg: "bg-[#1a1a2e]/5", text: "text-[#1a1a2e]/50", border: "border-[#1a1a2e]/10" }
}

export default async function WinnersPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  /* Fetch all editions */
  const { data: editions } = await supabase
    .from("award_editions")
    .select("*")
    .order("sort_order", { ascending: true })

  /* Fetch all winners with edition data */
  const { data: winners } = await supabase
    .from("award_winners")
    .select("*, award_editions(name, slug, event_name, year, city, country)")
    .order("sort_order", { ascending: true })

  const allEditions = (editions ?? []) as AwardEdition[]
  const allWinners = (winners ?? []) as AwardWinner[]
  const hasWinners = allWinners.length > 0

  return (
    <main className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative pt-20 sm:pt-24 pb-10 sm:pb-14 px-4 sm:px-6 overflow-hidden">
        {/* Ambient gold glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: "800px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(231,171,28,0.08) 0%, transparent 60%)",
          }}
          aria-hidden
        />

        {/* Gold gradient line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e7ab1c] to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5 px-4 py-1.5 rounded-full bg-[#e7ab1c]/8 border border-[#e7ab1c]/15">
              <Trophy size={13} />
              Award Winners
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={120}>
            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-bold text-[#1a1a2e] mb-4 sm:mb-6 tracking-tight"
              style={sfFont}
            >
              Our Award{" "}
              <span className="bg-gradient-to-r from-[#e7ab1c] to-[#d49c10] bg-clip-text text-transparent">
                Winners
              </span>
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={240}>
            <p className="text-base sm:text-lg text-[#1a1a2e]/75 max-w-2xl mx-auto leading-relaxed px-2">
              Celebrating the leaders, innovators, and changemakers who have been
              recognised for their outstanding contributions across{" "}
              {allEditions.length} editions of TLF awards.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-10 sm:mb-14">
        <AnimateOnScroll animation="scale">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border border-[#e7ab1c]/15">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#e7ab1c]/8 blur-3xl rounded-full" />
            <div className="relative z-10 grid grid-cols-3 gap-6 sm:gap-8 p-8 sm:p-10">
              {[
                { icon: Trophy, value: `${allEditions.length}`, label: "Award Editions" },
                { icon: Award, value: `${allWinners.length}+`, label: "Winners Honoured" },
                { icon: MapPin, value: `${new Set(allEditions.map(e => e.country).filter(Boolean)).size}+`, label: "Countries" },
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#e7ab1c]/10 border border-[#e7ab1c]/20 flex items-center justify-center mx-auto mb-3">
                      <Icon size={20} className="text-[#e7ab1c]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1" style={sfFont}>
                      {stat.value}
                    </div>
                    <div className="text-[10px] sm:text-xs font-bold text-white/85 uppercase tracking-[0.15em]">
                      {stat.label}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="h-1 bg-gradient-to-r from-transparent via-[#e7ab1c] to-transparent" />
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── Main content ── */}
      {hasWinners ? (
        /* Dynamic winners with filter */
        <WinnersFilter editions={allEditions} winners={allWinners} />
      ) : (
        /* Empty state — show editions as "coming soon" */
        <>
          {/* Edition cards */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 sm:pb-16">
            <AnimateOnScroll animation="fade-up">
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-2 text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-4 px-4 py-1.5 rounded-full bg-[#e7ab1c]/8 border border-[#e7ab1c]/15">
                  <Sparkles size={13} />
                  Past Editions
                </span>
                <h2
                  className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] mb-3"
                  style={sfFont}
                >
                  Award Editions
                </h2>
                <p className="text-sm sm:text-base text-[#1a1a2e]/65 max-w-xl mx-auto">
                  Winners from all past editions are being compiled and will be
                  available here soon. Browse the editions below.
                </p>
              </div>
            </AnimateOnScroll>

            <StaggerChildren
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
              animation="fade-up"
              stagger={80}
            >
              {allEditions.map((edition) => {
                const colors = getSeriesColor(edition.event_name)
                return (
                  <div
                    key={edition.id}
                    className="group relative rounded-2xl overflow-hidden bg-white border border-[#1a1a2e]/[0.06] hover:shadow-lg hover:border-[#e7ab1c]/30 transition-all duration-300"
                  >
                    {/* Gradient header */}
                    <div
                      className="relative h-36 flex flex-col items-center justify-center overflow-hidden"
                      style={{
                        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                      }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#e7ab1c]/5 blur-3xl" />
                      <Trophy size={32} className="text-[#e7ab1c]/30 mb-2" />
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
                        {edition.event_name}
                      </span>

                      {/* Series badge */}
                      <div className={`absolute top-3 right-3 ${colors.bg} ${colors.text} border ${colors.border} text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider`}>
                        {edition.year}
                      </div>
                    </div>

                    <div className="h-[3px] bg-gradient-to-r from-[#e7ab1c]/60 via-[#e7ab1c] to-[#e7ab1c]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="p-5 sm:p-6">
                      <h3
                        className="text-base sm:text-lg font-bold text-[#1a1a2e] mb-2 group-hover:text-[#e7ab1c] transition-colors leading-snug"
                        style={sfFont}
                      >
                        {edition.name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#1a1a2e]/60 mb-4">
                        {edition.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-[#e7ab1c]" />
                            {edition.city}, {edition.country}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-[#e7ab1c]" />
                          {edition.year}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e7ab1c]/8 text-[#e7ab1c] text-[11px] font-bold">
                          <Star size={11} />
                          Coming Soon
                        </span>
                        <Link
                          href="/archive"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a1a2e]/50 hover:text-[#e7ab1c] transition-colors"
                        >
                          View Event <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </StaggerChildren>
          </section>

          {/* CTA */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
            <AnimateOnScroll animation="fade-up">
              <div className="rounded-3xl bg-white border border-[#1a1a2e]/[0.06] shadow-sm p-10 md:p-16 text-center relative overflow-hidden">
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    width: "600px",
                    height: "350px",
                    borderRadius: "50%",
                    background: "radial-gradient(ellipse at center, rgba(231,171,28,0.10) 0%, transparent 60%)",
                  }}
                  aria-hidden
                />
                <div className="relative z-10">
                  <Trophy size={40} className="mx-auto mb-5 text-[#e7ab1c]" />
                  <h2
                    className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] mb-4"
                    style={sfFont}
                  >
                    Winners Gallery Coming Soon
                  </h2>
                  <p className="text-[#1a1a2e]/70 text-base leading-relaxed mb-8 max-w-xl mx-auto">
                    We are compiling the complete gallery of award winners from all
                    TLF editions. Check back soon, or explore our event archive for
                    more details.
                  </p>
                  <Link
                    href="/archive"
                    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#e7ab1c] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#d49c10] shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
                  >
                    Explore Event Archive
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </AnimateOnScroll>
          </section>
        </>
      )}
    </main>
  )
}
