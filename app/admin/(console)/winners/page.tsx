"use client"

import { useState, useEffect, useCallback } from "react"
import {
  getAwardEditions,
  getAwardWinners,
  addAwardEdition,
  updateAwardEdition,
  deleteAwardEdition,
  addAwardWinner,
  updateAwardWinner,
  deleteAwardWinner,
} from "@/app/actions/winnerActions"
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Loader2,
  Trophy,
  MapPin,
  Calendar,
  Users,
  Award,
  Building2,
} from "lucide-react"

/* ── Types ─────────────────────────────────────────────────────────── */

interface EditionRow {
  id: string
  name: string
  slug: string
  event_name: string
  year: number
  city: string | null
  country: string | null
  sort_order: number
}

interface WinnerRow {
  id: string
  edition_id: string
  name: string
  company: string | null
  designation: string | null
  award_category: string | null
  image_url: string | null
  linkedin_url: string | null
  sort_order: number
  award_editions?: {
    name: string
    slug: string
    event_name: string
    year: number
    city: string | null
    country: string | null
  } | null
}

type Tab = "editions" | "winners"

/* ══════════════════════════════════════════════════════════════════════ */
export default function AdminWinnersPage() {
  const [activeTab, setActiveTab]           = useState<Tab>("editions")
  const [editions, setEditions]             = useState<EditionRow[]>([])
  const [winners, setWinners]               = useState<WinnerRow[]>([])
  const [loading, setLoading]               = useState(true)
  const [searchQuery, setSearchQuery]       = useState("")
  const [selectedEdition, setSelectedEdition] = useState<string>("")
  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [editingEdition, setEditingEdition] = useState<EditionRow | null>(null)
  const [editingWinner, setEditingWinner]   = useState<WinnerRow | null>(null)
  const [submitting, setSubmitting]         = useState(false)
  const [actionError, setActionError]       = useState<string | null>(null)
  const [deletingId, setDeletingId]         = useState<string | null>(null)

  /* ── Data fetching ─────────────────────────────────────────────── */

  const fetchEditions = useCallback(async () => {
    const result = await getAwardEditions()
    if (result.success && result.editions) {
      setEditions(result.editions as EditionRow[])
    }
  }, [])

  const fetchWinners = useCallback(async () => {
    const result = await getAwardWinners(selectedEdition || undefined)
    if (result.success && result.winners) {
      setWinners(result.winners as WinnerRow[])
    }
  }, [selectedEdition])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchEditions(), fetchWinners()]).then(() => setLoading(false))
  }, [fetchEditions, fetchWinners])

  /* Refetch winners when edition filter changes */
  useEffect(() => {
    fetchWinners()
  }, [selectedEdition, fetchWinners])

  /* ── Filter ────────────────────────────────────────────────────── */

  const filteredEditions = editions.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.city ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredWinners = winners.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.company ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.award_category ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  /* ── Handlers ──────────────────────────────────────────────────── */

  async function handleEditionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)
    const fd = new FormData(e.currentTarget)
    const result = editingEdition
      ? await updateAwardEdition(editingEdition.id, fd)
      : await addAwardEdition(fd)
    if (result.success) {
      setDrawerOpen(false)
      setEditingEdition(null)
      await fetchEditions()
    } else {
      setActionError(result.error ?? "Operation failed")
    }
    setSubmitting(false)
  }

  async function handleWinnerSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)
    const fd = new FormData(e.currentTarget)
    const result = editingWinner
      ? await updateAwardWinner(editingWinner.id, fd)
      : await addAwardWinner(fd)
    if (result.success) {
      setDrawerOpen(false)
      setEditingWinner(null)
      await fetchWinners()
    } else {
      setActionError(result.error ?? "Operation failed")
    }
    setSubmitting(false)
  }

  async function handleDeleteEdition(id: string) {
    if (!confirm("Delete this edition and all its winners?")) return
    setDeletingId(id)
    const result = await deleteAwardEdition(id)
    if (result.success) {
      await Promise.all([fetchEditions(), fetchWinners()])
    } else {
      setActionError(result.error ?? "Failed to delete")
    }
    setDeletingId(null)
  }

  async function handleDeleteWinner(id: string) {
    if (!confirm("Delete this winner?")) return
    setDeletingId(id)
    const result = await deleteAwardWinner(id)
    if (result.success) await fetchWinners()
    else setActionError(result.error ?? "Failed to delete")
    setDeletingId(null)
  }

  function openEditionDrawer(edition?: EditionRow) {
    setEditingEdition(edition ?? null)
    setEditingWinner(null)
    setDrawerOpen(true)
    setActionError(null)
  }

  function openWinnerDrawer(winner?: WinnerRow) {
    setEditingWinner(winner ?? null)
    setEditingEdition(null)
    setDrawerOpen(true)
    setActionError(null)
  }

  /* ══════════════════════════════════════════════════════════════════════
   *  RENDER
   * ══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#333] mb-1">Award Winners</h2>
          <p className="text-sm text-[#888]">Manage award editions and winners across all TLF events</p>
        </div>
        <button
          onClick={() => activeTab === "editions" ? openEditionDrawer() : openWinnerDrawer()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a84c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d4b85c] transition-colors"
        >
          <Plus size={16} />
          {activeTab === "editions" ? "New Edition" : "New Winner"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-[#f5f5f5] rounded-lg w-fit">
        <button
          onClick={() => { setActiveTab("editions"); setSearchQuery("") }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            activeTab === "editions"
              ? "bg-white text-[#333] shadow-sm"
              : "text-[#888] hover:text-[#555]"
          }`}
        >
          <Trophy size={15} />
          Editions ({editions.length})
        </button>
        <button
          onClick={() => { setActiveTab("winners"); setSearchQuery("") }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            activeTab === "winners"
              ? "bg-white text-[#333] shadow-sm"
              : "text-[#888] hover:text-[#555]"
          }`}
        >
          <Award size={15} />
          Winners ({winners.length})
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === "editions" ? "Search editions..." : "Search winners by name, company, or category..."}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#ccc] transition-colors"
          />
        </div>
        {activeTab === "winners" && (
          <select
            value={selectedEdition}
            onChange={(e) => setSelectedEdition(e.target.value)}
            className="px-4 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc] transition-colors min-w-[200px]"
          >
            <option value="">All Editions</option>
            {editions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.year})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Error banner */}
      {actionError && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400"><X size={14} /></button>
        </div>
      )}

      {/* ── EDITIONS TABLE ── */}
      {activeTab === "editions" && (
        <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-[#aaa] gap-2">
              <Loader2 size={18} className="animate-spin" /> Loading editions...
            </div>
          ) : filteredEditions.length === 0 ? (
            <div className="py-20 text-center">
              <Trophy size={32} className="mx-auto mb-3 text-[#ccc]" />
              <p className="text-[#999] text-sm">
                {searchQuery ? "No editions match your search." : "No editions yet. Add your first award edition."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#f9f9f9]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Edition</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Event Series</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Year</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Location</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEditions.map((edition) => (
                  <tr key={edition.id} className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#e7ab1c]/10 border border-[#e7ab1c]/20 flex items-center justify-center shrink-0">
                          <Trophy size={15} className="text-[#e7ab1c]" />
                        </div>
                        <div>
                          <div className="font-medium text-[#333]">{edition.name}</div>
                          <div className="text-[11px] text-[#aaa]">{edition.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#777] text-xs">{edition.event_name}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-xs text-[#777]">
                        <Calendar size={12} className="text-[#bbb]" />
                        {edition.year}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-xs text-[#777]">
                        <MapPin size={12} className="text-[#bbb]" />
                        {edition.city ? `${edition.city}, ${edition.country}` : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditionDrawer(edition)}
                          className="p-2 rounded-md text-[#aaa] hover:text-[#555] hover:bg-[#fafafa] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteEdition(edition.id)}
                          disabled={deletingId === edition.id}
                          className="p-2 rounded-md text-[#aaa] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                          title="Delete"
                        >
                          {deletingId === edition.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── WINNERS TABLE ── */}
      {activeTab === "winners" && (
        <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-[#aaa] gap-2">
              <Loader2 size={18} className="animate-spin" /> Loading winners...
            </div>
          ) : filteredWinners.length === 0 ? (
            <div className="py-20 text-center">
              <Award size={32} className="mx-auto mb-3 text-[#ccc]" />
              <p className="text-[#999] text-sm">
                {searchQuery || selectedEdition
                  ? "No winners match your filters."
                  : "No winners yet. Add your first award winner."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#f9f9f9]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Winner</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Company</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Edition</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWinners.map((w) => (
                  <tr key={w.id} className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#eee] flex items-center justify-center text-[#888] text-xs font-bold shrink-0">
                          {w.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-[#333]">{w.name}</div>
                          {w.designation && <div className="text-[11px] text-[#aaa]">{w.designation}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#777] text-xs">
                      {w.company ? (
                        <span className="inline-flex items-center gap-1">
                          <Building2 size={12} className="text-[#bbb]" />
                          {w.company}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-4 text-[#777] text-xs">{w.award_category ?? "—"}</td>
                    <td className="px-5 py-4 text-[#777] text-xs">
                      {w.award_editions ? `${w.award_editions.name} (${w.award_editions.year})` : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openWinnerDrawer(w)}
                          className="p-2 rounded-md text-[#aaa] hover:text-[#555] hover:bg-[#fafafa] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteWinner(w.id)}
                          disabled={deletingId === w.id}
                          className="p-2 rounded-md text-[#aaa] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                          title="Delete"
                        >
                          {deletingId === w.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
       *  DRAWER
       * ══════════════════════════════════════════════════════════════════════ */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-[#1a1a2e]/60 z-40" onClick={() => { setDrawerOpen(false); setEditingEdition(null); setEditingWinner(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-[#333]">
                {/* Determine title */}
                {activeTab === "editions"
                  ? editingEdition ? "Edit Edition" : "Add Edition"
                  : editingWinner ? "Edit Winner" : "Add Winner"}
              </h3>
              <button
                onClick={() => { setDrawerOpen(false); setEditingEdition(null); setEditingWinner(null) }}
                className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── EDITION FORM ── */}
            {activeTab === "editions" && (
              <form onSubmit={handleEditionSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Edition Name *</label>
                  <input type="text" name="name" required defaultValue={editingEdition?.name ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="5th Asia Leadership Awards" />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Slug *</label>
                  <input type="text" name="slug" required defaultValue={editingEdition?.slug ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="5th-ala-mumbai" />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Event Series Name *</label>
                  <input type="text" name="eventName" required defaultValue={editingEdition?.event_name ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Asia Leadership Awards" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Year *</label>
                    <input type="number" name="year" required min="2015" max="2035" defaultValue={editingEdition?.year ?? new Date().getFullYear()} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Sort Order</label>
                    <input type="number" name="sortOrder" min="0" defaultValue={editingEdition?.sort_order ?? 0} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">City</label>
                    <input type="text" name="city" defaultValue={editingEdition?.city ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Country</label>
                    <input type="text" name="country" defaultValue={editingEdition?.country ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="India" />
                  </div>
                </div>

                {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}

                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => { setDrawerOpen(false); setEditingEdition(null) }} className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : editingEdition ? "Update Edition" : "Add Edition"}
                  </button>
                </div>
              </form>
            )}

            {/* ── WINNER FORM ── */}
            {activeTab === "winners" && (
              <form onSubmit={handleWinnerSubmit} className="p-6 space-y-5">
                {!editingWinner && (
                  <div>
                    <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Edition *</label>
                    <select name="editionId" required className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                      <option value="">Select edition...</option>
                      {editions.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.year})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input type="text" name="name" required defaultValue={editingWinner?.name ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Rajesh Verma" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Designation</label>
                    <input type="text" name="designation" defaultValue={editingWinner?.designation ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="CEO" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Company</label>
                    <input type="text" name="company" defaultValue={editingWinner?.company ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Global Tech Solutions" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Award Category</label>
                  <input type="text" name="awardCategory" defaultValue={editingWinner?.award_category ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Leadership Excellence in Technology" />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">LinkedIn URL</label>
                  <input type="url" name="linkedinUrl" defaultValue={editingWinner?.linkedin_url ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="https://linkedin.com/in/..." />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Winner Photo</label>
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#e0e0e0] rounded-lg cursor-pointer hover:border-[#c9a84c]/50 hover:bg-[#c9a84c]/5 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#bbb] mb-1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                    <span className="text-xs text-[#999]">Click to upload photo</span>
                    <span className="text-[10px] text-[#ccc] mt-0.5">JPG, PNG up to 2MB</span>
                    <input type="file" name="photo" accept="image/*" className="hidden" />
                  </label>
                  <input type="hidden" name="imageUrl" defaultValue={editingWinner?.image_url ?? ""} />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Sort Order</label>
                  <input type="number" name="sortOrder" min="0" defaultValue={editingWinner?.sort_order ?? 0} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
                </div>

                {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}

                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => { setDrawerOpen(false); setEditingWinner(null) }} className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : editingWinner ? "Update Winner" : "Add Winner"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  )
}
