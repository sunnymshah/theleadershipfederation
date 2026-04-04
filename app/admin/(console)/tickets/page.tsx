"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { createTicket, updateTicket, deleteTicket } from "@/app/actions/ticketActions"
import { Plus, Pencil, Trash2, Search, X, Ticket, Loader2, IndianRupee } from "lucide-react"
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
  events: { title: string } | null
}

interface EventOption {
  id: string
  title: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft:     { bg: "bg-yellow-500/10", text: "text-yellow-600" },
  published: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  archived:  { bg: "bg-zinc-500/10",   text: "text-zinc-500" },
}

export default function AdminTicketsPage() {
  const [tickets, setTickets]       = useState<TicketRow[]>([])
  const [events, setEvents]         = useState<EventOption[]>([])
  const [loading, setLoading]       = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<TicketRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [ticketRes, eventRes] = await Promise.all([
      supabase.from("tickets").select("*, events(title)").order("created_at", { ascending: false }),
      supabase.from("events").select("id, title").order("title"),
    ])
    if (ticketRes.data) setTickets(ticketRes.data)
    if (eventRes.data) setEvents(eventRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = tickets.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.events?.title ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)
    const fd = new FormData(e.currentTarget)
    const result = editingTicket
      ? await updateTicket(editingTicket.id, fd)
      : await createTicket(fd)
    if (result.success) {
      setDrawerOpen(false)
      setEditingTicket(null)
      await fetchData()
    } else {
      setActionError(result.error ?? "Operation failed")
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this ticket tier?")) return
    setDeletingId(id)
    const result = await deleteTicket(id)
    if (result.success) await fetchData()
    else setActionError(result.error ?? "Failed to delete")
    setDeletingId(null)
  }

  function openEdit(ticket: TicketRow) {
    setEditingTicket(ticket)
    setDrawerOpen(true)
    setActionError(null)
  }

  function openCreate() {
    setEditingTicket(null)
    setDrawerOpen(true)
    setActionError(null)
  }

  function fmtPrice(n: number) {
    return new Intl.NumberFormat("en-IN").format(n)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#333] mb-1">Tickets</h2>
          <p className="text-sm text-[#888]">Manage ticket tiers and pricing for all events</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] transition-colors">
          <Plus size={16} /> New Ticket
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by ticket name or event…" className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#ccc] transition-colors" />
      </div>

      {actionError && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400"><X size={14} /></button>
        </div>
      )}

      <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#aaa] gap-2"><Loader2 size={18} className="animate-spin" /> Loading tickets…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Ticket size={32} className="mx-auto mb-3 text-[#ccc]" />
            <p className="text-[#999] text-sm">{searchQuery ? "No tickets match your search." : "No tickets yet. Create your first ticket tier."}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Ticket Name</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Event</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Price</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Sold / Limit</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-[#333]">{t.name}</div>
                    {t.description && <div className="text-[11px] text-[#aaa] mt-0.5 truncate max-w-[200px]">{t.description}</div>}
                  </td>
                  <td className="px-5 py-4 text-[#777] text-xs">{t.events?.title ?? "—"}</td>
                  <td className="px-5 py-4 text-[#555] font-mono text-xs">
                    {t.price_inr === 0 ? <span className="text-emerald-600">Free</span> : <>₹{fmtPrice(t.price_inr)}</>}
                  </td>
                  <td className="px-5 py-4 text-[#777] text-xs">
                    <span className="text-[#555] font-medium">{t.sold}</span> / {t.inventory_limit}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider", STATUS_STYLES[t.status]?.bg ?? "bg-gray-100", STATUS_STYLES[t.status]?.text ?? "text-[#888]")}>{t.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(t)} className="p-2 rounded-md text-[#aaa] hover:text-[#555] hover:bg-[#fafafa] transition-colors" title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id} className="p-2 rounded-md text-[#aaa] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30" title="Delete">
                        {deletingId === t.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Drawer ─────────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => { setDrawerOpen(false); setEditingTicket(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-[#333]">{editingTicket ? "Edit Ticket" : "Create Ticket"}</h3>
              <button onClick={() => { setDrawerOpen(false); setEditingTicket(null) }} className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {!editingTicket && (
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Event *</label>
                  <select name="eventId" required className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                    <option value="">Select event…</option>
                    {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Ticket Name *</label>
                <input type="text" name="name" required defaultValue={editingTicket?.name ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="VIP Pass" />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Description</label>
                <input type="text" name="description" defaultValue={editingTicket?.description ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Full access + networking dinner" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Price (INR)</label>
                  <input type="number" name="priceInr" min="0" defaultValue={editingTicket?.price_inr ?? 0} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Inventory Limit</label>
                  <input type="number" name="inventoryLimit" min="0" defaultValue={editingTicket?.inventory_limit ?? 100} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Status</label>
                <select name="status" defaultValue={editingTicket?.status ?? "draft"} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setDrawerOpen(false); setEditingTicket(null) }} className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editingTicket ? "Update Ticket" : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
