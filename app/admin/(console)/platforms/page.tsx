"use client"

/**
 * ── PLATFORMS ADMIN ─────────────────────────────────────────────────
 * Manage platform_features rows for conclave / inner_circle / show.
 * Affects /platforms public page.
 */

import { useState, useEffect, useCallback } from "react"
import {
  getPlatformFeatures,
  createPlatformFeature,
  updatePlatformFeature,
  deletePlatformFeature,
} from "@/app/actions/cmsActions"
import { Plus, Pencil, Trash2, Loader2, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

interface Feature {
  id: string
  platform: "conclave" | "inner_circle" | "show"
  title: string
  icon: string | null
  sort_order: number
  is_active: boolean
}

const PLATFORMS: { value: Feature["platform"]; label: string }[] = [
  { value: "conclave",     label: "Conclaves" },
  { value: "inner_circle", label: "Inner Circle" },
  { value: "show",         label: "The Show" },
]

const PLATFORM_LABEL: Record<string, string> = {
  conclave:     "Conclaves",
  inner_circle: "Inner Circle",
  show:         "The Show",
}

export default function AdminPlatformsPage() {
  const [items, setItems]           = useState<Feature[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState<Feature | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const res = await getPlatformFeatures(false)
    if (res.success && res.features) setItems(res.features as Feature[])
    else setError(res.error ?? "Failed to load features")
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  function openAdd() { setEditing(null); setShowForm(true); setError(null) }
  function openEdit(f: Feature) { setEditing(f); setShowForm(true); setError(null) }
  function close() { setShowForm(false); setEditing(null); setError(null) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true); setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    const activeEl = form.querySelector<HTMLInputElement>('input[name="is_active_cb"]')
    fd.set("is_active", activeEl?.checked ? "true" : "false")
    if (editing) fd.set("id", editing.id)
    const res = editing ? await updatePlatformFeature(fd) : await createPlatformFeature(fd)
    if (res.success) { close(); await fetchItems() }
    else setError(res.error ?? "Operation failed")
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this feature?")) return
    setDeletingId(id)
    const res = await deletePlatformFeature(id)
    if (res.success) await fetchItems()
    else setError(res.error ?? "Failed to delete")
    setDeletingId(null)
  }

  const grouped = PLATFORMS.map(p => ({
    ...p,
    features: items.filter(i => i.platform === p.value),
  }))

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers size={22} className="text-amber-500" />
            Platforms
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage feature bullets shown on the /platforms page for each pillar.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e7ab1c] text-white text-sm font-semibold hover:bg-[#d49c10] transition-colors"
        >
          <Plus size={16} /> New Feature
        </button>
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
            {editing ? "Edit Feature" : "New Feature"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Platform *">
                <select name="platform" required defaultValue={editing?.platform ?? "conclave"} className={inputCls}>
                  {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </Field>
              <Field label="Icon (lucide-react name)">
                <input name="icon" defaultValue={editing?.icon ?? ""} className={inputCls} placeholder="Crown, Globe, Radio…" />
              </Field>
            </div>
            <Field label="Title *">
              <input name="title" required defaultValue={editing?.title ?? ""} className={inputCls} placeholder="e.g. 650+ CXOs per flagship event" />
            </Field>
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

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="bg-[#e7ab1c] text-white font-semibold rounded-lg px-5 py-2 text-sm hover:bg-[#d49c10] disabled:opacity-50 transition-colors">
                {submitting ? "Saving…" : editing ? "Update Feature" : "Create Feature"}
              </button>
              <button type="button" onClick={close}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grouped lists */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.value} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{group.label}</h3>
                <span className="text-xs text-gray-500">{group.features.length} feature{group.features.length === 1 ? "" : "s"}</span>
              </div>
              {group.features.length === 0 ? (
                <div className="px-5 py-6 text-sm text-gray-400">No features yet.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {group.features.map(f => (
                    <li key={f.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200">
                        {f.sort_order}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{f.title}</p>
                        <p className="text-xs text-gray-500">
                          {f.icon ?? "no icon"}
                          {!f.is_active && <span className="ml-2 text-gray-500 uppercase tracking-wide text-[10px] font-semibold">Inactive</span>}
                        </p>
                      </div>
                      <button onClick={() => openEdit(f)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        disabled={deletingId === f.id}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === f.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Delete
                      </button>
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
