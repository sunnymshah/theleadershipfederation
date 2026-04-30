"use client"

/**
 * Exhibitors data manager (ITEM 6).
 *
 * Mirrors the SponsorsManager shape: list with search + Add, click-to-
 * edit form, delete confirm. Below the list lives a small Categories
 * editor (label + colour) which feeds the optional groupByCategory
 * toggle on the ExhibitorsListing block.
 *
 * Lives inside the builder's Data rail. Loads its own data on mount —
 * the parent panel just hands us the eventId.
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, ArrowLeft, Trash2, Tag } from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import { EntityListItem } from "./EntityListItem"
import { ImageUploadCrop } from "@/components/admin/ImageUploadCrop"
import {
  listExhibitors, listExhibitorCategories,
  upsertExhibitor, deleteExhibitor,
  upsertExhibitorCategory, deleteExhibitorCategory,
  type Exhibitor, type ExhibitorCategory,
} from "@/app/actions/exhibitorActions"

type EditState =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; row: Exhibitor }
  | { mode: "categories" }

export function ExhibitorsManager({
  eventId,
  onClose,
}: {
  eventId: string
  onClose?: () => void
}) {
  const router = useRouter()
  const [edit, setEdit] = useState<EditState>({ mode: "list" })
  const [search, setSearch] = useState("")
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([])
  const [categories, setCategories] = useState<ExhibitorCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function refresh() {
    const [a, b] = await Promise.all([
      listExhibitors(eventId),
      listExhibitorCategories(eventId),
    ])
    setExhibitors(a.rows)
    setCategories(b.rows)
  }

  useEffect(() => {
    let cancelled = false
    void refresh().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"?`)) return
    setBusyId(id)
    try {
      await deleteExhibitor(eventId, id)
      await refresh()
      router.refresh()
    } finally { setBusyId(null) }
  }

  if (edit.mode === "create" || edit.mode === "edit") {
    return (
      <ExhibitorForm
        eventId={eventId}
        categories={categories}
        initial={edit.mode === "edit" ? edit.row : undefined}
        onCancel={() => setEdit({ mode: "list" })}
        onSaved={async () => { await refresh(); setEdit({ mode: "list" }); router.refresh() }}
      />
    )
  }
  if (edit.mode === "categories") {
    return (
      <CategoriesForm
        eventId={eventId}
        categories={categories}
        onBack={() => setEdit({ mode: "list" })}
        onChanged={async () => { await refresh() }}
      />
    )
  }

  const q = search.trim().toLowerCase()
  const visible = q
    ? exhibitors.filter((e) => e.name.toLowerCase().includes(q) || (e.category ?? "").toLowerCase().includes(q))
    : exhibitors

  return (
    <SecondaryPanel
      title="Exhibitors"
      onClose={onClose}
      searchPlaceholder="Search exhibitors…"
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="px-2 pt-2 flex gap-2">
        <button type="button" onClick={() => setEdit({ mode: "create" })} className="z-btn-primary flex-1">
          <Plus size={14} strokeWidth={1.5} />
          Add exhibitor
        </button>
        <button type="button" onClick={() => setEdit({ mode: "categories" })} className="z-btn" title="Manage categories">
          <Tag size={13} strokeWidth={1.5} />
        </button>
      </div>
      <div className="pt-2 pb-4">
        {loading ? (
          <div className="z-empty mt-8"><Loader2 size={18} className="animate-spin z-empty-icon" /><p className="z-empty-desc mt-2">Loading…</p></div>
        ) : visible.length === 0 ? (
          <div className="z-empty">
            <p className="z-empty-title">No exhibitors yet</p>
            <p className="z-empty-desc">Add an exhibitor — they&apos;ll appear in the Exhibitors blocks.</p>
          </div>
        ) : (
          visible.map((row) => (
            <div key={row.id} className={busyId === row.id ? "opacity-50 pointer-events-none" : ""}>
              <EntityListItem
                avatarSrc={row.logo_url}
                avatarFallback={row.name.slice(0, 1).toUpperCase()}
                name={row.name}
                meta={[row.category, row.booth ? `Booth ${row.booth}` : null].filter(Boolean).join(" · ") || null}
                onEdit={() => setEdit({ mode: "edit", row })}
                onDelete={() => handleDelete(row.id, row.name)}
              />
            </div>
          ))
        )}
      </div>
    </SecondaryPanel>
  )
}

function ExhibitorForm({
  eventId, categories, initial, onCancel, onSaved,
}: {
  eventId: string
  categories: ExhibitorCategory[]
  initial?: Exhibitor
  onCancel: () => void
  onSaved: () => Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logo, setLogo] = useState<string>(initial?.logo_url ?? "")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const res = await upsertExhibitor(eventId, {
      id: initial?.id,
      name: String(fd.get("name") ?? ""),
      logo_url: logo || null,
      category: String(fd.get("category") ?? "") || null,
      booth: String(fd.get("booth") ?? "") || null,
      description: String(fd.get("description") ?? "") || null,
      website: String(fd.get("website") ?? "") || null,
      sort_order: initial?.sort_order ?? 0,
    })
    setSubmitting(false)
    if (!res.success) {
      setError(res.error ?? "Save failed")
      return
    }
    await onSaved()
  }

  return (
    <aside className="w-72 shrink-0 h-full bg-[var(--z-bg-alt,#f7f8fa)] border-r border-[var(--z-border,#e5e7eb)] flex flex-col">
      <div className="shrink-0 h-12 px-4 flex items-center gap-2 border-b border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg,#fff)]">
        <button type="button" onClick={onCancel} aria-label="Back" className="z-btn z-btn-icon">
          <ArrowLeft size={14} strokeWidth={1.5} />
        </button>
        <h2 className="text-[13px] font-bold text-[var(--z-text,#1f2937)]">
          {initial ? "Edit exhibitor" : "Add exhibitor"}
        </h2>
      </div>
      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <ManagerField label="Name" name="name" defaultValue={initial?.name} required />
        <label className="block">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Category</span>
          <input list="lf-exh-cats" name="category" defaultValue={initial?.category ?? ""} className="z-input" />
          <datalist id="lf-exh-cats">
            {categories.map((c) => <option key={c.id} value={c.name} />)}
          </datalist>
        </label>
        <ManagerField label="Booth" name="booth" defaultValue={initial?.booth ?? ""} />
        <ManagerField label="Website" name="website" type="url" defaultValue={initial?.website ?? ""} placeholder="https://…" />
        <ManagerArea label="Description" name="description" defaultValue={initial?.description ?? ""} />
        <div>
          <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Logo</span>
          <ImageUploadCrop value={logo} onChange={(v) => setLogo(v ?? "")} aspectRatio={0} folder="sponsors" label="" />
        </div>
        {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
        <div className="pt-1 flex items-center gap-2">
          <button type="submit" disabled={submitting} className="z-btn-primary flex-1">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {initial ? "Save" : "Add"}
          </button>
          <button type="button" onClick={onCancel} className="z-btn">Cancel</button>
        </div>
      </form>
    </aside>
  )
}

function CategoriesForm({
  eventId, categories, onBack, onChanged,
}: {
  eventId: string
  categories: ExhibitorCategory[]
  onBack: () => void
  onChanged: () => Promise<void>
}) {
  const [name, setName] = useState("")
  const [color, setColor] = useState("#e7ab1c")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function add() {
    if (!name.trim()) return
    setBusy(true); setError(null)
    const res = await upsertExhibitorCategory(eventId, { name: name.trim(), color, sort_order: categories.length * 10 })
    setBusy(false)
    if (!res.success) { setError(res.error ?? "Failed"); return }
    setName("")
    await onChanged()
  }
  async function remove(id: string, label: string) {
    if (!window.confirm(`Delete category "${label}"?`)) return
    setBusy(true); setError(null)
    const res = await deleteExhibitorCategory(eventId, id)
    setBusy(false)
    if (!res.success) { setError(res.error ?? "Failed"); return }
    await onChanged()
  }

  return (
    <aside className="w-72 shrink-0 h-full bg-[var(--z-bg-alt,#f7f8fa)] border-r border-[var(--z-border,#e5e7eb)] flex flex-col">
      <div className="shrink-0 h-12 px-4 flex items-center gap-2 border-b border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg,#fff)]">
        <button type="button" onClick={onBack} aria-label="Back" className="z-btn z-btn-icon">
          <ArrowLeft size={14} strokeWidth={1.5} />
        </button>
        <h2 className="text-[13px] font-bold text-[var(--z-text,#1f2937)]">Exhibitor categories</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        <p className="text-[11px] text-[var(--z-text-muted,#6b7280)]">
          Categories show as section headings on the Exhibitors block when “Group by category” is on.
        </p>
        <div className="flex items-center gap-1.5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="z-input flex-1" />
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" title="Pill colour" />
          <button onClick={add} disabled={busy || !name.trim()} className="z-btn-primary !px-3">
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          </button>
        </div>
        <div className="space-y-1 pt-1">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white border border-[var(--z-border,#e5e7eb)]">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color ?? "#94a3b8" }} />
              <span className="flex-1 text-[12px] truncate">{c.name}</span>
              <button onClick={() => void remove(c.id, c.name)} aria-label="Delete" className="z-btn z-btn-icon !w-6 !h-6 hover:!text-red-600">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-[12px] text-[var(--z-text-muted,#6b7280)] italic">No categories yet.</p>}
        </div>
        {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
      </div>
    </aside>
  )
}

function ManagerField({
  label, name, defaultValue, type = "text", required, placeholder,
}: {
  label: string; name: string; defaultValue?: string;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">
        {label}{required && <span className="text-[var(--z-danger,#dc2626)]"> *</span>}
      </span>
      <input type={type} name={name} defaultValue={defaultValue} required={required} placeholder={placeholder} className="z-input" />
    </label>
  )
}
function ManagerArea({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={3} className="z-input z-textarea" />
    </label>
  )
}
