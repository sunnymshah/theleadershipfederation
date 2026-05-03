"use client"

/**
 * In-builder Sessions manager — table view (ITEM 4).
 *
 * Columns: Time | Title | Track | Hall | Speakers count | Featured |
 * Actions. Default visible: Time / Title / Track / Speakers count /
 * Featured. Profile panel View shows time / track / hall / desc /
 * speaker chips; Edit form supports speaker multi-select via
 * linkSpeakersToSession.
 */

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Edit3, Trash2, Loader2, X as XIcon } from "lucide-react"
import {
  createSession, updateSession, deleteSession,
  setSessionFeatured, listSessionsFull, type SessionRow,
  linkSpeakersToSession, listSpeakerLinksForEvent,
} from "@/app/actions/sessionActions"
import {
  listSpeakersFull, type SpeakerRow,
} from "@/app/actions/speakerActions"
import { ManagerTable, type ColumnDef } from "./ManagerTable"
import { ProfilePanel } from "./ProfilePanel"
import { FeatureSwitch } from "./FeatureSwitch"

type SessionWithSpeakers = SessionRow & { speakerIds: string[] }

function fmtTime(iso: string): string {
  if (!iso) return ""
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
}
function fmtDateTime(iso: string): string {
  if (!iso) return ""
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })
}

export function SessionsManager({
  eventId,
  onClose,
}: {
  eventId: string
  sessions?: unknown
  onClose?: () => void
}) {
  const router = useRouter()
  const [rows, setRows] = useState<SessionWithSpeakers[]>([])
  const [allSpeakers, setAllSpeakers] = useState<SpeakerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [selected, setSelected] = useState<SessionWithSpeakers | null>(null)

  async function refresh() {
    const [s, links, sp] = await Promise.all([
      listSessionsFull(eventId),
      listSpeakerLinksForEvent(eventId),
      listSpeakersFull(eventId),
    ])
    const map = links.map ?? {}
    const merged: SessionWithSpeakers[] = s.rows.map((r) => ({ ...r, speakerIds: map[r.id] ?? [] }))
    setRows(merged)
    setAllSpeakers(sp.rows)
  }

  useEffect(() => {
    let cancelled = false
    void refresh().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  function openCreate() {
    const now = new Date()
    const start = new Date(now.getTime() + 60 * 60_000).toISOString()
    const end   = new Date(now.getTime() + 2 * 60 * 60_000).toISOString()
    setSelected({
      id: "",
      event_id: eventId,
      title: "",
      description: "",
      start_time: start,
      end_time: end,
      track: "",
      session_type: "session",
      room: "",
      capacity: null,
      featured: false,
      sort_order: rows.length * 10,
      slug: null,
      created_at: new Date().toISOString(),
      speakerIds: [],
    })
    setMode("edit")
    setOpen(true)
  }
  function openRow(item: SessionWithSpeakers) {
    setSelected(item); setMode("view"); setOpen(true)
  }

  async function onSave(next: SessionWithSpeakers) {
    const fd = new FormData()
    fd.set("eventId", eventId)
    fd.set("title", next.title ?? "")
    fd.set("description", next.description ?? "")
    fd.set("startTime", next.start_time ?? "")
    fd.set("endTime", next.end_time ?? "")
    fd.set("track", next.track ?? "")
    fd.set("sessionType", next.session_type ?? "session")
    fd.set("room", next.room ?? "")
    fd.set("capacity", String(next.capacity ?? ""))
    fd.set("sortOrder", String(next.sort_order ?? 0))
    fd.set("featured", next.featured ? "true" : "false")
    let res: { success?: boolean; error?: string; session?: { id: string } }
    if (next.id) {
      res = await updateSession(next.id, fd) as { success?: boolean; error?: string }
    } else {
      res = await createSession(fd) as { success?: boolean; error?: string; session?: { id: string } }
    }
    if (res?.success === false) return { success: false, error: res?.error }
    const newId = next.id || res?.session?.id
    if (newId) {
      const linkRes = await linkSpeakersToSession(newId, next.speakerIds)
      if (!linkRes.success) return { success: false, error: linkRes.error }
    }
    await refresh()
    router.refresh()
    return { success: true }
  }
  async function onDelete() {
    if (!selected?.id) return
    await deleteSession(selected.id)
    await refresh()
    router.refresh()
  }
  async function onToggleFeatured(row: SessionWithSpeakers, next: boolean) {
    const res = await setSessionFeatured(row.id, next)
    if (res.success) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, featured: next } : r)))
    }
    return res
  }

  const columns = useMemo<ColumnDef<SessionWithSpeakers>[]>(() => [
    {
      key: "time",
      label: "Time",
      defaultVisible: true,
      sortValue: (s) => new Date(s.start_time).getTime(),
      render: (s) => (
        <span className="font-mono text-[11px] tabular-nums">
          {fmtDateTime(s.start_time)}
          {s.end_time ? <span className="text-[var(--z-text-muted,#6b7280)]"> – {fmtTime(s.end_time)}</span> : null}
        </span>
      ),
    },
    {
      key: "title",
      label: "Title",
      defaultVisible: true,
      sortValue: (s) => s.title,
      filter: (s, q) => s.title.toLowerCase().includes(q.toLowerCase()),
      render: (s) => <span className="font-semibold">{s.title}</span>,
    },
    {
      key: "track",
      label: "Track",
      defaultVisible: true,
      sortValue: (s) => s.track ?? "",
      filter: (s, q) => (s.track ?? "").toLowerCase().includes(q.toLowerCase()),
      render: (s) => s.track ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--z-info,#3e7af7)]/10 text-[var(--z-info,#3e7af7)]">{s.track}</span>
      ) : <span className="text-[var(--z-text-muted,#6b7280)]">—</span>,
    },
    {
      key: "room",
      label: "Hall",
      defaultVisible: false,
      sortValue: (s) => s.room ?? "",
      filter: (s, q) => (s.room ?? "").toLowerCase().includes(q.toLowerCase()),
      render: (s) => <span className="text-[var(--z-text-muted,#6b7280)]">{s.room ?? "—"}</span>,
    },
    {
      key: "speakers",
      label: "Speakers",
      defaultVisible: true,
      sortValue: (s) => s.speakerIds.length,
      render: (s) => <span className="text-[var(--z-text-muted,#6b7280)]">{s.speakerIds.length}</span>,
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

  const speakerById = new Map(allSpeakers.map((s) => [s.id, s]))

  return (
    <>
      <ManagerTable<SessionWithSpeakers>
        tableId="sessions"
        title="Sessions"
        onClose={onClose}
        items={rows}
        columns={columns}
        rowActions={(s) => [
          { icon: <Edit3 size={11} />, label: "Edit", onClick: () => { setSelected(s); setMode("edit"); setOpen(true) } },
          { icon: <Trash2 size={11} />, label: "Delete", danger: true, onClick: async () => {
            if (!confirm(`Delete session "${s.title}"?`)) return
            await deleteSession(s.id)
            await refresh()
            router.refresh()
          } },
        ]}
        onAdd={openCreate}
        onRowClick={openRow}
        addLabel="Add session"
      />
      <ProfilePanel<SessionWithSpeakers>
        open={open}
        item={selected}
        title={selected?.title || "New session"}
        mode={mode}
        onClose={() => setOpen(false)}
        onModeChange={setMode}
        onSave={onSave}
        onDelete={selected?.id ? onDelete : undefined}
        viewBody={(s) => (
          <div className="space-y-3 text-[12px] text-[var(--z-text,#1f2937)]">
            <div>
              <p className="text-[15px] font-bold">{s.title}</p>
              <p className="font-mono text-[11px] text-[var(--z-text-muted,#6b7280)] tabular-nums mt-1">
                {fmtDateTime(s.start_time)} – {fmtTime(s.end_time)}
              </p>
              {(s.track || s.room) && (
                <p className="text-[11px] text-[var(--z-text-muted,#6b7280)] mt-0.5">
                  {[s.track, s.room].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            {s.description && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Description</p>
                <p className="whitespace-pre-wrap text-[12px] leading-relaxed">{s.description}</p>
              </div>
            )}
            {s.speakerIds.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Speakers</p>
                <ul className="flex flex-wrap gap-1.5">
                  {s.speakerIds.map((id) => {
                    const sp = speakerById.get(id)
                    if (!sp) return null
                    return (
                      <li key={id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--z-bg-alt,#f7f8fa)] border border-[var(--z-border,#e5e7eb)] text-[11px]">
                        {sp.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sp.image_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                        ) : null}
                        {sp.name}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
        editForm={(s, onChange) => (
          <>
            <PField label="Title" required value={s.title} onChange={(v) => onChange({ ...s, title: v })} />
            <div className="grid grid-cols-2 gap-2">
              <PField label="Start" type="datetime-local" value={toLocalInput(s.start_time)} onChange={(v) => onChange({ ...s, start_time: fromLocalInput(v) })} required />
              <PField label="End"   type="datetime-local" value={toLocalInput(s.end_time)}   onChange={(v) => onChange({ ...s, end_time: fromLocalInput(v) })} required />
            </div>
            <PField label="Track" value={s.track ?? ""} onChange={(v) => onChange({ ...s, track: v })} placeholder="Main Stage" />
            <PField label="Hall / Room" value={s.room ?? ""} onChange={(v) => onChange({ ...s, room: v })} />
            <PArea label="Description" value={s.description ?? ""} onChange={(v) => onChange({ ...s, description: v })} />
            <SpeakerChipPicker
              all={allSpeakers}
              selectedIds={s.speakerIds}
              onChange={(ids) => onChange({ ...s, speakerIds: ids })}
            />
            <label className="flex items-center gap-2 text-[12px]">
              <input type="checkbox" checked={s.featured} onChange={(e) => onChange({ ...s, featured: e.target.checked })} />
              <span>Feature this session</span>
            </label>
          </>
        )}
      />
    </>
  )
}

/* ── Speaker multi-select chip picker ─────────────────────────── */
function SpeakerChipPicker({
  all, selectedIds, onChange,
}: {
  all: SpeakerRow[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [picker, setPicker] = useState(false)
  const selected = all.filter((s) => selectedIds.includes(s.id))
  const available = all.filter((s) => !selectedIds.includes(s.id))
  return (
    <div>
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Speakers</span>
      <div className="flex flex-wrap gap-1.5">
        {selected.map((sp) => (
          <span key={sp.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--z-info,#3e7af7)]/10 text-[var(--z-info,#3e7af7)] text-[11px]">
            {sp.name}
            <button type="button" onClick={() => onChange(selectedIds.filter((id) => id !== sp.id))} aria-label={`Remove ${sp.name}`}>
              <XIcon size={10} />
            </button>
          </span>
        ))}
        {!picker && (
          <button type="button" onClick={() => setPicker(true)} className="inline-flex items-center px-2 py-1 rounded-full border border-dashed border-[var(--z-border-strong,#d1d5db)] text-[11px] text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-info,#3e7af7)] hover:border-[var(--z-info,#3e7af7)]">
            + Add speaker
          </button>
        )}
      </div>
      {picker && (
        <div className="mt-2 rounded-md border border-[var(--z-border,#e5e7eb)] bg-white max-h-40 overflow-y-auto">
          {available.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-[var(--z-text-muted,#6b7280)] italic">All speakers added.</p>
          ) : (
            available.map((sp) => (
              <button key={sp.id} type="button" onClick={() => { onChange([...selectedIds, sp.id]); setPicker(false) }} className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-[var(--z-bg-alt,#f7f8fa)]">
                {sp.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sp.image_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-[var(--z-bg-alt,#f7f8fa)] inline-flex items-center justify-center text-[9px] font-bold">{sp.name.slice(0, 1)}</span>
                )}
                {sp.name}
              </button>
            ))
          )}
          <div className="border-t border-[var(--z-border,#e5e7eb)] flex justify-end px-2 py-1">
            <button type="button" onClick={() => setPicker(false)} className="z-btn !text-[11px]">Done</button>
          </div>
        </div>
      )}
    </div>
  )
}

function toLocalInput(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function fromLocalInput(v: string): string {
  if (!v) return ""
  const d = new Date(v)
  return d.toISOString()
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
