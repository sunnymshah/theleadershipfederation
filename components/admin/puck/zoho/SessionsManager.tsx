"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, ArrowLeft } from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import { EntityListItem } from "./EntityListItem"
import {
  createSession, updateSession, deleteSession,
} from "@/app/actions/sessionActions"
import type { SessionShape } from "../blocks"

type EditState =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; session: SessionShape }

export function SessionsManager({
  eventId,
  sessions,
  onClose,
}: {
  eventId: string
  sessions: SessionShape[]
  onClose?: () => void
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [edit, setEdit] = useState<EditState>({ mode: "list" })
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter((s) =>
      s.title.toLowerCase().includes(q) || (s.track ?? "").toLowerCase().includes(q),
    )
  }, [sessions, search])

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete session "${title}"?`)) return
    setBusyId(id)
    try {
      await deleteSession(id)
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  if (edit.mode !== "list") {
    return (
      <SessionForm
        eventId={eventId}
        initial={edit.mode === "edit" ? edit.session : undefined}
        onCancel={() => setEdit({ mode: "list" })}
        onSaved={() => { setEdit({ mode: "list" }); router.refresh() }}
      />
    )
  }

  return (
    <SecondaryPanel
      title="Sessions"
      onClose={onClose}
      searchPlaceholder="Search sessions…"
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="px-2 pt-2">
        <button
          type="button"
          onClick={() => setEdit({ mode: "create" })}
          className="z-btn-primary w-[calc(100%-1rem)] mx-2"
        >
          <Plus size={14} strokeWidth={1.5} />
          Add session
        </button>
      </div>
      <div className="pt-2 pb-4">
        {filtered.length === 0 ? (
          <div className="z-empty">
            <p className="z-empty-title">
              {sessions.length === 0 ? "No sessions yet" : "No matches"}
            </p>
            <p className="z-empty-desc">
              {sessions.length === 0
                ? "Add sessions to populate the Agenda block."
                : "Try a different keyword."}
            </p>
          </div>
        ) : (
          filtered.map((s) => (
            <div key={s.id} className={busyId === s.id ? "opacity-50 pointer-events-none" : ""}>
              <EntityListItem
                avatarFallback={(s.title?.slice(0, 1) ?? "S").toUpperCase()}
                name={s.title}
                meta={[
                  s.starts_at ? new Date(s.starts_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : null,
                  s.track,
                ].filter(Boolean).join(" · ") || null}
                onEdit={() => setEdit({ mode: "edit", session: s })}
                onDelete={() => handleDelete(s.id, s.title)}
              />
            </div>
          ))
        )}
      </div>
    </SecondaryPanel>
  )
}

function SessionForm({
  eventId, initial, onCancel, onSaved,
}: {
  eventId: string
  initial?: SessionShape
  onCancel: () => void
  onSaved: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set("eventId", eventId)
    try {
      const res = initial
        ? await updateSession(initial.id, fd)
        : await createSession(fd)
      if ((res as { success?: boolean })?.success === false) {
        setError((res as { error?: string }).error ?? "Save failed")
      } else onSaved()
    } catch (err) {
      setError((err as Error).message ?? "Save failed")
    } finally { setSubmitting(false) }
  }

  return (
    <aside className="w-72 shrink-0 h-full bg-[var(--z-bg-alt,#f7f8fa)] border-r border-[var(--z-border,#e5e7eb)] flex flex-col">
      <div className="shrink-0 h-12 px-4 flex items-center gap-2 border-b border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg,#fff)]">
        <button type="button" onClick={onCancel} aria-label="Back" className="z-btn z-btn-icon">
          <ArrowLeft size={14} strokeWidth={1.5} />
        </button>
        <h2 className="text-[13px] font-bold text-[var(--z-text,#1f2937)]">
          {initial ? "Edit session" : "Add session"}
        </h2>
      </div>
      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <FieldRow>
          <Field label="Title" name="title" defaultValue={initial?.title} required />
        </FieldRow>
        <FieldRow>
          <Field label="Start" name="startTime" type="datetime-local" defaultValue={toLocal(initial?.starts_at)} required />
          <Field label="End"   name="endTime"   type="datetime-local" defaultValue={toLocal(initial?.ends_at ?? null)} />
        </FieldRow>
        <FieldRow>
          <Field label="Track" name="track" defaultValue={initial?.track ?? ""} />
          <Field label="Hall"  name="hall"  defaultValue="" />
        </FieldRow>
        <FieldArea label="Description" name="description" />
        {error && (
          <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
        <div className="pt-1 flex items-center gap-2">
          <button type="submit" disabled={submitting} className="z-btn-primary flex-1">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {initial ? "Save" : "Add session"}
          </button>
          <button type="button" onClick={onCancel} className="z-btn">Cancel</button>
        </div>
      </form>
    </aside>
  )
}

function toLocal(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  // Strip seconds + timezone for the datetime-local input.
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>
}

function Field({
  label, name, defaultValue, type = "text", required,
}: {
  label: string
  name: string
  defaultValue?: string
  type?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">
        {label}{required && <span className="text-[var(--z-danger,#dc2626)]"> *</span>}
      </span>
      <input type={type} name={name} defaultValue={defaultValue} required={required} className="z-input" />
    </label>
  )
}

function FieldArea({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="block col-span-2">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={3} className="z-input z-textarea" />
    </label>
  )
}
