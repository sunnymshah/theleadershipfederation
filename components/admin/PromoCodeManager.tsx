"use client"

/**
 * ─── PROMO CODE MANAGER (Zoho Backstage Replica) ────────────────────────
 *
 * Event-scoped promo/discount code management. Table view with
 * usage tracking, validity windows, and active/inactive toggle.
 */

import { useState, useCallback, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { createPromoCode, updatePromoCode, deletePromoCode } from "@/app/actions/promoCodeActions"
import { Plus, Pencil, Trash2, X, Loader2, Tag, Copy, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PromoRow {
  id: string
  event_id: string
  code: string
  discount_type: string
  discount_value: number
  max_uses: number | null
  used_count: number
  valid_from: string | null
  valid_until: string | null
  active: boolean
  created_at: string
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export function PromoCodeManager({ eventId }: { eventId: string }) {
  const [codes, setCodes]           = useState<PromoRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing]       = useState<PromoRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId]     = useState<string | null>(null)

  const supabase = createClient()

  const fetchCodes = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
    if (data) setCodes(data)
    setLoading(false)
  }, [eventId])

  useEffect(() => { fetchCodes() }, [fetchCodes])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)

    const fd = new FormData(e.currentTarget)
    fd.set("eventId", eventId)

    const result = editing
      ? await updatePromoCode(editing.id, fd)
      : await createPromoCode(fd)

    if (result.success) {
      setDrawerOpen(false)
      setEditing(null)
      await fetchCodes()
    } else {
      setActionError(result.error ?? "Operation failed")
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this promo code?")) return
    setDeletingId(id)
    const result = await deletePromoCode(id)
    if (result.success) await fetchCodes()
    else setActionError(result.error ?? "Failed to delete")
    setDeletingId(null)
  }

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  function isExpired(c: PromoRow) {
    return c.valid_until ? new Date(c.valid_until) < new Date() : false
  }

  function isMaxedOut(c: PromoRow) {
    return c.max_uses !== null && c.used_count >= c.max_uses
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#888]">
          {codes.length} code{codes.length !== 1 ? "s" : ""}
          {codes.length > 0 && <> &middot; {codes.filter(c => c.active && !isExpired(c) && !isMaxedOut(c)).length} active</>}
        </p>
        <button
          onClick={() => { setEditing(null); setDrawerOpen(true); setActionError(null) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d4b85c] transition-colors"
        >
          <Plus size={15} /> Create Code
        </button>
      </div>

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
            <Loader2 size={18} className="animate-spin" /> Loading codes…
          </div>
        ) : codes.length === 0 ? (
          <div className="py-16 text-center">
            <Tag size={28} className="mx-auto mb-3 text-[#ccc]" />
            <p className="text-[#999] text-sm">No promo codes yet.</p>
            <p className="text-[#bbb] text-xs mt-1">Create discount codes for early birds, VIPs, or partners.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-white">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Code</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Discount</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Usage</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Validity</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map(c => {
                const expired = isExpired(c)
                const maxed = isMaxedOut(c)
                const live = c.active && !expired && !maxed

                return (
                  <tr key={c.id} className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#333] bg-white px-2.5 py-1 rounded text-[13px] tracking-wider">{c.code}</span>
                        <button
                          onClick={() => copyCode(c.id, c.code)}
                          className="p-1 rounded text-[#bbb] hover:text-[#666] transition-colors"
                        >
                          {copiedId === c.id ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#555]">
                      {c.discount_type === "percentage"
                        ? <span className="text-emerald-400 font-semibold">{c.discount_value}% off</span>
                        : <span className="text-emerald-400 font-semibold">₹{new Intl.NumberFormat("en-IN").format(c.discount_value)} off</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-[#666] text-xs tabular-nums">
                        {c.used_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ""} used
                      </div>
                      {c.max_uses !== null && (
                        <div className="w-16 h-1 bg-[#e0e0e0] rounded-full mt-1 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", maxed ? "bg-red-400" : "bg-[#c9a84c]")}
                            style={{ width: `${Math.min(Math.round((c.used_count / c.max_uses) * 100), 100)}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[11px] text-[#888]">
                      {c.valid_from && c.valid_until ? (
                        <>{fmtDate(c.valid_from)} — {fmtDate(c.valid_until)}</>
                      ) : c.valid_until ? (
                        <>Until {fmtDate(c.valid_until)}</>
                      ) : (
                        "No expiry"
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        "inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider",
                        live ? "bg-emerald-500/10 text-emerald-400"
                          : expired ? "bg-red-500/10 text-red-400"
                          : maxed ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-white/5 text-[#aaa]"
                      )}>
                        {live ? "Active" : expired ? "Expired" : maxed ? "Maxed Out" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditing(c); setDrawerOpen(true); setActionError(null) }} className="p-1.5 rounded-md text-[#aaa] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id} className="p-1.5 rounded-md text-[#aaa] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30">
                          {deletingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Drawer ─────────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-[#1a1a2e]/60 z-40" onClick={() => { setDrawerOpen(false); setEditing(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-[#333]">{editing ? "Edit Promo Code" : "Create Promo Code"}</h3>
              <button onClick={() => { setDrawerOpen(false); setEditing(null) }} className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Promo Code *</label>
                <input type="text" name="code" required defaultValue={editing?.code ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors font-mono uppercase tracking-wider" placeholder="EARLYBIRD20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Discount Type *</label>
                  <select name="discountType" defaultValue={editing?.discount_type ?? "percentage"} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Discount Value *</label>
                  <input type="number" name="discountValue" required min="1" defaultValue={editing?.discount_value ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors tabular-nums" placeholder="20" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Max Uses</label>
                <input type="number" name="maxUses" min="1" defaultValue={editing?.max_uses ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors tabular-nums" placeholder="Leave blank for unlimited" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Valid From</label>
                  <input type="datetime-local" name="validFrom" defaultValue={editing?.valid_from ? new Date(editing.valid_from).toISOString().slice(0, 16) : ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Valid Until</label>
                  <input type="datetime-local" name="validUntil" defaultValue={editing?.valid_until ? new Date(editing.valid_until).toISOString().slice(0, 16) : ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
                </div>
              </div>
              {editing && (
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Active</label>
                  <select name="active" defaultValue={String(editing.active)} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}

              {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setDrawerOpen(false); setEditing(null) }} className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editing ? "Update Code" : "Create Code"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
