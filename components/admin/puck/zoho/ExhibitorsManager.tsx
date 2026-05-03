"use client"

/**
 * Exhibitors data manager — table view (ITEM 7.1).
 *
 * Columns: Logo | Name | Category | Booth | Website | Actions.
 * Default visible: Logo / Name / Category / Booth.
 * "Manage categories" link below the table opens a sub-modal driven
 * by event_exhibitor_categories.
 */

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Edit3, Trash2, Loader2, Tag, X, Plus } from "lucide-react"
import {
  listExhibitors, listExhibitorCategories,
  upsertExhibitor, deleteExhibitor,
  upsertExhibitorCategory, deleteExhibitorCategory,
  type Exhibitor, type ExhibitorCategory,
} from "@/app/actions/exhibitorActions"
import { ManagerTable, type ColumnDef } from "./ManagerTable"
import { ProfilePanel } from "./ProfilePanel"
import { ImageUploadCrop } from "@/components/admin/ImageUploadCrop"

export function ExhibitorsManager({
  eventId,
  onClose,
}: {
  eventId: string
  onClose?: () => void
}) {
  const router = useRouter()
  const [rows, setRows] = useState<Exhibitor[]>([])
  const [categories, setCategories] = useState<ExhibitorCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [selected, setSelected] = useState<Exhibitor | null>(null)
  const [catModalOpen, setCatModalOpen] = useState(false)

  async function refresh() {
    const [a, b] = await Promise.all([listExhibitors(eventId), listExhibitorCategories(eventId)])
    setRows(a.rows)
    setCategories(b.rows)
  }
  useEffect(() => {
    let cancelled = false
    void refresh().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  function openCreate() {
    setSelected({
      id: "", event_id: eventId, name: "", logo_url: null,
      category: null, booth: null, description: null, website: null,
      sort_order: rows.length * 10, created_at: new Date().toISOString(),
    })
    setMode("edit"); setOpen(true)
  }
  function openRow(item: Exhibitor) { setSelected(item); setMode("view"); setOpen(true) }

  async function onSave(next: Exhibitor) {
    const res = await upsertExhibitor(eventId, {
      id: next.id || undefined,
      name: next.name,
      logo_url: next.logo_url,
      category: next.category,
      booth: next.booth,
      description: next.description,
      website: next.website,
      sort_order: next.sort_order,
    })
    if (!res.success) return { success: false, error: res.error }
    await refresh()
    router.refresh()
    return { success: true }
  }
  async function onDelete() {
    if (!selected?.id) return
    await deleteExhibitor(eventId, selected.id)
    await refresh()
    router.refresh()
  }

  const columns = useMemo<ColumnDef<Exhibitor>[]>(() => [
    {
      key: "name", label: "Name", defaultVisible: true,
      sortValue: (e) => e.name,
      filter: (e, q) => e.name.toLowerCase().includes(q.toLowerCase()),
      render: (e) => <span className="font-semibold">{e.name}</span>,
    },
    {
      key: "category", label: "Category", defaultVisible: true,
      sortValue: (e) => e.category ?? "",
      filter: (e, q) => (e.category ?? "").toLowerCase().includes(q.toLowerCase()),
      render: (e) => e.category ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--z-bg-alt,#f7f8fa)] text-[var(--z-text,#1f2937)]">{e.category}</span>
      ) : <span className="text-[var(--z-text-muted,#6b7280)]">—</span>,
    },
    {
      key: "booth", label: "Booth", defaultVisible: true,
      sortValue: (e) => e.booth ?? "",
      filter: (e, q) => (e.booth ?? "").toLowerCase().includes(q.toLowerCase()),
      render: (e) => <span className="text-[var(--z-text-muted,#6b7280)]">{e.booth ?? "—"}</span>,
    },
    {
      key: "website", label: "Website", defaultVisible: false,
      sortValue: (e) => e.website ?? "",
      render: (e) => e.website ? (
        <a href={e.website} target="_blank" rel="noopener noreferrer" className="text-[var(--z-info,#3e7af7)] hover:underline truncate inline-block max-w-[180px]" onClick={(ev) => ev.stopPropagation()}>{e.website}</a>
      ) : <span className="text-[var(--z-text-muted,#6b7280)]">—</span>,
    },
  ], [])

  if (loading) {
    return (
      <div className="w-72 shrink-0 h-full bg-[var(--z-bg-alt,#f7f8fa)] border-r border-[var(--z-border,#e5e7eb)] flex items-center justify-center">
        <Loader2 size={16} className="animate-spin text-[var(--z-text-muted,#6b7280)]" />
      </div>
    )
  }

  return (
    <>
      <ManagerTable<Exhibitor>
        tableId="exhibitors"
        title="Exhibitors"
        onClose={onClose}
        items={rows}
        columns={columns}
        rowAvatar={(e) => ({ src: e.logo_url, fallback: (e.name || "?").slice(0, 1).toUpperCase() })}
        rowActions={(e) => [
          { icon: <Edit3 size={11} />, label: "Edit", onClick: () => { setSelected(e); setMode("edit"); setOpen(true) } },
          { icon: <Trash2 size={11} />, label: "Delete", danger: true, onClick: async () => {
            if (!confirm(`Delete "${e.name}"?`)) return
            await deleteExhibitor(eventId, e.id)
            await refresh()
            router.refresh()
          } },
        ]}
        onAdd={openCreate}
        onRowClick={openRow}
        addLabel="Add exhibitor"
      />
      <div className="px-3 py-2 border-t border-[var(--z-border,#e5e7eb)] bg-white text-[11px] text-[var(--z-text-muted,#6b7280)]">
        <button type="button" onClick={() => setCatModalOpen(true)} className="inline-flex items-center gap-1.5 hover:text-[var(--z-info,#3e7af7)]">
          <Tag size={11} /> Manage categories
        </button>
      </div>

      <ProfilePanel<Exhibitor>
        open={open}
        item={selected}
        title={selected?.name || "New exhibitor"}
        mode={mode}
        onClose={() => setOpen(false)}
        onModeChange={setMode}
        onSave={onSave}
        onDelete={selected?.id ? onDelete : undefined}
        viewBody={(e) => (
          <div className="space-y-3 text-[12px]">
            <div className="flex items-center gap-3">
              {e.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.logo_url} alt="" className="w-20 h-20 rounded-lg object-contain bg-white border border-[var(--z-border,#e5e7eb)]" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-[var(--z-bg-alt,#f7f8fa)] flex items-center justify-center text-[18px] font-bold">{(e.name || "?").slice(0, 1).toUpperCase()}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold truncate">{e.name}</p>
                {e.category && <p className="text-[11px] text-[var(--z-text-muted,#6b7280)] mt-0.5">{e.category}</p>}
                {e.booth && <p className="text-[11px] text-[var(--z-text-muted,#6b7280)] mt-0.5">Booth {e.booth}</p>}
              </div>
            </div>
            {e.description && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">About</p>
                <p className="whitespace-pre-wrap text-[12px] leading-relaxed">{e.description}</p>
              </div>
            )}
            {e.website && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Website</p>
                <a href={e.website} target="_blank" rel="noopener noreferrer" className="text-[var(--z-info,#3e7af7)] hover:underline">{e.website}</a>
              </div>
            )}
          </div>
        )}
        editForm={(e, onChange) => (
          <>
            <PField label="Name" required value={e.name} onChange={(v) => onChange({ ...e, name: v })} />
            <label className="block">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Category</span>
              <input list="lf-exh-cats" value={e.category ?? ""} onChange={(ev) => onChange({ ...e, category: ev.target.value })} className="z-input" />
              <datalist id="lf-exh-cats">
                {categories.map((c) => <option key={c.id} value={c.name} />)}
              </datalist>
            </label>
            <PField label="Booth" value={e.booth ?? ""} onChange={(v) => onChange({ ...e, booth: v })} />
            <PField label="Website" type="url" value={e.website ?? ""} onChange={(v) => onChange({ ...e, website: v })} placeholder="https://…" />
            <PArea label="About" value={e.description ?? ""} onChange={(v) => onChange({ ...e, description: v })} />
            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Logo</span>
              <ImageUploadCrop value={e.logo_url} onChange={(url) => onChange({ ...e, logo_url: url ?? null })} aspectRatio={0} folder="sponsors" label="" />
            </div>
          </>
        )}
      />

      {catModalOpen && (
        <CategoryModal
          eventId={eventId}
          categories={categories}
          onClose={() => setCatModalOpen(false)}
          onChanged={async () => { await refresh() }}
        />
      )}
    </>
  )
}

function CategoryModal({
  eventId, categories, onClose, onChanged,
}: {
  eventId: string
  categories: ExhibitorCategory[]
  onClose: () => void
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
    if (!confirm(`Delete category "${label}"?`)) return
    setBusy(true); setError(null)
    const res = await deleteExhibitorCategory(eventId, id)
    setBusy(false)
    if (!res.success) { setError(res.error ?? "Failed"); return }
    await onChanged()
  }

  return (
    <div className="fixed inset-0 z-[130] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 h-12 flex items-center border-b border-[var(--z-border,#e5e7eb)]">
          <h3 className="flex-1 text-[13px] font-bold">Manage categories</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="z-btn z-btn-icon"><X size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="z-input flex-1" />
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-[var(--z-border,#e5e7eb)]" />
            <button type="button" onClick={add} disabled={busy || !name.trim()} className="z-btn-primary !px-3"><Plus size={12} /></button>
          </div>
          <ul className="space-y-1">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white border border-[var(--z-border,#e5e7eb)]">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color ?? "#94a3b8" }} />
                <span className="flex-1 text-[12px]">{c.name}</span>
                <button onClick={() => remove(c.id, c.name)} aria-label="Delete" className="z-btn z-btn-icon !w-6 !h-6 hover:!text-red-600"><Trash2 size={11} /></button>
              </li>
            ))}
            {categories.length === 0 && <li className="text-[12px] text-[var(--z-text-muted,#6b7280)] italic">No categories yet.</li>}
          </ul>
          {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-2.5 py-1.5">{error}</p>}
        </div>
        <div className="px-4 py-3 border-t border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg-alt,#f7f8fa)] flex justify-end">
          <button type="button" onClick={onClose} className="z-btn">Done</button>
        </div>
      </div>
    </div>
  )
}

function PField({ label, value, onChange, required, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">
        {label}{required && <span className="text-[var(--z-danger,#dc2626)]"> *</span>}
      </span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className="z-input" />
    </label>
  )
}
function PArea({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="z-input z-textarea" />
    </label>
  )
}
