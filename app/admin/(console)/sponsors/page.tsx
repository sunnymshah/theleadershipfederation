"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { createSponsor, updateSponsor, deleteSponsor } from "@/app/actions/sponsorActions"
import { Plus, Pencil, Trash2, Search, X, Loader2, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SponsorRow {
  id: string
  event_id: string
  name: string
  tier: string
  logo_url: string | null
  website: string | null
  description: string | null
  sort_order: number
  events: { title: string } | null
}

interface EventOption { id: string; title: string }

const TIER_STYLES: Record<string, { bg: string; text: string }> = {
  title:    { bg: "bg-[#c9a84c]/15", text: "text-[#c9a84c]" },
  platinum: { bg: "bg-zinc-300/10",  text: "text-zinc-300" },
  gold:     { bg: "bg-yellow-500/10", text: "text-yellow-400" },
  silver:   { bg: "bg-zinc-400/10",  text: "text-zinc-400" },
  bronze:   { bg: "bg-amber-700/10", text: "text-amber-600" },
  partner:  { bg: "bg-blue-500/10",  text: "text-blue-400" },
}

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors]         = useState<SponsorRow[]>([])
  const [events, setEvents]             = useState<EventOption[]>([])
  const [loading, setLoading]           = useState(true)
  const [searchQuery, setSearchQuery]   = useState("")
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<SponsorRow | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [actionError, setActionError]   = useState<string | null>(null)
  const [deletingId, setDeletingId]     = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [sponsorRes, eventRes] = await Promise.all([
      supabase.from("sponsors").select("*, events(title)").order("sort_order"),
      supabase.from("events").select("id, title").order("title"),
    ])
    if (sponsorRes.data) setSponsors(sponsorRes.data)
    if (eventRes.data) setEvents(eventRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = sponsors.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.tier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.events?.title ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)
    const fd = new FormData(e.currentTarget)
    const result = editingSponsor ? await updateSponsor(editingSponsor.id, fd) : await createSponsor(fd)
    if (result.success) { setDrawerOpen(false); setEditingSponsor(null); await fetchData() }
    else setActionError(result.error ?? "Operation failed")
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this sponsor?")) return
    setDeletingId(id)
    const result = await deleteSponsor(id)
    if (result.success) await fetchData()
    else setActionError(result.error ?? "Failed to delete")
    setDeletingId(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Sponsors & Partners</h2>
          <p className="text-sm text-white/40">Manage sponsor tiers and partner profiles</p>
        </div>
        <button onClick={() => { setEditingSponsor(null); setDrawerOpen(true); setActionError(null) }} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] transition-colors">
          <Plus size={16} /> New Sponsor
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search sponsors…" className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/15 transition-colors" />
      </div>

      {actionError && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400"><X size={14} /></button>
        </div>
      )}

      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30 gap-2"><Loader2 size={18} className="animate-spin" /> Loading sponsors…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Building2 size={32} className="mx-auto mb-3 text-white/15" />
            <p className="text-white/35 text-sm">{searchQuery ? "No sponsors match your search." : "No sponsors yet. Add your first sponsor."}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Sponsor</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Tier</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Event</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Website</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-white/90">{s.name}</div>
                    {s.description && <div className="text-[11px] text-white/30 mt-0.5 truncate max-w-[200px]">{s.description}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider", TIER_STYLES[s.tier]?.bg ?? "bg-white/5", TIER_STYLES[s.tier]?.text ?? "text-white/40")}>{s.tier}</span>
                  </td>
                  <td className="px-5 py-4 text-white/50 text-xs">{s.events?.title ?? "—"}</td>
                  <td className="px-5 py-4 text-white/50 text-xs truncate max-w-[150px]">{s.website ?? "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditingSponsor(s); setDrawerOpen(true); setActionError(null) }} className="p-2 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors" title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} className="p-2 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30" title="Delete">
                        {deletingId === s.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
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
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => { setDrawerOpen(false); setEditingSponsor(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/[0.08] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-white">{editingSponsor ? "Edit Sponsor" : "Add Sponsor"}</h3>
              <button onClick={() => { setDrawerOpen(false); setEditingSponsor(null) }} className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {!editingSponsor && (
                <div>
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Event *</label>
                  <select name="eventId" required className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                    <option value="">Select event…</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Sponsor Name *</label>
                <input type="text" name="name" required defaultValue={editingSponsor?.name ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Tata Group" />
              </div>
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Tier</label>
                <select name="tier" defaultValue={editingSponsor?.tier ?? "gold"} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                  <option value="title">Title Sponsor</option>
                  <option value="platinum">Platinum</option>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="bronze">Bronze</option>
                  <option value="partner">Partner</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Logo URL</label>
                <input type="url" name="logoUrl" defaultValue={editingSponsor?.logo_url ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Website</label>
                <input type="url" name="website" defaultValue={editingSponsor?.website ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="https://example.com" />
              </div>
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Description</label>
                <textarea name="description" rows={2} defaultValue={editingSponsor?.description ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none" placeholder="Brief description…" />
              </div>
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Sort Order</label>
                <input type="number" name="sortOrder" min="0" defaultValue={editingSponsor?.sort_order ?? 0} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
              </div>
              {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setDrawerOpen(false); setEditingSponsor(null) }} className="flex-1 py-2.5 rounded-lg border border-white/[0.08] text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editingSponsor ? "Update Sponsor" : "Add Sponsor"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
