"use client"

/**
 * In-builder Speakers manager — table view (ITEM 3).
 *
 * Replaces the EntityListItem list with a Zoho-parity ManagerTable
 * (search + filter + sort + columns toolbar) backed by a
 * ProfilePanel slide-in for view/edit. Featured toggle in the row
 * saves immediately via setSpeakerFeatured. Profile panel View shows
 * avatar / name / role / country / bio; Edit shows the full form
 * including the featured checkbox.
 */

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Edit3, Trash2, Loader2 } from "lucide-react"
import {
  createSpeaker, updateSpeaker, deleteSpeaker,
  setSpeakerFeatured, listSpeakersFull, type SpeakerRow,
} from "@/app/actions/speakerActions"
import { ManagerTable, type ColumnDef } from "./ManagerTable"
import { ProfilePanel } from "./ProfilePanel"
import { FeatureSwitch } from "./FeatureSwitch"
import { ImageUploadCrop } from "@/components/admin/ImageUploadCrop"

export function SpeakersManager({
  eventId,
  onClose,
}: {
  eventId: string
  /** Legacy `speakers` prop from puck.metadata is unused — the table
   *  fetches every column directly via listSpeakersFull. */
  speakers?: unknown
  onClose?: () => void
}) {
  const router = useRouter()
  const [rows, setRows] = useState<SpeakerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [selected, setSelected] = useState<SpeakerRow | null>(null)

  async function refresh() {
    const r = await listSpeakersFull(eventId)
    setRows(r.rows)
  }

  useEffect(() => {
    let cancelled = false
    void refresh().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  function openCreate() {
    setSelected({
      id: "",
      event_id: eventId,
      name: "",
      designation: "",
      company: "",
      country: "",
      bio: "",
      image_url: null,
      slug: null,
      featured: false,
      sort_order: rows.length * 10,
      linkedin_url: null,
      twitter_url: null,
      email: null,
      created_at: new Date().toISOString(),
    })
    setMode("edit")
    setOpen(true)
  }
  function openRow(item: SpeakerRow) {
    setSelected(item)
    setMode("view")
    setOpen(true)
  }

  async function onSave(next: SpeakerRow) {
    const fd = new FormData()
    fd.set("eventId", eventId)
    fd.set("name", next.name ?? "")
    fd.set("designation", next.designation ?? "")
    fd.set("company", next.company ?? "")
    fd.set("country", next.country ?? "")
    fd.set("bio", next.bio ?? "")
    fd.set("imageUrl", next.image_url ?? "")
    fd.set("sortOrder", String(next.sort_order ?? 0))
    fd.set("featured", next.featured ? "true" : "false")
    const res = next.id
      ? await updateSpeaker(next.id, fd)
      : await createSpeaker(fd)
    if ((res as { success?: boolean }).success === false) {
      return { success: false, error: (res as { error?: string }).error }
    }
    await refresh()
    router.refresh()
    return { success: true }
  }

  async function onDelete() {
    if (!selected?.id) return
    const res = await deleteSpeaker(selected.id)
    if ((res as { success?: boolean }).success === false) return
    await refresh()
    router.refresh()
  }

  async function onToggleFeatured(row: SpeakerRow, next: boolean) {
    const res = await setSpeakerFeatured(row.id, next)
    if (res.success) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, featured: next } : r)))
    }
    return res
  }

  const columns = useMemo<ColumnDef<SpeakerRow>[]>(() => [
    {
      key: "name",
      label: "Name",
      defaultVisible: true,
      sortValue: (s) => s.name,
      filter: (s, q) => s.name.toLowerCase().includes(q.toLowerCase()),
      render: (s) => <span className="font-semibold">{s.name}</span>,
    },
    {
      key: "designation",
      label: "Designation",
      defaultVisible: true,
      sortValue: (s) => s.designation ?? "",
      filter: (s, q) => (s.designation ?? "").toLowerCase().includes(q.toLowerCase()),
      render: (s) => <span className="text-[var(--z-text-muted,#6b7280)]">{s.designation ?? "—"}</span>,
    },
    {
      key: "company",
      label: "Company",
      defaultVisible: true,
      sortValue: (s) => s.company ?? "",
      filter: (s, q) => (s.company ?? "").toLowerCase().includes(q.toLowerCase()),
      render: (s) => <span className="text-[var(--z-text-muted,#6b7280)]">{s.company ?? "—"}</span>,
    },
    {
      key: "country",
      label: "Country",
      defaultVisible: false,
      sortValue: (s) => s.country ?? "",
      filter: (s, q) => (s.country ?? "").toLowerCase().includes(q.toLowerCase()),
      render: (s) => <span className="text-[var(--z-text-muted,#6b7280)]">{s.country ?? "—"}</span>,
    },
    {
      key: "featured",
      label: "Featured",
      defaultVisible: true,
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
      <ManagerTable<SpeakerRow>
        tableId="speakers"
        title="Speakers"
        onClose={onClose}
        items={rows}
        columns={columns}
        rowAvatar={(s) => ({
          src: s.image_url,
          fallback: (s.name || "?").slice(0, 1).toUpperCase(),
        })}
        rowActions={(s) => [
          { icon: <Edit3 size={11} />, label: "Edit", onClick: () => { setSelected(s); setMode("edit"); setOpen(true) } },
          { icon: <Trash2 size={11} />, label: "Delete", danger: true, onClick: async () => {
            if (!confirm(`Delete speaker "${s.name}"?`)) return
            await deleteSpeaker(s.id)
            await refresh()
            router.refresh()
          } },
        ]}
        onAdd={openCreate}
        onRowClick={openRow}
        addLabel="Add speaker"
      />
      <ProfilePanel<SpeakerRow>
        open={open}
        item={selected}
        title={selected?.name || "New speaker"}
        mode={mode}
        onClose={() => setOpen(false)}
        onModeChange={setMode}
        onSave={onSave}
        onDelete={selected?.id ? onDelete : undefined}
        viewBody={(s) => (
          <div className="space-y-3 text-[12px] text-[var(--z-text,#1f2937)]">
            <div className="flex items-center gap-3">
              {s.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image_url} alt="" className="w-16 h-16 rounded-full object-cover bg-[var(--z-bg-alt,#f7f8fa)]" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[var(--z-bg-alt,#f7f8fa)] flex items-center justify-center text-[18px] font-bold text-[var(--z-text-muted,#6b7280)]">
                  {(s.name || "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold truncate">{s.name}</p>
                <p className="text-[12px] text-[var(--z-text-muted,#6b7280)] truncate">
                  {[s.designation, s.company].filter(Boolean).join(" · ")}
                </p>
                {s.country && <p className="text-[11px] text-[var(--z-text-muted,#6b7280)] mt-0.5">{s.country}</p>}
              </div>
            </div>
            {s.bio && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Bio</p>
                <p className="whitespace-pre-wrap text-[12px] leading-relaxed">{s.bio}</p>
              </div>
            )}
            {(s.linkedin_url || s.twitter_url || s.email) && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Contact</p>
                <ul className="space-y-1 text-[12px]">
                  {s.linkedin_url && <li><a href={s.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[var(--z-info,#3e7af7)] hover:underline">{s.linkedin_url}</a></li>}
                  {s.twitter_url && <li><a href={s.twitter_url} target="_blank" rel="noopener noreferrer" className="text-[var(--z-info,#3e7af7)] hover:underline">{s.twitter_url}</a></li>}
                  {s.email && <li><a href={`mailto:${s.email}`} className="text-[var(--z-info,#3e7af7)] hover:underline">{s.email}</a></li>}
                </ul>
              </div>
            )}
          </div>
        )}
        editForm={(s, onChange) => (
          <>
            <PField label="Name" required value={s.name} onChange={(v) => onChange({ ...s, name: v })} />
            <PField label="Designation" value={s.designation ?? ""} onChange={(v) => onChange({ ...s, designation: v })} />
            <PField label="Company" value={s.company ?? ""} onChange={(v) => onChange({ ...s, company: v })} />
            <PField label="Country" value={s.country ?? ""} onChange={(v) => onChange({ ...s, country: v })} placeholder="India" />
            <PArea label="Bio" value={s.bio ?? ""} onChange={(v) => onChange({ ...s, bio: v })} />
            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Photo</span>
              <ImageUploadCrop
                value={s.image_url}
                onChange={(url) => onChange({ ...s, image_url: url ?? null })}
                aspectRatio={1}
                folder="speakers"
                label=""
              />
            </div>
            <label className="flex items-center gap-2 text-[12px]">
              <input
                type="checkbox"
                checked={s.featured}
                onChange={(e) => onChange({ ...s, featured: e.target.checked })}
              />
              <span>Feature this speaker</span>
            </label>
          </>
        )}
      />
    </>
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
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="z-input"
      />
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
