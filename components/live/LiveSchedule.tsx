"use client"

import { useMemo } from "react"
import { Clock, MapPin, User, Mic2, Coffee, Award } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Session {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  speaker_name: string | null
  location: string | null
  session_type: string | null
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function getSessionIcon(sessionType: string | null) {
  switch (sessionType?.toLowerCase()) {
    case "keynote":
      return <Mic2 className="w-4 h-4" />
    case "break":
    case "networking":
      return <Coffee className="w-4 h-4" />
    case "award":
    case "awards":
      return <Award className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

function isNow(session: Session): boolean {
  const now = Date.now()
  return now >= new Date(session.start_time).getTime() && now <= new Date(session.end_time).getTime()
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function LiveSchedule({ sessions }: { sessions: Session[] }) {
  /* Group sessions by date */
  const grouped = useMemo(() => {
    const map = new Map<string, Session[]>()
    for (const s of sessions) {
      const dateKey = new Date(s.start_time).toISOString().slice(0, 10)
      const arr = map.get(dateKey) ?? []
      arr.push(s)
      map.set(dateKey, arr)
    }
    return map
  }, [sessions])

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/40">
        <Clock className="w-8 h-8" />
        <p className="text-base font-medium">Schedule not available yet</p>
        <p className="text-sm">Check back closer to the event.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {[...grouped.entries()].map(([dateKey, daySessions]) => (
        <div key={dateKey}>
          <h3 className="text-xs uppercase tracking-[0.2em] text-[#e7ab1c] font-semibold mb-4">
            {fmtDate(daySessions[0].start_time)}
          </h3>

          <div className="flex flex-col gap-3">
            {daySessions.map((session) => {
              const live = isNow(session)
              const isBreak =
                session.session_type?.toLowerCase() === "break" ||
                session.session_type?.toLowerCase() === "networking"

              return (
                <div
                  key={session.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    live
                      ? "bg-[#e7ab1c]/[0.08] border-[#e7ab1c]/40"
                      : isBreak
                        ? "bg-white/[0.02] border-white/[0.06]"
                        : "bg-white/[0.04] border-white/10"
                  }`}
                >
                  {/* Time + live indicator */}
                  <div className="flex items-center gap-2 mb-1.5">
                    {live && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e7ab1c]/20 text-[#e7ab1c] text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e7ab1c] animate-pulse" />
                        Now
                      </span>
                    )}
                    <span className="text-xs text-white/40 flex items-center gap-1">
                      {getSessionIcon(session.session_type)}
                      {fmtTime(session.start_time)} - {fmtTime(session.end_time)}
                    </span>
                  </div>

                  {/* Title */}
                  <p
                    className={`text-sm font-semibold leading-snug ${
                      isBreak ? "text-white/50" : "text-white"
                    }`}
                  >
                    {session.title}
                  </p>

                  {/* Description */}
                  {session.description && (
                    <p className="text-xs text-white/40 mt-1 line-clamp-2 leading-relaxed">
                      {session.description}
                    </p>
                  )}

                  {/* Speaker + Location */}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {session.speaker_name && (
                      <span className="flex items-center gap-1 text-xs text-white/50">
                        <User className="w-3 h-3" />
                        {session.speaker_name}
                      </span>
                    )}
                    {session.location && (
                      <span className="flex items-center gap-1 text-xs text-white/50">
                        <MapPin className="w-3 h-3" />
                        {session.location}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
