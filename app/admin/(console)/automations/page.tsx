"use client"

/**
 * Admin Email Automations Page
 *
 * Event-driven email automation management:
 * - Event selector with stats overview
 * - Create/edit automations with trigger types, delay, active toggle
 * - Automation list with actions: edit, toggle, preview, manual trigger, delete
 * - Manual trigger confirmation modal with eligible recipient count
 */

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import {
  createAutomation,
  updateAutomation,
  deleteAutomation,
  toggleAutomation,
  getEventAutomations,
  triggerAutomation,
  previewAutomation,
  getAutomationStats,
} from "@/app/actions/automationActions"
import type { Automation } from "@/app/actions/automationActions"
import {
  Zap,
  Mail,
  Play,
  Pause,
  Trash2,
  Eye,
  Send,
  Plus,
  Settings,
  Clock,
} from "lucide-react"

/* ── Constants ─────────────────────────────────────────────────────────── */

const TRIGGER_TYPES = [
  { value: "registration", label: "Registration", icon: Mail },
  { value: "payment_confirmed", label: "Payment Confirmed", icon: Zap },
  { value: "check_in", label: "Check-in", icon: Play },
  { value: "days_before_event", label: "Days Before Event", icon: Clock },
  { value: "days_after_event", label: "Days After Event", icon: Clock },
  { value: "session_reminder", label: "Session Reminder", icon: Send },
  { value: "waitlist_promoted", label: "Waitlist Promoted", icon: Zap },
  { value: "approval_approved", label: "Approval Approved", icon: Play },
  { value: "approval_rejected", label: "Approval Rejected", icon: Pause },
] as const

const TRIGGER_LABEL: Record<string, string> = Object.fromEntries(
  TRIGGER_TYPES.map((t) => [t.value, t.label])
)

const TRIGGER_ICON: Record<string, typeof Zap> = Object.fromEntries(
  TRIGGER_TYPES.map((t) => [t.value, t.icon])
)

const TRIGGER_BADGE: Record<string, string> = {
  registration: "bg-blue-50 text-blue-700 border-blue-200",
  payment_confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  check_in: "bg-teal-50 text-teal-700 border-teal-200",
  days_before_event: "bg-amber-50 text-amber-700 border-amber-200",
  days_after_event: "bg-orange-50 text-orange-700 border-orange-200",
  session_reminder: "bg-purple-50 text-purple-700 border-purple-200",
  waitlist_promoted: "bg-indigo-50 text-indigo-700 border-indigo-200",
  approval_approved: "bg-lime-50 text-lime-700 border-lime-200",
  approval_rejected: "bg-red-50 text-red-700 border-red-200",
}

interface EventOption {
  id: string
  title: string
}

interface Stats {
  totalAutomations: number
  totalSent: number
  totalFailed: number
  byTriggerType: Record<string, { count: number; sent: number; failed: number }>
}

/* ═════════════════════════════════════════════════════════════════════════
 *  Main Component
 * ═════════════════════════════════════════════════════════════════════════ */

export default function AdminAutomationsPage() {
  /* ── Shared state ───────────────────────────────────────────────────── */
  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [automations, setAutomations] = useState<Automation[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(true)

  /* ── Modal state ────────────────────────────────────────────────────── */
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null)

  /* ── Form fields ────────────────────────────────────────────────────── */
  const [formName, setFormName] = useState("")
  const [formTriggerType, setFormTriggerType] = useState("registration")
  const [formTriggerDays, setFormTriggerDays] = useState(1)
  const [formSubject, setFormSubject] = useState("")
  const [formBodyHtml, setFormBodyHtml] = useState("")
  const [formDelayMinutes, setFormDelayMinutes] = useState(0)
  const [formIsActive, setFormIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  /* ── Preview / Manual Trigger state ─────────────────────────────────── */
  const [previewModal, setPreviewModal] = useState<{
    automationId: string
    automationName: string
    eligibleCount: number
  } | null>(null)
  const [triggerModal, setTriggerModal] = useState<{
    automationId: string
    automationName: string
    eligibleCount: number
    eligibleIds: string[]
  } | null>(null)
  const [triggering, setTriggering] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)

  const supabase = createClient()

  /* ── Data fetching ──────────────────────────────────────────────────── */

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true)
    const { data } = await supabase
      .from("events")
      .select("id, title")
      .order("start_date", { ascending: false })
    if (data) setEvents(data)
    setEventsLoading(false)
  }, [])

  const fetchAutomations = useCallback(async (eventId: string) => {
    if (!eventId) {
      setAutomations([])
      setStats(null)
      return
    }
    setLoading(true)
    const [autoResult, statsResult] = await Promise.all([
      getEventAutomations(eventId),
      getAutomationStats(eventId),
    ])
    if (autoResult.success && autoResult.automations) {
      setAutomations(autoResult.automations)
    }
    if (statsResult.success && statsResult.stats) {
      setStats(statsResult.stats)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (selectedEventId) {
      fetchAutomations(selectedEventId)
    } else {
      setAutomations([])
      setStats(null)
    }
  }, [selectedEventId, fetchAutomations])

  /* ── Form helpers ───────────────────────────────────────────────────── */

  function resetForm() {
    setFormName("")
    setFormTriggerType("registration")
    setFormTriggerDays(1)
    setFormSubject("")
    setFormBodyHtml("")
    setFormDelayMinutes(0)
    setFormIsActive(true)
    setEditingAutomation(null)
  }

  function openCreateModal() {
    resetForm()
    setShowFormModal(true)
  }

  function openEditModal(auto: Automation) {
    setEditingAutomation(auto)
    setFormName(auto.name)
    setFormTriggerType(auto.trigger_type)
    const config = auto.trigger_config as Record<string, unknown>
    setFormTriggerDays(typeof config.days === "number" ? config.days : 1)
    setFormSubject(auto.subject)
    setFormBodyHtml(auto.body_html)
    setFormDelayMinutes(auto.delay_minutes)
    setFormIsActive(auto.is_active)
    setShowFormModal(true)
  }

  function closeFormModal() {
    setShowFormModal(false)
    resetForm()
  }

  /* ── Save automation ────────────────────────────────────────────────── */

  async function handleSave() {
    if (!formName || !formSubject || !formBodyHtml) {
      alert("Please fill in name, subject, and email body.")
      return
    }
    if (!selectedEventId) {
      alert("Please select an event first.")
      return
    }

    setSaving(true)

    const formData = new FormData()
    formData.set("event_id", selectedEventId)
    formData.set("name", formName)
    formData.set("trigger_type", formTriggerType)
    formData.set("subject", formSubject)
    formData.set("body_html", formBodyHtml)
    formData.set("delay_minutes", String(formDelayMinutes))
    formData.set("is_active", String(formIsActive))

    // Build trigger_config for day-based triggers
    const triggerConfig: Record<string, unknown> = {}
    if (formTriggerType === "days_before_event" || formTriggerType === "days_after_event") {
      triggerConfig.days = formTriggerDays
    }
    formData.set("trigger_config", JSON.stringify(triggerConfig))

    if (editingAutomation) {
      const result = await updateAutomation(editingAutomation.id, formData)
      if (!result.success) {
        alert(result.error || "Failed to update automation.")
      }
    } else {
      const result = await createAutomation(formData)
      if (!result.success) {
        alert(result.error || "Failed to create automation.")
      }
    }

    setSaving(false)
    closeFormModal()
    await fetchAutomations(selectedEventId)
  }

  /* ── Toggle active ──────────────────────────────────────────────────── */

  async function handleToggle(auto: Automation) {
    const result = await toggleAutomation(auto.id, !auto.is_active)
    if (result.success) {
      await fetchAutomations(selectedEventId)
    } else {
      alert(result.error || "Failed to toggle automation.")
    }
  }

  /* ── Delete ─────────────────────────────────────────────────────────── */

  async function handleDelete(auto: Automation) {
    if (!confirm(`Are you sure you want to delete "${auto.name}"? This action cannot be undone.`)) return
    const result = await deleteAutomation(auto.id)
    if (result.success) {
      await fetchAutomations(selectedEventId)
    } else {
      alert(result.error || "Failed to delete automation.")
    }
  }

  /* ── Preview ────────────────────────────────────────────────────────── */

  async function handlePreview(auto: Automation) {
    setPreviewLoading(true)
    const result = await previewAutomation(auto.id)
    setPreviewLoading(false)
    if (result.success) {
      setPreviewModal({
        automationId: auto.id,
        automationName: auto.name,
        eligibleCount: result.eligibleCount ?? 0,
      })
    } else {
      alert(result.error || "Failed to load preview.")
    }
  }

  /* ── Manual Trigger ─────────────────────────────────────────────────── */

  async function handleManualTriggerSetup(auto: Automation) {
    setPreviewLoading(true)
    // We need eligible attendee IDs for the trigger
    const result = await previewAutomation(auto.id)
    setPreviewLoading(false)

    if (!result.success) {
      alert(result.error || "Failed to load eligible recipients.")
      return
    }

    if ((result.eligibleCount ?? 0) === 0) {
      alert("No eligible recipients found. All attendees may have already received this automation.")
      return
    }

    // We need to fetch the actual eligible attendee IDs
    const { data: attendees } = await supabase
      .from("attendees")
      .select("id")
      .eq("event_id", auto.event_id)
      .not("email", "is", null)
      .in("status", ["registered", "confirmed", "checked_in"])

    const allIds = (attendees ?? []).map((a: { id: string }) => a.id)

    // Get already-sent IDs
    const { data: logs } = await supabase
      .from("email_automation_logs")
      .select("attendee_id")
      .eq("automation_id", auto.id)

    const sentIds = new Set((logs ?? []).map((l: { attendee_id: string }) => l.attendee_id))
    const eligibleIds = allIds.filter((id: string) => !sentIds.has(id))

    setTriggerModal({
      automationId: auto.id,
      automationName: auto.name,
      eligibleCount: eligibleIds.length,
      eligibleIds,
    })
  }

  async function handleConfirmTrigger() {
    if (!triggerModal) return
    setTriggering(true)
    const result = await triggerAutomation(triggerModal.automationId, triggerModal.eligibleIds)
    setTriggering(false)

    if (result.success) {
      alert(`Sent: ${result.sentCount}, Skipped: ${result.skippedCount}, Failed: ${result.failedCount}`)
    } else {
      alert(result.error || "Trigger failed.")
    }

    setTriggerModal(null)
    await fetchAutomations(selectedEventId)
  }

  /* ── Computed values ────────────────────────────────────────────────── */

  const activeCount = automations.filter((a) => a.is_active).length
  const totalSent = stats?.totalSent ?? automations.reduce((sum, a) => sum + (a.sent_count || 0), 0)
  const showDaysInput = formTriggerType === "days_before_event" || formTriggerType === "days_after_event"

  /* ═════════════════════════════════════════════════════════════════════
   *  RENDER
   * ═════════════════════════════════════════════════════════════════════ */

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#333] mb-1 flex items-center gap-3">
            <Zap size={24} className="text-[#c9a84c]" strokeWidth={1.8} />
            Email Automations
          </h2>
          <p className="text-sm text-[#888]">
            Set up event-driven email workflows that trigger automatically.
          </p>
        </div>
        {selectedEventId && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] text-white text-sm font-semibold rounded-lg hover:bg-[#1557b0] transition-colors shadow-sm"
          >
            <Plus size={16} />
            Create Automation
          </button>
        )}
      </div>

      {/* Event Selector */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Select Event
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 focus:border-[#1a73e8] transition-colors shadow-sm"
        >
          <option value="">— Choose an event —</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
        {eventsLoading && (
          <p className="text-xs text-gray-400 mt-1">Loading events...</p>
        )}
      </div>

      {/* Stats Overview */}
      {selectedEventId && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Settings size={18} className="text-blue-600" />
              </div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Total Automations</p>
            </div>
            <p className="text-3xl font-bold text-[#333] tabular-nums">{stats?.totalAutomations ?? automations.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Mail size={18} className="text-emerald-600" />
              </div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Total Emails Sent</p>
            </div>
            <p className="text-3xl font-bold text-emerald-600 tabular-nums">{totalSent}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Zap size={18} className="text-amber-600" />
              </div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Active Automations</p>
            </div>
            <p className="text-3xl font-bold text-amber-600 tabular-nums">{activeCount}</p>
          </div>
        </div>
      )}

      {/* No event selected */}
      {!selectedEventId && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] py-16 text-center">
          <Zap size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Select an event to manage its email automations.</p>
        </div>
      )}

      {/* Loading */}
      {selectedEventId && loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] py-16 text-center text-gray-400 text-sm">
          Loading automations...
        </div>
      )}

      {/* Empty state */}
      {selectedEventId && !loading && automations.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] py-16 text-center">
          <Mail size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-4">No automations yet for this event.</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] text-white text-sm font-semibold rounded-lg hover:bg-[#1557b0] transition-colors shadow-sm"
          >
            <Plus size={16} />
            Create Your First Automation
          </button>
        </div>
      )}

      {/* Automation List */}
      {selectedEventId && !loading && automations.length > 0 && (
        <div className="space-y-3">
          {automations.map((auto) => {
            const TriggerIcon = TRIGGER_ICON[auto.trigger_type] ?? Zap
            const badgeClass = TRIGGER_BADGE[auto.trigger_type] ?? "bg-gray-50 text-gray-700 border-gray-200"
            const config = auto.trigger_config as Record<string, unknown>
            const daysLabel =
              (auto.trigger_type === "days_before_event" || auto.trigger_type === "days_after_event") && config.days
                ? ` (${config.days}d)`
                : ""

            return (
              <div
                key={auto.id}
                className={`bg-white rounded-xl border shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 transition-all hover:shadow-md ${
                  auto.is_active ? "border-gray-200" : "border-gray-100 opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-[#333] truncate">{auto.name}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass}`}>
                        <TriggerIcon size={11} />
                        {TRIGGER_LABEL[auto.trigger_type] ?? auto.trigger_type}{daysLabel}
                      </span>
                      {auto.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          Inactive
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mb-2 truncate">
                      <span className="font-medium text-gray-600">Subject:</span> {auto.subject}
                    </p>

                    <div className="flex items-center gap-5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Mail size={12} />
                        <span className="tabular-nums font-medium text-gray-600">{auto.sent_count}</span> sent
                      </span>
                      {auto.delay_minutes > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {auto.delay_minutes}m delay
                        </span>
                      )}
                      {auto.last_triggered_at && (
                        <span>
                          Last triggered:{" "}
                          {new Date(auto.last_triggered_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditModal(auto)}
                      className="p-2 rounded-lg text-gray-400 hover:text-[#1a73e8] hover:bg-blue-50 transition-colors"
                      title="Edit"
                    >
                      <Settings size={15} />
                    </button>
                    <button
                      onClick={() => handleToggle(auto)}
                      className={`p-2 rounded-lg transition-colors ${
                        auto.is_active
                          ? "text-emerald-500 hover:text-amber-600 hover:bg-amber-50"
                          : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                      }`}
                      title={auto.is_active ? "Deactivate" : "Activate"}
                    >
                      {auto.is_active ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button
                      onClick={() => handlePreview(auto)}
                      className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      title="Preview (recipient count)"
                      disabled={previewLoading}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handleManualTriggerSetup(auto)}
                      className="p-2 rounded-lg text-gray-400 hover:text-[#c9a84c] hover:bg-amber-50 transition-colors"
                      title="Manual Trigger"
                      disabled={previewLoading}
                    >
                      <Send size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(auto)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
       *  Modal: Create / Edit Automation
       * ═══════════════════════════════════════════════════════════════════ */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={closeFormModal}
          />
          {/* Drawer */}
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-y-auto mx-4">
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 px-7 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#333] flex items-center gap-2">
                <Zap size={18} className="text-[#c9a84c]" />
                {editingAutomation ? "Edit Automation" : "Create Automation"}
              </h3>
              <button
                onClick={closeFormModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Form Body */}
            <div className="px-7 py-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Automation Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Welcome Email on Registration"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 focus:border-[#1a73e8] transition-colors"
                />
              </div>

              {/* Trigger Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Trigger Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={formTriggerType}
                  onChange={(e) => setFormTriggerType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 focus:border-[#1a73e8] transition-colors"
                >
                  {TRIGGER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Days input for days_before/after */}
              {showDaysInput && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Number of Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={formTriggerDays}
                    onChange={(e) => setFormTriggerDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full max-w-[200px] px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 focus:border-[#1a73e8] transition-colors tabular-nums"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formTriggerType === "days_before_event"
                      ? `Email will trigger ${formTriggerDays} day${formTriggerDays !== 1 ? "s" : ""} before the event.`
                      : `Email will trigger ${formTriggerDays} day${formTriggerDays !== 1 ? "s" : ""} after the event.`}
                  </p>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Subject Line <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="e.g. Welcome to {{event_title}}"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 focus:border-[#1a73e8] transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Available variables: {"{{attendee_name}}"}, {"{{attendee_email}}"}, {"{{event_title}}"}
                </p>
              </div>

              {/* Body HTML */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email Body (HTML) <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formBodyHtml}
                  onChange={(e) => setFormBodyHtml(e.target.value)}
                  rows={10}
                  placeholder="<h1>Hello {{attendee_name}}</h1>&#10;<p>Thank you for registering...</p>"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 focus:border-[#1a73e8] transition-colors resize-y"
                />
              </div>

              {/* Delay */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Delay (minutes)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={10080}
                    value={formDelayMinutes}
                    onChange={(e) => setFormDelayMinutes(parseInt(e.target.value, 10) || 0)}
                    className="w-[140px] px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 focus:border-[#1a73e8] transition-colors tabular-nums"
                  />
                  <span className="text-xs text-gray-400">
                    Send {formDelayMinutes > 0 ? `${formDelayMinutes} minute${formDelayMinutes !== 1 ? "s" : ""} after trigger` : "immediately after trigger"}
                  </span>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    formIsActive ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      formIsActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700 font-medium">
                  {formIsActive ? "Active — will trigger automatically" : "Inactive — paused"}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white px-7 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={closeFormModal}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] text-white text-sm font-semibold rounded-lg hover:bg-[#1557b0] transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Zap size={15} />
                    {editingAutomation ? "Update Automation" : "Create Automation"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
       *  Modal: Preview (recipient count)
       * ═══════════════════════════════════════════════════════════════════ */}
      {previewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setPreviewModal(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Eye size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#333]">Automation Preview</h3>
                <p className="text-xs text-gray-500">{previewModal.automationName}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 mb-5">
              <p className="text-sm text-gray-600 mb-1">Eligible Recipients</p>
              <p className="text-4xl font-bold text-[#333] tabular-nums">{previewModal.eligibleCount}</p>
              <p className="text-xs text-gray-400 mt-1">
                Attendees who have not yet received this automation.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewModal(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
       *  Modal: Manual Trigger Confirmation
       * ═══════════════════════════════════════════════════════════════════ */}
      {triggerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => !triggering && setTriggerModal(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Send size={20} className="text-[#c9a84c]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#333]">Confirm Manual Trigger</h3>
                <p className="text-xs text-gray-500">{triggerModal.automationName}</p>
              </div>
            </div>

            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 mb-5">
              <p className="text-sm text-amber-800 font-medium mb-1">
                This will send to {triggerModal.eligibleCount} eligible recipient{triggerModal.eligibleCount !== 1 ? "s" : ""}.
              </p>
              <p className="text-xs text-amber-600">
                Attendees who have already received this automation will be skipped. This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTriggerModal(null)}
                disabled={triggering}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTrigger}
                disabled={triggering}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#c9a84c] text-white text-sm font-semibold rounded-lg hover:bg-[#b8983f] transition-colors shadow-sm disabled:opacity-50"
              >
                {triggering ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Confirm &amp; Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
