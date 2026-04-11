"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Loader2,
  Search,
  Download,
  FileText,
  Award,
  Ticket,
  CheckCircle2,
  Clock,
  CreditCard,
  ArrowLeft,
  Calendar,
  MapPin,
  X,
  Users,
  Send,
  UserCircle,
  BookOpen,
  Bookmark,
  ExternalLink,
  Save,
  MessageSquare,
  ChevronRight,
  Building2,
  Globe,
} from "lucide-react"
import {
  lookupAttendee,
  getAttendeeAgenda,
  removeBookmark,
  getNetworkingRequests,
  respondToNetworkingRequest,
  sendNetworkingRequest,
  getEventDirectory,
  updateAttendeeProfile,
  getSessionMaterials,
} from "@/app/actions/attendeePortalActions"

/* ── Types ────────────────────────────────────────────────────────── */

interface EventInfo {
  id: string
  title: string
  slug: string
  start_date: string
  end_date: string
  venue: string | null
  status: string
}

interface Attendee {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  designation: string | null
  dietary_preference: string | null
  linkedin_url: string | null
  show_in_directory: boolean
  status: string
  registration_date: string | null
  check_in_at: string | null
  events: EventInfo
}

interface AgendaSession {
  bookmarkId: string
  bookmarkedAt: string
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  track: string | null
  room: string | null
  session_type: string | null
}

interface NetworkingRequest {
  id: string
  event_id: string
  message: string | null
  status: string
  meeting_time: string | null
  meeting_location: string | null
  created_at: string
  responded_at: string | null
  from_attendee?: {
    id: string
    name: string
    company: string | null
    designation: string | null
    linkedin_url: string | null
  }
  to_attendee?: {
    id: string
    name: string
    company: string | null
    designation: string | null
    linkedin_url: string | null
  }
}

interface DirectoryEntry {
  id: string
  name: string
  company: string | null
  designation: string | null
  linkedin_url: string | null
}

interface MaterialItem {
  name: string
  url: string
  type?: string
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function statusLabel(status: string) {
  switch (status) {
    case "checked_in":
      return "Checked In"
    case "confirmed":
      return "Confirmed"
    case "registered":
      return "Registered"
    default:
      return status
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "checked_in":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "confirmed":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "registered":
      return "bg-amber-100 text-amber-700 border-amber-200"
    default:
      return "bg-gray-100 text-gray-600 border-gray-200"
  }
}

function networkStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700"
    case "accepted":
      return "bg-emerald-100 text-emerald-700"
    case "declined":
      return "bg-red-100 text-red-700"
    default:
      return "bg-gray-100 text-gray-600"
  }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })
}

/* ── Tabs ─────────────────────────────────────────────────────────── */

type TabId = "agenda" | "networking" | "profile" | "materials"

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "agenda", label: "My Agenda", icon: <Calendar size={16} /> },
  { id: "networking", label: "Networking", icon: <Users size={16} /> },
  { id: "profile", label: "Profile", icon: <UserCircle size={16} /> },
  { id: "materials", label: "Materials", icon: <BookOpen size={16} /> },
]

/* ── Main Page Component ──────────────────────────────────────────── */

export default function MyTicketsPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attendee, setAttendee] = useState<Attendee | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [selectedAttendeeIdx, setSelectedAttendeeIdx] = useState(0)
  const [searched, setSearched] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("agenda")

  const currentAttendee = attendees.length > 0 ? attendees[selectedAttendeeIdx] : attendee

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    setAttendee(null)
    setAttendees([])

    try {
      const result = await lookupAttendee(trimmed)
      if (!result.success) {
        setError(result.error ?? "No registrations found.")
        setSearched(true)
      } else {
        const all = (result.attendees ?? [result.attendee].filter(Boolean)) as unknown as Attendee[]
        setAttendees(all)
        setAttendee(all[0] ?? null)
        setSelectedAttendeeIdx(0)
        setSearched(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setEmail("")
    setAttendee(null)
    setAttendees([])
    setSearched(false)
    setError(null)
    setActiveTab("agenda")
  }

  function buildUrl(base: string, attendeeId: string) {
    return `${base}/${attendeeId}`
  }

  /* ── Email Lookup (Step 1) ──────────────────────────────────────── */

  if (!searched || (!currentAttendee && !error)) {
    return (
      <main className="min-h-screen bg-[#F4F8FF] relative">
        {/* Hero */}
        <section className="pt-24 pb-12 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-6">
              Self-Service Portal
            </span>
            <h1 className="text-[#1a1a2e] leading-[1.08] font-bold mb-6 text-3xl md:text-5xl">
              My Tickets
            </h1>
            <p className="text-lg text-[#1a1a2e]/75 leading-relaxed max-w-2xl mx-auto">
              Look up your registrations to access your agenda, download
              e-tickets, certificates, networking tools, and session materials.
            </p>
          </div>
        </section>

        {/* Lookup form */}
        <section className="pb-20 px-6">
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center">
                  <Ticket size={20} className="text-[#e7ab1c]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1a1a2e]">
                    Find My Tickets
                  </h2>
                  <p className="text-sm text-[#1a1a2e]/75">
                    Enter your registered email to access your portal
                  </p>
                </div>
              </div>

              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-[#1a1a2e]/80 uppercase tracking-wider mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F4F8FF] border border-[#1a1a2e]/[0.10] rounded-xl text-[#1a1a2e] placeholder:text-[#1a1a2e]/55 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#e7ab1c] hover:bg-[#d49c10] disabled:opacity-50 text-[#1a1a2e] font-bold rounded-full transition-colors shadow-[0_4px_24px_rgba(231,171,28,0.25)]"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      Find My Tickets
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    )
  }

  /* ── No results ─────────────────────────────────────────────────── */

  if (!currentAttendee) {
    return (
      <main className="min-h-screen bg-[#F4F8FF] relative">
        <section className="pt-24 pb-12 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-6">
              Self-Service Portal
            </span>
            <h1 className="text-[#1a1a2e] leading-[1.08] font-bold mb-6 text-3xl md:text-5xl">
              My Tickets
            </h1>
          </div>
        </section>
        <section className="pb-20 px-6">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-[#1a1a2e]/75 hover:text-[#e7ab1c] transition-colors mb-8 font-medium"
            >
              <ArrowLeft size={16} />
              Search with a different email
            </button>
            <div className="rounded-2xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center mx-auto mb-5">
                <Search size={24} className="text-[#e7ab1c]" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">
                No Registrations Found
              </h3>
              <p className="text-[#1a1a2e]/75 text-sm max-w-md mx-auto leading-relaxed">
                We could not find any active registrations for{" "}
                <span className="text-[#1a1a2e] font-semibold">{email}</span>.
                Please check the email address and try again.
              </p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  /* ── Step 2: Portal ─────────────────────────────────────────────── */

  const evt = currentAttendee.events

  return (
    <main className="min-h-screen bg-[#F4F8FF] relative">
      {/* Hero */}
      <section className="pt-24 pb-6 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-4">
            Self-Service Portal
          </span>
          <h1 className="text-[#1a1a2e] leading-[1.08] font-bold mb-2 text-3xl md:text-5xl">
            My Tickets
          </h1>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm text-[#1a1a2e]/75 hover:text-[#e7ab1c] transition-colors mb-6 font-medium"
          >
            <ArrowLeft size={16} />
            Search with a different email
          </button>

          {/* Event selector (if multiple registrations) */}
          {attendees.length > 1 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {attendees.map((a, idx) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAttendeeIdx(idx)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                    idx === selectedAttendeeIdx
                      ? "bg-[#e7ab1c] text-[#1a1a2e] border-[#e7ab1c] shadow-[0_2px_12px_rgba(231,171,28,0.25)]"
                      : "bg-white text-[#1a1a2e]/80 border-[#1a1a2e]/[0.10] hover:border-[#e7ab1c]/40"
                  }`}
                >
                  {a.events?.title ?? "Event"}
                </button>
              ))}
            </div>
          )}

          {/* Attendee Info Card */}
          <div className="rounded-2xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#1a1a2e]">
                      {currentAttendee.name}
                    </h2>
                    <p className="text-sm text-[#1a1a2e]/75 mt-0.5">
                      {[currentAttendee.designation, currentAttendee.company]
                        .filter(Boolean)
                        .join(" at ")}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${statusBadgeClass(currentAttendee.status)}`}
                  >
                    {currentAttendee.status === "checked_in" ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <Clock size={12} />
                    )}
                    {statusLabel(currentAttendee.status)}
                  </span>
                </div>

                {/* Event details */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-[#1a1a2e]/80 mb-5">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#e7ab1c]" />
                    {evt?.title}
                  </span>
                  {evt?.venue && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#e7ab1c]" />
                      {evt.venue}
                    </span>
                  )}
                  {evt?.start_date && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-[#e7ab1c]" />
                      {fmtDateShort(evt.start_date)}
                      {evt.end_date && evt.end_date !== evt.start_date
                        ? ` - ${fmtDateShort(evt.end_date)}`
                        : ""}
                    </span>
                  )}
                </div>

                {/* QR Code */}
                <div className="flex items-center gap-3 p-3 bg-[#F4F8FF] rounded-xl border border-[#1a1a2e]/[0.06] mb-5">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-[#1a1a2e]/[0.06]">
                    <QRDisplay value={`attendee:${currentAttendee.id}`} />
                  </div>
                  <div className="text-xs text-[#1a1a2e]/75">
                    <p className="font-bold text-[#1a1a2e] text-sm">Your QR Code</p>
                    <p>Show this at the registration desk for quick check-in</p>
                  </div>
                </div>

                {/* Download buttons */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href={buildUrl("/api/attendee/badge", currentAttendee.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-full border border-[#e7ab1c]/40 text-[#a37410] bg-[#e7ab1c]/10 hover:bg-[#e7ab1c]/20 transition-colors"
                  >
                    <Download size={14} />
                    E-Ticket
                  </a>

                  {currentAttendee.check_in_at && (
                    <a
                      href={buildUrl("/api/attendee/certificate", currentAttendee.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-full border border-emerald-500/40 text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                    >
                      <Award size={14} />
                      Certificate
                    </a>
                  )}

                  <a
                    href={buildUrl("/api/attendee/invoice", currentAttendee.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-full border border-blue-500/40 text-blue-700 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                  >
                    <FileText size={14} />
                    Invoice
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#1a1a2e]/[0.06] mb-6">
            <div className="flex gap-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-[#e7ab1c] text-[#e7ab1c]"
                      : "border-transparent text-[#1a1a2e]/75 hover:text-[#1a1a2e]"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="min-h-[400px]">
            {activeTab === "agenda" && (
              <AgendaTab attendeeId={currentAttendee.id} eventSlug={evt?.slug ?? ""} />
            )}
            {activeTab === "networking" && (
              <NetworkingTab
                attendeeId={currentAttendee.id}
                eventId={evt?.id ?? ""}
              />
            )}
            {activeTab === "profile" && (
              <ProfileTab attendee={currentAttendee} />
            )}
            {activeTab === "materials" && (
              <MaterialsTab attendeeId={currentAttendee.id} />
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

/* ── QR Display Component ─────────────────────────────────────────── */

function QRDisplay({ value }: { value: string }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(value, { width: 56, margin: 1 }).then((url: string) => {
        if (!cancelled) setQrUrl(url)
      })
    })
    return () => {
      cancelled = true
    }
  }, [value])

  if (!qrUrl) {
    return <div className="w-12 h-12 bg-[#1a1a2e]/5 rounded animate-pulse" />
  }

  return (
    <img src={qrUrl} alt="QR Code" className="w-12 h-12" />
  )
}

/* ── Agenda Tab ───────────────────────────────────────────────────── */

function AgendaTab({ attendeeId, eventSlug }: { attendeeId: string; eventSlug: string }) {
  const [sessions, setSessions] = useState<AgendaSession[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  const fetchAgenda = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getAttendeeAgenda(attendeeId)
      if (result.success) {
        const sorted = [...(result.sessions as AgendaSession[])].sort(
          (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
        setSessions(sorted)
      }
    } finally {
      setLoading(false)
    }
  }, [attendeeId])

  useEffect(() => {
    fetchAgenda()
  }, [fetchAgenda])

  async function handleRemove(sessionId: string) {
    setRemoving(sessionId)
    try {
      const result = await removeBookmark(attendeeId, sessionId)
      if (result.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      }
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-[#e7ab1c]" />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-[#e7ab1c]/10 flex items-center justify-center mx-auto mb-4">
          <Bookmark size={24} className="text-[#e7ab1c]" />
        </div>
        <h3 className="text-lg font-bold text-[#1a1a2e] mb-2">
          No Sessions Bookmarked
        </h3>
        <p className="text-sm text-[#1a1a2e]/75 mb-6 max-w-sm mx-auto">
          Browse the event schedule and bookmark sessions to build your personal
          agenda.
        </p>
        {eventSlug && (
          <Link
            href={`/events/${eventSlug}/schedule`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e7ab1c] hover:bg-[#d49c10] text-[#1a1a2e] text-sm font-bold rounded-full transition-colors shadow-[0_2px_12px_rgba(231,171,28,0.25)]"
          >
            <Calendar size={16} />
            Browse Sessions
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-[#1a1a2e]/75">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} bookmarked
        </p>
        {eventSlug && (
          <Link
            href={`/events/${eventSlug}/schedule`}
            className="inline-flex items-center gap-1.5 text-sm text-[#e7ab1c] hover:text-[#d49c10] font-medium transition-colors"
          >
            Browse Sessions
            <ChevronRight size={14} />
          </Link>
        )}
      </div>
      {sessions.map((session) => (
        <div
          key={session.id}
          className="rounded-xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-5 group hover:border-[#e7ab1c]/20 transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono text-[#1a1a2e]/75">
                  {fmtTime(session.start_time)} - {fmtTime(session.end_time)}
                </span>
                {session.track && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#e7ab1c]/10 text-[#e7ab1c]">
                    {session.track}
                  </span>
                )}
                {session.room && (
                  <span className="text-[10px] text-[#1a1a2e]/65 px-2 py-0.5 rounded bg-[#1a1a2e]/[0.03]">
                    {session.room}
                  </span>
                )}
              </div>
              <h4 className="font-medium text-[#1a1a2e] text-sm leading-snug">
                {session.title}
              </h4>
              {session.description && (
                <p className="text-xs text-[#1a1a2e]/75 mt-1 line-clamp-1">
                  {session.description}
                </p>
              )}
            </div>
            <button
              onClick={() => handleRemove(session.id)}
              disabled={removing === session.id}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[#1a1a2e]/65 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Remove from agenda"
            >
              {removing === session.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <X size={14} />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Networking Tab ───────────────────────────────────────────────── */

function NetworkingTab({
  attendeeId,
  eventId,
}: {
  attendeeId: string
  eventId: string
}) {
  const [incoming, setIncoming] = useState<NetworkingRequest[]>([])
  const [outgoing, setOutgoing] = useState<NetworkingRequest[]>([])
  const [directory, setDirectory] = useState<DirectoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dirSearch, setDirSearch] = useState("")
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [connectModal, setConnectModal] = useState<DirectoryEntry | null>(null)
  const [connectMessage, setConnectMessage] = useState("")
  const [sending, setSending] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [netResult, dirResult] = await Promise.all([
        getNetworkingRequests(attendeeId),
        getEventDirectory(eventId),
      ])
      if (netResult.success) {
        setIncoming(netResult.incoming as NetworkingRequest[])
        setOutgoing(netResult.outgoing as NetworkingRequest[])
      }
      if (dirResult.success) {
        setDirectory(dirResult.delegates as DirectoryEntry[])
      }
    } finally {
      setLoading(false)
    }
  }, [attendeeId, eventId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function handleRespond(requestId: string, response: "accepted" | "declined") {
    setRespondingTo(requestId)
    try {
      const result = await respondToNetworkingRequest(requestId, response)
      if (result.success) {
        setIncoming((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, status: response } : r
          )
        )
      }
    } finally {
      setRespondingTo(null)
    }
  }

  async function handleSendRequest() {
    if (!connectModal) return
    setSending(true)
    try {
      const result = await sendNetworkingRequest({
        eventId,
        fromAttendeeId: attendeeId,
        toAttendeeId: connectModal.id,
        message: connectMessage || undefined,
      })
      if (result.success) {
        setConnectModal(null)
        setConnectMessage("")
        await fetchAll()
      } else {
        alert(result.error)
      }
    } finally {
      setSending(false)
    }
  }

  const filteredDirectory = directory.filter(
    (d) =>
      d.id !== attendeeId &&
      (dirSearch === "" ||
        d.name.toLowerCase().includes(dirSearch.toLowerCase()) ||
        (d.company?.toLowerCase() ?? "").includes(dirSearch.toLowerCase()) ||
        (d.designation?.toLowerCase() ?? "").includes(dirSearch.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-[#e7ab1c]" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Incoming requests */}
      <div>
        <h3 className="text-sm font-semibold text-[#1a1a2e]/70 uppercase tracking-wider mb-3">
          Incoming Requests
        </h3>
        {incoming.length === 0 ? (
          <p className="text-sm text-[#1a1a2e]/65 bg-white rounded-xl border border-[#1a1a2e]/[0.06] p-5 text-center">
            No incoming networking requests yet.
          </p>
        ) : (
          <div className="space-y-3">
            {incoming.map((req) => {
              const person = req.from_attendee
              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1a1a2e] text-sm">
                        {person?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-[#1a1a2e]/75">
                        {[person?.designation, person?.company]
                          .filter(Boolean)
                          .join(" at ")}
                      </p>
                      {req.message && (
                        <p className="text-xs text-[#1a1a2e]/75 mt-2 italic bg-[#F4F8FF] rounded-lg p-2.5">
                          &ldquo;{req.message}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {req.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespond(req.id, "accepted")}
                            disabled={respondingTo === req.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          >
                            {respondingTo === req.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              "Accept"
                            )}
                          </button>
                          <button
                            onClick={() => handleRespond(req.id, "declined")}
                            disabled={respondingTo === req.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${networkStatusBadge(req.status)}`}
                        >
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Outgoing requests */}
      <div>
        <h3 className="text-sm font-semibold text-[#1a1a2e]/70 uppercase tracking-wider mb-3">
          Outgoing Requests
        </h3>
        {outgoing.length === 0 ? (
          <p className="text-sm text-[#1a1a2e]/65 bg-white rounded-xl border border-[#1a1a2e]/[0.06] p-5 text-center">
            No outgoing networking requests yet.
          </p>
        ) : (
          <div className="space-y-3">
            {outgoing.map((req) => {
              const person = req.to_attendee
              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1a1a2e] text-sm">
                        {person?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-[#1a1a2e]/75">
                        {[person?.designation, person?.company]
                          .filter(Boolean)
                          .join(" at ")}
                      </p>
                      {req.message && (
                        <p className="text-xs text-[#1a1a2e]/75 mt-2 italic bg-[#F4F8FF] rounded-lg p-2.5">
                          &ldquo;{req.message}&rdquo;
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${networkStatusBadge(req.status)}`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Find Leaders / Directory */}
      <div>
        <h3 className="text-sm font-semibold text-[#1a1a2e]/70 uppercase tracking-wider mb-3">
          Find Leaders
        </h3>
        <div className="mb-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1a2e]/65"
            />
            <input
              type="text"
              placeholder="Search by name, company, or role..."
              value={dirSearch}
              onChange={(e) => setDirSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1a1a2e]/[0.10] rounded-lg text-sm text-[#1a1a2e] placeholder:text-[#1a1a2e]/55 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"
            />
          </div>
        </div>

        {filteredDirectory.length === 0 ? (
          <p className="text-sm text-[#1a1a2e]/65 bg-white rounded-xl border border-[#1a1a2e]/[0.06] p-5 text-center">
            {directory.length === 0
              ? "No delegates visible in the directory yet."
              : "No results matching your search."}
          </p>
        ) : (
          <div className="rounded-xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm divide-y divide-[#1a1a2e]/[0.04] max-h-[400px] overflow-y-auto">
            {filteredDirectory.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[#F4F8FF]/60 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[#1a1a2e] text-sm truncate">
                      {person.name}
                    </p>
                    {person.linkedin_url && (
                      <a
                        href={person.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0077b5] hover:text-[#005885] transition-colors shrink-0"
                      >
                        <Globe size={13} />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-[#1a1a2e]/75 truncate">
                    {[person.designation, person.company]
                      .filter(Boolean)
                      .join(" at ")}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setConnectModal(person)
                    setConnectMessage("")
                  }}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#e7ab1c]/30 text-[#e7ab1c] bg-[#e7ab1c]/5 hover:bg-[#e7ab1c]/10 transition-colors"
                >
                  <Send size={12} />
                  Connect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {connectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a2e]/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1a1a2e]">
                  Connect with {connectModal.name}
                </h3>
                <p className="text-sm text-[#1a1a2e]/75">
                  {[connectModal.designation, connectModal.company]
                    .filter(Boolean)
                    .join(" at ")}
                </p>
              </div>
              <button
                onClick={() => setConnectModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1a1a2e]/65 hover:text-[#1a1a2e]/80 hover:bg-[#1a1a2e]/5 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-[#1a1a2e]/75 uppercase tracking-wider mb-2">
                Message (optional)
              </label>
              <textarea
                value={connectMessage}
                onChange={(e) => setConnectMessage(e.target.value)}
                placeholder="Introduce yourself or mention what you'd like to discuss..."
                rows={3}
                className="w-full px-4 py-3 bg-[#F4F8FF] border border-[#1a1a2e]/[0.10] rounded-lg text-sm text-[#1a1a2e] placeholder:text-[#1a1a2e]/55 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConnectModal(null)}
                className="px-4 py-2 text-sm font-medium text-[#1a1a2e]/75 hover:text-[#1a1a2e]/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                disabled={sending}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#e7ab1c] hover:bg-[#d49c10] disabled:opacity-50 text-[#1a1a2e] text-sm font-bold rounded-full transition-colors shadow-[0_2px_12px_rgba(231,171,28,0.25)]"
              >
                {sending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <MessageSquare size={14} />
                )}
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Profile Tab ──────────────────────────────────────────────────── */

function ProfileTab({ attendee }: { attendee: Attendee }) {
  const [form, setForm] = useState({
    name: attendee.name ?? "",
    company: attendee.company ?? "",
    designation: attendee.designation ?? "",
    phone: attendee.phone ?? "",
    dietary_preference: attendee.dietary_preference ?? "",
    linkedin_url: attendee.linkedin_url ?? "",
    show_in_directory: attendee.show_in_directory ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleChange(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const result = await updateAttendeeProfile(attendee.id, form)
      if (result.success) {
        setSaved(true)
      } else {
        alert(result.error)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-6 md:p-8">
      <h3 className="text-lg font-bold text-[#1a1a2e] mb-6">Edit Profile</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-[#1a1a2e]/75 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full px-4 py-2.5 bg-[#F4F8FF] border border-[#1a1a2e]/[0.10] rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-xs font-medium text-[#1a1a2e]/75 uppercase tracking-wider mb-1.5">
            Company
          </label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => handleChange("company", e.target.value)}
            className="w-full px-4 py-2.5 bg-[#F4F8FF] border border-[#1a1a2e]/[0.10] rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"
          />
        </div>

        {/* Designation */}
        <div>
          <label className="block text-xs font-medium text-[#1a1a2e]/75 uppercase tracking-wider mb-1.5">
            Designation
          </label>
          <input
            type="text"
            value={form.designation}
            onChange={(e) => handleChange("designation", e.target.value)}
            className="w-full px-4 py-2.5 bg-[#F4F8FF] border border-[#1a1a2e]/[0.10] rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-[#1a1a2e]/75 uppercase tracking-wider mb-1.5">
            Phone
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full px-4 py-2.5 bg-[#F4F8FF] border border-[#1a1a2e]/[0.10] rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"
          />
        </div>

        {/* Dietary Preference */}
        <div>
          <label className="block text-xs font-medium text-[#1a1a2e]/75 uppercase tracking-wider mb-1.5">
            Dietary Preference
          </label>
          <select
            value={form.dietary_preference}
            onChange={(e) => handleChange("dietary_preference", e.target.value)}
            className="w-full px-4 py-2.5 bg-[#F4F8FF] border border-[#1a1a2e]/[0.10] rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"
          >
            <option value="">No preference</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="non-vegetarian">Non-Vegetarian</option>
            <option value="gluten-free">Gluten-Free</option>
            <option value="halal">Halal</option>
            <option value="kosher">Kosher</option>
          </select>
        </div>

        {/* LinkedIn URL */}
        <div>
          <label className="block text-xs font-medium text-[#1a1a2e]/75 uppercase tracking-wider mb-1.5">
            LinkedIn URL
          </label>
          <input
            type="url"
            value={form.linkedin_url}
            onChange={(e) => handleChange("linkedin_url", e.target.value)}
            placeholder="https://linkedin.com/in/..."
            className="w-full px-4 py-2.5 bg-[#F4F8FF] border border-[#1a1a2e]/[0.10] rounded-lg text-sm text-[#1a1a2e] placeholder:text-[#1a1a2e]/55 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"
          />
        </div>
      </div>

      {/* Show in Directory toggle */}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={form.show_in_directory}
          onClick={() => handleChange("show_in_directory", !form.show_in_directory)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            form.show_in_directory ? "bg-[#e7ab1c]" : "bg-[#1a1a2e]/15"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
              form.show_in_directory ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm text-[#1a1a2e]/80">
          Show my profile in the event directory
        </span>
      </div>

      {/* Save button */}
      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#e7ab1c] hover:bg-[#d49c10] disabled:opacity-50 text-[#1a1a2e] text-sm font-bold rounded-full transition-colors shadow-[0_2px_12px_rgba(231,171,28,0.25)]"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Save Profile
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <CheckCircle2 size={14} />
            Saved successfully
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Materials Tab ────────────────────────────────────────────────── */

function MaterialsTab({ attendeeId }: { attendeeId: string }) {
  const [sessions, setSessions] = useState<
    Array<{
      id: string
      title: string
      materials: MaterialItem[]
    }>
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchMaterials() {
      setLoading(true)
      try {
        // First get agenda to know which sessions are bookmarked
        const agendaResult = await getAttendeeAgenda(attendeeId)
        if (!agendaResult.success || agendaResult.sessions.length === 0) {
          setSessions([])
          return
        }

        // Fetch materials for each bookmarked session
        const materialsResults = await Promise.all(
          agendaResult.sessions.map((s) =>
            getSessionMaterials((s as AgendaSession).id)
          )
        )

        if (cancelled) return

        const sessionsWithMaterials = materialsResults
          .filter(
            (r) =>
              r.success &&
              r.materials &&
              Array.isArray(r.materials) &&
              r.materials.length > 0
          )
          .map((r) => ({
            id: crypto.randomUUID(),
            title: r.sessionTitle ?? "Session",
            materials: r.materials as MaterialItem[],
          }))

        setSessions(sessionsWithMaterials)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchMaterials()
    return () => {
      cancelled = true
    }
  }, [attendeeId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-[#e7ab1c]" />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-[#e7ab1c]/10 flex items-center justify-center mx-auto mb-4">
          <BookOpen size={24} className="text-[#e7ab1c]" />
        </div>
        <h3 className="text-lg font-bold text-[#1a1a2e] mb-2">
          No Materials Available
        </h3>
        <p className="text-sm text-[#1a1a2e]/75 max-w-sm mx-auto">
          Materials for your bookmarked sessions will appear here once speakers
          upload them.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#1a1a2e]/75 mb-2">
        {sessions.length} session{sessions.length !== 1 ? "s" : ""} with
        downloadable materials
      </p>
      {sessions.map((session) => (
        <div
          key={session.id}
          className="rounded-xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-5"
        >
          <h4 className="font-medium text-[#1a1a2e] text-sm mb-3">
            {session.title}
          </h4>
          <div className="space-y-2">
            {session.materials.map((material, idx) => (
              <a
                key={idx}
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#F4F8FF] border border-[#1a1a2e]/[0.04] hover:border-[#e7ab1c]/20 text-sm text-[#1a1a2e]/70 hover:text-[#e7ab1c] transition-all group"
              >
                <FileText
                  size={16}
                  className="text-[#1a1a2e]/65 group-hover:text-[#e7ab1c] transition-colors shrink-0"
                />
                <span className="flex-1 min-w-0 truncate">
                  {material.name ?? `Material ${idx + 1}`}
                </span>
                <ExternalLink
                  size={14}
                  className="text-[#1a1a2e]/65 group-hover:text-[#e7ab1c] transition-colors shrink-0"
                />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
