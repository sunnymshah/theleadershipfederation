"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { createSponsor, updateSponsor, deleteSponsor } from "@/app/actions/sponsorActions"
import { setSponsorPortalAccess } from "@/app/actions/sponsorPortalActions"
import { getLeadCountsBySponsor, getLeads, exportLeadsCSV, getLeadStats, updateLead } from "@/app/actions/leadCaptureActions"
import { Plus, Pencil, Trash2, Search, X, Loader2, Building2, KeyRound, Flame, Download, ScanLine, ChevronDown } from "lucide-react"
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

  // Lead counts per sponsor
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({})

  // Leads drawer state
  const [leadsDrawerOpen, setLeadsDrawerOpen] = useState(false)
  const [leadsSponsor, setLeadsSponsor] = useState<SponsorRow | null>(null)
  const [leadsData, setLeadsData] = useState<Array<Record<string, unknown>>>([])
  const [leadsStats, setLeadsStats] = useState<{ total: number; byInterest: Record<string, number>; byStatus: Record<string, number> } | null>(null)
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [leadsInterestFilter, setLeadsInterestFilter] = useState("")
  const [exportingLeadsCsv, setExportingLeadsCsv] = useState(false)

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
    const [sponsorRes, eventRes, leadCountsRes] = await Promise.all([
      supabase.from("sponsors").select("*, events(title)").order("sort_order"),
      supabase.from("events").select("id, title").order("title"),
      getLeadCountsBySponsor(),
    ])
    if (sponsorRes.data) setSponsors(sponsorRes.data)
    if (eventRes.data) setEvents(eventRes.data)
    if (leadCountsRes.success) setLeadCounts(leadCountsRes.counts)
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
                <th className="text-center px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Leads</th>
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
                  <td className="px-5 py-4 text-center">
                    {(leadCounts[s.id] ?? 0) > 0 ? (
                      <button
                        onClick={async () => {
                          setLeadsSponsor(s)
                          setLeadsDrawerOpen(true)
                          setLoadingLeads(true)
                          setLeadsInterestFilter("")
                          const [leadsRes, statsRes] = await Promise.all([
                            getLeads(s.id, s.event_id),
                            getLeadStats(s.id, s.event_id),
                          ])
                          if (leadsRes.success) setLeadsData(leadsRes.leads as Array<Record<string, unknown>>)
                          if (statsRes.success && statsRes.stats) setLeadsStats(statsRes.stats)
                          setLoadingLeads(false)
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#c9a84c]/10 text-[#c9a84c] text-[12px] font-bold hover:bg-[#c9a84c]/20 transition-colors"
                      >
                        <Flame size={12} />
                        {leadCounts[s.id]}
                      </button>
                    ) : (
                      <span className="text-[#ccc] text-xs">0</span>
                    )}
                  </td>
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

      {/* ── Leads Drawer ──────────────────────────────────────────── */}
      {leadsDrawerOpen && leadsSponsor && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => { setLeadsDrawerOpen(false); setLeadsSponsor(null); setLeadsData([]); setLeadsStats(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-semibold text-[#333]">Leads: {leadsSponsor.name}</h3>
                <p className="text-[11px] text-[#888]">{leadsSponsor.events?.title ?? "All Events"}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setExportingLeadsCsv(true)
                    const result = await exportLeadsCSV(leadsSponsor.id, leadsSponsor.event_id)
                    if (result.success && result.csv) {
                      const blob = new Blob([result.csv], { type: "text/csv" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `leads-${leadsSponsor.name.replace(/\s+/g, "-").toLowerCase()}.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                    }
                    setExportingLeadsCsv(false)
                  }}
                  disabled={exportingLeadsCsv || leadsData.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#c9a84c] text-[#0a0a0a] text-[11px] font-bold hover:bg-[#d4b85c] disabled:opacity-40 transition-colors"
                >
                  {exportingLeadsCsv ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  Export CSV
                </button>
                <button onClick={() => { setLeadsDrawerOpen(false); setLeadsSponsor(null); setLeadsData([]); setLeadsStats(null) }} className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><X size={18} /></button>
              </div>
            </div>
            <div className="p-6">
              {loadingLeads ? (
                <div className="flex items-center justify-center py-16 text-[#aaa] gap-2">
                  <Loader2 size={18} className="animate-spin" /> Loading leads...
                </div>
              ) : (
                <>
                  {/* Stats */}
                  {leadsStats && (
                    <div className="grid grid-cols-4 gap-3 mb-5">
                      {[
                        { label: "Hot", count: leadsStats.byInterest.hot ?? 0, bg: "bg-red-50", text: "text-red-600" },
                        { label: "Warm", count: leadsStats.byInterest.warm ?? 0, bg: "bg-orange-50", text: "text-orange-600" },
                        { label: "Medium", count: leadsStats.byInterest.medium ?? 0, bg: "bg-blue-50", text: "text-blue-600" },
                        { label: "Cold", count: leadsStats.byInterest.cold ?? 0, bg: "bg-gray-50", text: "text-gray-500" },
                      ].map((s) => (
                        <button
                          key={s.label}
                          onClick={() => setLeadsInterestFilter(leadsInterestFilter === s.label.toLowerCase() ? "" : s.label.toLowerCase())}
                          className={cn("rounded-lg p-3 text-center border transition-colors", leadsInterestFilter === s.label.toLowerCase() ? "border-[#c9a84c] ring-2 ring-[#c9a84c]/20" : "border-[#e0e0e0]", s.bg)}
                        >
                          <p className={cn("text-xl font-bold", s.text)}>{s.count}</p>
                          <p className="text-[10px] text-[#888] uppercase tracking-wider font-semibold">{s.label}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Leads list */}
                  {leadsData.length === 0 ? (
                    <div className="text-center py-12">
                      <Flame size={28} className="mx-auto mb-2 text-[#ccc]" />
                      <p className="text-[#999] text-sm">No leads captured yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leadsData
                        .filter((l) => !leadsInterestFilter || (l.interest_level as string) === leadsInterestFilter)
                        .map((lead) => {
                        const interestBadge: Record<string, { bg: string; text: string }> = {
                          hot: { bg: "bg-red-100", text: "text-red-700" },
                          warm: { bg: "bg-orange-100", text: "text-orange-700" },
                          medium: { bg: "bg-blue-100", text: "text-blue-700" },
                          cold: { bg: "bg-gray-100", text: "text-gray-600" },
                        }
                        const badge = interestBadge[(lead.interest_level as string)] ?? interestBadge.medium
                        return (
                          <div key={lead.id as string} className="flex items-center gap-3 px-4 py-3 bg-[#fafafa] rounded-lg border border-[#eee]">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[13px] text-[#333] truncate">{lead.lead_name as string}</span>
                                <span className={cn("inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0", badge.bg, badge.text)}>{lead.interest_level as string}</span>
                              </div>
                              <div className="text-[11px] text-[#888] mt-0.5">
                                {lead.lead_company ? `${lead.lead_company}` : ""}
                                {lead.lead_company && lead.lead_email ? " · " : ""}
                                {lead.lead_email ? `${lead.lead_email}` : ""}
                              </div>
                            </div>
                            <div className="text-[10px] text-[#aaa] shrink-0">
                              {lead.captured_via === "qr_scan" && <ScanLine size={12} className="text-[#c9a84c] inline mr-1" />}
                              {new Date(lead.captured_at as string).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
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
