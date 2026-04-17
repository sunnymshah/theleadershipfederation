"use client"

/**
 * Admin Email Templates Page
 *
 * List, create, edit, preview, and delete email templates.
 * Default templates are marked and cannot be deleted.
 */

import { useState, useEffect, useCallback } from "react"
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  renderTemplate,
  type EmailTemplate,
  type CreateTemplateData,
} from "@/app/actions/emailTemplateActions"
import { createClient } from "@/utils/supabase/client"
import { useAdminPermissions } from "@/components/admin/AdminPermissionsContext"

/* ── Constants ──────────────────────────────────────────────────────────── */

const TEMPLATE_TYPES = [
  "confirmation",
  "reminder",
  "thank_you",
  "rejection",
  "waitlist",
  "certificate",
  "invoice",
  "custom",
] as const

const TYPE_LABELS: Record<string, string> = {
  confirmation: "Confirmation",
  reminder: "Reminder",
  thank_you: "Thank You",
  rejection: "Rejection",
  waitlist: "Waitlist",
  certificate: "Certificate",
  invoice: "Invoice",
  custom: "Custom",
}

const TYPE_COLORS: Record<string, string> = {
  confirmation: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reminder: "bg-amber-50 text-amber-700 border-amber-200",
  thank_you: "bg-blue-50 text-blue-700 border-blue-200",
  rejection: "bg-red-50 text-red-700 border-red-200",
  waitlist: "bg-purple-50 text-purple-700 border-purple-200",
  certificate: "bg-yellow-50 text-yellow-700 border-yellow-200",
  invoice: "bg-cyan-50 text-cyan-700 border-cyan-200",
  custom: "bg-gray-50 text-gray-700 border-gray-200",
}

const AVAILABLE_VARIABLES = [
  "attendee_name",
  "event_title",
  "event_date",
  "event_venue",
  "ticket_name",
  "qr_token",
]

interface EventOption {
  id: string
  title: string
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function AdminEmailTemplatesPage() {
  const { can } = useAdminPermissions()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<EventOption[]>([])

  // Edit/Create state
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [formName, setFormName] = useState("")
  const [formSlug, setFormSlug] = useState("")
  const [formSubject, setFormSubject] = useState("")
  const [formBodyHtml, setFormBodyHtml] = useState("")
  const [formType, setFormType] = useState<string>("custom")
  const [formEventId, setFormEventId] = useState<string>("")
  const [formVariables, setFormVariables] = useState<string[]>([])

  // Preview
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)

  const supabase = createClient()

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    const result = await getEmailTemplates()
    if (result.success && result.templates) {
      setTemplates(result.templates)
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

  useEffect(() => {
    fetchTemplates()
    fetchEvents()
  }, [fetchTemplates, fetchEvents])

  // Open create form
  function handleCreate() {
    setEditing(null)
    setCreating(true)
    setFormName("")
    setFormSlug("")
    setFormSubject("")
    setFormBodyHtml("")
    setFormType("custom")
    setFormEventId("")
    setFormVariables([])
    setPreviewHtml(null)
  }

  // Open edit form
  function handleEdit(tmpl: EmailTemplate) {
    setCreating(false)
    setEditing(tmpl)
    setFormName(tmpl.name)
    setFormSlug(tmpl.slug)
    setFormSubject(tmpl.subject)
    setFormBodyHtml(tmpl.body_html)
    setFormType(tmpl.template_type)
    setFormEventId(tmpl.event_id ?? "")
    setFormVariables(tmpl.variables ?? [])
    setPreviewHtml(null)
  }

  // Cancel editing
  function handleCancel() {
    setEditing(null)
    setCreating(false)
    setPreviewHtml(null)
  }

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    setFormName(name)
    if (creating) {
      setFormSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      )
    }
  }

  // Toggle variable
  function toggleVariable(v: string) {
    setFormVariables((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    )
  }

  // Insert variable into body
  function insertVariable(v: string) {
    setFormBodyHtml((prev) => prev + `{{${v}}}`)
  }

  // Preview
  async function handlePreview() {
    if (!editing) return
    setPreviewing(true)
    const sampleVars: Record<string, string> = {
      attendee_name: "Jane Doe",
      event_title: "TLF Leadership Summit 2026",
      event_date: "15 May 2026",
      event_venue: "Taj Lands End, Mumbai",
      ticket_name: "Executive Pass",
      qr_token: "abc123-demo-token",
    }
    const result = await renderTemplate(editing.id, sampleVars)
    if (result.success && result.html) {
      setPreviewHtml(result.html)
    } else {
      alert(result.error || "Failed to render preview")
    }
    setPreviewing(false)
  }

  // Save
  async function handleSave() {
    if (!formName || !formSlug || !formSubject || !formBodyHtml) {
      alert("Please fill in all required fields.")
      return
    }

    setSaving(true)

    if (creating) {
      const data: CreateTemplateData = {
        name: formName,
        slug: formSlug,
        subject: formSubject,
        body_html: formBodyHtml,
        template_type: formType,
        event_id: formEventId || null,
        variables: formVariables,
      }
      const result = await createEmailTemplate(data)
      if (result.success) {
        await fetchTemplates()
        handleCancel()
      } else {
        alert(result.error || "Failed to create template")
      }
    } else if (editing) {
      const result = await updateEmailTemplate(editing.id, {
        name: formName,
        slug: formSlug,
        subject: formSubject,
        body_html: formBodyHtml,
        template_type: formType,
        event_id: formEventId || null,
        variables: formVariables,
      })
      if (result.success) {
        await fetchTemplates()
        handleCancel()
      } else {
        alert(result.error || "Failed to update template")
      }
    }

    setSaving(false)
  }

  // Delete
  async function handleDelete(id: string, isDefault: boolean) {
    if (isDefault) {
      alert("Default system templates cannot be deleted.")
      return
    }
    if (!confirm("Are you sure you want to delete this template?")) return

    const result = await deleteEmailTemplate(id)
    if (result.success) {
      await fetchTemplates()
      if (editing?.id === id) handleCancel()
    } else {
      alert(result.error || "Failed to delete template")
    }
  }

  const showForm = creating || editing !== null

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#333] mb-1 flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Email Templates
          </h2>
          <p className="text-sm text-[#888]">
            Manage email templates for event communications.
          </p>
        </div>

        {!showForm && can("attendees", "create") && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] text-white text-sm font-semibold rounded-lg hover:bg-[#1557b0] transition-colors shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Template
          </button>
        )}
      </div>

      {/* Template List */}
      {!showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)] overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              No templates found. Run the migration to seed defaults, or create a new template.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Scope</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((tmpl) => (
                  <tr key={tmpl.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1a1a2e]">{tmpl.name}</span>
                        {tmpl.is_default && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-[#e7ab1c] bg-[#fef9e7] border border-[#e7ab1c]/20">
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${TYPE_COLORS[tmpl.template_type] ?? TYPE_COLORS.custom}`}>
                        {TYPE_LABELS[tmpl.template_type] ?? tmpl.template_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-[250px] truncate">
                      {tmpl.subject}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {tmpl.event_id ? "Event-specific" : "Global"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(tmpl)}
                          className="text-xs font-medium text-[#1a73e8] hover:underline"
                        >
                          Edit
                        </button>
                        {!tmpl.is_default && (
                          <button
                            onClick={() => handleDelete(tmpl.id, tmpl.is_default)}
                            className="text-xs font-medium text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="max-w-[800px]">
          <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)] p-6">
            <h3 className="text-lg font-semibold text-[#333] mb-6">
              {creating ? "New Template" : `Edit: ${editing?.name}`}
            </h3>

            <div className="space-y-5">
              {/* Name + Slug */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc]"
                    placeholder="e.g. VIP Welcome Email"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc]"
                    placeholder="e.g. vip-welcome-email"
                  />
                </div>
              </div>

              {/* Type + Event */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                    Template Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc]"
                  >
                    {TEMPLATE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                    Event (optional)
                  </label>
                  <select
                    value={formEventId}
                    onChange={(e) => setFormEventId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc]"
                  >
                    <option value="">Global (all events)</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Subject Line *
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc]"
                  placeholder="e.g. Registration Confirmed — {{event_title}}"
                />
              </div>

              {/* Variables */}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Available Variables (click to insert)
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_VARIABLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        insertVariable(v)
                        if (!formVariables.includes(v)) toggleVariable(v)
                      }}
                      className={`inline-flex px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                        formVariables.includes(v)
                          ? "bg-[#e8f0fe] text-[#1a73e8] border border-[#1a73e8]/30"
                          : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {"{{" + v + "}}"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body HTML */}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Body (HTML) *
                </label>
                <textarea
                  value={formBodyHtml}
                  onChange={(e) => setFormBodyHtml(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] font-mono focus:outline-none focus:border-[#ccc] resize-y"
                  placeholder="<div>Your email HTML here...</div>"
                />
              </div>

              {/* Preview */}
              {editing && (
                <div>
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={previewing}
                    className="text-sm font-medium text-[#1a73e8] hover:underline disabled:text-gray-400"
                  >
                    {previewing ? "Rendering preview..." : "Preview with sample data"}
                  </button>
                  {previewHtml && (
                    <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-medium">
                        Email Preview
                      </div>
                      <div
                        className="p-4 max-h-[400px] overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  saving
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#1a73e8] text-white hover:bg-[#1557b0] shadow-sm"
                }`}
              >
                {saving ? "Saving..." : creating ? "Create Template" : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-[#555] bg-[#f0f0f0] hover:bg-[#e8e8e8] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
