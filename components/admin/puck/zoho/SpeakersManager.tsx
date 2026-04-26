"use client"

/**
 * In-builder Speakers manager.
 *
 * Lists the event's speakers (read from Puck metadata that's already
 * loaded), lets the admin add / edit / delete via the existing
 * speakerActions server actions. After save, calls router.refresh() so
 * the metadata reloads and the SpeakersGrid block re-renders.
 */

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, ArrowLeft } from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import { EntityListItem } from "./EntityListItem"
import {
  createSpeaker, updateSpeaker, deleteSpeaker,
} from "@/app/actions/speakerActions"
import type { SpeakerShape } from "../blocks"

type EditState =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; speaker: SpeakerShape }

export function SpeakersManager({
  eventId,
  speakers,
  onClose,
}: {
  eventId: string
  speakers: SpeakerShape[]
  onClose?: () => void
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [edit, setEdit] = useState<EditState>({ mode: "list" })
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return speakers
    return speakers.filter((s) =>
      s.name.toLowerCase().includes(q)
      || (s.company ?? "").toLowerCase().includes(q)
      || (s.designation ?? "").toLowerCase().includes(q),
    )
  }, [speakers, search])

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete speaker "${name}"?`)) return
    setBusyId(id)
    try {
      await deleteSpeaker(id)
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  if (edit.mode !== "list") {
    return (
      <SpeakerForm
        eventId={eventId}
        initial={edit.mode === "edit" ? edit.speaker : undefined}
        onCancel={() => setEdit({ mode: "list" })}
        onSaved={() => {
          setEdit({ mode: "list" })
          router.refresh()
        }}
      />
    )
  }

  return (
    <SecondaryPanel
      title="Speakers"
      onClose={onClose}
      searchPlaceholder="Search speakers…"
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
          Add speaker
        </button>
      </div>
      <div className="pt-2 pb-4">
        {filtered.length === 0 ? (
          <div className="z-empty">
            <p className="z-empty-title">
              {speakers.length === 0 ? "No speakers yet" : "No matches"}
            </p>
            <p className="z-empty-desc">
              {speakers.length === 0
                ? "Add your first speaker — they'll appear in the SpeakersGrid block."
                : "Try a different keyword."}
            </p>
          </div>
        ) : (
          filtered.map((s) => (
            <div key={s.id} className={busyId === s.id ? "opacity-50 pointer-events-none" : ""}>
              <EntityListItem
                avatarSrc={s.image_url}
                avatarFallback={s.name.slice(0, 1).toUpperCase()}
                name={s.name}
                meta={[s.designation, s.company].filter(Boolean).join(" · ") || null}
                onEdit={() => setEdit({ mode: "edit", speaker: s })}
                onDelete={() => handleDelete(s.id, s.name)}
              />
            </div>
          ))
        )}
      </div>
    </SecondaryPanel>
  )
}

function SpeakerForm({
  eventId,
  initial,
  onCancel,
  onSaved,
}: {
  eventId: string
  initial?: SpeakerShape
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
        ? await updateSpeaker(initial.id, fd)
        : await createSpeaker(fd)
      if ((res as { success?: boolean })?.success === false) {
        setError((res as { error?: string }).error ?? "Save failed")
      } else {
        onSaved()
      }
    } catch (err) {
      setError((err as Error).message ?? "Save failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <aside className="w-72 shrink-0 h-full bg-[var(--z-bg-alt,#f7f8fa)] border-r border-[var(--z-border,#e5e7eb)] flex flex-col">
      <div className="shrink-0 h-12 px-4 flex items-center gap-2 border-b border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg,#fff)]">
        <button type="button" onClick={onCancel} aria-label="Back" className="z-btn z-btn-icon">
          <ArrowLeft size={14} strokeWidth={1.5} />
        </button>
        <h2 className="text-[13px] font-bold text-[var(--z-text,#1f2937)]">
          {initial ? "Edit speaker" : "Add speaker"}
        </h2>
      </div>
      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <Field label="Name" name="name" defaultValue={initial?.name} required />
        <Field label="Designation" name="designation" defaultValue={initial?.designation ?? ""} />
        <Field label="Company" name="company" defaultValue={initial?.company ?? ""} />
        <Field label="Photo URL" name="imageUrl" defaultValue={initial?.image_url ?? ""} type="url" placeholder="https://…" />
        <FieldArea label="Bio" name="bio" defaultValue="" />
        {error && (
          <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <div className="pt-1 flex items-center gap-2">
          <button type="submit" disabled={submitting} className="z-btn-primary flex-1">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {initial ? "Save" : "Add speaker"}
          </button>
          <button type="button" onClick={onCancel} className="z-btn">Cancel</button>
        </div>
      </form>
    </aside>
  )
}

function Field({
  label, name, defaultValue, type = "text", required, placeholder,
}: {
  label: string
  name: string
  defaultValue?: string
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">
        {label}{required && <span className="text-[var(--z-danger,#dc2626)]"> *</span>}
      </span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="z-input"
      />
    </label>
  )
}

function FieldArea({
  label, name, defaultValue,
}: {
  label: string
  name: string
  defaultValue?: string
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">
        {label}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        className="z-input z-textarea"
        rows={4}
      />
    </label>
  )
}
