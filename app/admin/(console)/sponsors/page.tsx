"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { createSponsor, updateSponsor, deleteSponsor } from "@/app/actions/sponsorActions"
import { setSponsorPortalAccess } from "@/app/actions/sponsorPortalActions"
import { Plus, Pencil, Trash2, Search, X, Loader2, Building2, KeyRound } from "lucide-react"
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
  contact_email: string | null
  portal_password: string | null
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

  // Portal access drawer state
  const [portalDrawerOpen, setPortalDrawerOpen] = useState(false)
  const [portalSponsor, setPortalSponsor]       = useState<SponsorRow | null>(null)
  const [portalEmail, setPortalEmail]           = useState("")
  const [portalPassword, setPortalPassword]     = useState("")
  const [savingPortal, setSavingPortal]         = useState(false)
  const [portalError, setPortalError]           = useState<string | null>(null)
  const [portalSuccess, setPortalSuccess]       = useState<string | null>(null)

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
          <h2 className="text-2xl font-bold text-[#333] mb-1">Sponsors & Partners</h2>
          <p className="text-sm text-[#888]">Manage sponsor tiers and partner profiles</p>
        </div>
        <button onClick={() => { setEditingSponsor(null); setDrawerOpen(true); setActionError(null) }} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] transition-colors">
          <Plus size={16} /> New Sponsor
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search sponsors…" className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#aaa] focus:outline-none focus:border-[#ccc] transition-colors" />
      </div>

      {actionError && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400"><X size={14} /></button>
        </div>
      )}

      <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#aaa] gap-2"><Loader2 size={18} className="animate-spin" /> Loading sponsors…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Building2 size={32} className="mx-auto mb-3 text-[#ccc]" />
            <p className="text-[#999] text-sm">{searchQuery ? "No sponsors match your search." : "No sponsors yet. Add your first sponsor."}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Sponsor</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Tier</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Event</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Website</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-[#333]">{s.name}</div>
                    {s.description && <div className="text-[11px] text-[#aaa] mt-0.5 truncate max-w-[200px]">{s.description}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider", TIER_STYLES[s.tier]?.bg ?? "bg-gray-100", TIER_STYLES[s.tier]?.text ?? "text-[#888]")}>{s.tier}</span>
                  </td>
                  <td className="px-5 py-4 text-[#777] text-xs">{s.events?.title ?? "—"}</td>
                  <td className="px-5 py-4 text-[#777] text-xs truncate max-w-[150px]">{s.website ?? "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setPortalSponsor(s); setPortalEmail(s.contact_email ?? ""); setPortalPassword(s.portal_password ?? ""); setPortalDrawerOpen(true); setPortalError(null); setPortalSuccess(null) }} className={cn("p-2 rounded-md transition-colors", s.contact_email ? "text-[#c9a84c] hover:text-[#b8972f] hover:bg-[#c9a84c]/10" : "text-[#aaa] hover:text-[#555] hover:bg-[#fafafa]")} title="Set Portal Access"><KeyRound size={15} /></button>
                      <button onClick={() => { setEditingSponsor(s); setDrawerOpen(true); setActionError(null) }} className="p-2 rounded-md text-[#aaa] hover:text-[#555] hover:bg-[#fafafa] transition-colors" title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} className="p-2 rounded-md text-[#aaa] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30" title="Delete">
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

      {/* ── Portal Access Drawer ─────────────────────────────────── */}
      {portalDrawerOpen && portalSponsor && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => { setPortalDrawerOpen(false); setPortalSponsor(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-[#333]">Set Portal Access</h3>
              <button onClick={() => { setPortalDrawerOpen(false); setPortalSponsor(null) }} className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-4 rounded-lg bg-[#f8f8f8] border border-[#e8e8e8]">
                <p className="text-[13px] font-semibold text-[#333]">{portalSponsor.name}</p>
                <p className="text-[11px] text-[#888] mt-0.5">{portalSponsor.tier.charAt(0).toUpperCase() + portalSponsor.tier.slice(1)} sponsor</p>
              </div>

              <p className="text-[12px] text-[#777] leading-relaxed">
                Set the contact email and portal password so this sponsor can log in at{" "}
                <span className="text-[#c9a84c] font-medium">/sponsor-portal</span>{" "}
                to manage their profile, upload logos, and update booth details.
              </p>

              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Contact Email *</label>
                <input type="email" value={portalEmail} onChange={(e) => setPortalEmail(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#aaa] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="sponsor@company.com" />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Portal Password *</label>
                <input type="text" value={portalPassword} onChange={(e) => setPortalPassword(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#aaa] focus:outline-none focus:border-[#c9a84c]/50 transition-colors font-mono" placeholder="Enter a portal password" />
                <p className="text-[10px] text-[#aaa] mt-1">Shared with the sponsor for portal login. Not encrypted.</p>
              </div>

              {portalError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{portalError}</div>}
              {portalSuccess && <div className="px-3 py-2.5 rounded-lg bg-green-500/8 border border-green-500/15 text-green-600 text-sm">{portalSuccess}</div>}

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setPortalDrawerOpen(false); setPortalSponsor(null) }} className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors">Cancel</button>
                <button
                  type="button"
                  disabled={savingPortal}
                  onClick={async () => {
                    setSavingPortal(true)
                    setPortalError(null)
                    setPortalSuccess(null)
                    const result = await setSponsorPortalAccess(portalSponsor.id, portalEmail, portalPassword)
                    if (result.success) {
                      setPortalSuccess("Portal access saved successfully")
                      await fetchData()
                    } else {
                      setPortalError(result.error ?? "Failed to set portal access")
                    }
                    setSavingPortal(false)
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {savingPortal ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save Portal Access"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sponsor Edit Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => { setDrawerOpen(false); setEditingSponsor(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-[#333]">{editingSponsor ? "Edit Sponsor" : "Add Sponsor"}</h3>
              <button onClick={() => { setDrawerOpen(false); setEditingSponsor(null) }} className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {!editingSponsor && (
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Event *</label>
                  <select name="eventId" required className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                    <option value="">Select event…</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Sponsor Name *</label>
                <input type="text" name="name" required defaultValue={editingSponsor?.name ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#aaa] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Tata Group" />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Tier</label>
                <select name="tier" defaultValue={editingSponsor?.tier ?? "gold"} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                  <option value="title">Title Sponsor</option>
                  <option value="platinum">Platinum</option>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="bronze">Bronze</option>
                  <option value="partner">Partner</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Logo URL</label>
                <input type="url" name="logoUrl" defaultValue={editingSponsor?.logo_url ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#aaa] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Website</label>
                <input type="url" name="website" defaultValue={editingSponsor?.website ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#aaa] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="https://example.com" />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Description</label>
                <textarea name="description" rows={2} defaultValue={editingSponsor?.description ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#aaa] focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none" placeholder="Brief description…" />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Sort Order</label>
                <input type="number" name="sortOrder" min="0" defaultValue={editingSponsor?.sort_order ?? 0} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
              </div>
              {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setDrawerOpen(false); setEditingSponsor(null) }} className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors">Cancel</button>
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
