"use client"

/**
 * In-builder Tickets manager — table view (ITEM 5).
 *
 * Columns: Name | Price | Sold/Limit (with progress bar) | Sales window
 * | Visibility (pill) | Actions. Default visible: Name / Price /
 * Sold / Limit / Visibility.
 *
 * Profile panel View: name + description + price + sold-vs-limit
 * progress bar + features bullets + sales window + early-bird countdown
 * if applicable. Edit form: full set including features array editor +
 * most_popular checkbox (action enforces single-row uniqueness).
 */

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Edit3, Trash2, Loader2 } from "lucide-react"
import {
  createTicket, updateTicket, deleteTicket,
  listTicketsFull, type TicketRow,
} from "@/app/actions/ticketActions"
import { ManagerTable, type ColumnDef } from "./ManagerTable"
import { ProfilePanel } from "./ProfilePanel"

const VIS_OPTIONS: Array<{ value: string; label: string; cls: string }> = [
  { value: "published",  label: "Public",     cls: "bg-emerald-100 text-emerald-700" },
  { value: "hidden",     label: "Hidden",     cls: "bg-gray-200 text-gray-700" },
  { value: "promo-only", label: "Promo only", cls: "bg-amber-100 text-amber-700" },
]

function fmtINR(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return `₹${n.toLocaleString("en-IN")}`
}
function fmtDateOnly(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}
function toLocalInput(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function TicketsManager({
  eventId,
  onClose,
}: {
  eventId: string
  tickets?: unknown
  onClose?: () => void
}) {
  const router = useRouter()
  const [rows, setRows] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [selected, setSelected] = useState<TicketRow | null>(null)

  async function refresh() {
    const r = await listTicketsFull(eventId)
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
      description: "",
      price_inr: 0,
      inventory_limit: null,
      sold: 0,
      status: "published",
      sales_start_at: null,
      sales_end_at: null,
      early_bird_ends_at: null,
      features: null,
      most_popular: false,
      sort_order: rows.length * 10,
      created_at: new Date().toISOString(),
    })
    setMode("edit")
    setOpen(true)
  }
  function openRow(item: TicketRow) {
    setSelected(item); setMode("view"); setOpen(true)
  }

  async function onSave(next: TicketRow) {
    const fd = new FormData()
    fd.set("eventId", eventId)
    fd.set("name", next.name ?? "")
    fd.set("description", next.description ?? "")
    fd.set("priceInr", String(next.price_inr ?? 0))
    fd.set("inventoryLimit", String(next.inventory_limit ?? 0))
    fd.set("status", next.status ?? "published")
    fd.set("salesStart", next.sales_start_at ?? "")
    fd.set("salesEnd",   next.sales_end_at ?? "")
    fd.set("earlyBirdEndsAt", next.early_bird_ends_at ?? "")
    fd.set("features", (next.features ?? []).join("\n"))
    fd.set("mostPopular", next.most_popular ? "true" : "false")
    const res = next.id
      ? await updateTicket(next.id, fd)
      : await createTicket(fd)
    if ((res as { success?: boolean }).success === false) {
      return { success: false, error: (res as { error?: string }).error }
    }
    await refresh()
    router.refresh()
    return { success: true }
  }
  async function onDelete() {
    if (!selected?.id) return
    await deleteTicket(selected.id)
    await refresh()
    router.refresh()
  }

  const columns = useMemo<ColumnDef<TicketRow>[]>(() => [
    {
      key: "name",
      label: "Name",
      defaultVisible: true,
      sortValue: (t) => t.name,
      filter: (t, q) => t.name.toLowerCase().includes(q.toLowerCase()),
      render: (t) => (
        <span className="inline-flex items-center gap-1.5 font-semibold">
          {t.name}
          {t.most_popular && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">Most popular</span>
          )}
        </span>
      ),
    },
    {
      key: "price",
      label: "Price",
      defaultVisible: true,
      sortValue: (t) => t.price_inr,
      render: (t) => <span className="font-mono tabular-nums">{fmtINR(t.price_inr)}</span>,
    },
    {
      key: "sold",
      label: "Sold / Limit",
      defaultVisible: true,
      sortValue: (t) => t.sold,
      render: (t) => <SoldBar sold={t.sold ?? 0} limit={t.inventory_limit ?? 0} />,
    },
    {
      key: "sales_window",
      label: "Sales window",
      defaultVisible: false,
      sortValue: (t) => t.sales_start_at ?? "",
      render: (t) => {
        if (!t.sales_start_at && !t.sales_end_at) return <span className="text-[var(--z-text-muted,#6b7280)]">—</span>
        return (
          <span className="text-[11px] text-[var(--z-text-muted,#6b7280)]">
            {fmtDateOnly(t.sales_start_at)} → {fmtDateOnly(t.sales_end_at)}
          </span>
        )
      },
    },
    {
      key: "visibility",
      label: "Visibility",
      defaultVisible: true,
      sortValue: (t) => t.status,
      render: (t) => {
        const opt = VIS_OPTIONS.find((o) => o.value === t.status) ?? VIS_OPTIONS[0]
        return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${opt.cls}`}>{opt.label}</span>
      },
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
      <ManagerTable<TicketRow>
        tableId="tickets"
        title="Tickets"
        onClose={onClose}
        items={rows}
        columns={columns}
        rowActions={(t) => [
          { icon: <Edit3 size={11} />, label: "Edit", onClick: () => { setSelected(t); setMode("edit"); setOpen(true) } },
          { icon: <Trash2 size={11} />, label: "Delete", danger: true, onClick: async () => {
            if (!confirm(`Delete ticket "${t.name}"?`)) return
            await deleteTicket(t.id)
            await refresh()
            router.refresh()
          } },
        ]}
        onAdd={openCreate}
        onRowClick={openRow}
        addLabel="Add ticket"
      />
      <ProfilePanel<TicketRow>
        open={open}
        item={selected}
        title={selected?.name || "New ticket"}
        mode={mode}
        onClose={() => setOpen(false)}
        onModeChange={setMode}
        onSave={onSave}
        onDelete={selected?.id ? onDelete : undefined}
        viewBody={(t) => (
          <div className="space-y-3 text-[12px] text-[var(--z-text,#1f2937)]">
            <div>
              <p className="text-[15px] font-bold flex items-center gap-1.5">
                {t.name}
                {t.most_popular && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">Most popular</span>}
              </p>
              <p className="text-[20px] font-bold font-mono tabular-nums mt-1" style={{ color: "var(--lf-primary, #e7ab1c)" }}>{fmtINR(t.price_inr)}</p>
            </div>
            {t.description && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Description</p>
                <p className="whitespace-pre-wrap text-[12px] leading-relaxed">{t.description}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Sold</p>
              <SoldBar sold={t.sold} limit={t.inventory_limit ?? 0} large />
            </div>
            {t.features && t.features.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Features</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {t.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
            {(t.sales_start_at || t.sales_end_at) && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Sales window</p>
                <p className="text-[12px]">{fmtDateOnly(t.sales_start_at)} → {fmtDateOnly(t.sales_end_at)}</p>
              </div>
            )}
            {t.early_bird_ends_at && new Date(t.early_bird_ends_at) > new Date() && (
              <EarlyBirdCountdown to={t.early_bird_ends_at} />
            )}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Visibility</p>
              {(() => {
                const opt = VIS_OPTIONS.find((o) => o.value === t.status) ?? VIS_OPTIONS[0]
                return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${opt.cls}`}>{opt.label}</span>
              })()}
            </div>
          </div>
        )}
        editForm={(t, onChange) => (
          <>
            <PField label="Name" required value={t.name} onChange={(v) => onChange({ ...t, name: v })} />
            <PArea label="Description" value={t.description ?? ""} onChange={(v) => onChange({ ...t, description: v })} />
            <div className="grid grid-cols-2 gap-2">
              <PField label="Price (₹)" type="number" value={String(t.price_inr ?? 0)} onChange={(v) => onChange({ ...t, price_inr: parseInt(v) || 0 })} />
              <PField label="Inventory" type="number" value={String(t.inventory_limit ?? 0)} onChange={(v) => onChange({ ...t, inventory_limit: parseInt(v) || 0 })} />
            </div>
            <label className="block">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Visibility</span>
              <select value={t.status} onChange={(e) => onChange({ ...t, status: e.target.value })} className="z-input">
                {VIS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <PField label="Sales start" type="datetime-local" value={toLocalInput(t.sales_start_at)} onChange={(v) => onChange({ ...t, sales_start_at: v ? new Date(v).toISOString() : null })} />
              <PField label="Sales end" type="datetime-local" value={toLocalInput(t.sales_end_at)} onChange={(v) => onChange({ ...t, sales_end_at: v ? new Date(v).toISOString() : null })} />
            </div>
            <PField label="Early-bird ends" type="datetime-local" value={toLocalInput(t.early_bird_ends_at)} onChange={(v) => onChange({ ...t, early_bird_ends_at: v ? new Date(v).toISOString() : null })} />
            <FeaturesEditor features={t.features ?? []} onChange={(f) => onChange({ ...t, features: f })} />
            <label className="flex items-center gap-2 text-[12px]">
              <input type="checkbox" checked={t.most_popular} onChange={(e) => onChange({ ...t, most_popular: e.target.checked })} />
              <span>Most popular (highlights this ticket; only one allowed per event)</span>
            </label>
          </>
        )}
      />
    </>
  )
}

function SoldBar({ sold, limit, large }: { sold: number; limit: number; large?: boolean }) {
  if (!limit) {
    return <span className="text-[var(--z-text-muted,#6b7280)] text-[11px]">{sold} sold · No limit</span>
  }
  const pct = Math.max(0, Math.min(100, (sold / limit) * 100))
  return (
    <div className={large ? "w-full" : "min-w-[120px]"}>
      <div className="flex items-center justify-between text-[10px] tabular-nums text-[var(--z-text-muted,#6b7280)]">
        <span>{sold}</span>
        <span>/ {limit}</span>
      </div>
      <div className={`mt-1 ${large ? "h-2.5" : "h-1.5"} bg-[var(--z-bg-alt,#f7f8fa)] rounded overflow-hidden`}>
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: pct > 90 ? "#dc2626" : "var(--lf-primary, #e7ab1c)" }} />
      </div>
    </div>
  )
}

function EarlyBirdCountdown({ to }: { to: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const ms = Math.max(0, new Date(to).getTime() - now)
  const days  = Math.floor(ms / 86_400_000)
  const hours = Math.floor((ms % 86_400_000) / 3_600_000)
  const mins  = Math.floor((ms % 3_600_000) / 60_000)
  return (
    <div className="rounded-md border-2 px-3 py-2" style={{ borderColor: "var(--lf-primary, #e7ab1c)" }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--lf-primary, #e7ab1c)" }}>Early bird ends in</p>
      <p className="font-mono text-[14px] font-bold tabular-nums">{days}d {hours}h {mins}m</p>
    </div>
  )
}

function FeaturesEditor({ features, onChange }: { features: string[]; onChange: (f: string[]) => void }) {
  return (
    <div>
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Features (one per line)</span>
      <textarea
        value={features.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n"))}
        rows={4}
        className="z-input z-textarea"
        placeholder="VIP lounge access&#10;Priority seating&#10;Welcome kit"
      />
      <p className="mt-0.5 text-[10px] text-[var(--z-text-muted,#6b7280)]">Each line becomes a bullet on the public ticket card.</p>
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
function PArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="z-input z-textarea" />
    </label>
  )
}
