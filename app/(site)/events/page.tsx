import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import Image from "next/image"
import {
  Calendar,
  MapPin,
  ArrowRight,
  Users,
  Mic2,
  Ticket,
  Sparkles,
} from "lucide-react"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"

export const revalidate = 0

export const metadata = {
  title: "Events | The Leadership Federation",
  description:
    "World-class leadership summits, conclaves, and forums bringing together CXOs, policymakers, and thought leaders.",
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function fmtMonth(d: string) {
  return new Date(d)
    .toLocaleDateString("en-IN", { month: "short" })
    .toUpperCase()
}

function fmtDay(d: string) {
  return new Date(d).getDate().toString().padStart(2, "0")
}

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

export default async function EventsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  /* Fetch published events with speaker and ticket tier counts */
  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, slug, start_date, end_date, venue, description, cover_image_url, status, speakers(id), tickets(id)"
    )
    .eq("status", "published")
    .order("start_date", { ascending: true })

  const now = new Date()
  const allEvents = events ?? []
  const upcoming = allEvents.filter((e) => new Date(e.start_date) >= now)
  const past = allEvents.filter((e) => new Date(e.start_date) < now)

  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      {/* ── Hero ── */}
      <section className="pt-20 sm:pt-24 pb-12 sm:pb-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up" delay={0}>
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5 px-4 py-1.5 rounded-full bg-[#e7ab1c]/8 border border-[#e7ab1c]/15">
              Curated Experiences
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={100}>
            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-bold text-[#1a1a2e] mb-6 tracking-tight"
              style={sfFont}
            >
              Our{" "}
              <span className="bg-gradient-to-r from-[#e7ab1c] to-[#d49c10] bg-clip-text text-transparent">
                Events
              </span>
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={200}>
            <p className="text-base sm:text-lg text-[#1a1a2e]/75 max-w-2xl mx-auto leading-relaxed">
              World-class leadership summits, conclaves, and strategic forums
              bringing together CXOs, policymakers, and visionary thought leaders
              from 30+ countries.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Upcoming Events ── */}
      {upcoming.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24">
          <div className="flex items-center gap-3 mb-8 sm:mb-10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xs font-bold text-[#1a1a2e]/80 uppercase tracking-[0.2em]">
              Upcoming Events
            </h2>
          </div>

          <div className="grid gap-6">
            {upcoming.map((event, i) => {
              const speakerCount = Array.isArray(event.speakers)
                ? event.speakers.length
                : 0
              const ticketCount = Array.isArray(event.tickets)
                ? event.tickets.length
                : 0

              return (
                <AnimateOnScroll key={event.id} animation="fade-up" delay={i * 100}>
                <Link
                  href={`/events/${event.slug}`}
                  className="group relative block rounded-2xl overflow-hidden transition-all duration-300 bg-white border border-[#1a1a2e]/[0.06] hover:shadow-[0_12px_40px_rgba(26, 26, 46,0.08)] hover:border-[#e7ab1c]/20"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Cover image */}
                    {event.cover_image_url && (
                      <div className="relative md:w-80 lg:w-96 h-48 md:h-auto shrink-0 overflow-hidden">
                        <Image
                          src={event.cover_image_url}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          sizes="(max-width: 768px) 100vw, 384px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 md:bg-gradient-to-l" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="relative z-10 flex-1 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6 sm:gap-8">
                      {/* Date block */}
                      <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex flex-col items-center justify-center bg-[#e7ab1c]/10 border border-[#e7ab1c]/20">
                        <span className="text-2xl sm:text-3xl font-bold text-[#e7ab1c] leading-none tabular-nums">
                          {fmtDay(event.start_date)}
                        </span>
                        <span className="text-[10px] font-bold text-[#e7ab1c] uppercase tracking-[0.15em] mt-1">
                          {fmtMonth(event.start_date)}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1a1a2e] group-hover:text-[#e7ab1c] transition-colors duration-300 mb-3"
                          style={sfFont}
                        >
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 sm:gap-5 text-sm text-[#1a1a2e]/75 mb-3">
                          <span className="flex items-center gap-2">
                            <Calendar
                              size={14}
                              className="text-[#e7ab1c]"
                            />
                            {fmtDate(event.start_date)}
                            {event.end_date &&
                              ` — ${fmtDate(event.end_date)}`}
                          </span>
                          {event.venue && (
                            <span className="flex items-center gap-2">
                              <MapPin
                                size={14}
                                className="text-[#e7ab1c]"
                              />
                              {event.venue}
                            </span>
                          )}
                        </div>

                        {/* Speaker and ticket tier info */}
                        <div className="flex flex-wrap gap-4 text-xs text-[#1a1a2e]/65 mb-3">
                          {speakerCount > 0 && (
                            <span className="flex items-center gap-1.5">
                              <Mic2 size={12} className="text-[#e7ab1c]" />
                              {speakerCount} Speaker
                              {speakerCount !== 1 ? "s" : ""}
                            </span>
                          )}
                          {ticketCount > 0 && (
                            <span className="flex items-center gap-1.5">
                              <Ticket
                                size={12}
                                className="text-[#e7ab1c]"
                              />
                              {ticketCount} Ticket Type
                              {ticketCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm text-[#1a1a2e]/70 line-clamp-2 max-w-2xl">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="shrink-0">
                        <span className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm font-semibold bg-[#e7ab1c] text-white group-hover:bg-[#d49c10] transition-all shadow-[0_2px_12px_rgba(231,171,28,0.25)]">
                          Register <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gold bottom accent */}
                  <div className="h-[3px] bg-gradient-to-r from-transparent via-[#e7ab1c] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
                </AnimateOnScroll>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Past Events ── */}
      {past.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <h2 className="text-xs font-bold text-[#1a1a2e]/65 uppercase tracking-[0.2em]">
              Past Events
            </h2>
            <Link
              href="/archive"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#e7ab1c] hover:text-[#d49c10] transition-colors"
            >
              View All Past Events{" "}
              <ArrowRight size={13} className="translate-y-px" />
            </Link>
          </div>

          <StaggerChildren animation="fade-up" stagger={80}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {past.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group block rounded-2xl overflow-hidden bg-white border border-[#1a1a2e]/[0.06] hover:shadow-[0_8px_30px_rgba(26, 26, 46,0.06)] hover:border-[#e7ab1c]/15 transition-all duration-300"
                >
                  {/* Compact cover */}
                  {event.cover_image_url && (
                    <div className="relative h-32 overflow-hidden">
                      <Image
                        src={event.cover_image_url}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 bg-[#e7ab1c]/10 border border-[#e7ab1c]/15">
                        <span className="text-sm font-bold text-[#e7ab1c] leading-none tabular-nums">
                          {fmtDay(event.start_date)}
                        </span>
                        <span className="text-[8px] font-bold text-[#e7ab1c] uppercase tracking-wider">
                          {fmtMonth(event.start_date)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3
                          className="text-base font-bold text-[#1a1a2e] group-hover:text-[#e7ab1c] transition-colors truncate"
                          style={sfFont}
                        >
                          {event.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-[#1a1a2e]/65">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {fmtDate(event.start_date)}
                      </span>
                      {event.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {event.venue}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Gold bottom accent */}
                  <div className="h-[2px] bg-gradient-to-r from-transparent via-[#e7ab1c] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              ))}
            </div>
          </StaggerChildren>
        </section>
      )}

      {/* ── Empty State ── */}
      {allEvents.length === 0 && (
        <AnimateOnScroll animation="scale">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center pb-20">
            <div className="max-w-md mx-auto">
              {/* Decorative icon cluster */}
              <div className="relative w-28 h-28 mx-auto mb-8">
                <div className="absolute inset-0 rounded-3xl bg-[#e7ab1c]/8 border border-[#e7ab1c]/15 rotate-6" />
                <div className="absolute inset-0 rounded-3xl bg-[#e7ab1c]/5 border border-[#e7ab1c]/10 -rotate-3" />
                <div className="relative w-full h-full rounded-3xl bg-white border border-[#e7ab1c]/20 flex items-center justify-center shadow-sm">
                  <Sparkles size={36} className="text-[#e7ab1c]" />
                </div>
              </div>

              <h3
                className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] mb-3"
                style={sfFont}
              >
                Events Coming Soon
              </h3>
              <p className="text-[#1a1a2e]/75 text-base mb-2 leading-relaxed">
                The Leadership Federation is preparing world-class experiences for
                CXOs, policymakers, and visionary leaders.
              </p>
              <p className="text-[#1a1a2e]/65 text-sm mb-8">
                Check back soon for upcoming conclaves, summits, and awards
                ceremonies.
              </p>

              <Link
                href="/archive"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-[#e7ab1c] border border-[#e7ab1c]/25 hover:bg-[#e7ab1c]/5 transition-all"
              >
                Browse Past Events <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </AnimateOnScroll>
      )}
    </main>
  )
}
