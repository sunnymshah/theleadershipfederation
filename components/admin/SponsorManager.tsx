"use client"

/**
 * ─── SPONSOR MANAGER (Zoho Backstage Replica) ──────────────────────────
 *
 * Event-scoped sponsor/partner management with tier-based organization,
 * logo upload, and drag-and-drop ordering.
 */

import { useState, useCallback, useEffect, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { createSponsor, updateSponsor, deleteSponsor } from "@/app/actions/sponsorActions"
import { Plus, Pencil, Trash2, X, Loader2, Building2, Upload, Globe } from "lucide-react"
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
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  title:    { label: "Title Sponsor",    color: "text-[#c9a84c]",   bg: "bg-[#c9a84c]/10",  border: "border-[#c9a84c]/30" },
  platinum: { label: "Platinum",         color: "text-gray-300",     bg: "bg-gray-300/10",    border: "border-gray-400/30" },
  gold:     { label: "Gold",             color: "text-yellow-500",   bg: "bg-yellow-500/10",  border: "border-yellow-500/30" },
  silver:   { label: "Silver",           color: "text-gray-400",     bg: "bg-gray-400/10",    border: "border-gray-500/30" },
  bronze:   { label: "Bronze",           color: "text-orange-600",   bg: "bg-orange-600/10",  border: "border-orange-600/30" },
  partner:  { label: "Partner",          color: "text-blue-400",     bg: "bg-blue-500/10",    border: "border-blue-500/30" },
}

const TIER_ORDER = ["title", "platinum", "gold", "silver", "bronze", "partner"]

export function SponsorManager({ eventId }: { eventId: string }) {
  const [sponsors, setSponsors]     = useState<SponsorRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing]       = useState<SponsorRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const fetchSponsors = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("sponsors")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    if (data) setSponsors(data)
    setLoading(false)
  }, [eventId])

  useEffect(() => { fetchSponsors() }, [fetchSponsors])

  // Group by tier
  const grouped = TIER_ORDER.reduce<Record<string, SponsorRow[]>>((acc, tier) => {
    const items = sponsors.filter(s => s.tier === tier)
    if (items.length > 0) acc[tier] = items
    return acc
  }, {})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)

    const fd = new FormData(e.currentTarget)
    fd.set("eventId", eventId)

    const result = editing
      ? await updateSponsor(editing.id, fd)
      : await createSponsor(fd)

    if (result.success) {
      setDrawerOpen(false)
      setEditing(null)
      setPreviewUrl(null)
      await fetchSponsors()
    } else {
      setActionError(result.error ?? "Operation failed")
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this sponsor?")) return
    setDeletingId(id)
    const result = await deleteSponsor(id)
    if (result.success) await fetchSponsors()
    else setActionError(result.error ?? "Failed to delete")
    setDeletingId(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreviewUrl(URL.createObjectURL(file))
  }

  function openDrawer(sponsor?: SponsorRow) {
    setEditing(sponsor ?? null)
    setDrawerOpen(true)
    setActionError(null)
    setPreviewUrl(sponsor?.logo_url ?? null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#888]">
          {sponsors.length} sponsor{sponsors.length !== 1 ? "s" : ""} across {Object.keys(grouped).length} tier{Object.keys(grouped).length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => openDrawer()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] text-white text-sm font-bold hover:bg-[#d4b85c] transition-colors"
        >
          <Plus size={15} /> Add Sponsor
        </button>
      </div>

      {actionError && (
        <div className="mb-5 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400"><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#aaa] gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading sponsors…
        </div>
      ) : sponsors.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-[#e0e0e0]">
          <Building2 size={28} className="mx-auto mb-3 text-[#ccc]" />
          <p className="text-[#999] text-sm">No sponsors added yet.</p>
          <p className="text-[#bbb] text-xs mt-1">Add title sponsors, partners, and exhibitors.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([tier, items]) => {
            const tc = TIER_CONFIG[tier] ?? TIER_CONFIG.gold
            return (
              <div key={tier}>
                {/* Tier Header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className={cn("px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider", tc.bg, tc.color)}>
                    {tc.label}
                  </span>
                  <div className="flex-1 h-px bg-[#e0e0e0]" />
                  <span className="text-[11px] text-[#bbb]">{items.length}</span>
                </div>

                {/* Sponsor Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map(s => (
                    <div key={s.id} className={cn("group rounded-xl border bg-white hover:bg-[#fafafa] transition-all overflow-hidden", tc.border)}>
                      <div className="p-5 flex items-center gap-4">
                        {/* Logo */}
                        {s.logo_url ? (
                          <img src={s.logo_url} alt={s.name} className="w-14 h-14 rounded-lg object-contain bg-[#f0f0f0] p-1 shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-[#f0f0f0] flex items-center justify-center shrink-0">
                            <Building2 size={20} className="text-[#bbb]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#333] text-[14px]">{s.name}</div>
                          {s.website && (
                            <a href={s.website} target="_blank" rel="noopener" className="flex items-center gap-1 text-[11px] text-[#aaa] hover:text-[#c9a84c] transition-colors mt-0.5">
                              <Globe size={10} /> {s.website.replace(/https?:\/\/(www\.)?/, "").slice(0, 30)}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="px-5 py-2 border-t border-[#e0e0e0] flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openDrawer(s)} className="p-1.5 rounded-md text-[#aaa] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} className="p-1.5 rounded-md text-[#aaa] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30">
                          {deletingId === s.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Drawer ─────────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-[#1a1a2e]/60 z-40" onClick={() => { setDrawerOpen(false); setEditing(null); setPreviewUrl(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-[#333]">{editing ? "Edit Sponsor" : "Add Sponsor"}</h3>
              <button onClick={() => { setDrawerOpen(false); setEditing(null); setPreviewUrl(null) }} className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Logo Upload */}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-2">Company Logo</label>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-[#e0e0e0] hover:border-[#c9a84c]/40 flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-white shrink-0"
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Upload size={18} className="text-[#bbb]" />
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" name="logo" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <div>
                    <p className="text-[11px] text-[#aaa]">Upload logo (max 5MB)</p>
                    {previewUrl && (
                      <button type="button" onClick={() => { setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = "" }} className="text-[11px] text-red-400/60 hover:text-red-400 mt-1">Remove</button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Or paste logo URL</label>
                <input type="url" name="logoUrl" defaultValue={editing?.logo_url ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="https://..." />
              </div>

              <hr className="border-[#e0e0e0]" />

              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Sponsor Name *</label>
                <input type="text" name="name" required defaultValue={editing?.name ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Acme Corp" />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Tier *</label>
                <select name="tier" defaultValue={editing?.tier ?? "gold"} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                  {TIER_ORDER.map(t => <option key={t} value={t}>{TIER_CONFIG[t].label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Website</label>
                <input type="url" name="website" defaultValue={editing?.website ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="https://acme.com" />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Description</label>
                <textarea name="description" rows={2} defaultValue={editing?.description ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none" placeholder="Brief sponsor description…" />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Sort Order</label>
                <input type="number" name="sortOrder" min="0" defaultValue={editing?.sort_order ?? 0} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
              </div>

              {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setDrawerOpen(false); setEditing(null); setPreviewUrl(null) }} className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#555] hover:bg-[#fafafa] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-white text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editing ? "Update Sponsor" : "Add Sponsor"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
