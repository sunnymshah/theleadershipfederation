import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getEvent } from "@/lib/get-event"
import { ArrowLeft, Calendar, MapPin } from "lucide-react"
import { BookmarkButton } from "./BookmarkButton"
import { TrackFilter } from "./TrackFilter"

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) return { title: "Schedule Not Found" }
  return {
    title: `Schedule - ${event.title} | The Leadership Federation`,
    description: `Full session schedule for ${event.title}`,
  }
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function fmtDay(d: string) {
  return new Date(d).getDate().toString()
}

function fmtMonth(d: string) {
  return new Date(d)
    .toLocaleDateString("en-IN", { month: "short" })
    .toUpperCase()
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface Session {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  track: string | null
  room: string | null
  session_type: string | null
  event_id: string
}

interface Speaker {
  id: string
  name: string
  image_url: string | null
}

const sessionTypeColors: Record<string, string> = {
  keynote: "bg-[#e7ab1c]/10 text-[#a37410] border-[#e7ab1c]/30",
  session: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  panel: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  workshop: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  break: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  networking: "bg-orange-500/10 text-orange-700 border-orange-500/20",
}

/* ── Page Component ───────────────────────────────────────────────── */

export default async function SchedulePage({ params }: Props) {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) notFound()

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Fetch sessions
  const { data: sessionsRaw } = await supabase
    .from("sessions")
    .select("id, title, description, start_time, end_time, track, room, session_type, event_id")
    .eq("event_id", event.id)
    .order("start_time")

  const sessions: Session[] = (sessionsRaw ?? []) as Session[]

  // Fetch session_speakers links + speakers
  const sessionIds = sessions.map((s) => s.id)

  const { data: sessionSpeakerLinks } = sessionIds.length > 0
    ? await supabase
        .from("session_speakers")
        .select("session_id, speaker_id")
        .in("session_id", sessionIds)
    : { data: [] as { session_id: string; speaker_id: string }[] }

  const speakerIds = [
    ...new Set((sessionSpeakerLinks ?? []).map((l) => l.speaker_id)),
  ]
  const { data: speakersRaw } = speakerIds.length > 0
    ? await supabase
        .from("speakers")
        .select("id, name, image_url")
        .in("id", speakerIds)
    : { data: [] as Speaker[] }

  const speakers = (speakersRaw ?? []) as Speaker[]
  const speakerMap = new Map(speakers.map((s) => [s.id, s]))

  // Build sessionId -> speaker names map
  const sessionSpeakersMap = new Map<string, string[]>()
  for (const link of sessionSpeakerLinks ?? []) {
    const sp = speakerMap.get(link.speaker_id)
    if (sp) {
      if (!sessionSpeakersMap.has(link.session_id))
        sessionSpeakersMap.set(link.session_id, [])
      sessionSpeakersMap.get(link.session_id)!.push(sp.name)
    }
  }

  // Group sessions by date
  const sessionsByDate = new Map<string, Session[]>()
  for (const session of sessions) {
    const dateKey = new Date(session.start_time).toISOString().split("T")[0]
    if (!sessionsByDate.has(dateKey)) sessionsByDate.set(dateKey, [])
    sessionsByDate.get(dateKey)!.push(session)
  }
  const dayDates = Array.from(sessionsByDate.keys()).sort()

  // Group sessions within a date by time slot (start_time)
  function groupByTimeSlot(daySessions: Session[]) {
    const slots = new Map<string, Session[]>()
    for (const s of daySessions) {
      const key = s.start_time
      if (!slots.has(key)) slots.set(key, [])
      slots.get(key)!.push(s)
    }
    return Array.from(slots.entries()).sort(
      ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
    )
  }

  // Collect all tracks
  const allTracks = [
    ...new Set(sessions.map((s) => s.track).filter(Boolean)),
  ] as string[]
  const hasTracks = allTracks.length > 1

  // Serialize speaker map for client component
  const sessionSpeakersObj: Record<string, string[]> = {}
  sessionSpeakersMap.forEach((names, id) => {
    sessionSpeakersObj[id] = names
  })

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="pt-36 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Link
            href={`/events/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-[#1a1a2e]/45 hover:text-[#e7ab1c] transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back to Event
          </Link>

          <div className="text-center">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-4">
              Event Schedule
            </span>
            <h1 className="text-[#1a1a2e] leading-[1.08] font-bold mb-3 text-3xl md:text-5xl">
              {event.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-[#1a1a2e]/55">
              {event.venue && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#e7ab1c]" />
                  {event.venue}
                </span>
              )}
              {event.start_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#e7ab1c]" />
                  {fmtDate(event.start_date)}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Content */}
      <section className="pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          {sessions.length === 0 ? (
            <div className="rounded-2xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-[#e7ab1c]/10 flex items-center justify-center mx-auto mb-4">
                <Calendar size={24} className="text-[#e7ab1c]" />
              </div>
              <h3 className="text-lg font-bold text-[#1a1a2e] mb-2">
                Schedule Coming Soon
              </h3>
              <p className="text-sm text-[#1a1a2e]/55 max-w-sm mx-auto">
                The session schedule for this event has not been published yet.
                Check back soon!
              </p>
            </div>
          ) : (
            <>
              {/* Track filter (client component) */}
              {hasTracks && <TrackFilter tracks={allTracks} />}

              {/* Day-by-day schedule */}
              <div className="space-y-12">
                {dayDates.map((date, dayIndex) => {
                  const daySessions = sessionsByDate.get(date) ?? []
                  const timeSlots = groupByTimeSlot(daySessions)

                  return (
                    <div key={date} id={`day-${dayIndex + 1}`}>
                      {/* Day header */}
                      <div className="flex items-center gap-4 mb-8">
                        <div className="shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center bg-[#e7ab1c]/10 border border-[#e7ab1c]/30">
                          <span className="text-xl font-bold text-[#e7ab1c] leading-none tabular-nums">
                            {fmtDay(date)}
                          </span>
                          <span className="text-[9px] font-bold text-[#e7ab1c]/70 uppercase tracking-wider mt-0.5">
                            {fmtMonth(date)}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-[#1a1a2e]">
                            Day {dayIndex + 1}
                          </h2>
                          <p className="text-sm text-[#1a1a2e]/45">
                            {fmtDate(date)}
                          </p>
                        </div>
                      </div>

                      {/* Time slots */}
                      <div className="space-y-4">
                        {timeSlots.map(([slotTime, slotSessions]) => {
                          const hasMultipleTracks =
                            hasTracks && slotSessions.length > 1

                          return (
                            <div key={slotTime} className="relative">
                              {/* Time label */}
                              <div className="flex items-start gap-4">
                                <div className="shrink-0 w-20 pt-5 text-right">
                                  <span className="text-xs font-mono font-medium text-[#1a1a2e]/45">
                                    {fmtTime(slotTime)}
                                  </span>
                                </div>

                                {/* Session cards — side-by-side when multi-track */}
                                <div
                                  className={`flex-1 ${
                                    hasMultipleTracks
                                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                                      : "space-y-3"
                                  }`}
                                >
                                  {slotSessions.map((session) => {
                                    const speakerNames =
                                      sessionSpeakersObj[session.id] ?? []
                                    const typeClass =
                                      sessionTypeColors[
                                        session.session_type ?? ""
                                      ] ??
                                      "bg-[#1a1a2e]/[0.04] text-[#1a1a2e]/55 border-[#1a1a2e]/[0.06]"

                                    return (
                                      <div
                                        key={session.id}
                                        data-track={session.track ?? ""}
                                        className="schedule-session rounded-xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-5 hover:border-[#e7ab1c]/40 hover:shadow-md transition-all"
                                      >
                                        {/* Badges */}
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                          {session.session_type && (
                                            <span
                                              className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${typeClass}`}
                                            >
                                              {session.session_type}
                                            </span>
                                          )}
                                          {session.track && (
                                            <span className="text-[10px] font-semibold text-[#e7ab1c] uppercase tracking-wider px-2 py-0.5 rounded bg-[#e7ab1c]/10">
                                              {session.track}
                                            </span>
                                          )}
                                          {session.room && (
                                            <span className="text-[10px] text-[#1a1a2e]/55 px-2 py-0.5 rounded bg-[#1a1a2e]/[0.04]">
                                              {session.room}
                                            </span>
                                          )}
                                        </div>

                                        {/* Title */}
                                        <h3 className="font-semibold text-[#1a1a2e] text-sm leading-snug mb-1">
                                          {session.title}
                                        </h3>

                                        {/* Time range */}
                                        <p className="text-xs font-mono text-[#1a1a2e]/45 mb-2">
                                          {fmtTime(session.start_time)} &mdash;{" "}
                                          {fmtTime(session.end_time)}
                                        </p>

                                        {/* Description preview */}
                                        {session.description && (
                                          <p className="text-xs text-[#1a1a2e]/55 line-clamp-2 leading-relaxed mb-3">
                                            {session.description}
                                          </p>
                                        )}

                                        {/* Speaker names */}
                                        {speakerNames.length > 0 && (
                                          <p className="text-xs text-[#1a1a2e]/70 mb-3">
                                            <span className="font-medium">
                                              {speakerNames.join(", ")}
                                            </span>
                                          </p>
                                        )}

                                        {/* Bookmark button */}
                                        {session.session_type !== "break" && (
                                          <BookmarkButton
                                            sessionId={session.id}
                                            sessionTitle={session.title}
                                          />
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
