"use client"

/**
 * Hotels manager — table view (ITEM 7.2).
 *
 * Columns: Image | Name | Distance (km) | Price range | Booking URL |
 * Actions. Default visible: Image / Name / Distance / Price range.
 */

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Edit3, Trash2, Loader2 } from "lucide-react"
import {
  listHotels, upsertHotel, deleteHotel, type EventHotel,
} from "@/app/actions/hotelActions"
import { ManagerTable, type ColumnDef } from "./ManagerTable"
import { ProfilePanel } from "./ProfilePanel"
import { ImageUploadCrop } from "@/components/admin/ImageUploadCrop"

export function HotelsManager({
  eventId,
  onClose,
}: {
  eventId: string
  onClose?: () => void
}) {
  const router = useRouter()
  const [rows, setRows] = useState<EventHotel[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [selected, setSelected] = useState<EventHotel | null>(null)

  async function refresh() {
    const r = await listHotels(eventId)
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
      id: "", event_id: eventId, name: "", image_url: null,
      address: null, distance_km: null, price_range: null,
      booking_url: null, description: null,
      sort_order: rows.length * 10, created_at: new Date().toISOString(),
    })
    setMode("edit"); setOpen(true)
  }
  function openRow(item: EventHotel) { setSelected(item); setMode("view"); setOpen(true) }

  async function onSave(next: EventHotel) {
    const res = await upsertHotel(eventId, {
      id: next.id || undefined,
      name: next.name,
      image_url: next.image_url,
      address: next.address,
      distance_km: next.distance_km,
      price_range: next.price_range,
      booking_url: next.booking_url,
      description: next.description,
      sort_order: next.sort_order,
    })
    if (!res.success) return { success: false, error: res.error }
    await refresh()
    router.refresh()
    return { success: true }
  }
  async function onDelete() {
    if (!selected?.id) return
    await deleteHotel(eventId, selected.id)
    await refresh()
    router.refresh()
  }

  const columns = useMemo<ColumnDef<EventHotel>[]>(() => [
    {
      key: "name", label: "Name", defaultVisible: true,
      sortValue: (h) => h.name,
      filter: (h, q) => h.name.toLowerCase().includes(q.toLowerCase()),
      render: (h) => <span className="font-semibold">{h.name}</span>,
    },
    {
      key: "distance_km", label: "Distance", defaultVisible: true,
      sortValue: (h) => h.distance_km ?? Number.MAX_SAFE_INTEGER,
      render: (h) => h.distance_km != null ? (
        <span className="font-mono tabular-nums">{Number(h.distance_km).toFixed(1)} km</span>
      ) : <span className="text-[var(--z-text-muted,#6b7280)]">—</span>,
    },
    {
      key: "price_range", label: "Price range", defaultVisible: true,
      sortValue: (h) => h.price_range ?? "",
      filter: (h, q) => (h.price_range ?? "").toLowerCase().includes(q.toLowerCase()),
      render: (h) => <span className="text-[var(--z-text-muted,#6b7280)]">{h.price_range ?? "—"}</span>,
    },
    {
      key: "booking_url", label: "Booking URL", defaultVisible: false,
      sortValue: (h) => h.booking_url ?? "",
      render: (h) => h.booking_url ? (
        <a href={h.booking_url} target="_blank" rel="noopener noreferrer" className="text-[var(--z-info,#3e7af7)] hover:underline truncate inline-block max-w-[180px]" onClick={(e) => e.stopPropagation()}>{h.booking_url}</a>
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
      <ManagerTable<EventHotel>
        tableId="hotels"
        title="Hotels"
        onClose={onClose}
        items={rows}
        columns={columns}
        rowAvatar={(h) => ({ src: h.image_url, fallback: (h.name || "?").slice(0, 1).toUpperCase() })}
        rowActions={(h) => [
          { icon: <Edit3 size={11} />, label: "Edit", onClick: () => { setSelected(h); setMode("edit"); setOpen(true) } },
          { icon: <Trash2 size={11} />, label: "Delete", danger: true, onClick: async () => {
            if (!confirm(`Delete hotel "${h.name}"?`)) return
            await deleteHotel(eventId, h.id)
            await refresh()
            router.refresh()
          } },
        ]}
        onAdd={openCreate}
        onRowClick={openRow}
        addLabel="Add hotel"
      />
      <ProfilePanel<EventHotel>
        open={open}
        item={selected}
        title={selected?.name || "New hotel"}
        mode={mode}
        onClose={() => setOpen(false)}
        onModeChange={setMode}
        onSave={onSave}
        onDelete={selected?.id ? onDelete : undefined}
        viewBody={(h) => (
          <div className="space-y-3 text-[12px]">
            {h.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={h.image_url} alt="" className="w-full aspect-[16/10] rounded-lg object-cover bg-[var(--z-bg-alt,#f7f8fa)]" />
            )}
            <p className="text-[15px] font-bold">{h.name}</p>
            <div className="flex flex-wrap gap-3 text-[12px] text-[var(--z-text-muted,#6b7280)]">
              {h.distance_km != null && <span>{Number(h.distance_km).toFixed(1)} km away</span>}
              {h.price_range && <span className="font-semibold">{h.price_range}</span>}
            </div>
            {h.address && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Address</p>
                <p>{h.address}</p>
              </div>
            )}
            {h.description && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">About</p>
                <p className="whitespace-pre-wrap leading-relaxed">{h.description}</p>
              </div>
            )}
            {h.booking_url && (
              <a href={h.booking_url} target="_blank" rel="noopener noreferrer" className="z-btn-primary inline-flex items-center !text-[12px]">Book now</a>
            )}
          </div>
        )}
        editForm={(h, onChange) => (
          <>
            <PField label="Name" required value={h.name} onChange={(v) => onChange({ ...h, name: v })} />
            <PField label="Address" value={h.address ?? ""} onChange={(v) => onChange({ ...h, address: v })} />
            <div className="grid grid-cols-2 gap-2">
              <PField label="Distance (km)" type="number" value={h.distance_km != null ? String(h.distance_km) : ""} onChange={(v) => onChange({ ...h, distance_km: v ? Number(v) : null })} />
              <PField label="Price range" value={h.price_range ?? ""} onChange={(v) => onChange({ ...h, price_range: v })} placeholder="₹4,500 / night" />
            </div>
            <PField label="Booking URL" type="url" value={h.booking_url ?? ""} onChange={(v) => onChange({ ...h, booking_url: v })} placeholder="https://…" />
            <PArea label="About" value={h.description ?? ""} onChange={(v) => onChange({ ...h, description: v })} />
            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Image</span>
              <ImageUploadCrop value={h.image_url} onChange={(url) => onChange({ ...h, image_url: url ?? null })} aspectRatio={16 / 10} folder="sections" label="" />
            </div>
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
