"use client"

/**
 * ─── SPONSOR PORTAL: LEAD CAPTURE ──────────────────────────────────────────
 *
 * Mobile-optimized lead capture page for sponsor booth staff.
 * Supports QR/badge scan lookup and manual entry.
 * Light theme with gold #e7ab1c accents matching the sponsor portal.
 */

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  getSponsorSession,
  getSponsorProfile,
} from "@/app/actions/sponsorPortalActions"
import {
  captureLead,
  captureLeadFromQr,
  getLeads,
  updateLead,
  exportLeadsCSV,
} from "@/app/actions/leadCaptureActions"
import {
  Loader2,
  LogOut,
  Download,
  ScanLine,
  PenLine,
  List,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Flame,
  Thermometer,
  Snowflake,
  User,
  Building2,
  Mail,
  Phone,
  Briefcase,
  MessageSquare,
  ArrowLeft,
} from "lucide-react"
import { sponsorLogout } from "@/app/actions/sponsorPortalActions"
import { cn } from "@/lib/utils"

/* ── Types ───────────────────────────────────────────────────────────────── */

interface SponsorData {
  id: string
  event_id: string
  name: string
  tier: string
  logo_url: string | null
  events:
    | {
        id: string
        title: string
        slug: string
        start_date: string
        end_date: string
        venue: string
        status: string
      }[]
    | null
}

interface LeadRow {
  id: string
  sponsor_id: string
  event_id: string
  attendee_id: string | null
  lead_name: string
  lead_email: string | null
  lead_phone: string | null
  lead_company: string | null
  lead_designation: string | null
  notes: string | null
  interest_level: string
  captured_via: string
  captured_at: string
  follow_up_status: string
  follow_up_notes: string | null
}

type Tab = "scan" | "manual" | "leads"

const INTEREST_LEVELS = [
  { value: "hot", label: "Hot", color: "bg-red-500", textColor: "text-white", icon: Flame },
  { value: "warm", label: "Warm", color: "bg-orange-400", textColor: "text-white", icon: Thermometer },
  { value: "medium", label: "Medium", color: "bg-blue-500", textColor: "text-white", icon: Thermometer },
  { value: "cold", label: "Cold", color: "bg-gray-400", textColor: "text-white", icon: Snowflake },
] as const

const FOLLOW_UP_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "contacted", label: "Contacted" },
  { value: "meeting_set", label: "Meeting Set" },
  { value: "closed", label: "Closed" },
  { value: "not_interested", label: "Not Interested" },
] as const

const INTEREST_BADGE: Record<string, { bg: string; text: string }> = {
  hot: { bg: "bg-red-100", text: "text-red-700" },
  warm: { bg: "bg-orange-100", text: "text-orange-700" },
  medium: { bg: "bg-blue-100", text: "text-blue-700" },
  cold: { bg: "bg-gray-100", text: "text-gray-600" },
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function SponsorLeadCapturePage() {
  const router = useRouter()
  const [sponsor, setSponsor] = useState<SponsorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("scan")
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [exporting, setExporting] = useState(false)

  /* ── Auth + Load Profile ─────────────────────────────────────────────── */

  const loadProfile = useCallback(async () => {
    const sessionId = await getSponsorSession()
    if (!sessionId) {
      router.push("/sponsor-portal")
      return
    }

    const result = await getSponsorProfile(sessionId)
    if (result.success && result.sponsor) {
      setSponsor(result.sponsor as SponsorData)
    } else {
      router.push("/sponsor-portal")
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  /* ── Load Leads ──────────────────────────────────────────────────────── */

  const refreshLeads = useCallback(async () => {
    if (!sponsor) return
    setLoadingLeads(true)
    const event = sponsor.events?.[0]
    const result = await getLeads(sponsor.id, event?.id)
    if (result.success) {
      setLeads(result.leads as LeadRow[])
    }
    setLoadingLeads(false)
  }, [sponsor])

  useEffect(() => {
    if (sponsor) refreshLeads()
  }, [sponsor, refreshLeads])

  /* ── Export CSV ──────────────────────────────────────────────────────── */

  async function handleExport() {
    if (!sponsor) return
    const event = sponsor.events?.[0]
    if (!event) return
    setExporting(true)
    const result = await exportLeadsCSV(sponsor.id, event.id)
    if (result.success && result.csv) {
      const blob = new Blob([result.csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `leads-${sponsor.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
    setExporting(false)
  }

  /* ── Loading state ───────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="flex items-center gap-3 text-[#888]">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  if (!sponsor) return null

  const event = sponsor.events?.[0] ?? null
  const todayLeads = leads.filter((l) => {
    const d = new Date(l.captured_at)
    const today = new Date()
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    )
  })

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-[#1a1a2e] text-white px-4 py-4 safe-area-top">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {sponsor.logo_url ? (
                <img
                  src={sponsor.logo_url}
                  alt={sponsor.name}
                  className="w-10 h-10 rounded-lg object-contain bg-white/10 p-1"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Building2 size={18} className="text-white/60" />
                </div>
              )}
              <div>
                <h1 className="text-[15px] font-bold leading-tight">{sponsor.name}</h1>
                {event && (
                  <p className="text-[11px] text-white/50">{event.title}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/sponsor-portal/dashboard")}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                onClick={async () => {
                  await sponsorLogout()
                  router.push("/sponsor-portal")
                }}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5">
            <div>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Today</span>
              <p className="text-xl font-bold text-[#e7ab1c]">{todayLeads.length}</p>
            </div>
            <div>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Total</span>
              <p className="text-xl font-bold text-white">{leads.length}</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting || leads.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e7ab1c] text-[#1a1a2e] text-[12px] font-bold hover:bg-[#d49c16] disabled:opacity-40 transition-colors"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ───────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#e0e0e0] sticky top-0 z-20">
        <div className="max-w-lg mx-auto flex">
          {([
            { key: "scan" as Tab, label: "QR / Badge", icon: ScanLine },
            { key: "manual" as Tab, label: "Manual Entry", icon: PenLine },
            { key: "leads" as Tab, label: "Leads", icon: List },
          ]).map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3.5 text-[13px] font-medium transition-colors border-b-2",
                  isActive
                    ? "text-[#e7ab1c] border-[#e7ab1c]"
                    : "text-[#999] border-transparent hover:text-[#666]"
                )}
              >
                <Icon size={16} />
                {tab.label}
                {tab.key === "leads" && leads.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-[#e7ab1c]/10 text-[#e7ab1c] text-[11px] font-bold px-1.5">
                    {leads.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 py-5">
        {activeTab === "scan" && (
          <QrScanTab
            sponsorId={sponsor.id}
            eventId={event?.id ?? ""}
            onLeadCaptured={() => {
              refreshLeads()
              setActiveTab("leads")
            }}
          />
        )}
        {activeTab === "manual" && (
          <ManualEntryTab
            sponsorId={sponsor.id}
            eventId={event?.id ?? ""}
            onLeadCaptured={() => {
              refreshLeads()
              setActiveTab("leads")
            }}
          />
        )}
        {activeTab === "leads" && (
          <LeadsListTab
            leads={leads}
            loading={loadingLeads}
            onRefresh={refreshLeads}
          />
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  QR / Badge Scan Tab
 * ═══════════════════════════════════════════════════════════════════════════ */

function QrScanTab({
  sponsorId,
  eventId,
  onLeadCaptured,
}: {
  sponsorId: string
  eventId: string
  onLeadCaptured: () => void
}) {
  const [qrToken, setQrToken] = useState("")
  const [searching, setSearching] = useState(false)
  const [attendee, setAttendee] = useState<{
    id: string
    name: string
    email: string | null
    company: string | null
    designation: string | null
    phone: string | null
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [interestLevel, setInterestLevel] = useState("medium")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleLookup() {
    if (!qrToken.trim()) return
    setSearching(true)
    setError(null)
    setAttendee(null)
    setSuccess(false)

    const result = await captureLeadFromQr(sponsorId, eventId, qrToken.trim())
    if (result.success && result.attendee) {
      setAttendee(result.attendee)
    } else {
      setError(result.error ?? "Not found")
    }
    setSearching(false)
  }

  async function handleSaveLead() {
    if (!attendee) return
    setSaving(true)
    setError(null)

    const result = await captureLead({
      sponsorId,
      eventId,
      attendeeId: attendee.id,
      name: attendee.name,
      email: attendee.email ?? undefined,
      phone: attendee.phone ?? undefined,
      company: attendee.company ?? undefined,
      designation: attendee.designation ?? undefined,
      notes: notes || undefined,
      interestLevel,
      capturedVia: "qr_scan",
    })

    if (result.success) {
      setSuccess(true)
      setAttendee(null)
      setQrToken("")
      setNotes("")
      setInterestLevel("medium")
      setTimeout(() => {
        setSuccess(false)
        onLeadCaptured()
      }, 1500)
    } else {
      setError(result.error ?? "Failed to save lead")
    }
    setSaving(false)
  }

  function handleReset() {
    setQrToken("")
    setAttendee(null)
    setError(null)
    setNotes("")
    setInterestLevel("medium")
    setSuccess(false)
  }

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <Check size={32} className="text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-[#1a1a2e] mb-1">Lead Captured!</h3>
        <p className="text-sm text-[#888]">Redirecting to leads list...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Search input */}
      <div>
        <label className="block text-[11px] text-[#888] uppercase tracking-wider font-semibold mb-2">
          Badge Number / QR Code
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
            <input
              type="text"
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              placeholder="Enter badge number or scan QR..."
              className="w-full pl-10 pr-4 py-3.5 bg-white border border-[#e0e0e0] rounded-xl text-sm text-[#1a1a2e] placeholder-[#bbb] focus:outline-none focus:border-[#e7ab1c] focus:ring-2 focus:ring-[#e7ab1c]/10 transition-all"
              autoFocus
            />
          </div>
          <button
            onClick={handleLookup}
            disabled={searching || !qrToken.trim()}
            className="px-5 py-3.5 rounded-xl bg-[#e7ab1c] text-white text-sm font-bold hover:bg-[#d49c16] disabled:opacity-40 transition-colors flex items-center gap-2"
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
            Scan
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Attendee Details */}
      {attendee && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#e0e0e0] p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1a1a2e]">{attendee.name}</h3>
                {attendee.designation && (
                  <p className="text-[13px] text-[#888]">{attendee.designation}</p>
                )}
              </div>
              <button
                onClick={handleReset}
                className="p-1.5 rounded-md text-[#ccc] hover:text-[#888] hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5">
              {attendee.company && (
                <div className="flex items-center gap-2.5 text-[13px] text-[#666]">
                  <Building2 size={14} className="text-[#bbb] shrink-0" />
                  {attendee.company}
                </div>
              )}
              {attendee.email && (
                <div className="flex items-center gap-2.5 text-[13px] text-[#666]">
                  <Mail size={14} className="text-[#bbb] shrink-0" />
                  {attendee.email}
                </div>
              )}
              {attendee.phone && (
                <div className="flex items-center gap-2.5 text-[13px] text-[#666]">
                  <Phone size={14} className="text-[#bbb] shrink-0" />
                  {attendee.phone}
                </div>
              )}
            </div>
          </div>

          {/* Interest Level */}
          <div>
            <label className="block text-[11px] text-[#888] uppercase tracking-wider font-semibold mb-2">
              Interest Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {INTEREST_LEVELS.map((level) => {
                const Icon = level.icon
                const isSelected = interestLevel === level.value
                return (
                  <button
                    key={level.value}
                    onClick={() => setInterestLevel(level.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-3 rounded-xl text-[12px] font-bold transition-all border-2",
                      isSelected
                        ? `${level.color} ${level.textColor} border-transparent shadow-lg`
                        : "bg-white border-[#e0e0e0] text-[#888] hover:border-[#ccc]"
                    )}
                  >
                    <Icon size={18} />
                    {level.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] text-[#888] uppercase tracking-wider font-semibold mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-[#e0e0e0] rounded-xl text-sm text-[#1a1a2e] placeholder-[#bbb] focus:outline-none focus:border-[#e7ab1c] focus:ring-2 focus:ring-[#e7ab1c]/10 transition-all resize-none"
              placeholder="Interested in product X, follow up next week..."
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSaveLead}
            disabled={saving}
            className="w-full py-4 rounded-xl bg-[#e7ab1c] text-white text-[15px] font-bold hover:bg-[#d49c16] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#e7ab1c]/20"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check size={18} /> Add as Lead
              </>
            )}
          </button>
        </div>
      )}

      {/* Empty state when no search */}
      {!attendee && !error && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#e7ab1c]/10 mb-4">
            <ScanLine size={28} className="text-[#e7ab1c]" />
          </div>
          <h3 className="text-[15px] font-semibold text-[#1a1a2e] mb-1">
            Scan a Badge
          </h3>
          <p className="text-[13px] text-[#999] max-w-xs mx-auto">
            Enter the attendee&apos;s badge number or scan their QR code to quickly capture lead details.
          </p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Manual Entry Tab
 * ═══════════════════════════════════════════════════════════════════════════ */

function ManualEntryTab({
  sponsorId,
  eventId,
  onLeadCaptured,
}: {
  sponsorId: string
  eventId: string
  onLeadCaptured: () => void
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    designation: "",
    notes: "",
  })
  const [interestLevel, setInterestLevel] = useState("medium")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) return
    setSaving(true)
    setError(null)

    const result = await captureLead({
      sponsorId,
      eventId,
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      company: formData.company.trim() || undefined,
      designation: formData.designation.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      interestLevel,
      capturedVia: "manual",
    })

    if (result.success) {
      setSuccess(true)
      setFormData({ name: "", email: "", phone: "", company: "", designation: "", notes: "" })
      setInterestLevel("medium")
      setTimeout(() => {
        setSuccess(false)
        onLeadCaptured()
      }, 1500)
    } else {
      setError(result.error ?? "Failed to save lead")
    }
    setSaving(false)
  }

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <Check size={32} className="text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-[#1a1a2e] mb-1">Lead Saved!</h3>
        <p className="text-sm text-[#888]">Redirecting to leads list...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-[11px] text-[#888] uppercase tracking-wider font-semibold mb-1.5">
          Name *
        </label>
        <div className="relative">
          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3.5 bg-white border border-[#e0e0e0] rounded-xl text-sm text-[#1a1a2e] placeholder-[#bbb] focus:outline-none focus:border-[#e7ab1c] focus:ring-2 focus:ring-[#e7ab1c]/10 transition-all"
            placeholder="Full name"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-[11px] text-[#888] uppercase tracking-wider font-semibold mb-1.5">
          Email
        </label>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="w-full pl-10 pr-4 py-3.5 bg-white border border-[#e0e0e0] rounded-xl text-sm text-[#1a1a2e] placeholder-[#bbb] focus:outline-none focus:border-[#e7ab1c] focus:ring-2 focus:ring-[#e7ab1c]/10 transition-all"
            placeholder="email@company.com"
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-[11px] text-[#888] uppercase tracking-wider font-semibold mb-1.5">
          Phone
        </label>
        <div className="relative">
          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="w-full pl-10 pr-4 py-3.5 bg-white border border-[#e0e0e0] rounded-xl text-sm text-[#1a1a2e] placeholder-[#bbb] focus:outline-none focus:border-[#e7ab1c] focus:ring-2 focus:ring-[#e7ab1c]/10 transition-all"
            placeholder="+91 98765 43210"
          />
        </div>
      </div>

      {/* Company */}
      <div>
        <label className="block text-[11px] text-[#888] uppercase tracking-wider font-semibold mb-1.5">
          Company
        </label>
        <div className="relative">
          <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input
            type="text"
            value={formData.company}
            onChange={(e) => updateField("company", e.target.value)}
            className="w-full pl-10 pr-4 py-3.5 bg-white border border-[#e0e0e0] rounded-xl text-sm text-[#1a1a2e] placeholder-[#bbb] focus:outline-none focus:border-[#e7ab1c] focus:ring-2 focus:ring-[#e7ab1c]/10 transition-all"
            placeholder="Company name"
          />
        </div>
      </div>

      {/* Designation */}
      <div>
        <label className="block text-[11px] text-[#888] uppercase tracking-wider font-semibold mb-1.5">
          Designation
        </label>
        <div className="relative">
          <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input
            type="text"
            value={formData.designation}
            onChange={(e) => updateField("designation", e.target.value)}
            className="w-full pl-10 pr-4 py-3.5 bg-white border border-[#e0e0e0] rounded-xl text-sm text-[#1a1a2e] placeholder-[#bbb] focus:outline-none focus:border-[#e7ab1c] focus:ring-2 focus:ring-[#e7ab1c]/10 transition-all"
            placeholder="CTO, VP Sales, etc."
          />
        </div>
      </div>

      {/* Interest Level */}
      <div>
        <label className="block text-[11px] text-[#888] uppercase tracking-wider font-semibold mb-2">
          Interest Level
        </label>
        <div className="grid grid-cols-4 gap-2">
          {INTEREST_LEVELS.map((level) => {
            const Icon = level.icon
            const isSelected = interestLevel === level.value
            return (
              <button
                key={level.value}
                type="button"
                onClick={() => setInterestLevel(level.value)}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 rounded-xl text-[12px] font-bold transition-all border-2",
                  isSelected
                    ? `${level.color} ${level.textColor} border-transparent shadow-lg`
                    : "bg-white border-[#e0e0e0] text-[#888] hover:border-[#ccc]"
                )}
              >
                <Icon size={18} />
                {level.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[11px] text-[#888] uppercase tracking-wider font-semibold mb-1.5">
          Notes
        </label>
        <div className="relative">
          <MessageSquare size={16} className="absolute left-3 top-3.5 text-[#bbb]" />
          <textarea
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={3}
            className="w-full pl-10 pr-4 py-3 bg-white border border-[#e0e0e0] rounded-xl text-sm text-[#1a1a2e] placeholder-[#bbb] focus:outline-none focus:border-[#e7ab1c] focus:ring-2 focus:ring-[#e7ab1c]/10 transition-all resize-none"
            placeholder="Notes about this lead..."
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={saving || !formData.name.trim()}
        className="w-full py-4 rounded-xl bg-[#e7ab1c] text-white text-[15px] font-bold hover:bg-[#d49c16] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#e7ab1c]/20"
      >
        {saving ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Saving...
          </>
        ) : (
          <>
            <Check size={18} /> Save Lead
          </>
        )}
      </button>
    </form>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Leads List Tab
 * ═══════════════════════════════════════════════════════════════════════════ */

function LeadsListTab({
  leads,
  loading,
  onRefresh,
}: {
  leads: LeadRow[]
  loading: boolean
  onRefresh: () => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({})
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function handleFollowUpChange(leadId: string, status: string) {
    setUpdatingId(leadId)
    await updateLead(leadId, { followUpStatus: status })
    onRefresh()
    setUpdatingId(null)
  }

  async function handleSaveNotes(leadId: string) {
    setUpdatingId(leadId)
    await updateLead(leadId, { notes: editingNotes[leadId] ?? "" })
    onRefresh()
    setUpdatingId(null)
    setEditingNotes((prev) => {
      const next = { ...prev }
      delete next[leadId]
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#aaa] gap-2">
        <Loader2 size={18} className="animate-spin" /> Loading leads...
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <List size={28} className="text-[#ccc]" />
        </div>
        <h3 className="text-[15px] font-semibold text-[#1a1a2e] mb-1">No Leads Yet</h3>
        <p className="text-[13px] text-[#999]">
          Scan a badge or add a lead manually to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => {
        const expanded = expandedId === lead.id
        const badge = INTEREST_BADGE[lead.interest_level] ?? INTEREST_BADGE.medium
        const capturedTime = new Date(lead.captured_at).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })

        return (
          <div
            key={lead.id}
            className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden shadow-sm"
          >
            {/* Summary row */}
            <button
              onClick={() => setExpandedId(expanded ? null : lead.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-[14px] text-[#1a1a2e] truncate">
                    {lead.lead_name}
                  </span>
                  <span
                    className={cn(
                      "inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0",
                      badge.bg,
                      badge.text
                    )}
                  >
                    {lead.interest_level}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#888]">
                  {lead.lead_company && (
                    <>
                      <span className="truncate">{lead.lead_company}</span>
                      <span className="text-[#ddd]">|</span>
                    </>
                  )}
                  <span className="shrink-0">{capturedTime}</span>
                  {lead.captured_via === "qr_scan" && (
                    <ScanLine size={12} className="text-[#e7ab1c] shrink-0" />
                  )}
                </div>
              </div>
              {expanded ? (
                <ChevronUp size={16} className="text-[#bbb] shrink-0" />
              ) : (
                <ChevronDown size={16} className="text-[#bbb] shrink-0" />
              )}
            </button>

            {/* Expanded detail */}
            {expanded && (
              <div className="px-4 pb-4 border-t border-[#f0f0f0] pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  {lead.lead_email && (
                    <div>
                      <span className="text-[#aaa] block mb-0.5">Email</span>
                      <span className="text-[#555]">{lead.lead_email}</span>
                    </div>
                  )}
                  {lead.lead_phone && (
                    <div>
                      <span className="text-[#aaa] block mb-0.5">Phone</span>
                      <span className="text-[#555]">{lead.lead_phone}</span>
                    </div>
                  )}
                  {lead.lead_designation && (
                    <div>
                      <span className="text-[#aaa] block mb-0.5">Designation</span>
                      <span className="text-[#555]">{lead.lead_designation}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[#aaa] block mb-0.5">Captured Via</span>
                    <span className="text-[#555] capitalize">{lead.captured_via.replace("_", " ")}</span>
                  </div>
                </div>

                {/* Follow-up Status */}
                <div>
                  <label className="block text-[10px] text-[#aaa] uppercase tracking-wider mb-1">
                    Follow-up Status
                  </label>
                  <select
                    value={lead.follow_up_status}
                    onChange={(e) => handleFollowUpChange(lead.id, e.target.value)}
                    disabled={updatingId === lead.id}
                    className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e0e0e0] rounded-lg text-[13px] text-[#333] focus:outline-none focus:border-[#e7ab1c] transition-colors disabled:opacity-50"
                  >
                    {FOLLOW_UP_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] text-[#aaa] uppercase tracking-wider mb-1">
                    Notes
                  </label>
                  <textarea
                    value={
                      editingNotes[lead.id] !== undefined
                        ? editingNotes[lead.id]
                        : lead.notes ?? ""
                    }
                    onChange={(e) =>
                      setEditingNotes((prev) => ({ ...prev, [lead.id]: e.target.value }))
                    }
                    rows={2}
                    className="w-full px-3 py-2 bg-[#fafafa] border border-[#e0e0e0] rounded-lg text-[13px] text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#e7ab1c] transition-colors resize-none"
                    placeholder="Add notes..."
                  />
                  {editingNotes[lead.id] !== undefined &&
                    editingNotes[lead.id] !== (lead.notes ?? "") && (
                      <button
                        onClick={() => handleSaveNotes(lead.id)}
                        disabled={updatingId === lead.id}
                        className="mt-2 px-4 py-2 rounded-lg bg-[#e7ab1c] text-white text-[12px] font-bold hover:bg-[#d49c16] disabled:opacity-50 transition-colors"
                      >
                        {updatingId === lead.id ? "Saving..." : "Save Notes"}
                      </button>
                    )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
