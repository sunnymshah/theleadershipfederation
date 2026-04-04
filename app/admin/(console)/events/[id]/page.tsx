"use client"

/**
 * ─── ZOHO BACKSTAGE REPLICA: EVENT WORKSPACE ────────────────────────────
 *
 * The master event management hub. When an admin clicks an event, they land
 * here — a fully-featured workspace with tabbed navigation mirroring
 * Zoho Backstage's event management experience.
 *
 * Tabs: Overview | Tickets | Speakers | CRM/Leads | Sponsors | Agenda | Promo Codes | Settings
 */

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { updateEvent } from "@/app/actions/eventActions"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Loader2,
  Ticket,
  Users,
  LayoutDashboard,
  Building2,
  ClipboardList,
  Tag,
  Settings,
  Globe,
  Copy,
  CheckCircle2,
  AlertCircle,
  Eye,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Sub-components (lazy-loaded via tabs) ─────────────────────────────
import { TicketManager } from "@/components/admin/TicketManager"
import { SpeakerManager } from "@/components/admin/SpeakerManager"
import { AttendeeManager } from "@/components/admin/AttendeeManager"
import { SponsorManager } from "@/components/admin/SponsorManager"
import { SessionManager } from "@/components/admin/SessionManager"
import { PromoCodeManager } from "@/components/admin/PromoCodeManager"

// ── Types ─────────────────────────────────────────────────────────────
interface EventDetail {
  id: string
  title: string
  slug: string
  start_date: string
  end_date: string
  venue: string
  description: string | null
  cover_image_url: string | null
  status: string
  created_at: string
  updated_at: string
}

interface Counts {
  tickets: number
  speakers: number
  attendees: number
  sponsors: number
  sessions: number
  promoCodes: number
  revenue: number
  checkedIn: number
}

// ── Status config ─────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  draft:     { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-400" },
  published: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  completed: { bg: "bg-blue-500/10",   text: "text-blue-400",    dot: "bg-blue-400" },
  cancelled: { bg: "bg-red-500/10",    text: "text-red-400",     dot: "bg-red-400" },
}

// ── Tab config ────────────────────────────────────────────────────────
const TABS = [
  { key: "overview",    label: "Overview",     icon: LayoutDashboard },
  { key: "tickets",     label: "Tickets",      icon: Ticket },
  { key: "speakers",    label: "Speakers",     icon: Users },
  { key: "crm",         label: "CRM / Leads",  icon: Users },
  { key: "sponsors",    label: "Sponsors",     icon: Building2 },
  { key: "agenda",      label: "Agenda",       icon: ClipboardList },
  { key: "promo-codes", label: "Promo Codes",  icon: Tag },
  { key: "settings",    label: "Settings",     icon: Settings },
] as const

type TabKey = (typeof TABS)[number]["key"]

// ── Formatters ────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}
function fmtPrice(n: number) {
  return new Intl.NumberFormat("en-IN").format(n)
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent]         = useState<EventDetail | null>(null)
  const [counts, setCounts]       = useState<Counts>({ tickets: 0, speakers: 0, attendees: 0, sponsors: 0, sessions: 0, promoCodes: 0, revenue: 0, checkedIn: 0 })
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>("overview")

  const supabase = createClient()

  const fetchEvent = useCallback(async () => {
    setLoading(true)
    const [eventRes, ticketCount, speakerCount, attendeeCount, sponsorCount, sessionCount, promoCount, revenueRes, checkedInCount] = await Promise.all([
      supabase.from("events").select("*").eq("id", id).single(),
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("event_id", id),
      supabase.from("speakers").select("id", { count: "exact", head: true }).eq("event_id", id),
      supabase.from("attendees").select("id", { count: "exact", head: true }).eq("event_id", id),
      supabase.from("sponsors").select("id", { count: "exact", head: true }).eq("event_id", id),
      supabase.from("sessions").select("id", { count: "exact", head: true }).eq("event_id", id),
      supabase.from("promo_codes").select("id", { count: "exact", head: true }).eq("event_id", id),
      supabase.from("tickets").select("price_inr, sold").eq("event_id", id),
      supabase.from("attendees").select("id", { count: "exact", head: true }).eq("event_id", id).eq("status", "checked_in"),
    ])

    if (eventRes.data) setEvent(eventRes.data)

    // Calculate revenue
    const revenue = (revenueRes.data ?? []).reduce((sum: number, t: { price_inr: number; sold: number }) => sum + t.price_inr * t.sold, 0)

    setCounts({
      tickets: ticketCount.count ?? 0,
      speakers: speakerCount.count ?? 0,
      attendees: attendeeCount.count ?? 0,
      sponsors: sponsorCount.count ?? 0,
      sessions: sessionCount.count ?? 0,
      promoCodes: promoCount.count ?? 0,
      revenue,
      checkedIn: checkedInCount.count ?? 0,
    })
    setLoading(false)
  }, [id])

  useEffect(() => { fetchEvent() }, [fetchEvent])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-[#aaa] gap-2">
        <Loader2 size={20} className="animate-spin" /> Loading event…
      </div>
    )
  }

  if (!event) {
    return (
      <div className="p-8 text-center py-32">
        <p className="text-[#888]">Event not found.</p>
        <Link href="/admin/events" className="text-[#c9a84c] text-sm mt-2 inline-block hover:underline">Back to Events</Link>
      </div>
    )
  }

  const statusStyle = STATUS_STYLES[event.status] ?? STATUS_STYLES.draft
  const isUpcoming = new Date(event.start_date) > new Date()

  return (
    <div className="flex flex-col h-full">
      {/* ── Sticky Header ─────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-[#e0e0e0] z-10">
        <div className="px-8 pt-5 pb-0">
          {/* Breadcrumb */}
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-1.5 text-[11px] text-[#aaa] hover:text-[#666] transition-colors mb-4 uppercase tracking-wider font-medium"
          >
            <ArrowLeft size={12} /> All Events
          </Link>

          {/* Event Header Bar */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1 min-w-0">
              {/* Title Row */}
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-[#333] truncate">{event.title}</h1>
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0", statusStyle.bg, statusStyle.text)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", statusStyle.dot)} />
                  {event.status}
                </span>
              </div>

              {/* Meta Row */}
              <div className="flex items-center gap-5 text-[13px] text-[#888]">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#bbb]" />
                  {fmtDate(event.start_date)}
                  {fmtDate(event.start_date) !== fmtDate(event.end_date) && <> — {fmtDate(event.end_date)}</>}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#bbb]" />
                  {event.venue}
                </span>
                {event.status === "published" && (
                  <Link
                    href={`/events/${event.slug}`}
                    target="_blank"
                    className="flex items-center gap-1 text-[#c9a84c] hover:text-[#d4b85c] transition-colors"
                  >
                    <Globe size={13} />
                    View Live Page
                    <ExternalLink size={10} />
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex gap-3 shrink-0 ml-6">
              {[
                { label: "Registrations", value: counts.attendees, color: "text-blue-400", bg: "bg-blue-500/10" },
                { label: "Revenue", value: `₹${fmtPrice(counts.revenue)}`, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "Checked In", value: `${counts.checkedIn}/${counts.attendees}`, color: "text-[#c9a84c]", bg: "bg-[#c9a84c]/10" },
              ].map((s) => (
                <div key={s.label} className={cn("px-4 py-2.5 rounded-xl border border-[#e0e0e0]", s.bg)}>
                  <div className={cn("text-lg font-bold tabular-nums", s.color)}>{s.value}</div>
                  <div className="text-[10px] text-[#999] uppercase tracking-wider font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tab Bar ─────────────────────────────────────────────── */}
          <nav className="flex gap-0 -mb-px">
            {TABS.map(({ key, label, icon: Icon }) => {
              // Badge count per tab
              const badgeCount = key === "tickets" ? counts.tickets
                : key === "speakers" ? counts.speakers
                : key === "crm" ? counts.attendees
                : key === "sponsors" ? counts.sponsors
                : key === "agenda" ? counts.sessions
                : key === "promo-codes" ? counts.promoCodes
                : null

              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-all",
                    activeTab === key
                      ? "border-[#c9a84c] text-[#333]"
                      : "border-transparent text-[#999] hover:text-[#666] hover:border-[#e0e0e0]"
                  )}
                >
                  <Icon size={14} className={activeTab === key ? "text-[#c9a84c]" : ""} />
                  {label}
                  {badgeCount !== null && badgeCount > 0 && (
                    <span className={cn(
                      "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums",
                      activeTab === key ? "bg-[#c9a84c]/20 text-[#c9a84c]" : "bg-[#f0f0f0] text-[#aaa]"
                    )}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* ── Tab Content (scrollable) ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {activeTab === "overview"     && <OverviewTab event={event} counts={counts} onTabSwitch={setActiveTab} />}
          {activeTab === "tickets"      && <TicketManager eventId={event.id} />}
          {activeTab === "speakers"     && <SpeakerManager eventId={event.id} />}
          {activeTab === "crm"          && <AttendeeManager eventId={event.id} />}
          {activeTab === "sponsors"     && <SponsorManager eventId={event.id} />}
          {activeTab === "agenda"       && <SessionManager eventId={event.id} />}
          {activeTab === "promo-codes"  && <PromoCodeManager eventId={event.id} />}
          {activeTab === "settings"     && <SettingsTab event={event} onUpdate={fetchEvent} />}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// OVERVIEW TAB — Zoho-style dashboard cards
// ═══════════════════════════════════════════════════════════════════════

function OverviewTab({ event, counts, onTabSwitch }: { event: EventDetail; counts: Counts; onTabSwitch: (tab: TabKey) => void }) {
  const daysUntil = Math.ceil((new Date(event.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const isUpcoming = daysUntil > 0
  const isPast = new Date(event.end_date) < new Date()

  return (
    <div className="space-y-8">
      {/* Countdown / Status Banner */}
      {isUpcoming && (
        <div className="rounded-xl bg-gradient-to-r from-[#c9a84c]/10 via-[#c9a84c]/5 to-transparent border border-[#c9a84c]/20 p-5 flex items-center justify-between">
          <div>
            <p className="text-[#c9a84c] font-semibold text-sm">Event Countdown</p>
            <p className="text-[#777] text-xs mt-0.5">Your event is coming up. Make sure everything is ready.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#c9a84c] tabular-nums">{daysUntil}</div>
            <div className="text-[10px] text-[#999] uppercase tracking-wider">days to go</div>
          </div>
        </div>
      )}

      {isPast && event.status !== "completed" && (
        <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-5 flex items-center gap-3">
          <AlertCircle size={18} className="text-blue-400 shrink-0" />
          <div>
            <p className="text-blue-400 font-semibold text-sm">Event has ended</p>
            <p className="text-[#888] text-xs mt-0.5">Consider updating the status to "Completed" in Settings.</p>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ticket Tiers",   value: String(counts.tickets),   icon: Ticket,        color: "text-blue-400",     bg: "bg-blue-500/10",    tab: "tickets" as TabKey },
          { label: "Speakers",       value: String(counts.speakers),  icon: Users,          color: "text-purple-400",   bg: "bg-purple-500/10",  tab: "speakers" as TabKey },
          { label: "Registrations",  value: String(counts.attendees), icon: Users,          color: "text-orange-400",   bg: "bg-orange-500/10",  tab: "crm" as TabKey },
          { label: "Sponsors",       value: String(counts.sponsors),  icon: Building2,      color: "text-[#c9a84c]",    bg: "bg-[#c9a84c]/10",   tab: "sponsors" as TabKey },
          { label: "Sessions",       value: String(counts.sessions),  icon: ClipboardList,  color: "text-cyan-400",     bg: "bg-cyan-500/10",    tab: "agenda" as TabKey },
          { label: "Promo Codes",    value: String(counts.promoCodes),icon: Tag,            color: "text-pink-400",     bg: "bg-pink-500/10",    tab: "promo-codes" as TabKey },
          { label: "Revenue",        value: `₹${fmtPrice(counts.revenue)}`, icon: Ticket,  color: "text-emerald-400",  bg: "bg-emerald-500/10", tab: "tickets" as TabKey },
          { label: "Check-In Rate",  value: counts.attendees > 0 ? `${Math.round((counts.checkedIn / counts.attendees) * 100)}%` : "—", icon: CheckCircle2, color: "text-teal-400", bg: "bg-teal-500/10", tab: "crm" as TabKey },
        ].map(({ label, value, icon: Icon, color, bg, tab }) => (
          <button
            key={label}
            onClick={() => onTabSwitch(tab)}
            className="text-left p-5 rounded-xl border border-[#e0e0e0] bg-white hover:bg-[#fafafa] hover:border-[#ccc] transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider">{label}</p>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bg)}>
                <Icon size={15} className={color} />
              </div>
            </div>
            <p className={cn("text-2xl font-bold tabular-nums", color)}>{value}</p>
          </button>
        ))}
      </div>

      {/* Event Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Details */}
        <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
          <div className="px-5 py-3 bg-white border-b border-[#e0e0e0]">
            <h3 className="text-xs font-semibold text-[#777] uppercase tracking-wider">Event Details</h3>
          </div>
          <div className="divide-y divide-[#eee]">
            {[
              { label: "Title", value: event.title },
              { label: "URL Slug", value: `/${event.slug}` },
              { label: "Start", value: fmtDateTime(event.start_date) },
              { label: "End", value: fmtDateTime(event.end_date) },
              { label: "Venue", value: event.venue },
              { label: "Created", value: fmtDateTime(event.created_at) },
              { label: "Last Updated", value: fmtDateTime(event.updated_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center px-5 py-3">
                <span className="text-[13px] text-[#999] w-32 shrink-0">{label}</span>
                <span className="text-[13px] text-[#444]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Description + Cover */}
        <div className="space-y-6">
          {event.description && (
            <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
              <div className="px-5 py-3 bg-white border-b border-[#e0e0e0]">
                <h3 className="text-xs font-semibold text-[#777] uppercase tracking-wider">Description</h3>
              </div>
              <div className="px-5 py-4">
                <p className="text-[13px] text-[#666] leading-relaxed whitespace-pre-line">{event.description}</p>
              </div>
            </div>
          )}

          {event.cover_image_url && (
            <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
              <div className="px-5 py-3 bg-white border-b border-[#e0e0e0]">
                <h3 className="text-xs font-semibold text-[#777] uppercase tracking-wider">Cover Image</h3>
              </div>
              <div className="p-4">
                <img src={event.cover_image_url} alt={event.title} className="rounded-lg w-full max-h-48 object-cover" />
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
            <div className="px-5 py-3 bg-white border-b border-[#e0e0e0]">
              <h3 className="text-xs font-semibold text-[#777] uppercase tracking-wider">Quick Actions</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <button onClick={() => onTabSwitch("speakers")} className="px-4 py-3 rounded-lg border border-[#e0e0e0] text-sm text-[#666] hover:text-[#333] hover:bg-[#fafafa] transition-all text-left">
                <Users size={16} className="text-purple-400 mb-2" />
                Add Speakers
              </button>
              <button onClick={() => onTabSwitch("tickets")} className="px-4 py-3 rounded-lg border border-[#e0e0e0] text-sm text-[#666] hover:text-[#333] hover:bg-[#fafafa] transition-all text-left">
                <Ticket size={16} className="text-blue-400 mb-2" />
                Manage Tickets
              </button>
              <button onClick={() => onTabSwitch("agenda")} className="px-4 py-3 rounded-lg border border-[#e0e0e0] text-sm text-[#666] hover:text-[#333] hover:bg-[#fafafa] transition-all text-left">
                <ClipboardList size={16} className="text-cyan-400 mb-2" />
                Build Agenda
              </button>
              <button onClick={() => onTabSwitch("sponsors")} className="px-4 py-3 rounded-lg border border-[#e0e0e0] text-sm text-[#666] hover:text-[#333] hover:bg-[#fafafa] transition-all text-left">
                <Building2 size={16} className="text-[#c9a84c] mb-2" />
                Add Sponsors
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// SETTINGS TAB — Event configuration, status, danger zone
// ═══════════════════════════════════════════════════════════════════════

function SettingsTab({ event, onUpdate }: { event: EventDetail; onUpdate: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    const fd = new FormData(e.currentTarget)
    const result = await updateEvent(event.id, fd)

    if (result.success) {
      setMessage({ type: "success", text: "Event settings saved successfully." })
      onUpdate()
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to save." })
    }
    setSubmitting(false)
  }

  function handleCopySlug() {
    navigator.clipboard.writeText(`${window.location.origin}/events/${event.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Public URL */}
      <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
        <div className="px-5 py-3 bg-white border-b border-[#e0e0e0]">
          <h3 className="text-xs font-semibold text-[#777] uppercase tracking-wider">Public URL</h3>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 bg-[#fafafa] border border-[#e0e0e0] rounded-lg text-[13px] text-[#666] font-mono truncate">
              /events/{event.slug}
            </div>
            <button
              onClick={handleCopySlug}
              className="px-3 py-2.5 rounded-lg border border-[#e0e0e0] text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"
            >
              {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
            {event.status === "published" && (
              <Link
                href={`/events/${event.slug}`}
                target="_blank"
                className="px-3 py-2.5 rounded-lg border border-[#e0e0e0] text-[#888] hover:text-[#c9a84c] hover:bg-[#c9a84c]/5 transition-colors"
              >
                <Eye size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-[#e0e0e0] overflow-hidden">
        <div className="px-5 py-3 bg-white border-b border-[#e0e0e0]">
          <h3 className="text-xs font-semibold text-[#777] uppercase tracking-wider">Event Configuration</h3>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Event Title *</label>
            <input type="text" name="title" required defaultValue={event.title} className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
          </div>
          <div>
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">URL Slug *</label>
            <input type="text" name="slug" required defaultValue={event.slug} className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Start Date *</label>
              <input type="datetime-local" name="startDate" required defaultValue={new Date(event.start_date).toISOString().slice(0, 16)} className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">End Date *</label>
              <input type="datetime-local" name="endDate" required defaultValue={new Date(event.end_date).toISOString().slice(0, 16)} className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Venue *</label>
            <input type="text" name="venue" required defaultValue={event.venue} className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
          </div>
          <div>
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Description</label>
            <textarea name="description" rows={4} defaultValue={event.description ?? ""} className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Cover Image URL</label>
            <input type="url" name="coverImageUrl" defaultValue={event.cover_image_url ?? ""} className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="https://..." />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Status</label>
            <select name="status" defaultValue={event.status} className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
              <option value="draft">Draft</option>
              <option value="published">Published (visible on public site)</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {message && (
            <div className={cn("px-4 py-3 rounded-lg text-sm flex items-center gap-2", message.type === "success" ? "bg-emerald-500/8 border border-emerald-500/15 text-emerald-400" : "bg-red-500/8 border border-red-500/15 text-red-400")}>
              {message.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-[#c9a84c] text-white text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  )
}
