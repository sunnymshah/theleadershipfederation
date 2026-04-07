import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin, Clock, Users, Building2, ArrowLeft, Ticket, Award, ExternalLink, Camera } from "lucide-react"
import { TicketPurchaseCard } from "@/components/site/TicketPurchaseCard"
import { getGalleryImages } from "@/app/actions/galleryActions"
import { getEvent } from "@/lib/get-event"
import { SpeakerGrid } from "@/components/site/SpeakerGrid"

export const revalidate = 300

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
    return { label: "Completed", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", pulse: false }
  }
  if (now >= start && now <= end) {
    return { label: "Live Now", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", pulse: true }
  }
  return { label: "Upcoming", color: "bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/30", pulse: false }
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
  if (!event) notFound()

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [speakersRes, ticketsRes, sessionsRes, sponsorsRes, sessionSpeakersRes, galleryRes, customFieldsRes] = await Promise.all([
    supabase.from("speakers").select("*").eq("event_id", event.id).order("sort_order"),
    supabase.from("tickets").select("*").eq("event_id", event.id).eq("status", "published").order("price_inr"),
    supabase.from("sessions").select("*").eq("event_id", event.id).order("start_time"),
    supabase.from("sponsors").select("*").eq("event_id", event.id).order("sort_order"),
    supabase.from("session_speakers").select("session_id, speaker_id").in(
      "session_id",
      (await supabase.from("sessions").select("id").eq("event_id", event.id)).data?.map((s: { id: string }) => s.id) ?? []
    ),
    getGalleryImages(event.id),
    supabase.from("custom_fields").select("id, field_label, field_name, field_type, options, is_required, sort_order").eq("event_id", event.id).order("sort_order"),
  ])

  const speakers = speakersRes.data ?? []
  const tickets = ticketsRes.data ?? []
  const sessions = sessionsRes.data ?? []
  const sponsors = sponsorsRes.data ?? []
  const galleryImages = galleryRes.images ?? []
  const customFields = customFieldsRes.data ?? []

  // Fetch active price tiers for all tickets (for early bird / timed pricing)
  const now = new Date().toISOString()
  const ticketIds = tickets.map((t: { id: string }) => t.id)
  const { data: activePriceTiers } = ticketIds.length > 0
    ? await supabase
        .from("ticket_price_tiers")
        .select("*")
        .in("ticket_id", ticketIds)
        .eq("is_active", true)
        .lte("starts_at", now)
        .gte("ends_at", now)
    : { data: [] as { ticket_id: string; price_inr: number; name: string }[] }

  // Build a map: ticketId -> active tier
  const priceTierMap: Record<string, { price: number; name: string }> = {}
  for (const tier of activePriceTiers ?? []) {
    // Use the most recently created tier if multiple overlap
    if (!priceTierMap[tier.ticket_id]) {
      priceTierMap[tier.ticket_id] = { price: tier.price_inr, name: tier.name }
    }
  }
  const sessionSpeakerLinks = sessionSpeakersRes.data ?? []

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
    title: "text-[#c9a84c] border-[#c9a84c]/20", platinum: "text-zinc-300 border-zinc-300/20",
    gold: "text-yellow-400 border-yellow-400/20", silver: "text-zinc-400 border-zinc-400/20",
    bronze: "text-amber-600 border-amber-600/20", partner: "text-blue-400 border-blue-400/20",
  }
  const sessionTypes: Record<string, string> = {
    keynote: "bg-[#c9a84c]/10 text-[#c9a84c]", session: "bg-blue-500/10 text-blue-400",
    panel: "bg-purple-500/10 text-purple-400", workshop: "bg-emerald-500/10 text-emerald-400",
    break: "bg-zinc-500/10 text-zinc-400", networking: "bg-orange-500/10 text-orange-400",
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
  if (tickets.length > 0) stats.push({ label: tickets.length === 1 ? "Ticket Tier" : "Ticket Tiers", value: tickets.length, icon: "tickets" })
  if (sponsors.length > 0) stats.push({ label: sponsors.length === 1 ? "Sponsor" : "Sponsors", value: sponsors.length, icon: "sponsors" })

  return (
    <div className="min-h-screen bg-[#050505]">
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
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-[#050505]/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/60 to-transparent" />
          </>
        ) : (
          <>
            {/* Gradient background when no cover image */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(160deg, #050505 0%, #0a0908 40%, #0f0d08 60%, #050505 100%)",
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
                  background: "radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 60%)",
                }}
              />
              <div
                className="absolute top-[5%] right-[10%]"
                style={{
                  width: "400px",
                  height: "400px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)",
                }}
              />
            </div>
          </>
        )}

        {/* Bottom fade to background */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to top, #050505, transparent)" }}
          aria-hidden
        />

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-16 pt-32 w-full">
          {/* Back link + Status badge row */}
          <div className="flex items-center justify-between mb-10">
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-sm text-white/25 hover:text-[#c9a84c] transition-colors"
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
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-6 max-w-5xl">
            {event.title}
          </h1>

          {/* Tagline */}
          {tagline && (
            <p className="text-lg sm:text-xl md:text-2xl text-white/50 font-light max-w-3xl leading-relaxed mb-8">
              {tagline}
            </p>
          )}

          {/* Date + Venue row */}
          <div className="flex flex-wrap items-center gap-6 mb-10">
            <span className="flex items-center gap-2.5 text-base text-white/60">
              <Calendar size={18} className="text-[#c9a84c]" />
              {fmtDate(event.start_date)}
              {event.start_date !== event.end_date && (
                <> &mdash; {fmtDate(event.end_date)}</>
              )}
            </span>
            {event.venue && (
              <span className="flex items-center gap-2.5 text-base text-white/60">
                <MapPin size={18} className="text-[#c9a84c]" />
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
                        background: "rgba(201,168,76,0.06)",
                        border: "1px solid rgba(201,168,76,0.15)",
                      }}
                    >
                      <span className="text-3xl font-bold text-[#c9a84c] tabular-nums">
                        {unit.value.toString().padStart(2, "0")}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
                      {unit.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Button — only for published events with tickets */}
          {isUpcoming && tickets.length > 0 && (
            <a
              href="#tickets"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold text-[#0a0a0a] transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #e7ab1c 0%, #c9a84c 100%)",
                boxShadow: "0 0 40px rgba(231,171,28,0.25), 0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              Register Now
            </a>
          )}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
       *  2. KEY STATS BAR
       * ──────────────────────────────────────────────────────────── */}
      {stats.length > 0 && (
        <section className="relative z-10 -mt-1">
          <div className="max-w-6xl mx-auto px-6">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className={`grid grid-cols-2 md:grid-cols-${stats.length > 4 ? 4 : stats.length}`}>
                {stats.map((stat, i) => (
                  <div
                    key={stat.label}
                    className={`flex flex-col items-center justify-center py-8 px-4 ${
                      i < stats.length - 1 ? "border-r border-white/[0.04]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1">
                      {stat.icon === "speakers" && <Users size={16} className="text-[#c9a84c]/60" />}
                      {stat.icon === "sessions" && <Clock size={16} className="text-[#c9a84c]/60" />}
                      {stat.icon === "tickets" && <Ticket size={16} className="text-[#c9a84c]/60" />}
                      {stat.icon === "sponsors" && <Award size={16} className="text-[#c9a84c]/60" />}
                      <span className="text-3xl font-bold text-white tabular-nums">{stat.value}</span>
                    </div>
                    <span className="text-xs text-white/30 uppercase tracking-wider font-medium">
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
        <section id="speakers" className="py-28 relative">
          {/* Subtle ambient glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ width: "800px", height: "600px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(201,168,76,0.03) 0%, transparent 60%)" }}
            aria-hidden
          />

          <div className="relative z-10 max-w-6xl mx-auto px-6">
            {/* Section header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#c9a84c]/40" />
                <span className="text-[11px] font-bold text-[#c9a84c] uppercase tracking-[0.25em]">
                  Meet the Minds
                </span>
                <div className="h-px w-8 bg-[#c9a84c]/40" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
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
        <section id="agenda" className="py-28 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto px-6">
            {/* Section header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#c9a84c]/40" />
                <span className="text-[11px] font-bold text-[#c9a84c] uppercase tracking-[0.25em]">
                  The Programme
                </span>
                <div className="h-px w-8 bg-[#c9a84c]/40" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white/50 hover:text-[#c9a84c] transition-all duration-200 hover:bg-[#c9a84c]/[0.06]"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <span className="text-[#c9a84c] font-bold">Day {i + 1}</span>
                    <span className="text-white/25">{fmtDateShort(date)}</span>
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
                          background: "rgba(201,168,76,0.08)",
                          border: "1px solid rgba(201,168,76,0.15)",
                        }}
                      >
                        <span className="text-xl font-bold text-[#c9a84c] leading-none tabular-nums">{fmtDay(date)}</span>
                        <span className="text-[9px] font-bold text-[#c9a84c]/50 uppercase tracking-wider mt-0.5">
                          {fmtMonth(date)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Day {dayIndex + 1}
                        </h3>
                        <p className="text-sm text-white/30">{fmtDate(date)}</p>
                      </div>
                    </div>

                    {/* Timeline with gold line */}
                    <div className="relative pl-8 md:pl-10">
                      {/* Vertical gold line */}
                      <div
                        className="absolute left-3 md:left-4 top-0 bottom-0 w-px"
                        style={{ background: "linear-gradient(to bottom, rgba(201,168,76,0.3), rgba(201,168,76,0.05))" }}
                      />

                      <div className="space-y-4">
                        {daySessions.map((session) => (
                          <div key={session.id as string} className="relative group">
                            {/* Timeline dot */}
                            <div
                              className="absolute -left-8 md:-left-10 top-5 w-2.5 h-2.5 rounded-full border-2 border-[#c9a84c]/40 bg-[#050505] group-hover:border-[#c9a84c] group-hover:bg-[#c9a84c]/20 transition-all duration-300"
                              style={{ marginLeft: "7px" }}
                            />

                            {/* Session card */}
                            <div
                              className="rounded-xl p-5 md:p-6 transition-all duration-300 hover:bg-white/[0.03] group-hover:border-white/[0.08]"
                              style={{ border: "1px solid rgba(255,255,255,0.04)" }}
                            >
                              <div className="flex flex-col md:flex-row md:items-start gap-4">
                                {/* Time */}
                                <div className="shrink-0 text-sm font-mono text-white/30 w-36 tabular-nums pt-0.5">
                                  {fmtTime(session.start_time as string)} &mdash; {fmtTime(session.end_time as string)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  {/* Badges row */}
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${sessionTypes[session.session_type as string] ?? "bg-white/5 text-white/30"}`}>
                                      {session.session_type as string}
                                    </span>
                                    {(session.track as string | null) && (
                                      <span className="text-[10px] text-white/20 uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.03]">
                                        {session.track as string}
                                      </span>
                                    )}
                                    {(session.room as string | null) && (
                                      <span className="text-[10px] text-white/20 px-2 py-0.5 rounded-md bg-white/[0.03]">
                                        {session.room as string}
                                      </span>
                                    )}
                                  </div>

                                  {/* Title */}
                                  <h4 className="font-medium text-white/90 text-base">{session.title as string}</h4>

                                  {/* Description */}
                                  {(session.description as string | null) && (
                                    <p className="text-sm text-white/30 mt-1.5 line-clamp-2 leading-relaxed">
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
                                                className="w-6 h-6 rounded-full object-cover ring-1 ring-[#050505]"
                                              />
                                            ) : (
                                              <div
                                                key={sp.id}
                                                className="w-6 h-6 rounded-full flex items-center justify-center ring-1 ring-[#050505]"
                                                style={{ background: "rgba(201,168,76,0.15)" }}
                                              >
                                                <span className="text-[8px] font-bold text-[#c9a84c]/70">
                                                  {sp.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                                </span>
                                              </div>
                                            )
                                          ))}
                                        </div>
                                        <span className="text-[11px] text-white/35">
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
       *  5. TICKETS SECTION
       * ──────────────────────────────────────────────────────────── */}
      {tickets.length > 0 && (
        <section id="tickets" className="py-28 relative border-t border-white/[0.04]">
          {/* Ambient glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ width: "900px", height: "500px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 55%)" }}
            aria-hidden
          />

          <div className="relative z-10 max-w-6xl mx-auto px-6">
            {/* Section header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#c9a84c]/40" />
                <span className="text-[11px] font-bold text-[#c9a84c] uppercase tracking-[0.25em]">
                  Secure Your Place
                </span>
                <div className="h-px w-8 bg-[#c9a84c]/40" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Choose Your Experience
              </h2>
              <p className="text-sm text-white/30 max-w-lg mx-auto">
                Select the tier that matches your level of engagement. Limited seats available.
              </p>
            </div>

            {isCompleted && event.status === "completed" ? (
              /* Event ended message */
              <div
                className="max-w-lg mx-auto text-center py-12 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-blue-500/10">
                  <Clock size={28} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">This Event Has Ended</h3>
                <p className="text-sm text-white/30 max-w-sm mx-auto">
                  Registration is no longer available. Stay tuned for future events.
                </p>
              </div>
            ) : (
              /* Ticket cards grid */
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {tickets.map((ticket) => (
                  <TicketPurchaseCard
                    key={ticket.id}
                    ticket={ticket}
                    eventId={event.id}
                    eventTitle={event.title}
                    currentPrice={priceTierMap[ticket.id]?.price ?? null}
                    tierName={priceTierMap[ticket.id]?.name ?? null}
                    customFields={customFields}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
       *  6. SPONSORS SECTION
       * ──────────────────────────────────────────────────────────── */}
      {sponsors.length > 0 && (
        <section className="py-28 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto px-6">
            {/* Section header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#c9a84c]/40" />
                <span className="text-[11px] font-bold text-[#c9a84c] uppercase tracking-[0.25em]">
                  Our Partners
                </span>
                <div className="h-px w-8 bg-[#c9a84c]/40" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Sponsors & Partners
              </h2>
            </div>

            {tierOrder.map((tier) => {
              const tierSponsors = sponsors.filter((s) => s.tier === tier)
              if (tierSponsors.length === 0) return null
              const colorClass = tierColors[tier] ?? "text-white/40 border-white/[0.06]"
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
                          className={`rounded-xl text-center transition-all duration-300 hover:bg-white/[0.03] group ${
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
                            <Building2 size={isTitle ? 32 : 24} className="mx-auto mb-3 opacity-40" />
                          )}
                          <p className={`font-semibold text-white/80 ${isTitle ? "text-base" : "text-sm"}`}>
                            {sponsor.name}
                          </p>
                          {sponsor.description && (
                            <p className="text-[11px] text-white/25 mt-1 max-w-[220px]">{sponsor.description}</p>
                          )}
                          {sponsor.website && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[#c9a84c]/40 mt-2 group-hover:text-[#c9a84c]/70 transition-colors">
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
       *  6.5. EVENT GALLERY SECTION
       * ──────────────────────────────────────────────────────────── */}
      {galleryImages.length > 0 && (
        <section id="gallery" className="py-28 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto px-6">
            {/* Section header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#c9a84c]/40" />
                <span className="text-[11px] font-bold text-[#c9a84c] uppercase tracking-[0.25em]">
                  Captured Moments
                </span>
                <div className="h-px w-8 bg-[#c9a84c]/40" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Event Gallery
              </h2>
            </div>

            {/* Gallery grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((image) => (
                <div
                  key={image.id}
                  className="relative rounded-xl overflow-hidden aspect-square group cursor-pointer transition-all duration-300 hover:scale-105"
                  style={{
                    border: "1px solid rgba(255,255,255,0.04)",
                    boxShadow: "0 0 0 0 rgba(201,168,76,0)",
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
                      boxShadow: "inset 0 0 0 2px rgba(201,168,76,0.5), 0 0 20px rgba(201,168,76,0.15)",
                    }}
                  />

                  {/* Featured badge */}
                  {image.is_featured && (
                    <div className="absolute top-3 left-3 z-10">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background: "rgba(201,168,76,0.2)",
                          color: "#c9a84c",
                          border: "1px solid rgba(201,168,76,0.3)",
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
                          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
                        }}
                      >
                        {image.caption && (
                          <p className="text-sm text-white/90 font-medium leading-snug mb-1">
                            {image.caption}
                          </p>
                        )}
                        {image.photographer && (
                          <p className="text-[11px] text-white/40">
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
        <section className="py-28 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <div
                className="rounded-2xl p-8 md:p-10 text-center"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* Map pin icon */}
                <div
                  className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center"
                  style={{
                    background: "rgba(201,168,76,0.08)",
                    border: "1px solid rgba(201,168,76,0.15)",
                  }}
                >
                  <MapPin size={24} className="text-[#c9a84c]" />
                </div>

                {/* Venue name */}
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">
                  {event.venue}
                </h3>

                {/* Date reminder */}
                <p className="text-sm text-white/30 mb-4">
                  {fmtDate(event.start_date)}
                  {event.start_date !== event.end_date && (
                    <> &mdash; {fmtDate(event.end_date)}</>
                  )}
                </p>

                {/* Remaining description text */}
                {descriptionRemainder && (
                  <p className="text-sm text-white/25 leading-relaxed max-w-lg mx-auto mt-4">
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
      {isUpcoming && tickets.length > 0 && (
        <section className="relative overflow-hidden">
          <div
            className="py-16 md:py-20"
            style={{
              background: "linear-gradient(135deg, rgba(231,171,28,0.08) 0%, rgba(201,168,76,0.04) 50%, rgba(231,171,28,0.08) 100%)",
              borderTop: "1px solid rgba(201,168,76,0.15)",
              borderBottom: "1px solid rgba(201,168,76,0.15)",
            }}
          >
            {/* Ambient glow behind */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ width: "600px", height: "300px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(231,171,28,0.08) 0%, transparent 60%)" }}
              aria-hidden
            />

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Don&apos;t Miss Out
              </h2>
              <p className="text-base text-white/40 mb-8 max-w-lg mx-auto">
                Secure your place at {event.title}. Limited seats available.
              </p>
              <a
                href="#tickets"
                className="inline-flex items-center gap-2.5 px-10 py-4 rounded-xl text-base font-bold text-[#0a0a0a] transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #e7ab1c 0%, #c9a84c 100%)",
                  boxShadow: "0 0 40px rgba(231,171,28,0.25), 0 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                Register Now
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
