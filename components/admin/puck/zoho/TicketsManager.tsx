"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, ArrowLeft } from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import { EntityListItem } from "./EntityListItem"
import {
  createTicket, updateTicket, deleteTicket,
} from "@/app/actions/ticketActions"
import type { TicketShape } from "../blocks"

type EditState =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; ticket: TicketShape }

export function TicketsManager({
  eventId,
  tickets,
  onClose,
}: {
  eventId: string
  tickets: TicketShape[]
  onClose?: () => void
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [edit, setEdit] = useState<EditState>({ mode: "list" })
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tickets
    return tickets.filter((t) => t.name.toLowerCase().includes(q))
  }, [tickets, search])

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete ticket "${name}"?`)) return
    setBusyId(id)
    try {
      await deleteTicket(id)
      router.refresh()
    } finally { setBusyId(null) }
  }

  if (edit.mode !== "list") {
    return (
      <TicketForm
        eventId={eventId}
        initial={edit.mode === "edit" ? edit.ticket : undefined}
        onCancel={() => setEdit({ mode: "list" })}
        onSaved={() => { setEdit({ mode: "list" }); router.refresh() }}
      />
    )
  }

  return (
    <SecondaryPanel
      title="Tickets"
      onClose={onClose}
      searchPlaceholder="Search tickets…"
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
          Add ticket
        </button>
      </div>
      <div className="pt-2 pb-4">
        {filtered.length === 0 ? (
          <div className="z-empty">
            <p className="z-empty-title">
              {tickets.length === 0 ? "No tickets yet" : "No matches"}
            </p>
            <p className="z-empty-desc">
              {tickets.length === 0
                ? "Add tickets to populate the Tickets blocks."
                : "Try a different keyword."}
            </p>
          </div>
        ) : (
          filtered.map((t) => {
            const remaining = t.inventory_limit
              ? Math.max(0, t.inventory_limit - (t.sold ?? 0))
              : null
            return (
              <div key={t.id} className={busyId === t.id ? "opacity-50 pointer-events-none" : ""}>
                <EntityListItem
                  avatarFallback="₹"
                  name={t.name}
                  meta={`₹${t.price_inr.toLocaleString("en-IN")}${remaining !== null ? ` · ${remaining} left` : ""}`}
                  onEdit={() => setEdit({ mode: "edit", ticket: t })}
                  onDelete={() => handleDelete(t.id, t.name)}
                />
              </div>
            )
          })
        )}
      </div>
    </SecondaryPanel>
  )
}

function TicketForm({
  eventId, initial, onCancel, onSaved,
}: {
  eventId: string
  initial?: TicketShape
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
        ? await updateTicket(initial.id, fd)
        : await createTicket(fd)
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
          {initial ? "Edit ticket" : "Add ticket"}
        </h2>
      </div>
      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <Field label="Name" name="name" defaultValue={initial?.name} required />
        <FieldArea label="Description" name="description" defaultValue={initial?.description ?? ""} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Price (INR)" name="priceInr" type="number" defaultValue={String(initial?.price_inr ?? 0)} required />
          <Field label="Inventory" name="inventoryLimit" type="number" defaultValue={String(initial?.inventory_limit ?? "")} />
        </div>
        {error && (
          <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
        <div className="pt-1 flex items-center gap-2">
          <button type="submit" disabled={submitting} className="z-btn-primary flex-1">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {initial ? "Save" : "Add ticket"}
          </button>
          <button type="button" onClick={onCancel} className="z-btn">Cancel</button>
        </div>
      </form>
    </aside>
  )
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
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={3} className="z-input z-textarea" />
    </label>
  )
}
