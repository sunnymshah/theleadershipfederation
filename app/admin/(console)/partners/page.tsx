"use client"

/**
 * ── PARTNERS ADMIN ──────────────────────────────────────────────────
 * CRUD for the `partners` table. Categories: title / powered_by /
 * associate / media. Affects /partners public page.
 */

import { useState, useEffect, useCallback } from "react"
import {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
} from "@/app/actions/cmsActions"
import { Plus, Pencil, Trash2, Loader2, Handshake, Filter, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageContentEditor, type SectionDef } from "@/components/admin/PageContentEditor"

const PARTNERS_PAGE_SECTIONS: SectionDef[] = [
  {
    kind: "fields",
    sectionKey: "hero",
    label: "Hero",
    description: "Top of the page: eyebrow, headline, intro paragraph.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", placeholder: "Our Network" },
      { name: "title", label: "Headline", placeholder: "Partners & Ecosystem" },
      { name: "description", label: "Description", textarea: true },
    ],
  },
  {
    kind: "list",
    sectionKey: "stats",
    label: "Stats Strip",
    description: "The four-up stats row (e.g. 100+ Partners, 30+ Countries).",
    titleField: "label",
    itemLabel: "Stat",
    itemFields: [
      { name: "value", label: "Value", placeholder: "100+" },
      { name: "label", label: "Label", placeholder: "Partners" },
    ],
  },
  {
    kind: "list",
    sectionKey: "categories",
    label: "Partner Category Labels",
    description: "Section titles used above each group of partner logos.",
    titleField: "title",
    itemLabel: "Category",
    itemFields: [
      { name: "slug", label: "Slug (title / powered_by / associate / media)", placeholder: "title" },
      { name: "title", label: "Display Title", placeholder: "Title Partners" },
    ],
  },
  {
    kind: "fields",
    sectionKey: "benefits_header",
    label: "\u201CBecome a Partner\u201D Header",
    description: "Eyebrow, headline, and intro for the Become-a-Partner block.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", placeholder: "Partner With Us" },
      { name: "title", label: "Headline", placeholder: "Become a Partner" },
      { name: "description", label: "Description", textarea: true },
    ],
  },
  {
    kind: "list",
    sectionKey: "benefits",
    label: "Partner Benefits",
    description: "Three cards highlighting what partners get.",
    titleField: "title",
    itemLabel: "Benefit",
    itemFields: [
      { name: "icon", label: "Icon key (globe / handshake / trendingup / users / sparkles / calendar)", placeholder: "globe" },
      { name: "title", label: "Title", placeholder: "Global Visibility" },
      { name: "description", label: "Description", textarea: true },
    ],
  },
]

interface Partner {
  id: string
  name: string
  category: "title" | "powered_by" | "associate" | "media"
  logo_url: string | null
  website_url: string | null
  description: string | null
  sort_order: number
  is_active: boolean
}

const CATEGORIES: { value: Partner["category"]; label: string }[] = [
  { value: "title",      label: "Title" },
  { value: "powered_by", label: "Powered By" },
  { value: "associate",  label: "Associate" },
  { value: "media",      label: "Media" },
]

const CATEGORY_LABEL: Record<string, string> = {
  title:      "Title",
  powered_by: "Powered By",
  associate:  "Associate",
  media:      "Media",
}

export default function AdminPartnersPage() {
  const [items, setItems]           = useState<Partner[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState<Partner | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const res = await getPartners(false)
    if (res.success && res.partners) setItems(res.partners as Partner[])
    else setError(res.error ?? "Failed to load partners")
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  function openAdd()       { setEditing(null); setShowForm(true); setError(null) }
  function openEdit(p: Partner) { setEditing(p); setShowForm(true); setError(null) }
  function close()         { setShowForm(false); setEditing(null); setError(null) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true); setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    const activeEl = form.querySelector<HTMLInputElement>('input[name="is_active_cb"]')
    fd.set("is_active", activeEl?.checked ? "true" : "false")
    if (editing) fd.set("id", editing.id)
    const res = editing ? await updatePartner(fd) : await createPartner(fd)
    if (res.success) { close(); await fetchItems() }
    else setError(res.error ?? "Operation failed")
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this partner?")) return
    setDeletingId(id)
    const res = await deletePartner(id)
    if (res.success) await fetchItems()
    else setError(res.error ?? "Failed to delete")
    setDeletingId(null)
  }

  const filtered = categoryFilter === "all"
    ? items
    : items.filter(p => p.category === categoryFilter)

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Handshake size={22} className="text-amber-500" />
            Partners
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage partner logos shown on the /partners page.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e7ab1c] text-white text-sm font-semibold hover:bg-[#d49c10] transition-colors"
        >
          <Plus size={16} /> New Partner
        </button>
      </div>

      {error && !showForm && (
        <div className="mb-4 flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700">Dismiss</button>
        </div>
      )}

      {/* Page content (hero, stats strip, category labels, benefits) */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-[#333] mb-3 uppercase tracking-wider">
          Page Content
        </h2>
        <PageContentEditor pageSlug="partners" sections={PARTNERS_PAGE_SECTIONS} />
      </div>

      <h2 className="text-sm font-bold text-[#333] mb-3 uppercase tracking-wider">
        Partner Logos
      </h2>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <span className="text-sm text-gray-500">{filtered.length} partner{filtered.length === 1 ? "" : "s"}</span>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            {editing ? "Edit Partner" : "New Partner"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name *">
                <input name="name" required defaultValue={editing?.name ?? ""} className={inputCls} placeholder="e.g. Tata" />
              </Field>
              <Field label="Category *">
                <select name="category" required defaultValue={editing?.category ?? "title"} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Logo URL">
                <input name="logo_url" defaultValue={editing?.logo_url ?? ""} className={inputCls} placeholder="/partners/tata.jpg" />
              </Field>
              <Field label="Website URL">
                <input name="website_url" defaultValue={editing?.website_url ?? ""} className={inputCls} placeholder="https://…" />
              </Field>
            </div>
            <Field label="Description">
              <textarea name="description" defaultValue={editing?.description ?? ""} className={cn(inputCls, "min-h-[80px]")} />
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
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#e7ab1c] text-white font-semibold rounded-lg px-5 py-2 text-sm hover:bg-[#d49c10] disabled:opacity-50 transition-colors"
              >
                {submitting ? "Saving…" : editing ? "Update Partner" : "Create Partner"}
              </button>
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Handshake size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No partners yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      {CATEGORY_LABEL[p.category]}
                    </span>
                    <span className="ml-2">order {p.sort_order}</span>
                  </p>
                </div>
                {!p.is_active && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Inactive</span>
                )}
              </div>

              <div className="flex items-center justify-center h-16 bg-gray-50 rounded-lg mb-3 px-3">
                {p.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo_url} alt={p.name} className="max-h-10 max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400">No logo</span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-auto pt-2 border-t border-gray-100">
                <button onClick={() => openEdit(p)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {deletingId === p.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Delete
                </button>
              </div>
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
