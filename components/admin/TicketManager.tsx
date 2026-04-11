"use client"

import React, { useState, useCallback, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { createTicket, updateTicket, deleteTicket } from "@/app/actions/ticketActions"
import {
  createPriceTier,
  deletePriceTier,
  getPriceTiers,
} from "@/app/actions/priceTierActions"
import { Plus, Pencil, Trash2, X, Loader2, Ticket, ChevronDown, Clock, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

interface TicketRow {
  id: string
  event_id: string
  name: string
  description: string | null
  price_inr: number
  inventory_limit: number
  sold: number
  status: string
  created_at: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft:     { bg: "bg-yellow-500/10", text: "text-yellow-600" },
  published: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  archived:  { bg: "bg-[#f0f0f0]",     text: "text-[#888]" },
}

interface PriceTierRow {
  id: string
  ticket_id: string
  name: string
  price_inr: number
  starts_at: string
  ends_at: string
  is_active: boolean
  created_at: string
}

function fmtPrice(n: number) {
  return new Intl.NumberFormat("en-IN").format(n)
}

function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function isTierActive(tier: PriceTierRow) {
  const now = Date.now()
  return tier.is_active && new Date(tier.starts_at).getTime() <= now && new Date(tier.ends_at).getTime() >= now
}

/* ── Price Tier Section (inline per ticket) ──────────────────────────── */

function PriceTierSection({ ticketId, basePrice }: { ticketId: string; basePrice: number }) {
  const [tiers, setTiers] = useState<PriceTierRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchTiers = useCallback(async () => {
    setLoading(true)
    const res = await getPriceTiers(ticketId)
    if (res.success) setTiers(res.tiers as PriceTierRow[])
    setLoading(false)
  }, [ticketId])

  useEffect(() => { fetchTiers() }, [fetchTiers])

  async function handleCreateTier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const res = await createPriceTier(ticketId, {
      name: fd.get("tierName") as string,
      price_inr: parseInt(fd.get("tierPrice") as string) || 0,
      starts_at: fd.get("tierStartsAt") as string,
      ends_at: fd.get("tierEndsAt") as string,
    })
    if (res.success) {
      setShowForm(false)
      await fetchTiers()
    } else {
      setError(res.error ?? "Failed to create tier")
    }
    setSaving(false)
  }

  async function handleDeleteTier(tierId: string) {
    if (!confirm("Delete this price tier?")) return
    setDeleting(tierId)
    await deletePriceTier(tierId)
    await fetchTiers()
    setDeleting(null)
  }

  if (loading) {
    return (
      <div className="px-5 py-3 flex items-center gap-2 text-[#aaa] text-xs">
        <Loader2 size={12} className="animate-spin" /> Loading tiers...
      </div>
    )
  }

  return (
    <div className="px-5 pb-4 pt-1">
      {/* Existing tiers */}
      {tiers.length > 0 && (
        <div className="space-y-2 mb-3">
          {/* Visual timeline */}
          <div className="flex items-center gap-2 mb-2">
            <Clock size={12} className="text-[#bbb]" />
            <span className="text-[10px] text-[#999] uppercase tracking-wider font-semibold">Price Timeline</span>
          </div>
          {tiers.map((tier) => {
            const active = isTierActive(tier)
            return (
              <div
                key={tier.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-xs transition-colors",
                  active
                    ? "bg-[#c9a84c]/[0.06] border-[#c9a84c]/20"
                    : "bg-[#fafafa] border-[#e8e8e8]"
                )}
              >
                <Tag size={12} className={active ? "text-[#c9a84c]" : "text-[#ccc]"} />
                <span className={cn("font-medium", active ? "text-[#c9a84c]" : "text-[#666]")}>{tier.name}</span>
                <span className="text-[#888] tabular-nums">&#8377;{fmtPrice(tier.price_inr)}</span>
                <span className="text-[#aaa]">{fmtDateShort(tier.starts_at)} — {fmtDateShort(tier.ends_at)}</span>
                {active && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Active
                  </span>
                )}
                {!tier.is_active && (
                  <span className="text-[10px] text-[#bbb] font-medium uppercase">Disabled</span>
                )}
                <div className="ml-auto">
                  <button
                    onClick={() => handleDeleteTier(tier.id)}
                    disabled={deleting === tier.id}
                    className="p-1 rounded text-[#bbb] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                  >
                    {deleting === tier.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add tier form */}
      {showForm ? (
        <form onSubmit={handleCreateTier} className="space-y-3 p-3 rounded-lg bg-[#fafafa] border border-[#e8e8e8]">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-[#888] uppercase tracking-wider mb-1">Tier Name *</label>
              <input type="text" name="tierName" required placeholder='e.g. "Early Bird"' className="w-full px-2.5 py-2 bg-white border border-[#e0e0e0] rounded text-xs text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50" />
            </div>
            <div>
              <label className="block text-[10px] text-[#888] uppercase tracking-wider mb-1">Price (INR) *</label>
              <input type="number" name="tierPrice" required min="0" placeholder={String(basePrice)} className="w-full px-2.5 py-2 bg-white border border-[#e0e0e0] rounded text-xs text-[#333] tabular-nums focus:outline-none focus:border-[#c9a84c]/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-[#888] uppercase tracking-wider mb-1">Starts At *</label>
              <input type="datetime-local" name="tierStartsAt" required className="w-full px-2.5 py-2 bg-white border border-[#e0e0e0] rounded text-xs text-[#333] focus:outline-none focus:border-[#c9a84c]/50" />
            </div>
            <div>
              <label className="block text-[10px] text-[#888] uppercase tracking-wider mb-1">Ends At *</label>
              <input type="datetime-local" name="tierEndsAt" required className="w-full px-2.5 py-2 bg-white border border-[#e0e0e0] rounded text-xs text-[#333] focus:outline-none focus:border-[#c9a84c]/50" />
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowForm(false); setError(null) }} className="flex-1 py-2 rounded border border-[#e0e0e0] text-xs text-[#777] hover:bg-white transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded bg-[#c9a84c] text-white text-xs font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-1">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add Tier
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs text-[#c9a84c] hover:text-[#b8973e] font-medium transition-colors"
        >
          <Plus size={12} /> Add Price Tier
        </button>
      )}
    </div>
  )
}

export function TicketManager({ eventId }: { eventId: string }) {
  const [tickets, setTickets]       = useState<TicketRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing]       = useState<TicketRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedTierId, setExpandedTierId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
    if (data) setTickets(data)
    setLoading(false)
  }, [eventId])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)

    const fd = new FormData(e.currentTarget)
    fd.set("eventId", eventId)

    const result = editing
      ? await updateTicket(editing.id, fd)
      : await createTicket(fd)

    if (result.success) {
      setDrawerOpen(false)
      setEditing(null)
      await fetchTickets()
    } else {
      setActionError(result.error ?? "Operation failed")
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this ticket tier? This cannot be undone.")) return
    setDeletingId(id)
    const result = await deleteTicket(id)
    if (result.success) await fetchTickets()
    else setActionError(result.error ?? "Failed to delete")
    setDeletingId(null)
  }

  const totalInventory = tickets.reduce((s, t) => s + t.inventory_limit, 0)
  const totalSold = tickets.reduce((s, t) => s + t.sold, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-[#888]">
            {tickets.length} tier{tickets.length !== 1 ? "s" : ""}
            {totalSold > 0 && <> &middot; <span className="text-[#c9a84c]">{totalSold}/{totalInventory} sold</span></>}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setDrawerOpen(true); setActionError(null) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] text-white text-sm font-bold hover:bg-[#d4b85c] transition-colors"
        >
          <Plus size={15} /> Add Ticket Tier
        </button>
      </div>

      {/* Error */}
      {actionError && (
        <div className="mb-5 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400"><X size={14} /></button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#aaa] gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading tickets…
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center">
            <Ticket size={28} className="mx-auto mb-3 text-[#ccc]" />
            <p className="text-[#999] text-sm">No ticket tiers configured yet.</p>
            <p className="text-[#bbb] text-xs mt-1">Add your first ticket tier to start selling.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Price (INR)</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Inventory</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => {
                const pct = t.inventory_limit > 0 ? Math.round((t.sold / t.inventory_limit) * 100) : 0
                const isExpanded = expandedTierId === t.id
                return (
                  <React.Fragment key={t.id}>
                    <tr className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-[#333]">{t.name}</div>
                        {t.description && <div className="text-[11px] text-[#aaa] mt-0.5 line-clamp-1">{t.description}</div>}
                      </td>
                      <td className="px-5 py-4 text-[#555] tabular-nums">
                        {t.price_inr === 0 ? (
                          <span className="text-emerald-600 font-medium">Free</span>
                        ) : (
                          <>&#8377;{fmtPrice(t.price_inr)}</>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[#666] text-xs tabular-nums">{t.sold} / {t.inventory_limit}</div>
                        <div className="w-24 h-1.5 bg-[#e8e8e8] rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-red-400" : pct >= 60 ? "bg-yellow-400" : "bg-[#c9a84c]")}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider", STATUS_STYLES[t.status]?.bg ?? "bg-[#f0f0f0]", STATUS_STYLES[t.status]?.text ?? "text-[#888]")}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setExpandedTierId(isExpanded ? null : t.id)}
                            className={cn("p-2 rounded-md text-[#aaa] hover:text-[#c9a84c] hover:bg-[#c9a84c]/5 transition-colors", isExpanded && "text-[#c9a84c] bg-[#c9a84c]/5")}
                            title="Price Tiers"
                          >
                            <ChevronDown size={15} className={cn("transition-transform", isExpanded && "rotate-180")} />
                          </button>
                          <button onClick={() => { setEditing(t); setDrawerOpen(true); setActionError(null) }} className="p-2 rounded-md text-[#aaa] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><Pencil size={15} /></button>
                          <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id} className="p-2 rounded-md text-[#aaa] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30">
                            {deletingId === t.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expandable Price Tiers row */}
                    {isExpanded && (
                      <tr className="bg-[#f8f9fa]">
                        <td colSpan={5} className="p-0">
                          <PriceTierSection ticketId={t.id} basePrice={t.price_inr} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-[#1a1a2e]/60 z-40" onClick={() => { setDrawerOpen(false); setEditing(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-[#333]">{editing ? "Edit Ticket Tier" : "Add Ticket Tier"}</h3>
              <button onClick={() => { setDrawerOpen(false); setEditing(null) }} className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Ticket Name *</label>
                <input type="text" name="name" required defaultValue={editing?.name ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="VIP Pass" />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Description</label>
                <textarea name="description" rows={2} defaultValue={editing?.description ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none" placeholder="Includes front-row seating and networking dinner…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Price (INR) *</label>
                  <input type="number" name="priceInr" required min="0" defaultValue={editing?.price_inr ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors tabular-nums" placeholder="5000" />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Total Inventory *</label>
                  <input type="number" name="inventoryLimit" required min="1" defaultValue={editing?.inventory_limit ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors tabular-nums" placeholder="100" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Status</label>
                <select name="status" defaultValue={editing?.status ?? "draft"} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setDrawerOpen(false); setEditing(null) }} className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-white text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editing ? "Update Tier" : "Create Tier"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
