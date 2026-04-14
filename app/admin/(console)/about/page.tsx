"use client"

/**
 * ── ABOUT ADMIN ─────────────────────────────────────────────────────
 * Manage about_sections: pillars, stats, vision, founder.
 * Affects /about public page.
 */

import { useState, useEffect, useCallback } from "react"
import {
  getAboutSections,
  createAboutSection,
  updateAboutSection,
  deleteAboutSection,
} from "@/app/actions/cmsActions"
import { Plus, Pencil, Trash2, Loader2, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type SectionType = "pillar" | "stat" | "vision" | "founder"

interface Section {
  id: string
  section_type: SectionType
  title: string
  subtitle: string | null
  description: string | null
  icon: string | null
  image_url: string | null
  metric_value: string | null
  metric_label: string | null
  link_url: string | null
  sort_order: number
  is_active: boolean
}

const TYPES: { value: SectionType; label: string }[] = [
  { value: "pillar",  label: "Pillar" },
  { value: "stat",    label: "Stat" },
  { value: "vision",  label: "Vision" },
  { value: "founder", label: "Founder" },
]

const TYPE_LABEL: Record<string, string> = {
  pillar:  "Pillars",
  stat:    "Stats",
  vision:  "Vision",
  founder: "Founder",
}

export default function AdminAboutPage() {
  const [items, setItems]           = useState<Section[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState<Section | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [newType, setNewType]       = useState<SectionType>("pillar")

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const res = await getAboutSections(false)
    if (res.success && res.sections) setItems(res.sections as Section[])
    else setError(res.error ?? "Failed to load sections")
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  function openAdd(type: SectionType) { setNewType(type); setEditing(null); setShowForm(true); setError(null) }
  function openEdit(s: Section) { setEditing(s); setShowForm(true); setError(null) }
  function close() { setShowForm(false); setEditing(null); setError(null) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true); setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    const activeEl = form.querySelector<HTMLInputElement>('input[name="is_active_cb"]')
    fd.set("is_active", activeEl?.checked ? "true" : "false")
    if (editing) fd.set("id", editing.id)
    const res = editing ? await updateAboutSection(fd) : await createAboutSection(fd)
    if (res.success) { close(); await fetchItems() }
    else setError(res.error ?? "Operation failed")
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this section?")) return
    setDeletingId(id)
    const res = await deleteAboutSection(id)
    if (res.success) await fetchItems()
    else setError(res.error ?? "Failed to delete")
    setDeletingId(null)
  }

  const grouped = TYPES.map(t => ({
    ...t,
    sections: items.filter(i => i.section_type === t.value),
  }))

  const currentType = editing?.section_type ?? newType

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Info size={22} className="text-amber-500" />
            About
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pillars, stats, vision and founder shown on the /about page.
          </p>
        </div>
      </div>

      {error && !showForm && (
        <div className="mb-4 flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700">Dismiss</button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            {editing ? `Edit ${TYPE_LABEL[currentType]} Section` : `New ${TYPE_LABEL[currentType]} Section`}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Type *">
                <select name="section_type" required defaultValue={currentType} className={inputCls}
                  onChange={(e) => setNewType(e.target.value as SectionType)}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Title *">
                <input name="title" required defaultValue={editing?.title ?? ""} className={inputCls} />
              </Field>
            </div>

            {(currentType === "pillar" || currentType === "founder" || currentType === "vision") && (
              <>
                <Field label="Subtitle">
                  <input name="subtitle" defaultValue={editing?.subtitle ?? ""} className={inputCls} placeholder={currentType === "founder" ? "Founder & CEO" : ""} />
                </Field>
                <Field label="Description">
                  <textarea name="description" defaultValue={editing?.description ?? ""} rows={5} className={cn(inputCls, "resize-y")} />
                </Field>
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(currentType === "pillar") && (
                <Field label="Icon (lucide-react name)">
                  <input name="icon" defaultValue={editing?.icon ?? ""} className={inputCls} placeholder="MessageSquare, Globe, ShieldCheck, Handshake" />
                </Field>
              )}
              {(currentType === "founder") && (
                <>
                  <Field label="Image URL">
                    <input name="image_url" defaultValue={editing?.image_url ?? ""} className={inputCls} placeholder="/sunny-shah.jpg" />
                  </Field>
                  <Field label="Link URL (LinkedIn, etc.)">
                    <input name="link_url" defaultValue={editing?.link_url ?? ""} className={inputCls} />
                  </Field>
                </>
              )}
              {(currentType === "stat") && (
                <>
                  <Field label="Metric Value">
                    <input name="metric_value" defaultValue={editing?.metric_value ?? ""} className={inputCls} placeholder="50+" />
                  </Field>
                  <Field label="Metric Label">
                    <input name="metric_label" defaultValue={editing?.metric_label ?? ""} className={inputCls} placeholder="Events" />
                  </Field>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Sort Order">
                <input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} className={inputCls} />
              </Field>
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="checkbox" name="is_active_cb" defaultChecked={editing ? editing.is_active : true} className="w-4 h-4 rounded accent-[#e7ab1c]" />
                  Active
                </label>
              </div>
            </div>

            {/* Hidden fallbacks so edits don't lose untouched fields when form hides them for a type */}
            {(currentType !== "pillar" && currentType !== "founder" && currentType !== "vision") && (
              <>
                <input type="hidden" name="subtitle" defaultValue={editing?.subtitle ?? ""} />
                <input type="hidden" name="description" defaultValue={editing?.description ?? ""} />
              </>
            )}
            {(currentType !== "pillar") && <input type="hidden" name="icon" defaultValue={editing?.icon ?? ""} />}
            {(currentType !== "founder") && (
              <>
                <input type="hidden" name="image_url" defaultValue={editing?.image_url ?? ""} />
                <input type="hidden" name="link_url" defaultValue={editing?.link_url ?? ""} />
              </>
            )}
            {(currentType !== "stat") && (
              <>
                <input type="hidden" name="metric_value" defaultValue={editing?.metric_value ?? ""} />
                <input type="hidden" name="metric_label" defaultValue={editing?.metric_label ?? ""} />
              </>
            )}

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="bg-[#e7ab1c] text-white font-semibold rounded-lg px-5 py-2 text-sm hover:bg-[#d49c10] disabled:opacity-50 transition-colors">
                {submitting ? "Saving…" : editing ? "Update Section" : "Create Section"}
              </button>
              <button type="button" onClick={close}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.value} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{TYPE_LABEL[group.value]}</h3>
                <button
                  onClick={() => openAdd(group.value)}
                  className="inline-flex items-center gap-1 text-xs text-[#e7ab1c] hover:text-[#d49c10] font-semibold"
                >
                  <Plus size={14} /> Add {group.label}
                </button>
              </div>
              {group.sections.length === 0 ? (
                <div className="px-5 py-6 text-sm text-gray-400">No {group.label.toLowerCase()} entries yet.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {group.sections.map(s => (
                    <li key={s.id} className="px-5 py-3 flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200 shrink-0 mt-0.5">
                        {s.sort_order}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {s.title}
                          {s.subtitle && <span className="ml-2 text-gray-500 font-normal">— {s.subtitle}</span>}
                          {!s.is_active && <span className="ml-2 text-gray-500 uppercase tracking-wide text-[10px] font-semibold">Inactive</span>}
                        </p>
                        {s.section_type === "stat" && (
                          <p className="text-sm text-amber-700 mt-0.5">{s.metric_value} {s.metric_label}</p>
                        )}
                        {s.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 whitespace-pre-wrap">{s.description}</p>
                        )}
                        {s.icon && <p className="text-[11px] text-gray-400 mt-0.5">icon: {s.icon}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => openEdit(s)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {deletingId === s.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
