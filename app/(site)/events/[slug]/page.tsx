import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin, Clock, Users, Building2, ArrowLeft, Ticket, Award, ExternalLink, Camera, Trophy } from "lucide-react"
import { getGalleryImages } from "@/app/actions/galleryActions"
import { getEvent } from "@/lib/get-event"
import { SpeakerGrid } from "@/components/site/SpeakerGrid"
import { getEventSections } from "@/app/actions/eventSectionActions"
import { EventSectionsRenderer } from "@/components/site/EventSections"

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  // Uses React cache() — shared with the page component so only one DB call
  const event = await getEvent(slug)
  if (!event) return { title: "Event Not Found" }
  return {
    title: `${event.title} | The Leadership Federation`,
    description: event.description ?? `${event.title} at ${event.venue}`,
  }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}
function fmtDay(d: string) {
  return new Date(d).getDate().toString()
}
function fmtMonth(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { month: "short" }).toUpperCase()
}
function fmtYear(d: string) {
  return new Date(d).getFullYear().toString()
}

function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

/** Extract first sentence from a string for the tagline */
function firstSentence(text: string): string {
  const match = text.match(/^(.+?[.!?])\s/)
  return match ? match[1] : text
}

/** Get the remainder after the first sentence */
function restOfText(text: string): string {
  const match = text.match(/^.+?[.!?]\s([\s\S]+)$/)
  return match ? match[1] : ""
}

/** Compute countdown from now to a target date (server-rendered) */
function getCountdown(targetDate: string): { days: number; hours: number; minutes: number } | null {
  const now = Date.now()
  const target = new Date(targetDate).getTime()
  const diff = target - now
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return { days, hours, minutes }
}

/** Determine event status for display */
function getEventDisplayStatus(event: { status: string; start_date: string; end_date: string }): {
  label: string
  color: string
  pulse: boolean
} {
  const now = Date.now()
  const start = new Date(event.start_date).getTime()
  const end = new Date(event.end_date).getTime()

  if (event.status === "completed" || now > end) {
    return { label: "Completed", color: "bg-blue-500/15 text-blue-700 border-blue-500/30", pulse: false }
  }
  if (now >= start && now <= end) {
    return { label: "Live Now", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", pulse: true }
  }
  return { label: "Upcoming", color: "bg-[#e7ab1c]/15 text-[#a37410] border-[#e7ab1c]/40", pulse: false }
}

/** Group sessions by date string (YYYY-MM-DD) */
function groupSessionsByDate(sessions: Array<{ start_time: string; [key: string]: unknown }>): Map<string, typeof sessions> {
  const groups = new Map<string, typeof sessions>()
  for (const session of sessions) {
    const dateKey = new Date(session.start_time).toISOString().split("T")[0]
    if (!groups.has(dateKey)) groups.set(dateKey, [])
    groups.get(dateKey)!.push(session)
  }
  return groups
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params

  // Uses React cache() — shared with generateMetadata so only one DB call
  const event = await getEvent(slug)
  if (!event) {
    // Render a diagnostic page instead of a blind 404. Helps you see
    // exactly which slug failed and what to check. Server-side this
    // logs the full trail in Vercel Function logs.
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-24">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-4 px-3 py-1 rounded-full bg-[#e7ab1c]/10 border border-[#e7ab1c]/20">
            Event not found
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-4 tracking-tight">
            We couldn&apos;t find that event
          </h1>
          <p className="text-[#1a1a2e]/70 leading-relaxed mb-6">
            The slug <code className="px-1.5 py-0.5 rounded bg-[#1a1a2e]/8 text-[13px] font-mono">{slug}</code> isn&apos;t in our events table.
            This usually means one of three things:
          </p>
          <ul className="text-left text-sm text-[#1a1a2e]/75 space-y-2 mb-8 bg-[#F4F8FF] rounded-xl p-5 border border-[#1a1a2e]/[0.06]">
            <li><strong>1.</strong> The event slug was renamed after the card was shared — check Admin → Events for the current slug.</li>
            <li><strong>2.</strong> The event was deleted. Past editions live on the Past Events page.</li>
            <li><strong>3.</strong> The slug was typed by hand with a typo — double-check the URL.</li>
          </ul>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/events"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#1a1a2e] text-white text-sm font-semibold hover:bg-[#2a2a4e] transition-colors"
            >
              ← All upcoming events
            </a>
            <a
              href="/archive"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-white border border-[#1a1a2e]/10 text-[#1a1a2e] text-sm font-semibold hover:bg-[#F4F8FF] transition-colors"
            >
              Past events →
            </a>
          </div>
        </div>
      </main>
    )
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [speakersRes, sessionsRes, sponsorsRes, sessionSpeakersRes, galleryRes, winnersRes, ticketsRes, sectionsRes] = await Promise.all([
    supabase.from("speakers").select("*").eq("event_id", event.id).order("sort_order"),
    supabase.from("sessions").select("*").eq("event_id", event.id).order("start_time"),
    supabase.from("sponsors").select("*").eq("event_id", event.id).order("sort_order"),
    supabase.from("session_speakers").select("session_id, speaker_id").in(
      "session_id",
      (await supabase.from("sessions").select("id").eq("event_id", event.id)).data?.map((s: { id: string }) => s.id) ?? []
    ),
    getGalleryImages(event.id),
    supabase.from("event_winners").select("*").eq("event_id", event.id).order("sort_order"),
    supabase.from("tickets").select("id, name, description, price_inr, sold, inventory_limit").eq("event_id", event.id).order("sort_order"),
    getEventSections(event.id),
  ])

  const speakers = speakersRes.data ?? []
  const sessions = sessionsRes.data ?? []
  const sponsors = sponsorsRes.data ?? []
  const galleryImages = galleryRes.images ?? []
  const winners = winnersRes.data ?? []
  const sessionSpeakerLinks = sessionSpeakersRes.data ?? []
  const tickets = ticketsRes.data ?? []
  const sections = sectionsRes.sections ?? []

  // ── Page-builder renderer ──────────────────────────────────────────
  // If the admin has added sections in /admin/events/<id>/builder, render
  // from them (zoho-style). Otherwise fall back to the legacy layout
  // below so existing events keep working.
  if (sections.length > 0) {
    return (
      <EventSectionsRenderer
        sections={sections}
        event={{
          id: event.id,
          slug: event.slug,
          title: event.title,
          start_date: event.start_date,
          end_date: event.end_date,
          venue: event.venue,
          description: event.description,
          cover_image_url: event.cover_image_url,
        }}
        speakers={speakers.map((s) => ({
          id: s.id,
          name: s.name,
          designation: s.designation ?? null,
          company: s.company ?? null,
          image_url: s.image_url ?? null,
        }))}
        sessions={sessions.map((s) => ({
          id: s.id,
          title: s.title,
          starts_at: s.start_time,
          ends_at: s.end_time ?? null,
          speaker_names: null,
          track: s.track ?? null,
        }))}
        sponsors={sponsors.map((s) => ({
          id: s.id,
          name: s.name,
          logo_url: s.logo_url ?? null,
          tier: s.tier ?? null,
          website: s.website_url ?? null,
        }))}
        tickets={tickets.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description ?? null,
          price_inr: t.price_inr,
          sold: t.sold ?? 0,
          inventory_limit: t.inventory_limit ?? null,
        }))}
      />
    )
  }

  // Build a map: sessionId -> speaker objects
  const speakerMap = new Map(speakers.map((s: { id: string }) => [s.id, s]))
  const sessionSpeakersMap = new Map<string, typeof speakers>()
  for (const link of sessionSpeakerLinks) {
    const sp = speakerMap.get(link.speaker_id)
    if (sp) {
      if (!sessionSpeakersMap.has(link.session_id)) sessionSpeakersMap.set(link.session_id, [])
      sessionSpeakersMap.get(link.session_id)!.push(sp)
    }
  }

  const tierOrder = ["title", "platinum", "gold", "silver", "bronze", "partner"]
  const tierLabels: Record<string, string> = {
    title: "Title Sponsor", platinum: "Platinum", gold: "Gold", silver: "Silver", bronze: "Bronze", partner: "Partners",
  }
  const tierColors: Record<string, string> = {
    title: "text-[#a37410] border-[#e7ab1c]/40", platinum: "text-zinc-600 border-zinc-300",
    gold: "text-yellow-700 border-yellow-400/40", silver: "text-zinc-500 border-zinc-400/40",
    bronze: "text-amber-700 border-amber-600/40", partner: "text-blue-700 border-blue-400/40",
  }
  const sessionTypes: Record<string, string> = {
    keynote: "bg-[#e7ab1c]/10 text-[#a37410] border border-[#e7ab1c]/30",
    session: "bg-blue-500/10 text-blue-700 border border-blue-500/20",
    panel: "bg-purple-500/10 text-purple-700 border border-purple-500/20",
    workshop: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
    break: "bg-zinc-500/10 text-zinc-600 border border-zinc-500/20",
    networking: "bg-orange-500/10 text-orange-700 border border-orange-500/20",
  }

  const eventStatus = getEventDisplayStatus(event)
  const countdown = getCountdown(event.start_date)
  const isUpcoming = event.status === "published" && countdown !== null
  const isCompleted = event.status === "completed" || !countdown
  const tagline = event.description ? firstSentence(event.description) : null
  const descriptionRemainder = event.description ? restOfText(event.description) : ""
  const hasCoverImage = !!event.cover_image_url
  const sessionsByDate = groupSessionsByDate(sessions)
  const dayDates = Array.from(sessionsByDate.keys()).sort()

  // Stats for the key stats bar
  const stats: Array<{ label: string; value: number; icon: string }> = []
  if (speakers.length > 0) stats.push({ label: speakers.length === 1 ? "Speaker" : "Speakers", value: speakers.length, icon: "speakers" })
  if (sessions.length > 0) stats.push({ label: sessions.length === 1 ? "Session" : "Sessions", value: sessions.length, icon: "sessions" })
  if (sponsors.length > 0) stats.push({ label: sponsors.length === 1 ? "Sponsor" : "Sponsors", value: sponsors.length, icon: "sponsors" })
  if (winners.length > 0) stats.push({ label: winners.length === 1 ? "Winner" : "Winners", value: winners.length, icon: "winners" })

  return (
    <div className="min-h-screen">
      {/* No pricing on event page — all registration happens via /tickets */}

      {/* ────────────────────────────────────────────────────────────
       *  1. HERO SECTION — Full-width, immersive
       * ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex flex-col justify-end overflow-hidden">
        {/* Background: cover image or gradient */}
        {hasCoverImage ? (
          <>
            <div className="absolute inset-0">
              <Image
                src={event.cover_image_url}
                alt=""
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            </div>
            {/* Dark overlay for text readability over the cover image */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14]/95 via-[#0a0a14]/70 to-[#0a0a14]/35" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a14]/55 to-transparent" />
          </>
        ) : (
          <>
            {/* Light frost background when no cover image */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(160deg, #F4F8FF 0%, #FAFCFF 40%, #FFFBF0 60%, #F4F8FF 100%)",
              }}
            />
            {/* Ambient gold glow */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <div
                className="absolute top-[10%] left-1/2 -translate-x-1/2"
                style={{
                  width: "1200px",
                  height: "800px",
                  borderRadius: "50%",
                  background: "radial-gradient(ellipse at center, rgba(231,171,28,0.10) 0%, transparent 60%)",
                }}
              />
              <div
                className="absolute top-[5%] right-[10%]"
                style={{
                  width: "400px",
                  height: "400px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(231,171,28,0.08) 0%, transparent 70%)",
                }}
              />
            </div>
          </>
        )}

        {/* Bottom fade to page background */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to top, #F4F8FF, transparent)" }}
          aria-hidden
        />

        {/* Hero content — text color adapts: light on cover image, dark on frost */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-12 pt-24 w-full">
          {/* Back link + Status badge row */}
          <div className="flex items-center justify-between mb-10">
            <Link
              href="/events"
              className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
                hasCoverImage
                  ? "text-white/55 hover:text-[#e7ab1c]"
                  : "text-[#1a1a2e]/45 hover:text-[#e7ab1c]"
              }`}
            >
              <ArrowLeft size={14} /> All Events
            </Link>

            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${eventStatus.color}`}
            >
              {eventStatus.pulse && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
              )}
              {eventStatus.label}
            </span>
          </div>

          {/* Event title */}
          <h1
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6 max-w-5xl ${
              hasCoverImage ? "text-white" : "text-[#1a1a2e]"
            }`}
          >
            {event.title}
          </h1>

          {/* Tagline */}
          {tagline && (
            <p
              className={`text-lg sm:text-xl md:text-2xl font-light max-w-3xl leading-relaxed mb-8 ${
                hasCoverImage ? "text-white/65" : "text-[#1a1a2e]/65"
              }`}
            >
              {tagline}
            </p>
          )}

          {/* Date + Venue row */}
          <div className="flex flex-wrap items-center gap-6 mb-10">
            <span
              className={`flex items-center gap-2.5 text-base ${
                hasCoverImage ? "text-white/75" : "text-[#1a1a2e]/70"
              }`}
            >
              <Calendar size={18} className="text-[#e7ab1c]" />
              {fmtDate(event.start_date)}
              {event.start_date !== event.end_date && (
                <> &mdash; {fmtDate(event.end_date)}</>
              )}
            </span>
            {event.venue && (
              <span
                className={`flex items-center gap-2.5 text-base ${
                  hasCoverImage ? "text-white/75" : "text-[#1a1a2e]/70"
                }`}
              >
                <MapPin size={18} className="text-[#e7ab1c]" />
                {event.venue}
              </span>
            )}
          </div>

          {/* Countdown timer — only for future events */}
          {countdown && isUpcoming && (
            <div className="flex items-center gap-6 mb-10">
              <div className="flex items-center gap-4">
                {[
                  { value: countdown.days, label: "Days" },
                  { value: countdown.hours, label: "Hours" },
                  { value: countdown.minutes, label: "Minutes" },
                ].map((unit) => (
                  <div key={unit.label} className="text-center">
                    <div
                      className="w-20 h-20 rounded-xl flex items-center justify-center mb-1.5"
                      style={{
                        background: "rgba(231,171,28,0.10)",
                        border: "1px solid rgba(231,171,28,0.30)",
                      }}
                    >
                      <span className="text-3xl font-bold text-[#e7ab1c] tabular-nums">
                        {unit.value.toString().padStart(2, "0")}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-medium uppercase tracking-wider ${
                        hasCoverImage ? "text-white/60" : "text-[#1a1a2e]/55"
                      }`}
                    >
                      {unit.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Button — links to /tickets for registration */}
          {isUpcoming && (
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] bg-[#e7ab1c] hover:bg-[#d49c10] shadow-[0_8px_32px_rgba(231,171,28,0.35)]"
            >
              Register Now
            </Link>
          )}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
       *  2. KEY STATS BAR
       * ──────────────────────────────────────────────────────────── */}
      {stats.length > 0 && (
        <section className="relative z-10 -mt-1">
          <div className="max-w-6xl mx-auto px-6">
            <div className="rounded-2xl overflow-hidden bg-white shadow-lg border border-[#1a1a2e]/[0.06]">
              <div className={`grid grid-cols-2 md:grid-cols-${stats.length > 4 ? 4 : stats.length}`}>
                {stats.map((stat, i) => (
                  <div
                    key={stat.label}
                    className={`flex flex-col items-center justify-center py-8 px-4 ${
                      i < stats.length - 1 ? "border-r border-[#1a1a2e]/[0.05]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1">
                      {stat.icon === "speakers" && <Users size={16} className="text-[#e7ab1c]" />}
                      {stat.icon === "sessions" && <Clock size={16} className="text-[#e7ab1c]" />}
                      {stat.icon === "tickets" && <Ticket size={16} className="text-[#e7ab1c]" />}
                      {stat.icon === "sponsors" && <Building2 size={16} className="text-[#e7ab1c]" />}
                      {stat.icon === "winners" && <Trophy size={16} className="text-[#e7ab1c]" />}
                      <span className="text-3xl font-bold text-[#1a1a2e] tabular-nums">{stat.value}</span>
                    </div>
                    <span className="text-xs text-[#1a1a2e]/55 uppercase tracking-wider font-medium">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
       *  3. SPEAKERS SECTION
       * ──────────────────────────────────────────────────────────── */}
      {speakers.length > 0 && (
        <section id="speakers" className="py-16 relative">
          {/* Subtle ambient glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ width: "800px", height: "600px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(231,171,28,0.06) 0%, transparent 60%)" }}
            aria-hidden
          />

          <div className="relative z-10 max-w-6xl mx-auto px-6">
            {/* Section header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#e7ab1c]/40" />
                <span className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em]">
                  Meet the Minds
                </span>
                <div className="h-px w-8 bg-[#e7ab1c]/40" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e]">
                Featured Speakers
              </h2>
            </div>

            {/* Speaker grid — smart layout for any count */}
            <SpeakerGrid speakers={speakers} />
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
       *  4. AGENDA SECTION — Day-by-day timeline
       * ──────────────────────────────────────────────────────────── */}
      {sessions.length > 0 && (
        <section id="agenda" className="py-16 border-t border-[#1a1a2e]/[0.05]">
          <div className="max-w-6xl mx-auto px-6">
            {/* Section header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#e7ab1c]/40" />
                <span className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em]">
                  The Programme
                </span>
                <div className="h-px w-8 bg-[#e7ab1c]/40" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e]">
                Event Agenda
              </h2>
            </div>

            {/* Day tabs (only if multi-day) */}
            {dayDates.length > 1 && (
              <div className="flex flex-wrap justify-center gap-3 mb-14">
                {dayDates.map((date, i) => (
                  <a
                    key={date}
                    href={`#day-${i + 1}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-[#1a1a2e]/55 hover:text-[#e7ab1c] transition-all duration-200 hover:bg-[#e7ab1c]/[0.08] bg-white shadow-sm"
                    style={{ border: "1px solid rgba(26, 26, 46,0.08)" }}
                  >
                    <span className="text-[#e7ab1c] font-bold">Day {i + 1}</span>
                    <span className="text-[#1a1a2e]/45">{fmtDateShort(date)}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Timeline per day */}
            <div className="max-w-4xl mx-auto space-y-20">
              {dayDates.map((date, dayIndex) => {
                const daySessions = sessionsByDate.get(date) ?? []
                return (
                  <div key={date} id={`day-${dayIndex + 1}`}>
                    {/* Day header */}
                    <div className="flex items-center gap-4 mb-8">
                      <div
                        className="shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center"
                        style={{
                          background: "rgba(231,171,28,0.10)",
                          border: "1px solid rgba(231,171,28,0.30)",
                        }}
                      >
                        <span className="text-xl font-bold text-[#e7ab1c] leading-none tabular-nums">{fmtDay(date)}</span>
                        <span className="text-[9px] font-bold text-[#e7ab1c]/70 uppercase tracking-wider mt-0.5">
                          {fmtMonth(date)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#1a1a2e]">
                          Day {dayIndex + 1}
                        </h3>
                        <p className="text-sm text-[#1a1a2e]/45">{fmtDate(date)}</p>
                      </div>
                    </div>

                    {/* Timeline with gold line */}
                    <div className="relative pl-8 md:pl-10">
                      {/* Vertical gold line */}
                      <div
                        className="absolute left-3 md:left-4 top-0 bottom-0 w-px"
                        style={{ background: "linear-gradient(to bottom, rgba(231,171,28,0.4), rgba(231,171,28,0.1))" }}
                      />

                      <div className="space-y-4">
                        {daySessions.map((session) => (
                          <div key={session.id as string} className="relative group">
                            {/* Timeline dot */}
                            <div
                              className="absolute -left-8 md:-left-10 top-5 w-2.5 h-2.5 rounded-full border-2 border-[#e7ab1c]/50 bg-[#F4F8FF] group-hover:border-[#e7ab1c] group-hover:bg-[#e7ab1c]/20 transition-all duration-300"
                              style={{ marginLeft: "7px" }}
                            />

                            {/* Session card */}
                            <div className="rounded-xl p-5 md:p-6 bg-white shadow-sm border border-[#1a1a2e]/[0.06] transition-all duration-300 hover:shadow-md hover:border-[#e7ab1c]/30">
                              <div className="flex flex-col md:flex-row md:items-start gap-4">
                                {/* Time */}
                                <div className="shrink-0 text-sm font-mono text-[#1a1a2e]/45 w-36 tabular-nums pt-0.5">
                                  {fmtTime(session.start_time as string)} &mdash; {fmtTime(session.end_time as string)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  {/* Badges row */}
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${sessionTypes[session.session_type as string] ?? "bg-[#1a1a2e]/[0.04] text-[#1a1a2e]/55 border border-[#1a1a2e]/[0.06]"}`}>
                                      {session.session_type as string}
                                    </span>
                                    {(session.track as string | null) && (
                                      <span className="text-[10px] text-[#e7ab1c] uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#e7ab1c]/10">
                                        {session.track as string}
                                      </span>
                                    )}
                                    {(session.room as string | null) && (
                                      <span className="text-[10px] text-[#1a1a2e]/55 px-2 py-0.5 rounded-md bg-[#1a1a2e]/[0.04]">
                                        {session.room as string}
                                      </span>
                                    )}
                                  </div>

                                  {/* Title */}
                                  <h4 className="font-semibold text-[#1a1a2e] text-base">{session.title as string}</h4>

                                  {/* Description */}
                                  {(session.description as string | null) && (
                                    <p className="text-sm text-[#1a1a2e]/55 mt-1.5 line-clamp-2 leading-relaxed">
                                      {session.description as string}
                                    </p>
                                  )}

                                  {/* Session Speakers */}
                                  {(() => {
                                    const sessionSpks = sessionSpeakersMap.get(session.id as string)
                                    if (!sessionSpks || sessionSpks.length === 0) return null
                                    return (
                                      <div className="flex items-center gap-2 mt-3">
                                        <div className="flex -space-x-1.5">
                                          {sessionSpks.slice(0, 5).map((sp: { id: string; name: string; image_url: string | null }) => (
                                            sp.image_url ? (
                                              <Image
                                                key={sp.id}
                                                src={sp.image_url}
                                                alt={sp.name}
                                                width={24}
                                                height={24}
                                                className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                                              />
                                            ) : (
                                              <div
                                                key={sp.id}
                                                className="w-6 h-6 rounded-full flex items-center justify-center ring-2 ring-white"
                                                style={{ background: "rgba(231,171,28,0.18)" }}
                                              >
                                                <span className="text-[8px] font-bold text-[#e7ab1c]">
                                                  {sp.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                                </span>
                                              </div>
                                            )
                                          ))}
                                        </div>
                                        <span className="text-[11px] text-[#1a1a2e]/55">
                                          {sessionSpks.map((sp: { name: string }) => sp.name).join(", ")}
                                        </span>
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
       *  5. REGISTER CTA — links to /tickets
       * ──────────────────────────────────────────────────────────── */}
      {isUpcoming && (
        <section className="py-16 border-t border-[#1a1a2e]/[0.05]">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#e7ab1c]/40" />
              <span className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em]">
                Secure Your Place
              </span>
              <div className="h-px w-8 bg-[#e7ab1c]/40" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-3">
              Ready to Join?
            </h2>
            <p className="text-sm text-[#1a1a2e]/65 max-w-lg mx-auto mb-8">
              Limited seats available. Reserve your spot now.
            </p>
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-base font-bold text-white bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_24px_rgba(231,171,28,0.35)]"
            >
              <Ticket size={16} />
              View Tickets & Register
            </Link>
          </div>
        </section>
      )}

      {isCompleted && event.status === "completed" && (
        <section className="py-16 border-t border-[#1a1a2e]/[0.05]">
          <div className="max-w-lg mx-auto text-center px-6 py-12 rounded-2xl bg-white shadow-sm border border-[#1a1a2e]/[0.06]">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-blue-500/10">
              <Clock size={28} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a2e] mb-2">This Event Has Ended</h3>
            <p className="text-sm text-[#1a1a2e]/65 max-w-sm mx-auto">
              Registration is no longer available. Stay tuned for future events.
            </p>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
       *  6. SPONSORS SECTION
       * ──────────────────────────────────────────────────────────── */}
      {sponsors.length > 0 && (
        <section className="py-16 border-t border-[#1a1a2e]/[0.05]">
          <div className="max-w-6xl mx-auto px-6">
            {/* Section header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#e7ab1c]/40" />
                <span className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em]">
                  Our Partners
                </span>
                <div className="h-px w-8 bg-[#e7ab1c]/40" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e]">
                Sponsors & Partners
              </h2>
            </div>

            {tierOrder.map((tier) => {
              const tierSponsors = sponsors.filter((s) => s.tier === tier)
              if (tierSponsors.length === 0) return null
              const colorClass = tierColors[tier] ?? "text-[#1a1a2e]/55 border-[#1a1a2e]/[0.08]"
              const isTitle = tier === "title"

              return (
                <div key={tier} className="mb-14 last:mb-0">
                  {/* Tier label */}
                  <h3 className={`text-[11px] font-bold uppercase tracking-[0.15em] mb-6 text-center ${colorClass.split(" ")[0]}`}>
                    {tierLabels[tier] ?? tier}
                  </h3>

                  {/* Sponsor cards */}
                  <div className={`flex flex-wrap justify-center ${isTitle ? "gap-6" : "gap-4"}`}>
                    {tierSponsors.map((sponsor) => {
                      const cardContent = (
                        <div
                          className={`rounded-xl text-center bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#e7ab1c]/40 group ${
                            isTitle ? "px-12 py-8" : "px-8 py-5"
                          } ${colorClass}`}
                          style={{ border: "1px solid" }}
                        >
                          {sponsor.logo_url ? (
                            <Image
                              src={sponsor.logo_url}
                              alt={sponsor.name}
                              width={isTitle ? 160 : 120}
                              height={isTitle ? 64 : 48}
                              className={`mx-auto mb-3 object-contain ${isTitle ? "h-16" : "h-10"} w-auto`}
                            />
                          ) : (
                            <Building2 size={isTitle ? 32 : 24} className="mx-auto mb-3 text-[#1a1a2e]/35" />
                          )}
                          <p className={`font-semibold text-[#1a1a2e] ${isTitle ? "text-base" : "text-sm"}`}>
                            {sponsor.name}
                          </p>
                          {sponsor.description && (
                            <p className="text-[11px] text-[#1a1a2e]/55 mt-1 max-w-[220px]">{sponsor.description}</p>
                          )}
                          {sponsor.website && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[#e7ab1c]/70 mt-2 group-hover:text-[#e7ab1c] transition-colors">
                              <ExternalLink size={9} /> Visit
                            </span>
                          )}
                        </div>
                      )

                      return sponsor.website ? (
                        <a
                          key={sponsor.id}
                          href={sponsor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {cardContent}
                        </a>
                      ) : (
                        <div key={sponsor.id}>
                          {cardContent}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
       *  6.25. AWARD WINNERS SECTION
       * ──────────────────────────────────────────────────────────── */}
      {winners.length > 0 && (
        <section id="winners" className="py-20 border-t border-[#1a1a2e]/[0.05] relative overflow-hidden">
          {/* Ambient gold glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: "800px",
              height: "400px",
              borderRadius: "50%",
              background: "radial-gradient(ellipse at center, rgba(231,171,28,0.08) 0%, transparent 60%)",
            }}
            aria-hidden
          />

          <div className="relative z-10 max-w-6xl mx-auto px-6">
            {/* Section header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#e7ab1c]/40" />
                <span className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em]">
                  Hall of Honour
                </span>
                <div className="h-px w-8 bg-[#e7ab1c]/40" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-3">
                Award Winners
              </h2>
              <p className="text-sm text-[#1a1a2e]/60 max-w-xl mx-auto">
                Celebrating the leaders honoured at {event.title}.
              </p>
            </div>

            {/* Winners grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {winners.map((w) => (
                <div
                  key={w.id}
                  className="group relative rounded-2xl bg-white border border-[#1a1a2e]/[0.06] shadow-sm hover:shadow-md hover:border-[#e7ab1c]/40 transition-all duration-300 overflow-hidden"
                >
                  {/* Gold accent ribbon */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#e7ab1c]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="p-6">
                    {/* Trophy + category */}
                    {w.award_category && (
                      <div className="flex items-center gap-2 mb-4">
                        <Trophy size={13} className="text-[#e7ab1c] shrink-0" />
                        <span className="text-[10px] font-bold text-[#e7ab1c] uppercase tracking-[0.15em] truncate">
                          {w.award_category}
                        </span>
                      </div>
                    )}

                    {/* Image + Name + role */}
                    <div className="flex items-start gap-4">
                      {w.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={w.image_url}
                          alt={w.name}
                          className="w-16 h-16 rounded-full object-cover shrink-0 ring-2 ring-[#e7ab1c]/25"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[#e7ab1c]/10 border border-[#e7ab1c]/25 flex items-center justify-center shrink-0">
                          <Award size={22} className="text-[#e7ab1c]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1a1a2e] leading-tight">{w.name}</p>
                        {(w.designation || w.company) && (
                          <p className="text-[12px] text-[#1a1a2e]/60 mt-1 leading-snug">
                            {[w.designation, w.company].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        {w.linkedin_url && (
                          <a
                            href={w.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] text-[#1a1a2e]/50 hover:text-[#0a66c2] mt-2 transition-colors"
                          >
                            <ExternalLink size={11} />
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
       *  6.5. EVENT GALLERY SECTION
       * ──────────────────────────────────────────────────────────── */}
      {galleryImages.length > 0 && (
        <section id="gallery" className="py-16 border-t border-[#1a1a2e]/[0.05]">
          <div className="max-w-6xl mx-auto px-6">
            {/* Section header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#e7ab1c]/40" />
                <span className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em]">
                  Captured Moments
                </span>
                <div className="h-px w-8 bg-[#e7ab1c]/40" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e]">
                Event Gallery
              </h2>
            </div>

            {/* Gallery grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((image) => (
                <div
                  key={image.id}
                  className="relative rounded-xl overflow-hidden aspect-square group cursor-pointer transition-all duration-300 hover:scale-105 bg-white shadow-sm"
                  style={{
                    border: "1px solid rgba(26, 26, 46,0.06)",
                  }}
                  onMouseEnter={undefined}
                >
                  {/* Image */}
                  <Image
                    src={image.image_url}
                    alt={image.caption || "Event gallery photo"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />

                  {/* Gold border glow on hover */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      boxShadow: "inset 0 0 0 2px rgba(231,171,28,0.6), 0 0 20px rgba(231,171,28,0.25)",
                    }}
                  />

                  {/* Featured badge */}
                  {image.is_featured && (
                    <div className="absolute top-3 left-3 z-10">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background: "rgba(231,171,28,0.95)",
                          color: "#ffffff",
                          border: "1px solid rgba(231,171,28,1)",
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        <Camera size={10} />
                        Featured
                      </span>
                    </div>
                  )}

                  {/* Caption + photographer overlay on hover */}
                  {(image.caption || image.photographer) && (
                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                      <div
                        className="px-4 pt-10 pb-4"
                        style={{
                          background: "linear-gradient(to top, rgba(26, 26, 46,0.85) 0%, rgba(26, 26, 46,0.4) 60%, transparent 100%)",
                        }}
                      >
                        {image.caption && (
                          <p className="text-sm text-white/90 font-medium leading-snug mb-1">
                            {image.caption}
                          </p>
                        )}
                        {image.photographer && (
                          <p className="text-[11px] text-white/85">
                            Photo by {image.photographer}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
       *  7. VENUE / LOCATION SECTION
       * ──────────────────────────────────────────────────────────── */}
      {event.venue && (
        <section className="py-16 border-t border-[#1a1a2e]/[0.05]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl p-8 md:p-10 text-center bg-white shadow-sm border border-[#1a1a2e]/[0.06]">
                {/* Map pin icon */}
                <div
                  className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center"
                  style={{
                    background: "rgba(231,171,28,0.10)",
                    border: "1px solid rgba(231,171,28,0.30)",
                  }}
                >
                  <MapPin size={24} className="text-[#e7ab1c]" />
                </div>

                {/* Venue name */}
                <h3 className="text-xl md:text-2xl font-semibold text-[#1a1a2e] mb-2">
                  {event.venue}
                </h3>

                {/* Date reminder */}
                <p className="text-sm text-[#1a1a2e]/55 mb-4">
                  {fmtDate(event.start_date)}
                  {event.start_date !== event.end_date && (
                    <> &mdash; {fmtDate(event.end_date)}</>
                  )}
                </p>

                {/* Remaining description text */}
                {descriptionRemainder && (
                  <p className="text-sm text-[#1a1a2e]/65 leading-relaxed max-w-lg mx-auto mt-4">
                    {descriptionRemainder}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
       *  8. BOTTOM CTA BAR
       * ──────────────────────────────────────────────────────────── */}
      {isUpcoming && (
        <section className="relative overflow-hidden">
          <div
            className="py-16 md:py-20"
            style={{
              background: "linear-gradient(135deg, rgba(231,171,28,0.10) 0%, rgba(231,171,28,0.05) 50%, rgba(231,171,28,0.10) 100%)",
              borderTop: "1px solid rgba(231,171,28,0.25)",
              borderBottom: "1px solid rgba(231,171,28,0.25)",
            }}
          >
            {/* Ambient glow behind */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ width: "600px", height: "300px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(231,171,28,0.12) 0%, transparent 60%)" }}
              aria-hidden
            />

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-3">
                Don&apos;t Miss Out
              </h2>
              <p className="text-base text-[#1a1a2e]/55 mb-8 max-w-lg mx-auto">
                Secure your place at {event.title}. Limited seats available.
              </p>
              <Link
                href="/tickets"
                className="inline-flex items-center gap-2.5 px-10 py-4 rounded-xl text-base font-bold text-white bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  boxShadow: "0 8px 32px rgba(231,171,28,0.35)",
                }}
              >
                Register Now
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
