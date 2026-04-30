"use client"

/**
 * Hotels data manager (ITEM 7).
 * Same shape as ExhibitorsManager — list / Add / edit form / delete.
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, ArrowLeft } from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import { EntityListItem } from "./EntityListItem"
import { ImageUploadCrop } from "@/components/admin/ImageUploadCrop"
import {
  listHotels, upsertHotel, deleteHotel, type EventHotel,
} from "@/app/actions/hotelActions"

type EditState =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; row: EventHotel }

export function HotelsManager({
  eventId,
  onClose,
}: {
  eventId: string
  onClose?: () => void
}) {
  const router = useRouter()
  const [edit, setEdit] = useState<EditState>({ mode: "list" })
  const [search, setSearch] = useState("")
  const [hotels, setHotels] = useState<EventHotel[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function refresh() {
    const r = await listHotels(eventId)
    setHotels(r.rows)
  }

  useEffect(() => {
    let cancelled = false
    void refresh().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete hotel "${name}"?`)) return
    setBusyId(id)
    try {
      await deleteHotel(eventId, id)
      await refresh()
      router.refresh()
    } finally { setBusyId(null) }
  }

  if (edit.mode !== "list") {
    return (
      <HotelForm
        eventId={eventId}
        initial={edit.mode === "edit" ? edit.row : undefined}
        onCancel={() => setEdit({ mode: "list" })}
        onSaved={async () => { await refresh(); setEdit({ mode: "list" }); router.refresh() }}
      />
    )
  }

  const q = search.trim().toLowerCase()
  const visible = q
    ? hotels.filter((h) => h.name.toLowerCase().includes(q) || (h.address ?? "").toLowerCase().includes(q))
    : hotels

  return (
    <SecondaryPanel
      title="Hotels"
      onClose={onClose}
      searchPlaceholder="Search hotels…"
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="px-2 pt-2">
        <button type="button" onClick={() => setEdit({ mode: "create" })} className="z-btn-primary w-[calc(100%-1rem)] mx-2">
          <Plus size={14} strokeWidth={1.5} />
          Add hotel
        </button>
      </div>
      <div className="pt-2 pb-4">
        {loading ? (
          <div className="z-empty mt-8"><Loader2 size={18} className="animate-spin z-empty-icon" /><p className="z-empty-desc mt-2">Loading…</p></div>
        ) : visible.length === 0 ? (
          <div className="z-empty">
            <p className="z-empty-title">No hotels yet</p>
            <p className="z-empty-desc">Add a hotel — they&apos;ll appear in the Hotels block.</p>
          </div>
        ) : (
          visible.map((row) => (
            <div key={row.id} className={busyId === row.id ? "opacity-50 pointer-events-none" : ""}>
              <EntityListItem
                avatarSrc={row.image_url}
                avatarFallback={row.name.slice(0, 1).toUpperCase()}
                name={row.name}
                meta={[row.distance_km != null ? `${row.distance_km.toFixed(1)} km` : null, row.price_range].filter(Boolean).join(" · ") || null}
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

function HotelForm({
  eventId, initial, onCancel, onSaved,
}: {
  eventId: string
  initial?: EventHotel
  onCancel: () => void
  onSaved: () => Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [image, setImage] = useState<string>(initial?.image_url ?? "")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const distRaw = String(fd.get("distance_km") ?? "").trim()
    const distance_km = distRaw ? Number(distRaw) : null
    const res = await upsertHotel(eventId, {
      id: initial?.id,
      name: String(fd.get("name") ?? ""),
      image_url: image || null,
      address: String(fd.get("address") ?? "") || null,
      distance_km: Number.isFinite(distance_km) ? distance_km : null,
      price_range: String(fd.get("price_range") ?? "") || null,
      booking_url: String(fd.get("booking_url") ?? "") || null,
      description: String(fd.get("description") ?? "") || null,
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
          {initial ? "Edit hotel" : "Add hotel"}
        </h2>
      </div>
      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <ManagerField label="Name" name="name" defaultValue={initial?.name} required />
        <ManagerField label="Address" name="address" defaultValue={initial?.address ?? ""} />
        <ManagerField label="Distance (km)" name="distance_km" type="number" defaultValue={initial?.distance_km != null ? String(initial.distance_km) : ""} />
        <ManagerField label="Price range" name="price_range" defaultValue={initial?.price_range ?? ""} placeholder="₹4,500 / night" />
        <ManagerField label="Booking URL" name="booking_url" type="url" defaultValue={initial?.booking_url ?? ""} placeholder="https://…" />
        <ManagerArea label="Description" name="description" defaultValue={initial?.description ?? ""} />
        <div>
          <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Image</span>
          <ImageUploadCrop value={image} onChange={(v) => setImage(v ?? "")} aspectRatio={16 / 10} folder="sections" label="" />
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
