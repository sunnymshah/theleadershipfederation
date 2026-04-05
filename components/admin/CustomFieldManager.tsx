"use client"

/**
 * ─── CUSTOM FIELD MANAGER ──────────────────────────────────────────────
 *
 * Manage custom registration form fields per event.
 * Supports: text, textarea, select, checkbox, number, email, url
 * Drag-handle reorder, required toggle, preview section.
 */

import { useState, useCallback, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import {
  createCustomField,
  updateCustomField,
  deleteCustomField,
  reorderCustomFields,
} from "@/app/actions/customFieldActions"
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  GripVertical,
  Eye,
  AlertCircle,
  CheckCircle2,
  Type,
  List,
  Hash,
  Mail,
  Link2,
  AlignLeft,
  CheckSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomField {
  id: string
  event_id: string
  field_name: string
  field_label: string
  field_type: string
  options: string[] | null
  is_required: boolean
  sort_order: number
  created_at: string
}

const FIELD_TYPE_CONFIG: Record<string, { label: string; icon: typeof Type; color: string }> = {
  text:     { label: "Text",       icon: Type,        color: "bg-blue-500/10 text-blue-400" },
  textarea: { label: "Textarea",   icon: AlignLeft,   color: "bg-purple-500/10 text-purple-400" },
  select:   { label: "Dropdown",   icon: List,        color: "bg-[#c9a84c]/10 text-[#c9a84c]" },
  checkbox: { label: "Checkbox",   icon: CheckSquare, color: "bg-emerald-500/10 text-emerald-400" },
  number:   { label: "Number",     icon: Hash,        color: "bg-orange-500/10 text-orange-400" },
  email:    { label: "Email",      icon: Mail,        color: "bg-cyan-500/10 text-cyan-400" },
  url:      { label: "URL",        icon: Link2,       color: "bg-pink-500/10 text-pink-400" },
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export function CustomFieldManager({ eventId }: { eventId: string }) {
  const [fields, setFields]             = useState<CustomField[]>([])
  const [loading, setLoading]           = useState(true)
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [editing, setEditing]           = useState<CustomField | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [actionError, setActionError]   = useState<string | null>(null)
  const [deletingId, setDeletingId]     = useState<string | null>(null)
  const [showPreview, setShowPreview]   = useState(false)
  const [selectedType, setSelectedType] = useState("text")

  const supabase = createClient()

  const fetchFields = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("custom_fields")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order")
    if (data) setFields(data)
    setLoading(false)
  }, [eventId])

  useEffect(() => { fetchFields() }, [fetchFields])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)

    const fd = new FormData(e.currentTarget)
    // Auto-set sort_order for new fields
    if (!editing) {
      fd.set("sort_order", String(fields.length))
    }

    const result = editing
      ? await updateCustomField(editing.id, fd)
      : await createCustomField(eventId, fd)

    if (result.success) {
      setDrawerOpen(false)
      setEditing(null)
      await fetchFields()
    } else {
      setActionError(result.error ?? "Operation failed")
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this custom field? All collected values will be lost.")) return
    setDeletingId(id)
    const result = await deleteCustomField(id)
    if (result.success) await fetchFields()
    setDeletingId(null)
  }

  async function moveField(index: number, direction: "up" | "down") {
    const newFields = [...fields]
    const target = direction === "up" ? index - 1 : index + 1
    if (target < 0 || target >= newFields.length) return

    ;[newFields[index], newFields[target]] = [newFields[target], newFields[index]]
    const orders = newFields.map((f, i) => ({ id: f.id, sort_order: i }))
    setFields(newFields)
    await reorderCustomFields(orders)
  }

  function openAdd() {
    setEditing(null)
    setDrawerOpen(true)
    setActionError(null)
    setSelectedType("text")
  }

  function openEdit(field: CustomField) {
    setEditing(field)
    setDrawerOpen(true)
    setActionError(null)
    setSelectedType(field.field_type)
  }

  // ── Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#aaa] gap-2 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading custom fields...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#333]">Custom Registration Fields</h2>
          <p className="text-[13px] text-[#999] mt-0.5">Add custom questions to your registration form</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-2 rounded-lg border border-[#e0e0e0] text-[#666] hover:text-[#333] hover:bg-[#fafafa] transition-colors text-sm flex items-center gap-1.5"
          >
            <Eye size={14} /> {showPreview ? "Hide" : "Show"} Preview
          </button>
          <button
            onClick={openAdd}
            className="px-4 py-2 rounded-lg bg-[#c9a84c] text-white text-sm font-medium hover:bg-[#d4b85c] transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} /> Add Field
          </button>
        </div>
      </div>

      {/* ── Fields List ──────────────────────────────────────────── */}
      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d0d0d0] p-12 text-center">
          <Type size={32} className="mx-auto mb-3 text-[#ccc]" />
          <p className="text-[#888] text-sm">No custom fields yet</p>
          <p className="text-[#bbb] text-xs mt-1">Add fields to collect extra info from registrants</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-lg bg-[#c9a84c] text-white text-sm font-medium hover:bg-[#d4b85c] transition-colors inline-flex items-center gap-1.5">
            <Plus size={14} /> Add Your First Field
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
          <div className="divide-y divide-[#eee]">
            {fields.map((field, index) => {
              const typeConfig = FIELD_TYPE_CONFIG[field.field_type] ?? FIELD_TYPE_CONFIG.text
              const TypeIcon = typeConfig.icon

              return (
                <div key={field.id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#fafafa] transition-colors">
                  {/* Drag Handle / Reorder */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => moveField(index, "up")}
                      disabled={index === 0}
                      className="text-[#ccc] hover:text-[#888] disabled:opacity-30 transition-colors"
                    >
                      <GripVertical size={14} />
                    </button>
                  </div>

                  {/* Type Icon */}
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", typeConfig.color)}>
                    <TypeIcon size={14} />
                  </div>

                  {/* Field Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#333] truncate">{field.field_label}</span>
                      {field.is_required && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400">Required</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider", typeConfig.color)}>
                        {typeConfig.label}
                      </span>
                      <span className="text-[11px] text-[#bbb] font-mono">{field.field_name}</span>
                      {field.options && field.options.length > 0 && (
                        <span className="text-[11px] text-[#bbb]">({field.options.length} options)</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveField(index, "up")}
                      disabled={index === 0}
                      className="p-1.5 rounded text-[#bbb] hover:text-[#666] hover:bg-[#f0f0f0] transition-colors disabled:opacity-30"
                      title="Move up"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    </button>
                    <button
                      onClick={() => moveField(index, "down")}
                      disabled={index === fields.length - 1}
                      className="p-1.5 rounded text-[#bbb] hover:text-[#666] hover:bg-[#f0f0f0] transition-colors disabled:opacity-30"
                      title="Move down"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    <button
                      onClick={() => openEdit(field)}
                      className="p-1.5 rounded text-[#bbb] hover:text-[#c9a84c] hover:bg-[#c9a84c]/5 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(field.id)}
                      disabled={deletingId === field.id}
                      className="p-1.5 rounded text-[#bbb] hover:text-red-400 hover:bg-red-500/5 transition-colors"
                      title="Delete"
                    >
                      {deletingId === field.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Preview Section ──────────────────────────────────────── */}
      {showPreview && fields.length > 0 && (
        <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
          <div className="px-5 py-3 bg-white border-b border-[#e0e0e0]">
            <h3 className="text-xs font-semibold text-[#777] uppercase tracking-wider">Form Preview</h3>
          </div>
          <div className="p-5 space-y-4 bg-[#fafafa]">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  {field.field_label} {field.is_required && <span className="text-red-400">*</span>}
                </label>

                {field.field_type === "text" && (
                  <input type="text" disabled placeholder={`Enter ${field.field_label.toLowerCase()}`} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc]" />
                )}
                {field.field_type === "textarea" && (
                  <textarea disabled rows={3} placeholder={`Enter ${field.field_label.toLowerCase()}`} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] resize-none" />
                )}
                {field.field_type === "select" && (
                  <select disabled className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#ccc]">
                    <option>Select {field.field_label.toLowerCase()}</option>
                    {field.options?.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {field.field_type === "checkbox" && (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" disabled className="w-4 h-4 rounded border-[#e0e0e0]" />
                    <span className="text-sm text-[#666]">{field.field_label}</span>
                  </div>
                )}
                {field.field_type === "number" && (
                  <input type="number" disabled placeholder="0" className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc]" />
                )}
                {field.field_type === "email" && (
                  <input type="email" disabled placeholder="email@example.com" className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc]" />
                )}
                {field.field_type === "url" && (
                  <input type="url" disabled placeholder="https://..." className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc]" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Drawer (Add / Edit) ──────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => { setDrawerOpen(false); setEditing(null) }} />
          <div className="relative w-full max-w-md bg-white shadow-2xl border-l border-[#e0e0e0] overflow-y-auto">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-[#e0e0e0] flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#333]">{editing ? "Edit Field" : "Add Custom Field"}</h3>
              <button onClick={() => { setDrawerOpen(false); setEditing(null) }} className="p-1.5 rounded-lg hover:bg-[#f0f0f0] text-[#aaa] hover:text-[#666] transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Drawer Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Field Label *</label>
                <input
                  type="text"
                  name="field_label"
                  required
                  defaultValue={editing?.field_label ?? ""}
                  placeholder="e.g., T-shirt Size"
                  className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  onChange={(e) => {
                    if (!editing) {
                      const nameInput = e.currentTarget.form?.querySelector<HTMLInputElement>('input[name="field_name"]')
                      if (nameInput) nameInput.value = slugify(e.target.value)
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Field Name (ID) *</label>
                <input
                  type="text"
                  name="field_name"
                  required
                  defaultValue={editing?.field_name ?? ""}
                  placeholder="auto_generated_from_label"
                  className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors font-mono"
                />
                <p className="text-[11px] text-[#bbb] mt-1">Auto-generated from label. Used as internal identifier.</p>
              </div>

              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Field Type *</label>
                <select
                  name="field_type"
                  required
                  defaultValue={editing?.field_type ?? "text"}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                >
                  {Object.entries(FIELD_TYPE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              {/* Options — only for select type */}
              {selectedType === "select" && (
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Options (comma-separated) *</label>
                  <textarea
                    name="options"
                    rows={3}
                    required={selectedType === "select"}
                    defaultValue={editing?.options?.join(", ") ?? ""}
                    placeholder="Small, Medium, Large, XL"
                    className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none"
                  />
                  <p className="text-[11px] text-[#bbb] mt-1">Separate options with commas</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_required"
                  id="is_required"
                  defaultChecked={editing?.is_required ?? false}
                  className="w-4 h-4 rounded border-[#e0e0e0] text-[#c9a84c] focus:ring-[#c9a84c]/50"
                />
                <label htmlFor="is_required" className="text-sm text-[#555]">Required field</label>
              </div>

              <input type="hidden" name="sort_order" value={editing?.sort_order ?? fields.length} />

              {actionError && (
                <div className="px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={14} /> {actionError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-[#c9a84c] text-white text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : editing ? "Update Field" : "Add Field"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
