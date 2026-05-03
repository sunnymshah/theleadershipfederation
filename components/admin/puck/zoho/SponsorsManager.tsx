"use client"

/**
 * In-builder Sponsors manager — table view (ITEM 6).
 *
 * Columns: Logo | Name | Tier | Website | Featured | Actions.
 * Default visible: Logo / Name / Tier / Featured.
 *
 * "Manage tiers" button below the table opens TierManagerModal —
 * sub-modal listing tiers with reorder + add custom + per-tier color.
 * Profile panel View/Edit pattern matches Speakers.
 */

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Edit3, Trash2, Loader2, Tag, X, Plus } from "lucide-react"
import {
  createSponsor, updateSponsor, deleteSponsor,
  listSponsorsFull, setSponsorFeatured, type SponsorRow,
  listSponsorTiers, upsertSponsorTier, deleteSponsorTier,
  reorderSponsorTiers, type SponsorTier,
} from "@/app/actions/sponsorActions"
import { ManagerTable, type ColumnDef } from "./ManagerTable"
import { ProfilePanel } from "./ProfilePanel"
import { FeatureSwitch } from "./FeatureSwitch"
import { ImageUploadCrop } from "@/components/admin/ImageUploadCrop"

const FALLBACK_TIERS = ["title", "platinum", "gold", "silver", "bronze", "partner"] as const
function tierLabel(t: string | null) {
  if (!t) return "—"
  return t.charAt(0).toUpperCase() + t.slice(1)
}
function tierClass(t: string | null) {
  switch (t) {
    case "title":    return "bg-purple-100 text-purple-700"
    case "platinum": return "bg-slate-200 text-slate-800"
    case "gold":     return "bg-amber-100 text-amber-700"
    case "silver":   return "bg-gray-200 text-gray-700"
    case "bronze":   return "bg-orange-100 text-orange-700"
    case "partner":  return "bg-blue-100 text-blue-700"
    default:         return "bg-[var(--z-bg-alt,#f7f8fa)] text-[var(--z-text,#1f2937)]"
  }
}

export function SponsorsManager({
  eventId,
  onClose,
}: {
  eventId: string
  sponsors?: unknown
  onClose?: () => void
}) {
  const router = useRouter()
  const [rows, setRows] = useState<SponsorRow[]>([])
  const [tiers, setTiers] = useState<SponsorTier[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [selected, setSelected] = useState<SponsorRow | null>(null)
  const [tierModalOpen, setTierModalOpen] = useState(false)

  async function refresh() {
    const [s, t] = await Promise.all([listSponsorsFull(eventId), listSponsorTiers(eventId)])
    setRows(s.rows)
    setTiers(t.rows)
  }

  useEffect(() => {
    let cancelled = false
    void refresh().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  function openCreate() {
    setSelected({
      id: "", event_id: eventId, name: "", tier: "gold",
      logo_url: null, website: null, description: null,
      featured: false, sort_order: rows.length * 10,
      created_at: new Date().toISOString(),
    })
    setMode("edit"); setOpen(true)
  }
  function openRow(item: SponsorRow) {
    setSelected(item); setMode("view"); setOpen(true)
  }

  async function onSave(next: SponsorRow) {
    const fd = new FormData()
    fd.set("eventId", eventId)
    fd.set("name", next.name ?? "")
    fd.set("tier", next.tier ?? "gold")
    fd.set("logoUrl", next.logo_url ?? "")
    fd.set("website", next.website ?? "")
    fd.set("description", next.description ?? "")
    fd.set("sortOrder", String(next.sort_order ?? 0))
    fd.set("featured", next.featured ? "true" : "false")
    const res = next.id ? await updateSponsor(next.id, fd) : await createSponsor(fd)
    if ((res as { success?: boolean }).success === false) {
      return { success: false, error: (res as { error?: string }).error }
    }
    await refresh()
    router.refresh()
    return { success: true }
  }
  async function onDelete() {
    if (!selected?.id) return
    await deleteSponsor(selected.id)
    await refresh()
    router.refresh()
  }
  async function onToggleFeatured(row: SponsorRow, next: boolean) {
    const res = await setSponsorFeatured(row.id, next)
    if (res.success) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, featured: next } : r)))
    }
    return res
  }

  // Tier choices: prefer DB tiers, fall back to canonical six.
  const tierChoices = tiers.length > 0
    ? tiers.map((t) => t.name)
    : (FALLBACK_TIERS as readonly string[])

  const columns = useMemo<ColumnDef<SponsorRow>[]>(() => [
    {
      key: "name", label: "Name", defaultVisible: true,
      sortValue: (s) => s.name,
      filter: (s, q) => s.name.toLowerCase().includes(q.toLowerCase()),
      render: (s) => <span className="font-semibold">{s.name}</span>,
    },
    {
      key: "tier", label: "Tier", defaultVisible: true,
      sortValue: (s) => s.tier ?? "",
      filter: (s, q) => (s.tier ?? "").toLowerCase().includes(q.toLowerCase()),
      render: (s) => <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${tierClass(s.tier)}`}>{tierLabel(s.tier)}</span>,
    },
    {
      key: "website", label: "Website", defaultVisible: false,
      sortValue: (s) => s.website ?? "",
      render: (s) => s.website ? (
        <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-[var(--z-info,#3e7af7)] hover:underline truncate inline-block max-w-[180px]" onClick={(e) => e.stopPropagation()}>{s.website}</a>
      ) : <span className="text-[var(--z-text-muted,#6b7280)]">—</span>,
    },
    {
      key: "featured", label: "Featured", defaultVisible: true,
      sortValue: (s) => (s.featured ? 1 : 0),
      render: (s) => <FeatureSwitch value={s.featured} onChange={(v) => onToggleFeatured(s, v)} />,
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
      <ManagerTable<SponsorRow>
        tableId="sponsors"
        title="Sponsors"
        onClose={onClose}
        items={rows}
        columns={columns}
        rowAvatar={(s) => ({
          src: s.logo_url,
          fallback: (s.name || "?").slice(0, 1).toUpperCase(),
        })}
        rowActions={(s) => [
          { icon: <Edit3 size={11} />, label: "Edit", onClick: () => { setSelected(s); setMode("edit"); setOpen(true) } },
          { icon: <Trash2 size={11} />, label: "Delete", danger: true, onClick: async () => {
            if (!confirm(`Delete sponsor "${s.name}"?`)) return
            await deleteSponsor(s.id)
            await refresh()
            router.refresh()
          } },
        ]}
        onAdd={openCreate}
        onRowClick={openRow}
        addLabel="Add sponsor"
      />
      {/* Manage Tiers — sits below the table inside the SecondaryPanel. */}
      <div className="px-3 py-2 border-t border-[var(--z-border,#e5e7eb)] bg-white text-[11px] text-[var(--z-text-muted,#6b7280)]">
        <button
          type="button"
          onClick={() => setTierModalOpen(true)}
          className="inline-flex items-center gap-1.5 hover:text-[var(--z-info,#3e7af7)]"
        >
          <Tag size={11} /> Manage tiers
        </button>
      </div>

      <ProfilePanel<SponsorRow>
        open={open}
        item={selected}
        title={selected?.name || "New sponsor"}
        mode={mode}
        onClose={() => setOpen(false)}
        onModeChange={setMode}
        onSave={onSave}
        onDelete={selected?.id ? onDelete : undefined}
        viewBody={(s) => (
          <div className="space-y-3 text-[12px]">
            <div className="flex items-center gap-3">
              {s.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logo_url} alt="" className="w-20 h-20 rounded-lg object-contain bg-white border border-[var(--z-border,#e5e7eb)]" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-[var(--z-bg-alt,#f7f8fa)] flex items-center justify-center text-[18px] font-bold">{(s.name || "?").slice(0, 1).toUpperCase()}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold truncate">{s.name}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1 ${tierClass(s.tier)}`}>{tierLabel(s.tier)}</span>
              </div>
            </div>
            {s.description && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">About</p>
                <p className="whitespace-pre-wrap text-[12px] leading-relaxed">{s.description}</p>
              </div>
            )}
            {s.website && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Website</p>
                <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-[var(--z-info,#3e7af7)] hover:underline">{s.website}</a>
              </div>
            )}
          </div>
        )}
        editForm={(s, onChange) => (
          <>
            <PField label="Name" required value={s.name} onChange={(v) => onChange({ ...s, name: v })} />
            <label className="block">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Tier</span>
              <select value={s.tier ?? "gold"} onChange={(e) => onChange({ ...s, tier: e.target.value })} className="z-input">
                {tierChoices.map((t) => <option key={t} value={t}>{tierLabel(t)}</option>)}
              </select>
            </label>
            <PField label="Website" type="url" value={s.website ?? ""} onChange={(v) => onChange({ ...s, website: v })} placeholder="https://…" />
            <PArea label="About" value={s.description ?? ""} onChange={(v) => onChange({ ...s, description: v })} />
            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Logo</span>
              <ImageUploadCrop value={s.logo_url} onChange={(url) => onChange({ ...s, logo_url: url ?? null })} aspectRatio={0} folder="sponsors" label="" />
            </div>
            <label className="flex items-center gap-2 text-[12px]">
              <input type="checkbox" checked={s.featured} onChange={(e) => onChange({ ...s, featured: e.target.checked })} />
              <span>Feature this sponsor</span>
            </label>
          </>
        )}
      />

      {tierModalOpen && (
        <TierManagerModal
          eventId={eventId}
          tiers={tiers}
          onClose={() => setTierModalOpen(false)}
          onChanged={async () => { await refresh() }}
        />
      )}
    </>
  )
}

/* ── Tier sub-modal ───────────────────────────────────────────── */
function TierManagerModal({
  eventId, tiers, onClose, onChanged,
}: {
  eventId: string
  tiers: SponsorTier[]
  onClose: () => void
  onChanged: () => Promise<void>
}) {
  const [list, setList] = useState<SponsorTier[]>(tiers)
  const [name, setName] = useState("")
  const [color, setColor] = useState("#e7ab1c")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function add() {
    if (!name.trim()) return
    setBusy(true); setError(null)
    const res = await upsertSponsorTier(eventId, { name: name.trim(), color, sort_order: list.length * 10 })
    setBusy(false)
    if (!res.success) { setError(res.error ?? "Failed"); return }
    setName("")
    if (res.row) setList([...list, res.row])
    await onChanged()
  }
  async function remove(id: string, label: string) {
    if (!confirm(`Delete tier "${label}"?`)) return
    setBusy(true); setError(null)
    const res = await deleteSponsorTier(eventId, id)
    setBusy(false)
    if (!res.success) { setError(res.error ?? "Failed"); return }
    setList(list.filter((t) => t.id !== id))
    await onChanged()
  }
  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir
    if (j < 0 || j >= list.length) return
    const next = [...list]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setList(next)
    void reorderSponsorTiers(eventId, next.map((t) => t.id)).then(() => onChanged())
  }

  return (
    <div className="fixed inset-0 z-[130] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 h-12 flex items-center border-b border-[var(--z-border,#e5e7eb)]">
          <h3 className="flex-1 text-[13px] font-bold">Manage tiers</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="z-btn z-btn-icon"><X size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          <p className="text-[11px] text-[var(--z-text-muted,#6b7280)]">Tiers are shown as section headings on the public Sponsors block. Reorder to control display order.</p>
          <div className="flex items-center gap-1.5">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tier name" className="z-input flex-1" />
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-[var(--z-border,#e5e7eb)]" />
            <button type="button" onClick={add} disabled={busy || !name.trim()} className="z-btn-primary !px-3"><Plus size={12} /></button>
          </div>
          <ul className="space-y-1">
            {list.map((t, idx) => (
              <li key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white border border-[var(--z-border,#e5e7eb)]">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color ?? "#94a3b8" }} />
                <span className="flex-1 text-[12px]">{t.name}</span>
                <button onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Up" className="z-btn z-btn-icon !w-6 !h-6 disabled:opacity-30">↑</button>
                <button onClick={() => move(idx, 1)} disabled={idx === list.length - 1} aria-label="Down" className="z-btn z-btn-icon !w-6 !h-6 disabled:opacity-30">↓</button>
                <button onClick={() => remove(t.id, t.name)} aria-label="Delete" className="z-btn z-btn-icon !w-6 !h-6 hover:!text-red-600"><Trash2 size={11} /></button>
              </li>
            ))}
            {list.length === 0 && <li className="text-[12px] text-[var(--z-text-muted,#6b7280)] italic">No custom tiers — defaults shown in the dropdown.</li>}
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
