"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, ArrowLeft } from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import { EntityListItem } from "./EntityListItem"
import {
  createSponsor, updateSponsor, deleteSponsor,
} from "@/app/actions/sponsorActions"
import type { SponsorShape } from "../blocks"

type EditState =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; sponsor: SponsorShape }

const TIER_OPTIONS = ["title", "platinum", "gold", "silver", "bronze", "partner"] as const

export function SponsorsManager({
  eventId,
  sponsors,
  onClose,
}: {
  eventId: string
  sponsors: SponsorShape[]
  onClose?: () => void
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [edit, setEdit] = useState<EditState>({ mode: "list" })
  const [busyId, setBusyId] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase()
    const visible = q
      ? sponsors.filter((s) => s.name.toLowerCase().includes(q) || (s.tier ?? "").toLowerCase().includes(q))
      : sponsors
    const byTier = new Map<string, SponsorShape[]>()
    for (const s of visible) {
      const t = (s.tier ?? "other").toLowerCase()
      if (!byTier.has(t)) byTier.set(t, [])
      byTier.get(t)!.push(s)
    }
    return byTier
  }, [sponsors, search])

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete sponsor "${name}"?`)) return
    setBusyId(id)
    try {
      await deleteSponsor(id)
      router.refresh()
    } finally { setBusyId(null) }
  }

  if (edit.mode !== "list") {
    return (
      <SponsorForm
        eventId={eventId}
        initial={edit.mode === "edit" ? edit.sponsor : undefined}
        onCancel={() => setEdit({ mode: "list" })}
        onSaved={() => { setEdit({ mode: "list" }); router.refresh() }}
      />
    )
  }

  // Tier display order
  const orderedTiers = [...TIER_OPTIONS as readonly string[]]
  for (const t of grouped.keys()) {
    if (!orderedTiers.includes(t)) orderedTiers.push(t)
  }

  return (
    <SecondaryPanel
      title="Sponsors"
      onClose={onClose}
      searchPlaceholder="Search sponsors…"
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
          Add sponsor
        </button>
      </div>
      <div className="pt-2 pb-4">
        {sponsors.length === 0 ? (
          <div className="z-empty">
            <p className="z-empty-title">No sponsors yet</p>
            <p className="z-empty-desc">Add your first sponsor — they'll appear in the Sponsors blocks.</p>
          </div>
        ) : (
          orderedTiers.map((tier) => {
            const list = grouped.get(tier)
            if (!list || list.length === 0) return null
            const label = tier.replace(/^./, (c) => c.toUpperCase())
            return (
              <div key={tier} className="pt-3">
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--z-text-muted,#6b7280)]">
                  {label}
                </p>
                {list.map((s) => (
                  <div key={s.id} className={busyId === s.id ? "opacity-50 pointer-events-none" : ""}>
                    <EntityListItem
                      avatarSrc={s.logo_url}
                      avatarFallback={s.name.slice(0, 1).toUpperCase()}
                      name={s.name}
                      meta={s.website || null}
                      onEdit={() => setEdit({ mode: "edit", sponsor: s })}
                      onDelete={() => handleDelete(s.id, s.name)}
                    />
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </SecondaryPanel>
  )
}

function SponsorForm({
  eventId, initial, onCancel, onSaved,
}: {
  eventId: string
  initial?: SponsorShape
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
        ? await updateSponsor(initial.id, fd)
        : await createSponsor(fd)
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
          {initial ? "Edit sponsor" : "Add sponsor"}
        </h2>
      </div>
      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <Field label="Name" name="name" defaultValue={initial?.name} required />
        <label className="block">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Tier</span>
          <select name="tier" defaultValue={initial?.tier ?? "partner"} className="z-input">
            {TIER_OPTIONS.map((t) => (
              <option key={t} value={t}>{t.replace(/^./, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </label>
        <Field label="Logo URL" name="logoUrl" type="url" defaultValue={initial?.logo_url ?? ""} placeholder="https://…" />
        <Field label="Website" name="website" type="url" defaultValue={initial?.website ?? ""} placeholder="https://…" />
        <FieldArea label="Description" name="description" defaultValue="" />
        {error && (
          <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
        <div className="pt-1 flex items-center gap-2">
          <button type="submit" disabled={submitting} className="z-btn-primary flex-1">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {initial ? "Save" : "Add sponsor"}
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
      <input type={type} name={name} defaultValue={defaultValue} required={required} placeholder={placeholder} className="z-input" />
    </label>
  )
}

function FieldArea({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={3} className="z-input z-textarea" />
    </label>
  )
}
