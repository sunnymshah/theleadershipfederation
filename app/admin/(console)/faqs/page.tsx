"use client"

/**
 * ── FAQs ADMIN ──────────────────────────────────────────────────────
 * Manage `faqs` table scoped by page (memberships, inner_circle, etc.)
 */

import { useState, useEffect, useCallback } from "react"
import {
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} from "@/app/actions/cmsActions"
import { Plus, Pencil, Trash2, Loader2, HelpCircle, Filter, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Faq {
  id: string
  page: string
  question: string
  answer: string
  sort_order: number
  is_active: boolean
}

const KNOWN_PAGES = ["memberships", "inner_circle", "general", "events", "contact"]

const PAGE_LABEL: Record<string, string> = {
  memberships:  "Memberships",
  inner_circle: "Inner Circle",
  general:      "General",
  events:       "Events",
  contact:      "Contact",
}

export default function AdminFaqsPage() {
  const [items, setItems]           = useState<Faq[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState<Faq | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pageFilter, setPageFilter] = useState<string>("all")

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const res = await getFaqs(undefined, false)
    if (res.success && res.faqs) setItems(res.faqs as Faq[])
    else setError(res.error ?? "Failed to load")
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  function openAdd() { setEditing(null); setShowForm(true); setError(null) }
  function openEdit(f: Faq) { setEditing(f); setShowForm(true); setError(null) }
  function close() { setShowForm(false); setEditing(null); setError(null) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true); setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    const activeEl = form.querySelector<HTMLInputElement>('input[name="is_active_cb"]')
    fd.set("is_active", activeEl?.checked ? "true" : "false")
    if (editing) fd.set("id", editing.id)
    const res = editing ? await updateFaq(fd) : await createFaq(fd)
    if (res.success) { close(); await fetchItems() }
    else setError(res.error ?? "Operation failed")
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this FAQ?")) return
    setDeletingId(id)
    const res = await deleteFaq(id)
    if (res.success) await fetchItems()
    else setError(res.error ?? "Failed to delete")
    setDeletingId(null)
  }

  const pages = Array.from(new Set([...KNOWN_PAGES, ...items.map(f => f.page)]))
  const filtered = pageFilter === "all" ? items : items.filter(f => f.page === pageFilter)

  const grouped = pages
    .map(page => ({ page, label: PAGE_LABEL[page] ?? page, faqs: filtered.filter(f => f.page === page) }))
    .filter(g => g.faqs.length > 0 || pageFilter === g.page || pageFilter === "all")

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle size={22} className="text-amber-500" />
            FAQs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Shared FAQs used across /memberships, /inner-circle, and other pages.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e7ab1c] text-white text-sm font-semibold hover:bg-[#d49c10] transition-colors"
        >
          <Plus size={16} /> New FAQ
        </button>
      </div>

      {error && !showForm && (
        <div className="mb-4 flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700">Dismiss</button>
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select value={pageFilter} onChange={(e) => setPageFilter(e.target.value)}
            className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 cursor-pointer">
            <option value="all">All Pages</option>
            {pages.map(p => <option key={p} value={p}>{PAGE_LABEL[p] ?? p}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <span className="text-sm text-gray-500">{filtered.length} FAQ{filtered.length === 1 ? "" : "s"}</span>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">{editing ? "Edit FAQ" : "New FAQ"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Page *">
                <input name="page" required defaultValue={editing?.page ?? "memberships"} className={inputCls} placeholder="memberships, inner_circle, general" list="page-list" />
                <datalist id="page-list">
                  {KNOWN_PAGES.map(p => <option key={p} value={p} />)}
                </datalist>
              </Field>
              <Field label="Sort Order">
                <input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} className={inputCls} />
              </Field>
            </div>
            <Field label="Question *">
              <input name="question" required defaultValue={editing?.question ?? ""} className={inputCls} />
            </Field>
            <Field label="Answer *">
              <textarea name="answer" required defaultValue={editing?.answer ?? ""} rows={5} className={cn(inputCls, "resize-y")} />
            </Field>
            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input type="checkbox" name="is_active_cb" defaultChecked={editing ? editing.is_active : true} className="w-4 h-4 rounded accent-[#e7ab1c]" />
                Active
              </label>
            </div>

            {error && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="bg-[#e7ab1c] text-white font-semibold rounded-lg px-5 py-2 text-sm hover:bg-[#d49c10] disabled:opacity-50 transition-colors">
                {submitting ? "Saving…" : editing ? "Update FAQ" : "Create FAQ"}
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <HelpCircle size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No FAQs yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(group => (
            <section key={group.page} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">{group.label}</h3>
              </div>
              {group.faqs.length === 0 ? (
                <div className="px-5 py-4 text-sm text-gray-400">No FAQs for this page.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {group.faqs.map(f => (
                    <li key={f.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {f.question}
                            {!f.is_active && <span className="ml-2 text-gray-500 uppercase tracking-wide text-[10px] font-semibold">Inactive</span>}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{f.answer}</p>
                          <p className="text-[11px] text-gray-400 mt-1">order {f.sort_order}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => openEdit(f)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                            <Pencil size={12} /> Edit
                          </button>
                          <button onClick={() => handleDelete(f.id)} disabled={deletingId === f.id}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50">
                            {deletingId === f.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            Delete
                          </button>
                        </div>
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
