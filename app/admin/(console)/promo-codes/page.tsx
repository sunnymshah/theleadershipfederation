"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { Plus, Pencil, Trash2, Search, X, Loader2, Tag } from "lucide-react"
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
  events: { title: string } | null
}

interface EventOption { id: string; title: string }

export default function AdminPromoCodesPage() {
  const [promos, setPromos]             = useState<PromoRow[]>([])
  const [events, setEvents]             = useState<EventOption[]>([])
  const [loading, setLoading]           = useState(true)
  const [searchQuery, setSearchQuery]   = useState("")
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [editing, setEditing]           = useState<PromoRow | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [actionError, setActionError]   = useState<string | null>(null)
  const [deletingId, setDeletingId]     = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [promoRes, eventRes] = await Promise.all([
      supabase.from("promo_codes").select("*, events(title)").order("created_at", { ascending: false }),
      supabase.from("events").select("id, title").order("title"),
    ])
    if (promoRes.data) setPromos(promoRes.data)
    if (eventRes.data) setEvents(eventRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = promos.filter((p) =>
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.events?.title ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)
    const fd = new FormData(e.currentTarget)

    const payload = {
      event_id: editing ? undefined : (fd.get("eventId") as string),
      code: (fd.get("code") as string).toUpperCase().trim(),
      discount_type: fd.get("discountType") as string,
      discount_value: parseInt(fd.get("discountValue") as string) || 0,
      max_uses: parseInt(fd.get("maxUses") as string) || null,
      valid_from: (fd.get("validFrom") as string) ? new Date(fd.get("validFrom") as string).toISOString() : null,
      valid_until: (fd.get("validUntil") as string) ? new Date(fd.get("validUntil") as string).toISOString() : null,
      active: fd.get("active") === "true",
    }

    const { error } = editing
      ? await supabase.from("promo_codes").update(payload).eq("id", editing.id)
      : await supabase.from("promo_codes").insert({ ...payload, event_id: fd.get("eventId") as string })

    if (error) { setActionError(error.message); setSubmitting(false); return }

    setDrawerOpen(false)
    setEditing(null)
    await fetchData()
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this promo code?")) return
    setDeletingId(id)
    await supabase.from("promo_codes").delete().eq("id", id)
    await fetchData()
    setDeletingId(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#333] mb-1">Promo Codes</h2>
          <p className="text-sm text-[#888]">Create discount codes for ticket purchases</p>
        </div>
        <button onClick={() => { setEditing(null); setDrawerOpen(true); setActionError(null) }} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] transition-colors">
          <Plus size={16} /> New Code
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search codes…" className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#ccc] transition-colors" />
      </div>

      {actionError && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400"><X size={14} /></button>
        </div>
      )}

      <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#aaa] gap-2"><Loader2 size={18} className="animate-spin" /> Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Tag size={32} className="mx-auto mb-3 text-[#ccc]" />
            <p className="text-[#999] text-sm">No promo codes yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-white">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Code</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Discount</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Usage</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Event</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-[#c9a84c] tracking-wider">{p.code}</td>
                  <td className="px-5 py-4 text-[#555] text-xs">
                    {p.discount_type === "percentage" ? `${p.discount_value}%` : `₹${p.discount_value}`} off
                  </td>
                  <td className="px-5 py-4 text-[#777] text-xs">
                    {p.used_count}{p.max_uses ? ` / ${p.max_uses}` : ""} used
                  </td>
                  <td className="px-5 py-4 text-[#777] text-xs">{p.events?.title ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider", p.active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditing(p); setDrawerOpen(true); setActionError(null) }} className="p-2 rounded-md text-[#aaa] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="p-2 rounded-md text-[#aaa] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30">
                        {deletingId === p.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => { setDrawerOpen(false); setEditing(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-[#333]">{editing ? "Edit Promo Code" : "Create Promo Code"}</h3>
              <button onClick={() => { setDrawerOpen(false); setEditing(null) }} className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {!editing && (
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Event *</label>
                  <select name="eventId" required className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                    <option value="">Select event…</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Code *</label>
                <input type="text" name="code" required defaultValue={editing?.code ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors font-mono uppercase tracking-wider" placeholder="EARLYBIRD20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Type</label>
                  <select name="discountType" defaultValue={editing?.discount_type ?? "percentage"} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Value *</label>
                  <input type="number" name="discountValue" required min="1" defaultValue={editing?.discount_value ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="20" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Max Uses (blank = unlimited)</label>
                <input type="number" name="maxUses" min="1" defaultValue={editing?.max_uses ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
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
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Status</label>
                <select name="active" defaultValue={editing?.active !== false ? "true" : "false"} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setDrawerOpen(false); setEditing(null) }} className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editing ? "Update" : "Create Code"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
