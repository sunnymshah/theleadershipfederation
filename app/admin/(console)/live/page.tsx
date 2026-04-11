"use client"

/**
 * ── LIVE CHECK-IN DASHBOARD ──────────────────────────────────────────────
 *
 * Big-screen, dark-themed dashboard for event-day check-in monitoring.
 * Auto-polls every 10 seconds. Designed for projection / large displays.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { getLiveStats } from "@/app/actions/liveActions"
import { getActiveEvents } from "@/app/actions/checkInActions"
import { cn } from "@/lib/utils"
import { ChevronDown, Maximize2, Loader2, Users, UserCheck, Clock, Award } from "lucide-react"

/* ── Types ────────────────────────────────────────────────────────────── */

interface Event {
  id: string
  title: string
  slug: string
  start_date: string
  status: string
}

interface LiveStats {
  totalRegistered: number
  checkedIn: number
  pending: number
  vipCheckedIn: number
  checkInRate: number
  recentCheckIns: {
    name: string
    company: string
    time: string
    ticketName: string
  }[]
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function fmtTime(d: string) {
  if (!d) return ""
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

function fmtClock() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

/* ── SVG Circular Progress ───────────────────────────────────────────── */

function CircularProgress({ percentage, size = 280, strokeWidth = 16 }: {
  percentage: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#c9a84c"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
        style={{
          filter: "drop-shadow(0 0 12px rgba(201,168,76,0.4))",
        }}
      />
    </svg>
  )
}

/* ── Stat Card ───────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  total,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  total?: number
  icon: React.FC<{ size?: number; className?: string }>
  color: string
}) {
  const pct = total && total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-6 py-5">
      <div className="flex items-center gap-3 mb-3">
        <Icon size={18} className={color} />
        <span className="text-xs uppercase tracking-wider text-white/30 font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white tabular-nums">{value.toLocaleString("en-IN")}</div>
      {total !== undefined && total > 0 && (
        <div className="mt-3">
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(pct, 100)}%`,
                background: "linear-gradient(90deg, #c9a84c 0%, #d9b85c 100%)",
              }}
            />
          </div>
          <p className="text-[10px] text-white/20 mt-1 tabular-nums">{pct}%</p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
 *  MAIN PAGE
 * ═══════════════════════════════════════════════════════════════════════ */

export default function LiveDashboardPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [clockStr, setClockStr] = useState(fmtClock())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const prevCheckInsRef = useRef<string[]>([])
  const [newIds, setNewIds] = useState<Set<string>>(new Set())

  // Fetch events on mount
  useEffect(() => {
    async function load() {
      const res = await getActiveEvents()
      if (res.success && res.events.length > 0) {
        setEvents(res.events)
        setSelectedEventId(res.events[0].id)
      }
      setLoading(false)
    }
    load()
  }, [])

  // Poll live stats every 10 seconds
  const fetchLive = useCallback(async () => {
    if (!selectedEventId) return
    const res = await getLiveStats(selectedEventId)
    if (res.success && res.stats) {
      const newStats = res.stats

      // Detect newly arrived check-ins for fade-in effect
      const currentNames = newStats.recentCheckIns.map((c) => c.name + c.time)
      const prev = prevCheckInsRef.current
      const fresh = currentNames.filter((n) => !prev.includes(n))
      if (fresh.length > 0) {
        setNewIds(new Set(fresh))
        // Clear the "new" state after the animation completes
        setTimeout(() => setNewIds(new Set()), 1200)
      }
      prevCheckInsRef.current = currentNames

      setStats(newStats)
    }
  }, [selectedEventId])

  useEffect(() => {
    fetchLive()
    const interval = setInterval(fetchLive, 10_000)
    return () => clearInterval(interval)
  }, [fetchLive])

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClockStr(fmtClock()), 1000)
    return () => clearInterval(t)
  }, [])

  // Full screen
  function goFullScreen() {
    document.documentElement.requestFullscreen?.()
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId)

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#1a1a2e] flex items-center justify-center">
        <Loader2 size={32} className="text-[#c9a84c] animate-spin" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="fixed inset-0 bg-[#1a1a2e] flex items-center justify-center">
        <p className="text-white/40 text-lg">No events available.</p>
      </div>
    )
  }

  const pct = stats?.checkInRate ?? 0

  return (
    <div className="fixed inset-0 bg-[#1a1a2e] text-white overflow-hidden flex flex-col" style={{ fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }}>
      {/* ── Top Bar ───────────────────────────────────────────────── */}
      <div className="shrink-0 h-14 flex items-center justify-between px-8 border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          {/* Event selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white/70 hover:text-white transition-colors"
            >
              {selectedEvent?.title ?? "Select event"}
              <ChevronDown size={14} className={cn("transition-transform", dropdownOpen && "rotate-180")} />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-[#1a1a2e] border border-white/[0.1] rounded-lg shadow-2xl z-50 py-1">
                {events.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => { setSelectedEventId(ev.id); setDropdownOpen(false) }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors",
                      ev.id === selectedEventId
                        ? "text-[#c9a84c] bg-[#c9a84c]/[0.06]"
                        : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                    )}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-white/10">|</span>
          <span className="text-xs text-white/20 uppercase tracking-wider">Live Dashboard</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-white/30 tabular-nums">{clockStr}</span>
          <button
            onClick={goFullScreen}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white/50 hover:text-white transition-colors"
          >
            <Maximize2 size={13} />
            Full Screen
          </button>
        </div>
      </div>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="shrink-0 px-8 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white">{selectedEvent?.title}</h1>
        <p className="text-xs text-white/20 mt-1">
          {selectedEvent?.start_date
            ? new Date(selectedEvent.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
            : ""}
        </p>
      </div>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <div className="flex-1 flex gap-8 px-8 pb-4 min-h-0 overflow-hidden">
        {/* Left 60% — Circular progress */}
        <div className="w-[60%] flex flex-col items-center justify-center">
          <div className="relative">
            <CircularProgress percentage={pct} size={320} strokeWidth={18} />
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold text-white tabular-nums">{pct}%</span>
              <span className="text-sm text-white/30 mt-1">Checked In</span>
            </div>
          </div>
          <p className="text-2xl font-semibold text-white/80 mt-8 tabular-nums">
            <span className="text-[#c9a84c]">{(stats?.checkedIn ?? 0).toLocaleString("en-IN")}</span>
            <span className="text-white/20 mx-2">/</span>
            <span>{(stats?.totalRegistered ?? 0).toLocaleString("en-IN")}</span>
            <span className="text-base text-white/30 ml-3">Checked In</span>
          </p>
        </div>

        {/* Right 40% — Live feed */}
        <div className="w-[40%] flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Live Feed</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
            {(stats?.recentCheckIns ?? []).length === 0 ? (
              <div className="text-center py-20 text-white/15 text-sm">
                No check-ins yet.
              </div>
            ) : (
              stats!.recentCheckIns.map((ci, i) => {
                const key = ci.name + ci.time
                const isNew = newIds.has(key)
                return (
                  <div
                    key={key + i}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.04] transition-all duration-700",
                      isNew && "animate-fadeIn bg-[#c9a84c]/[0.06] border-[#c9a84c]/[0.12]"
                    )}
                  >
                    {/* Time */}
                    <span className="text-xs text-white/25 tabular-nums w-12 shrink-0 text-right">
                      {fmtTime(ci.time)}
                    </span>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{ci.name}</p>
                      {ci.company && (
                        <p className="text-[11px] text-white/25 truncate">{ci.company}</p>
                      )}
                    </div>
                    {/* Ticket badge */}
                    <span className="shrink-0 text-[10px] px-2.5 py-1 rounded-md bg-[#c9a84c]/10 text-[#c9a84c]/80 font-semibold uppercase tracking-wider">
                      {ci.ticketName}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Bar — Stat Cards ───────────────────────────────── */}
      <div className="shrink-0 px-8 pb-6 pt-2">
        <div className="flex gap-4">
          <StatCard label="Total Registered" value={stats?.totalRegistered ?? 0} icon={Users} color="text-blue-400" />
          <StatCard label="Checked In" value={stats?.checkedIn ?? 0} total={stats?.totalRegistered ?? 0} icon={UserCheck} color="text-emerald-400" />
          <StatCard label="Pending" value={stats?.pending ?? 0} total={stats?.totalRegistered ?? 0} icon={Clock} color="text-amber-400" />
          <StatCard label="VIP Checked In" value={stats?.vipCheckedIn ?? 0} icon={Award} color="text-[#c9a84c]" />
        </div>
      </div>

      {/* Fade-in keyframes */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.7s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.06);
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
