import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import Image from "next/image"
import {
  Calendar,
  MapPin,
  ArrowRight,
  Mic2,
  Ticket,
  Sparkles,
  Clock,
  Users,
  Globe,
} from "lucide-react"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"

export const revalidate = 60

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

function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
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

function fmtYear(d: string) {
  return new Date(d).getFullYear().toString()
}

function getDaysUntil(d: string) {
  const diff = new Date(d).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

export default async function EventsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

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

  // The featured event is the nearest upcoming one
  const featured = upcoming[0] ?? null
  const otherUpcoming = upcoming.slice(1)

  return (
    <main className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative pt-20 sm:pt-24 pb-10 sm:pb-14 px-4 sm:px-6 overflow-hidden">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #1a1a2e 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <div className="relative max-w-6xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up" delay={0}>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5 px-4 py-1.5 rounded-full bg-[#e7ab1c]/8 border border-[#e7ab1c]/15">
              <Globe size={12} />
              Leadership Experiences
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={80}>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#1a1a2e] mb-5 tracking-tight leading-[1.1]"
              style={sfFont}
            >
              Where Leaders{" "}
              <span className="bg-gradient-to-r from-[#e7ab1c] to-[#d49c10] bg-clip-text text-transparent">
                Converge
              </span>
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={160}>
            <p className="text-base sm:text-lg text-[#1a1a2e]/65 max-w-2xl mx-auto leading-relaxed mb-8">
              Exclusive conclaves, summits, and strategic forums uniting
              CXOs, policymakers, and thought leaders from 30+ countries.
            </p>
          </AnimateOnScroll>

          {/* Quick stats */}
          {(upcoming.length > 0 || past.length > 0) && (
            <AnimateOnScroll animation="fade-up" delay={240}>
              <div className="inline-flex items-center gap-6 sm:gap-8 text-sm text-[#1a1a2e]/60">
                {upcoming.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      <strong className="text-[#1a1a2e] font-semibold">{upcoming.length}</strong> upcoming
                    </span>
                  </div>
                )}
                {past.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1a1a2e]/20" />
                    <span>
                      <strong className="text-[#1a1a2e] font-semibold">{past.length}</strong> completed
                    </span>
                  </div>
                )}
              </div>
            </AnimateOnScroll>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
       *  FEATURED EVENT — immersive hero card
       * ═════════════════════════════════════════════════════════ */}
      {featured && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-10 sm:mb-16">
          <AnimateOnScroll animation="fade-up" delay={100}>
            <Link
              href={`/events/${featured.slug}`}
              className="group relative block rounded-3xl overflow-hidden bg-[#1a1a2e] min-h-[420px] sm:min-h-[480px]"
            >
              {/* Cover image as full background */}
              {featured.cover_image_url && (
                <Image
                  src={featured.cover_image_url}
                  alt={featured.title}
                  fill
                  className="object-cover opacity-50 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, 1200px"
                  priority
                />
              )}

              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/60 to-transparent" />

              {/* "Featured" badge */}
              <div className="absolute top-5 left-5 sm:top-6 sm:left-6 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e7ab1c] text-[#1a1a2e] text-[11px] font-bold uppercase tracking-wider">
                  <Sparkles size={11} /> Featured Event
                </span>
              </div>

              {/* Countdown badge */}
              <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-10">
                <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-[#e7ab1c]" />
                    <span className="text-white text-sm font-semibold tabular-nums">
                      {getDaysUntil(featured.start_date)} days away
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10 z-10">
                <div className="max-w-3xl">
                  {/* Date pill */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 mb-4">
                    <Calendar size={13} className="text-[#e7ab1c]" />
                    <span className="text-white/90 text-sm font-medium">
                      {fmtDate(featured.start_date)}
                      {featured.end_date && featured.end_date !== featured.start_date && ` — ${fmtDate(featured.end_date)}`}
                    </span>
                  </div>

                  <h2
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight group-hover:text-[#e7ab1c] transition-colors duration-300"
                    style={sfFont}
                  >
                    {featured.title}
                  </h2>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5 sm:mb-6">
                    {featured.venue && (
                      <span className="flex items-center gap-1.5 text-white/70 text-sm">
                        <MapPin size={14} className="text-[#e7ab1c]" />
                        {featured.venue}
                      </span>
                    )}
                    {Array.isArray(featured.speakers) && featured.speakers.length > 0 && (
                      <span className="flex items-center gap-1.5 text-white/70 text-sm">
                        <Mic2 size={14} className="text-[#e7ab1c]" />
                        {featured.speakers.length} Speaker{featured.speakers.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {Array.isArray(featured.tickets) && featured.tickets.length > 0 && (
                      <span className="flex items-center gap-1.5 text-white/70 text-sm">
                        <Ticket size={14} className="text-[#e7ab1c]" />
                        {featured.tickets.length} Ticket Tier{featured.tickets.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {featured.description && (
                    <p className="text-white/55 text-sm sm:text-base line-clamp-2 max-w-2xl mb-6 hidden sm:block">
                      {featured.description}
                    </p>
                  )}

                  {/* CTA row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-[#e7ab1c] text-[#1a1a2e] group-hover:bg-[#d49c10] transition-all shadow-[0_4px_20px_rgba(231,171,28,0.3)]">
                      Learn More <ArrowRight size={15} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Gold accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e7ab1c] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
          </AnimateOnScroll>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
       *  MORE UPCOMING EVENTS
       * ═════════════════════════════════════════════════════════ */}
      {otherUpcoming.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24">
          <AnimateOnScroll animation="fade-up">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xs font-bold text-[#1a1a2e]/80 uppercase tracking-[0.2em]">
                More Upcoming
              </h2>
              <div className="flex-1 h-px bg-[#1a1a2e]/[0.06]" />
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
            {otherUpcoming.map((event, i) => {
              const speakerCount = Array.isArray(event.speakers) ? event.speakers.length : 0
              const ticketCount = Array.isArray(event.tickets) ? event.tickets.length : 0
              const daysUntil = getDaysUntil(event.start_date)

              return (
                <AnimateOnScroll key={event.id} animation="fade-up" delay={i * 100}>
                  <Link
                    href={`/events/${event.slug}`}
                    className="group relative flex flex-col rounded-2xl overflow-hidden bg-white border border-[#1a1a2e]/[0.06] hover:shadow-[0_16px_48px_rgba(26,26,46,0.08)] hover:border-[#e7ab1c]/20 transition-all duration-300"
                  >
                    {/* Image */}
                    {event.cover_image_url && (
                      <div className="relative h-44 sm:h-52 overflow-hidden">
                        <Image
                          src={event.cover_image_url}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                        {/* Days badge */}
                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-[11px] font-bold text-[#1a1a2e] tabular-nums">
                            {daysUntil}d left
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 p-5 sm:p-6">
                      {/* Date + Venue */}
                      <div className="flex flex-wrap gap-4 text-xs text-[#1a1a2e]/60 mb-3">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={12} className="text-[#e7ab1c]" />
                          {fmtDateShort(event.start_date)}
                          {event.end_date && event.end_date !== event.start_date && ` – ${fmtDateShort(event.end_date)}`}
                        </span>
                        {event.venue && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={12} className="text-[#e7ab1c]" />
                            {event.venue}
                          </span>
                        )}
                      </div>

                      <h3
                        className="text-lg sm:text-xl font-bold text-[#1a1a2e] group-hover:text-[#e7ab1c] transition-colors duration-200 mb-2 line-clamp-2"
                        style={sfFont}
                      >
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className="text-sm text-[#1a1a2e]/60 line-clamp-2 mb-4">
                          {event.description}
                        </p>
                      )}

                      {/* Bottom meta */}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#1a1a2e]/[0.05]">
                        <div className="flex items-center gap-3 text-xs text-[#1a1a2e]/50">
                          {speakerCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Mic2 size={11} /> {speakerCount} Speaker{speakerCount !== 1 ? "s" : ""}
                            </span>
                          )}
                          {ticketCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Ticket size={11} /> {ticketCount} Tier{ticketCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#e7ab1c] group-hover:gap-2 transition-all">
                          View <ArrowRight size={13} />
                        </span>
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

      {/* ══════════════════════════════════════════════════════════
       *  PAST EVENTS
       * ═════════════════════════════════════════════════════════ */}
      {past.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
          <AnimateOnScroll animation="fade-up">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-bold text-[#1a1a2e]/65 uppercase tracking-[0.2em]">
                  Past Events
                </h2>
                <div className="flex-1 h-px bg-[#1a1a2e]/[0.06] min-w-[40px]" />
              </div>
              <Link
                href="/archive"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#e7ab1c] hover:text-[#d49c10] transition-colors"
              >
                View Archive <ArrowRight size={13} className="translate-y-px" />
              </Link>
            </div>
          </AnimateOnScroll>

          <StaggerChildren animation="fade-up" stagger={80}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {past.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group relative block rounded-2xl overflow-hidden bg-white border border-[#1a1a2e]/[0.06] hover:shadow-[0_8px_30px_rgba(26,26,46,0.06)] hover:border-[#e7ab1c]/15 transition-all duration-300"
                >
                  {/* Cover */}
                  {event.cover_image_url ? (
                    <div className="relative h-36 overflow-hidden">
                      <Image
                        src={event.cover_image_url}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out grayscale-[0.3] group-hover:grayscale-0"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />

                      {/* Year badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#1a1a2e]/70 text-white text-[10px] font-bold">
                          {fmtYear(event.start_date)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 bg-gradient-to-r from-[#1a1a2e]/5 to-[#e7ab1c]/5" />
                  )}

                  <div className="p-5">
                    <h3
                      className="text-base font-bold text-[#1a1a2e] group-hover:text-[#e7ab1c] transition-colors mb-2 line-clamp-2"
                      style={sfFont}
                    >
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-xs text-[#1a1a2e]/55">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-[#1a1a2e]/35" />
                        {fmtDate(event.start_date)}
                      </span>
                      {event.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-[#1a1a2e]/35" />
                          {event.venue}
                        </span>
                      )}
                    </div>
                  </div>

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
              <p className="text-[#1a1a2e]/65 text-sm mb-8 leading-relaxed">
                We are preparing extraordinary leadership experiences. Check
                back soon for upcoming conclaves, summits, and awards.
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
