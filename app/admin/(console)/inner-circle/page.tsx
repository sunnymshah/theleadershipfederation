"use client"

/**
 * ── INNER-CIRCLE ADMIN ──────────────────────────────────────────────
 * Manage inner_circle_content: value props, how-it-works steps, testimonials.
 * Affects /inner-circle public page.
 */

import { useState, useEffect, useCallback } from "react"
import {
  getInnerCircleContent,
  createInnerCircleItem,
  updateInnerCircleItem,
  deleteInnerCircleItem,
} from "@/app/actions/cmsActions"
import { Plus, Pencil, Trash2, Loader2, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

type ContentType = "value_prop" | "how_it_works" | "testimonial"

interface Item {
  id: string
  content_type: ContentType
  title: string
  description: string | null
  subtitle: string | null
  icon: string | null
  accent: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}

const TYPES: { value: ContentType; label: string }[] = [
  { value: "value_prop",    label: "Value Props (Why Join)" },
  { value: "how_it_works",  label: "How It Works (Steps)" },
  { value: "testimonial",   label: "Member Testimonials" },
]

const TYPE_LABEL: Record<string, string> = {
  value_prop:   "Value Props",
  how_it_works: "How It Works",
  testimonial:  "Testimonials",
}

export default function AdminInnerCirclePage() {
  const [items, setItems]           = useState<Item[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState<Item | null>(null)
  const [newType, setNewType]       = useState<ContentType>("value_prop")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const res = await getInnerCircleContent(false)
    if (res.success && res.items) setItems(res.items as Item[])
    else setError(res.error ?? "Failed to load")
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  function openAdd(type: ContentType) { setNewType(type); setEditing(null); setShowForm(true); setError(null) }
  function openEdit(i: Item) { setEditing(i); setNewType(i.content_type); setShowForm(true); setError(null) }
  function close() { setShowForm(false); setEditing(null); setError(null) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true); setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    const activeEl = form.querySelector<HTMLInputElement>('input[name="is_active_cb"]')
    fd.set("is_active", activeEl?.checked ? "true" : "false")
    if (editing) fd.set("id", editing.id)
    const res = editing ? await updateInnerCircleItem(fd) : await createInnerCircleItem(fd)
    if (res.success) { close(); await fetchItems() }
    else setError(res.error ?? "Operation failed")
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return
    setDeletingId(id)
    const res = await deleteInnerCircleItem(id)
    if (res.success) await fetchItems()
    else setError(res.error ?? "Failed to delete")
    setDeletingId(null)
  }

  const grouped = TYPES.map(t => ({
    ...t,
    items: items.filter(i => i.content_type === t.value),
  }))

  const currentType = editing?.content_type ?? newType

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown size={22} className="text-amber-500" />
            Inner Circle Content
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Content blocks shown on the /inner-circle public page.
          </p>
        </div>
      </div>

      {error && !showForm && (
        <div className="mb-4 flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700">Dismiss</button>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            {editing ? `Edit ${TYPE_LABEL[currentType]} Item` : `New ${TYPE_LABEL[currentType]} Item`}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Type *">
                <select name="content_type" required value={newType} onChange={(e) => setNewType(e.target.value as ContentType)} className={inputCls}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Title *">
                <input name="title" required defaultValue={editing?.title ?? ""} className={inputCls} />
              </Field>
            </div>

            <Field label="Description">
              <textarea name="description" defaultValue={editing?.description ?? ""} rows={4} className={cn(inputCls, "resize-y")} />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(currentType === "how_it_works") && (
                <Field label="Subtitle (step number, e.g. '01')">
                  <input name="subtitle" defaultValue={editing?.subtitle ?? ""} className={inputCls} />
                </Field>
              )}
              {(currentType === "testimonial") && (
                <Field label="Subtitle (role/company)">
                  <input name="subtitle" defaultValue={editing?.subtitle ?? ""} className={inputCls} placeholder="Global Capability Centre" />
                </Field>
              )}
              {(currentType !== "how_it_works" && currentType !== "testimonial") && (
                <input type="hidden" name="subtitle" defaultValue={editing?.subtitle ?? ""} />
              )}

              {(currentType === "value_prop" || currentType === "how_it_works") && (
                <Field label="Icon (lucide-react name)">
                  <input name="icon" defaultValue={editing?.icon ?? ""} className={inputCls} placeholder="Globe, Users, BookOpen" />
                </Field>
              )}
              {(currentType === "testimonial") && <input type="hidden" name="icon" defaultValue={editing?.icon ?? ""} />}

              {(currentType === "value_prop") && (
                <Field label="Accent (tailwind gradient)">
                  <input name="accent" defaultValue={editing?.accent ?? ""} className={inputCls} placeholder="from-blue-500/20 to-blue-600/10" />
                </Field>
              )}
              {(currentType !== "value_prop") && <input type="hidden" name="accent" defaultValue={editing?.accent ?? ""} />}
            </div>

            <input type="hidden" name="image_url" defaultValue={editing?.image_url ?? ""} />

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

            {error && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="bg-[#e7ab1c] text-white font-semibold rounded-lg px-5 py-2 text-sm hover:bg-[#d49c10] disabled:opacity-50 transition-colors">
                {submitting ? "Saving…" : editing ? "Update" : "Create"}
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
            <section key={group.value} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{group.label}</h3>
                <button onClick={() => openAdd(group.value)} className="inline-flex items-center gap-1 text-xs text-[#e7ab1c] hover:text-[#d49c10] font-semibold">
                  <Plus size={14} /> Add
                </button>
              </div>
              {group.items.length === 0 ? (
                <div className="px-5 py-6 text-sm text-gray-400">No items yet.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {group.items.map(item => (
                    <li key={item.id} className="px-5 py-3 flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200 shrink-0 mt-0.5">
                        {item.sort_order}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.title}
                          {item.subtitle && <span className="ml-2 text-gray-500 font-normal">— {item.subtitle}</span>}
                          {!item.is_active && <span className="ml-2 text-gray-500 uppercase tracking-wide text-[10px] font-semibold">Inactive</span>}
                        </p>
                        {item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                        {(item.icon || item.accent) && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {item.icon && <span>icon: {item.icon}</span>}
                            {item.accent && <span className="ml-3">accent: {item.accent}</span>}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => openEdit(item)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50">
                          {deletingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
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
