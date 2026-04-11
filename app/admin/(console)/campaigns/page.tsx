"use client"

/**
 * Admin Email Campaigns Page
 *
 * Full campaign builder with 3 views:
 * 1. Campaign List — table with status badges, stats, actions
 * 2. Campaign Builder — multi-step create/edit flow
 * 3. Campaign Stats — delivery analytics and recipient table
 */

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getSegmentCount,
  sendCampaign,
  getCampaignStats,
  duplicateCampaign,
  type Campaign,
  type CampaignRecipient,
} from "@/app/actions/campaignActions"
import {
  getEmailTemplates,
  type EmailTemplate,
} from "@/app/actions/emailTemplateActions"

/* ── Constants ─────────────────────────────────────────────────────────── */

const SEGMENTS = [
  { value: "all", label: "All Attendees" },
  { value: "registered", label: "Registered / Confirmed" },
  { value: "checked_in", label: "Checked In" },
  { value: "vip", label: "VIP Only" },
  { value: "not_checked_in", label: "Not Checked In" },
  { value: "waitlisted", label: "Waitlisted" },
] as const

const STATUS_BADGE: Record<string, { bg: string; text: string; dot?: string }> = {
  draft:     { bg: "bg-gray-100", text: "text-gray-600" },
  scheduled: { bg: "bg-blue-50", text: "text-blue-700" },
  sending:   { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500 animate-pulse" },
  sent:      { bg: "bg-emerald-50", text: "text-emerald-700" },
  failed:    { bg: "bg-red-50", text: "text-red-700" },
}

const VARIABLES = [
  { key: "attendee_name", label: "Attendee Name" },
  { key: "event_title", label: "Event Title" },
  { key: "event_date", label: "Event Date" },
  { key: "event_venue", label: "Event Venue" },
]

interface EventOption { id: string; title: string }

/* ═════════════════════════════════════════════════════════════════════════
 *  Main Component
 * ═════════════════════════════════════════════════════════════════════════ */

export default function AdminCampaignsPage() {
  /* ── Shared state ───────────────────────────────────────────────────── */
  const [view, setView] = useState<"list" | "builder" | "stats">("list")
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<EventOption[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])

  /* ── Builder state ──────────────────────────────────────────────────── */
  const [editingId, setEditingId] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [formName, setFormName] = useState("")
  const [formEventId, setFormEventId] = useState("")
  const [formSubject, setFormSubject] = useState("")
  const [formSegment, setFormSegment] = useState("all")
  const [formBodyHtml, setFormBodyHtml] = useState("")
  const [formTemplateId, setFormTemplateId] = useState("")
  const [formScheduledAt, setFormScheduledAt] = useState("")
  const [segmentCount, setSegmentCount] = useState<number | null>(null)
  const [segmentLoading, setSegmentLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [useSchedule, setUseSchedule] = useState(false)
  const [confirmModal, setConfirmModal] = useState(false)

  /* ── Stats state ────────────────────────────────────────────────────── */
  const [statsCampaign, setStatsCampaign] = useState<Campaign | null>(null)
  const [statsData, setStatsData] = useState<{
    total: number; sent: number; opened: number; clicked: number; failed: number; bounced: number
  } | null>(null)
  const [statsRecipients, setStatsRecipients] = useState<CampaignRecipient[]>([])
  const [statsLoading, setStatsLoading] = useState(false)

  const supabase = createClient()

  /* ── Data fetching ──────────────────────────────────────────────────── */

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    const result = await getCampaigns()
    if (result.success && result.campaigns) {
      setCampaigns(result.campaigns)
    }
    setLoading(false)
  }, [])

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title")
      .order("start_date", { ascending: false })
    if (data) setEvents(data)
  }, [])

  const fetchTemplates = useCallback(async () => {
    const result = await getEmailTemplates()
    if (result.success && result.templates) {
      setTemplates(result.templates)
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
    fetchEvents()
    fetchTemplates()
  }, [fetchCampaigns, fetchEvents, fetchTemplates])

  /* ── Segment count ──────────────────────────────────────────────────── */

  useEffect(() => {
    if (!formEventId || view !== "builder") {
      setSegmentCount(null)
      return
    }
    let cancelled = false
    setSegmentLoading(true)
    getSegmentCount(formEventId, formSegment).then((res) => {
      if (!cancelled) {
        setSegmentCount(res.count ?? null)
        setSegmentLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [formEventId, formSegment, view])

  /* ── Builder actions ────────────────────────────────────────────────── */

  function openBuilder(campaign?: Campaign) {
    if (campaign) {
      setEditingId(campaign.id)
      setFormName(campaign.name)
      setFormEventId(campaign.event_id ?? "")
      setFormSubject(campaign.subject)
      setFormSegment(campaign.segment)
      setFormBodyHtml(campaign.body_html)
      setFormTemplateId(campaign.template_id ?? "")
      setFormScheduledAt(campaign.scheduled_at ? campaign.scheduled_at.slice(0, 16) : "")
      setUseSchedule(!!campaign.scheduled_at)
    } else {
      setEditingId(null)
      setFormName("")
      setFormEventId("")
      setFormSubject("")
      setFormSegment("all")
      setFormBodyHtml("")
      setFormTemplateId("")
      setFormScheduledAt("")
      setUseSchedule(false)
    }
    setStep(1)
    setPreviewHtml(null)
    setView("builder")
  }

  function closeBuilder() {
    setView("list")
    setEditingId(null)
    setPreviewHtml(null)
  }

  async function handleSaveDraft() {
    if (!formName || !formSubject || !formBodyHtml) {
      alert("Please fill in campaign name, subject, and body.")
      return
    }

    setSaving(true)

    const data = {
      name: formName,
      subject: formSubject,
      body_html: formBodyHtml,
      event_id: formEventId || null,
      segment: formSegment,
      scheduled_at: useSchedule && formScheduledAt ? new Date(formScheduledAt).toISOString() : null,
    }

    if (editingId) {
      const result = await updateCampaign(editingId, data)
      if (!result.success) {
        alert(result.error || "Failed to update campaign.")
      }
    } else {
      const result = await createCampaign(data)
      if (result.success && result.campaign) {
        setEditingId(result.campaign.id)
      } else {
        alert(result.error || "Failed to create campaign.")
      }
    }

    setSaving(false)
    await fetchCampaigns()
  }

  async function handleSendNow() {
    // Save first, then send
    if (!editingId) {
      await handleSaveDraft()
    }

    const campaignToSend = editingId
    if (!campaignToSend) {
      alert("Please save the campaign first.")
      return
    }

    setSending(true)
    const result = await sendCampaign(campaignToSend)
    setSending(false)

    if (result.success) {
      alert(`Campaign sent successfully. ${result.sent} emails sent.`)
    } else {
      alert(`Campaign sent with issues. Sent: ${result.sent}, Failed: ${result.failed}.\n${result.errors.join("\n")}`)
    }

    setConfirmModal(false)
    await fetchCampaigns()
    setView("list")
  }

  function handleLoadTemplate(templateId: string) {
    setFormTemplateId(templateId)
    const tmpl = templates.find((t) => t.id === templateId)
    if (tmpl) {
      setFormBodyHtml(tmpl.body_html)
      if (!formSubject) setFormSubject(tmpl.subject)
    }
  }

  function handlePreview() {
    const sampleVars: Record<string, string> = {
      attendee_name: "Jane Doe",
      event_title: "TLF Leadership Summit 2026",
      event_date: "15 May 2026",
      event_venue: "Taj Lands End, Mumbai",
    }
    let html = formBodyHtml
    for (const [key, value] of Object.entries(sampleVars)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value)
    }
    setPreviewHtml(html)
  }

  function insertVariable(key: string) {
    setFormBodyHtml((prev) => prev + `{{${key}}}`)
  }

  /* ── Campaign list actions ──────────────────────────────────────────── */

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this draft campaign?")) return
    const result = await deleteCampaign(id)
    if (result.success) {
      await fetchCampaigns()
    } else {
      alert(result.error || "Failed to delete campaign.")
    }
  }

  async function handleDuplicate(id: string) {
    const result = await duplicateCampaign(id)
    if (result.success) {
      await fetchCampaigns()
    } else {
      alert(result.error || "Failed to duplicate campaign.")
    }
  }

  async function openStats(campaign: Campaign) {
    setStatsCampaign(campaign)
    setStatsLoading(true)
    setView("stats")

    const result = await getCampaignStats(campaign.id)
    if (result.success) {
      setStatsData(result.stats ?? null)
      setStatsRecipients(result.recipients ?? [])
    }
    setStatsLoading(false)
  }

  /* ═════════════════════════════════════════════════════════════════════
   *  RENDER: Campaign List
   * ═════════════════════════════════════════════════════════════════════ */

  if (view === "list") {
    return (
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#333] mb-1 flex items-center gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
              Email Campaigns
            </h2>
            <p className="text-sm text-[#888]">
              Create, schedule, and track bulk email campaigns to your attendees.
            </p>
          </div>
          <button
            onClick={() => openBuilder()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] text-white text-sm font-semibold rounded-lg hover:bg-[#1557b0] transition-colors shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Campaign
          </button>
        </div>

        {/* Campaign Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)] overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              No campaigns yet. Click "New Campaign" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Campaign</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Recipients</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Sent</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Opened</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Open Rate</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Clicked</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.draft
                    const openRate = c.sent_count > 0
                      ? Math.round((c.opened_count / c.sent_count) * 100)
                      : 0

                    return (
                      <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <span className="font-medium text-[#1a1a2e]">{c.name}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-600 text-xs">
                          {c.events?.title ?? "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
                            {badge.dot && (
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            )}
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center text-gray-700 tabular-nums">
                          {c.total_recipients}
                        </td>
                        <td className="px-5 py-3 text-center text-gray-700 tabular-nums">
                          {c.sent_count}
                        </td>
                        <td className="px-5 py-3 text-center text-gray-700 tabular-nums">
                          {c.opened_count}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {c.sent_count > 0 ? (
                            <span className={`text-xs font-semibold ${openRate >= 50 ? "text-emerald-600" : openRate >= 20 ? "text-yellow-600" : "text-gray-500"}`}>
                              {openRate}%
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center text-gray-700 tabular-nums">
                          {c.clicked_count}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {c.sent_at
                            ? new Date(c.sent_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            : c.scheduled_at
                              ? `Sched: ${new Date(c.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                              : new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.status === "draft" && (
                              <button
                                onClick={() => openBuilder(c)}
                                className="text-xs font-medium text-[#1a73e8] hover:underline"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() => handleDuplicate(c.id)}
                              className="text-xs font-medium text-gray-500 hover:underline"
                            >
                              Duplicate
                            </button>
                            {(c.status === "sent" || c.status === "failed") && (
                              <button
                                onClick={() => openStats(c)}
                                className="text-xs font-medium text-emerald-600 hover:underline"
                              >
                                Stats
                              </button>
                            )}
                            {c.status === "draft" && (
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="text-xs font-medium text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ═════════════════════════════════════════════════════════════════════
   *  RENDER: Campaign Stats
   * ═════════════════════════════════════════════════════════════════════ */

  if (view === "stats" && statsCampaign) {
    const openRate = statsData && statsData.sent > 0
      ? Math.round((statsData.opened / statsData.sent) * 100)
      : 0
    const clickRate = statsData && statsData.sent > 0
      ? Math.round((statsData.clicked / statsData.sent) * 100)
      : 0

    return (
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setView("list")}
            className="flex items-center gap-1 text-sm text-[#1a73e8] hover:underline"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back to Campaigns
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#333] mb-1">{statsCampaign.name}</h2>
          <p className="text-sm text-[#888]">Campaign delivery analytics</p>
        </div>

        {statsLoading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading stats...</div>
        ) : statsData ? (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)]">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Total Sent</p>
                <p className="text-3xl font-bold text-[#333] tabular-nums">{statsData.sent}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)]">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Opened</p>
                <p className="text-3xl font-bold text-emerald-600 tabular-nums">{statsData.opened}</p>
                <p className="text-xs text-gray-500 mt-1">{openRate}% open rate</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)]">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Clicked</p>
                <p className="text-3xl font-bold text-blue-600 tabular-nums">{statsData.clicked}</p>
                <p className="text-xs text-gray-500 mt-1">{clickRate}% click rate</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)]">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-500 tabular-nums">{statsData.failed}</p>
              </div>
            </div>

            {/* Open Rate Bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)] mb-8">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-3">Delivery Overview</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Open Rate</span>
                    <span className="font-semibold">{openRate}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${openRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Click Rate</span>
                    <span className="font-semibold">{clickRate}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${clickRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recipient Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)] overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Recipients ({statsRecipients.length})
                </p>
              </div>
              {statsRecipients.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">No recipients yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Sent At</th>
                        <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Opened At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsRecipients.map((r) => {
                        const rBadge = STATUS_BADGE[r.status] ?? STATUS_BADGE.draft
                        return (
                          <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-2.5 font-medium text-[#1a1a2e]">
                              {r.attendees?.name ?? "—"}
                            </td>
                            <td className="px-5 py-2.5 text-gray-600">{r.email}</td>
                            <td className="px-5 py-2.5">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${rBadge.bg} ${rBadge.text}`}>
                                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-5 py-2.5 text-gray-500 text-xs">
                              {r.sent_at
                                ? new Date(r.sent_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                                : "—"}
                            </td>
                            <td className="px-5 py-2.5 text-gray-500 text-xs">
                              {r.opened_at
                                ? new Date(r.opened_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                                : "—"}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-gray-400 text-sm">No stats available.</div>
        )}
      </div>
    )
  }

  /* ═════════════════════════════════════════════════════════════════════
   *  RENDER: Campaign Builder
   * ═════════════════════════════════════════════════════════════════════ */

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={closeBuilder}
          className="flex items-center gap-1 text-sm text-[#1a73e8] hover:underline"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back to Campaigns
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#333] mb-1">
          {editingId ? "Edit Campaign" : "New Campaign"}
        </h2>
        <p className="text-sm text-[#888]">Build and send your email campaign in 4 steps.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0 mb-8">
        {[
          { num: 1, label: "Setup" },
          { num: 2, label: "Audience" },
          { num: 3, label: "Content" },
          { num: 4, label: "Review & Send" },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center">
            {idx > 0 && (
              <div className={`w-12 h-px ${step >= s.num ? "bg-[#1a73e8]" : "bg-gray-200"}`} />
            )}
            <button
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                step === s.num
                  ? "bg-[#e8f0fe] text-[#1a73e8]"
                  : step > s.num
                    ? "text-[#1a73e8] hover:bg-blue-50"
                    : "text-gray-400"
              }`}
            >
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                step === s.num
                  ? "bg-[#1a73e8] text-white"
                  : step > s.num
                    ? "bg-[#1a73e8]/20 text-[#1a73e8]"
                    : "bg-gray-200 text-gray-500"
              }`}>
                {step > s.num ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : s.num}
              </span>
              {s.label}
            </button>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="max-w-[800px]">
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)] p-6">

          {/* ─── Step 1: Setup ────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-[#333] mb-4">Campaign Setup</h3>

              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc]"
                  placeholder="e.g. Q2 Newsletter, Event Reminder Blast"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Event *
                </label>
                <select
                  value={formEventId}
                  onChange={(e) => setFormEventId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc]"
                >
                  <option value="">Select an event</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Subject Line *
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc]"
                  placeholder="e.g. You're invited to {{event_title}}"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={!formName || !formEventId || !formSubject}
                  className="px-6 py-2.5 bg-[#1a73e8] text-white text-sm font-semibold rounded-lg hover:bg-[#1557b0] transition-colors shadow-sm disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Next: Audience
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 2: Audience ─────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-[#333] mb-4">Select Audience</h3>

              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Segment
                </label>
                <div className="space-y-2">
                  {SEGMENTS.map((seg) => (
                    <label
                      key={seg.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formSegment === seg.value
                          ? "border-[#1a73e8] bg-[#e8f0fe]"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="segment"
                        value={seg.value}
                        checked={formSegment === seg.value}
                        onChange={(e) => setFormSegment(e.target.value)}
                        className="accent-[#1a73e8]"
                      />
                      <span className={`text-sm font-medium ${
                        formSegment === seg.value ? "text-[#1a73e8]" : "text-gray-700"
                      }`}>
                        {seg.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Live count */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {segmentLoading ? (
                  <span className="text-sm text-gray-500">Counting...</span>
                ) : segmentCount !== null ? (
                  <span className="text-sm font-semibold text-[#333]">
                    {segmentCount} recipient{segmentCount !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">Select an event to see count</span>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium text-[#555] bg-[#f0f0f0] hover:bg-[#e8e8e8] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-[#1a73e8] text-white text-sm font-semibold rounded-lg hover:bg-[#1557b0] transition-colors shadow-sm"
                >
                  Next: Content
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Content ──────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-[#333] mb-4">Email Content</h3>

              {/* Template selector */}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Load from Template (optional)
                </label>
                <select
                  value={formTemplateId}
                  onChange={(e) => handleLoadTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc]"
                >
                  <option value="">Write custom email</option>
                  {templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name} ({tmpl.template_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Variable pills */}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Insert Variables (click to add)
                </label>
                <div className="flex flex-wrap gap-2">
                  {VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      className="inline-flex px-2.5 py-1 rounded-md text-xs font-mono bg-[#e8f0fe] text-[#1a73e8] border border-[#1a73e8]/30 hover:bg-[#d2e3fc] transition-colors cursor-pointer"
                    >
                      {"{{" + v.key + "}}"}
                    </button>
                  ))}
                </div>
              </div>

              {/* HTML editor */}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Email Body (HTML) *
                </label>
                <textarea
                  value={formBodyHtml}
                  onChange={(e) => setFormBodyHtml(e.target.value)}
                  rows={14}
                  className="w-full px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] font-mono focus:outline-none focus:border-[#ccc] resize-y"
                  placeholder="<div>Your email HTML content here...</div>"
                />
              </div>

              {/* Preview */}
              <div>
                <button
                  type="button"
                  onClick={handlePreview}
                  className="text-sm font-medium text-[#1a73e8] hover:underline"
                >
                  Preview with sample data
                </button>
                {previewHtml && (
                  <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Email Preview</span>
                      <button
                        onClick={() => setPreviewHtml(null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Close
                      </button>
                    </div>
                    <div
                      className="p-4 max-h-[400px] overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium text-[#555] bg-[#f0f0f0] hover:bg-[#e8e8e8] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!formBodyHtml}
                  className="px-6 py-2.5 bg-[#1a73e8] text-white text-sm font-semibold rounded-lg hover:bg-[#1557b0] transition-colors shadow-sm disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Next: Review
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 4: Review & Send ───────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-[#333] mb-4">Review & Send</h3>

              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Campaign</p>
                  <p className="text-sm font-semibold text-[#333]">{formName}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Recipients</p>
                  <p className="text-sm font-semibold text-[#333]">
                    {segmentCount !== null ? `${segmentCount} attendees` : "—"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 col-span-2">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Subject</p>
                  <p className="text-sm font-semibold text-[#333]">{formSubject}</p>
                </div>
              </div>

              {/* Segment info */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Audience Segment</p>
                <p className="text-sm font-medium text-[#333]">
                  {SEGMENTS.find((s) => s.value === formSegment)?.label ?? formSegment}
                </p>
              </div>

              {/* Schedule option */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSchedule}
                    onChange={(e) => setUseSchedule(e.target.checked)}
                    className="accent-[#1a73e8]"
                  />
                  <span className="text-sm font-medium text-[#333]">Schedule for later</span>
                </label>
                {useSchedule && (
                  <div className="mt-3">
                    <input
                      type="datetime-local"
                      value={formScheduledAt}
                      onChange={(e) => setFormScheduledAt(e.target.value)}
                      className="px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc]"
                    />
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-4">
                {useSchedule ? (
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      saving
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-[#1a73e8] text-white hover:bg-[#1557b0] shadow-sm"
                    }`}
                  >
                    {saving ? "Scheduling..." : "Schedule Campaign"}
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmModal(true)}
                    disabled={sending || !segmentCount}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      sending || !segmentCount
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                    {sending ? "Sending..." : "Send Now"}
                  </button>
                )}

                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium text-[#555] bg-[#f0f0f0] hover:bg-[#e8e8e8] transition-colors"
                >
                  {saving ? "Saving..." : "Save as Draft"}
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium text-[#555] bg-[#f0f0f0] hover:bg-[#e8e8e8] transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Confirmation Modal ───────────────────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a2e]/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#333] mb-2">Confirm Send</h3>
            <p className="text-sm text-gray-600 mb-1">
              You are about to send this campaign to{" "}
              <strong className="text-[#333]">{segmentCount ?? 0} recipient{segmentCount !== 1 ? "s" : ""}</strong>.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Subject: <strong className="text-[#333]">{formSubject}</strong>
            </p>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setConfirmModal(false)}
                className="px-5 py-2 rounded-lg text-sm font-medium text-[#555] bg-[#f0f0f0] hover:bg-[#e8e8e8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNow}
                disabled={sending}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  sending
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {sending ? "Sending..." : `Send to ${segmentCount ?? 0} recipients`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
