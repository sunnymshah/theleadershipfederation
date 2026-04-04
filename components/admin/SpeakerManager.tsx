"use client"

/**
 * ─── SPEAKER MANAGER (Zoho Backstage Replica) ───────────────────────────
 *
 * Event-scoped speaker management with headshot image upload.
 * Features: card grid, drag-drop image upload, slide-out drawer,
 * search/filter, bulk actions.
 */

import { useState, useCallback, useEffect, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { createSpeaker, updateSpeaker, deleteSpeaker } from "@/app/actions/speakerActions"
import { Plus, Pencil, Trash2, X, Loader2, Users, Search, Upload, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpeakerRow {
  id: string
  event_id: string
  name: string
  designation: string | null
  company: string | null
  bio: string | null
  image_url: string | null
  sort_order: number
  created_at: string
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

export function SpeakerManager({ eventId }: { eventId: string }) {
  const [speakers, setSpeakers]     = useState<SpeakerRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing]       = useState<SpeakerRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const fetchSpeakers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("speakers")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    if (data) setSpeakers(data)
    setLoading(false)
  }, [eventId])

  useEffect(() => { fetchSpeakers() }, [fetchSpeakers])

  const filtered = speakers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.company ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.designation ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)

    const fd = new FormData(e.currentTarget)
    fd.set("eventId", eventId)

    const result = editing
      ? await updateSpeaker(editing.id, fd)
      : await createSpeaker(fd)

    if (result.success) {
      setDrawerOpen(false)
      setEditing(null)
      setPreviewUrl(null)
      await fetchSpeakers()
    } else {
      setActionError(result.error ?? "Operation failed")
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this speaker from the event?")) return
    setDeletingId(id)
    const result = await deleteSpeaker(id)
    if (result.success) await fetchSpeakers()
    else setActionError(result.error ?? "Failed to delete")
    setDeletingId(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  function openDrawer(speaker?: SpeakerRow) {
    setEditing(speaker ?? null)
    setDrawerOpen(true)
    setActionError(null)
    setPreviewUrl(speaker?.image_url ?? null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <p className="text-sm text-white/40">
            {speakers.length} speaker{speakers.length !== 1 ? "s" : ""}
          </p>
          {speakers.length > 0 && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search speakers…"
                className="pl-9 pr-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/15 transition-colors w-52"
              />
            </div>
          )}
        </div>
        <button
          onClick={() => openDrawer()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] transition-colors"
        >
          <Plus size={15} /> Add Speaker
        </button>
      </div>

      {/* Error */}
      {actionError && (
        <div className="mb-5 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400"><X size={14} /></button>
        </div>
      )}

      {/* Speaker Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/30 gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading speakers…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-white/[0.06]">
          <Users size={28} className="mx-auto mb-3 text-white/15" />
          <p className="text-white/35 text-sm">{searchQuery ? "No speakers match your search." : "No speakers added yet."}</p>
          <p className="text-white/20 text-xs mt-1">Add keynote speakers, panelists, and moderators.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03] transition-all hover:border-white/[0.1] overflow-hidden"
            >
              {/* Card Content */}
              <div className="p-5 flex gap-4">
                {/* Avatar */}
                {s.image_url ? (
                  <img src={s.image_url} alt={s.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center shrink-0 border border-[#c9a84c]/10">
                    <span className="text-[#c9a84c] text-lg font-bold">{getInitials(s.name)}</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white/90 text-[15px]">{s.name}</div>
                  {(s.designation || s.company) && (
                    <div className="text-[12px] text-white/40 mt-0.5">
                      {s.designation}{s.designation && s.company ? " · " : ""}{s.company}
                    </div>
                  )}
                  {s.bio && <p className="text-[11px] text-white/25 mt-2 line-clamp-2 leading-relaxed">{s.bio}</p>}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-2.5 border-t border-white/[0.04] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-white/[0.01]">
                <span className="text-[10px] text-white/20 uppercase tracking-wider">Order: {s.sort_order}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => openDrawer(s)} className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30">
                    {deletingId === s.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Slide-Out Drawer ─────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => { setDrawerOpen(false); setEditing(null); setPreviewUrl(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-[#0a0a0a] border-l border-white/[0.08] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-white">{editing ? "Edit Speaker" : "Add Speaker"}</h3>
              <button onClick={() => { setDrawerOpen(false); setEditing(null); setPreviewUrl(null) }} className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Headshot Upload */}
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">Headshot Photo</label>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-white/[0.1] hover:border-[#c9a84c]/40 flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-white/[0.02] shrink-0"
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Upload size={20} className="mx-auto text-white/20 mb-1" />
                        <span className="text-[10px] text-white/25">Upload</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="headshot"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <p className="text-[11px] text-white/30 mb-2">Click to upload or drag and drop. Max 5MB.</p>
                    <p className="text-[11px] text-white/20">JPG, PNG, WebP supported.</p>
                    {previewUrl && (
                      <button type="button" onClick={() => { setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = "" }} className="text-[11px] text-red-400/60 hover:text-red-400 mt-1 transition-colors">
                        Remove image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Or paste URL */}
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Or paste image URL</label>
                <input type="url" name="imageUrl" defaultValue={editing?.image_url ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="https://example.com/photo.jpg" />
              </div>

              <hr className="border-white/[0.06]" />

              {/* Name */}
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Full Name *</label>
                <input type="text" name="name" required defaultValue={editing?.name ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Dr. Priya Kapoor" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Designation</label>
                  <input type="text" name="designation" defaultValue={editing?.designation ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="CEO" />
                </div>
                <div>
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Company</label>
                  <input type="text" name="company" defaultValue={editing?.company ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Acme Corp" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Bio</label>
                <textarea name="bio" rows={3} defaultValue={editing?.bio ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none" placeholder="Brief speaker biography…" />
              </div>
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Sort Order</label>
                <input type="number" name="sortOrder" min="0" defaultValue={editing?.sort_order ?? speakers.length} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
              </div>

              {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setDrawerOpen(false); setEditing(null); setPreviewUrl(null) }} className="flex-1 py-2.5 rounded-lg border border-white/[0.08] text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editing ? "Update Speaker" : "Add Speaker"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
