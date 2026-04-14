"use client"

/**
 * ── MEDIA ADMIN ─────────────────────────────────────────────────────
 * Manages press_outlets and media_videos tables.
 * Affects /media public page.
 */

import { useState, useEffect, useCallback } from "react"
import {
  getMediaData,
  createPressOutlet,
  updatePressOutlet,
  deletePressOutlet,
  createMediaVideo,
  updateMediaVideo,
  deleteMediaVideo,
} from "@/app/actions/cmsActions"
import { Plus, Pencil, Trash2, Loader2, Newspaper, Video } from "lucide-react"
import { cn } from "@/lib/utils"

interface Outlet {
  id: string; name: string; logo_url: string | null; article_url: string | null
  sort_order: number; is_active: boolean
}
interface VideoRow {
  id: string; title: string; description: string | null; youtube_id: string | null
  thumbnail_url: string | null; label: string | null; sort_order: number; is_active: boolean
}

type Mode = "outlet" | "video"

export default function AdminMediaPage() {
  const [outlets, setOutlets]       = useState<Outlet[]>([])
  const [videos, setVideos]         = useState<VideoRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [mode, setMode]             = useState<Mode | null>(null)
  const [editing, setEditing]       = useState<Outlet | VideoRow | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const res = await getMediaData(false)
    if (res.success) {
      setOutlets((res.outlets ?? []) as Outlet[])
      setVideos((res.videos ?? []) as VideoRow[])
    } else setError(res.error ?? "Failed to load")
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function openOutlet(o?: Outlet) { setMode("outlet"); setEditing(o ?? null); setError(null) }
  function openVideo(v?: VideoRow) { setMode("video"); setEditing(v ?? null); setError(null) }
  function close() { setMode(null); setEditing(null); setError(null) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true); setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    const activeEl = form.querySelector<HTMLInputElement>('input[name="is_active_cb"]')
    fd.set("is_active", activeEl?.checked ? "true" : "false")
    if (editing && "id" in editing) fd.set("id", editing.id)

    let res
    if (mode === "outlet") res = editing ? await updatePressOutlet(fd) : await createPressOutlet(fd)
    else                   res = editing ? await updateMediaVideo(fd) : await createMediaVideo(fd)
    if (res.success) { close(); await fetchAll() }
    else setError(res.error ?? "Operation failed")
    setSubmitting(false)
  }

  async function handleDelete(kind: Mode, id: string) {
    if (!confirm(`Delete this ${kind}?`)) return
    setDeletingId(id)
    const res = kind === "outlet" ? await deletePressOutlet(id) : await deleteMediaVideo(id)
    if (res.success) await fetchAll()
    else setError(res.error ?? "Failed to delete")
    setDeletingId(null)
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Newspaper size={22} className="text-amber-500" />
            Media
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Press outlets and video highlights shown on /media.
          </p>
        </div>
      </div>

      {error && !mode && (
        <div className="mb-4 flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700">Dismiss</button>
        </div>
      )}

      {/* Form */}
      {mode && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            {editing ? `Edit ${mode}` : `New ${mode}`}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "outlet" && (() => {
              const o = editing as Outlet | null
              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Name *"><input name="name" required defaultValue={o?.name ?? ""} className={inputCls} placeholder="Economic Times" /></Field>
                    <Field label="Logo URL"><input name="logo_url" defaultValue={o?.logo_url ?? ""} className={inputCls} placeholder="/press/et.png" /></Field>
                  </div>
                  <Field label="Article URL">
                    <input name="article_url" defaultValue={o?.article_url ?? ""} className={inputCls} placeholder="https://…" />
                  </Field>
                </>
              )
            })()}

            {mode === "video" && (() => {
              const v = editing as VideoRow | null
              return (
                <>
                  <Field label="Title *">
                    <input name="title" required defaultValue={v?.title ?? ""} className={inputCls} />
                  </Field>
                  <Field label="Description">
                    <textarea name="description" defaultValue={v?.description ?? ""} rows={3} className={cn(inputCls, "resize-y")} />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="YouTube ID">
                      <input name="youtube_id" defaultValue={v?.youtube_id ?? ""} className={inputCls} placeholder="dQw4w9WgXcQ" />
                    </Field>
                    <Field label="Label">
                      <input name="label" defaultValue={v?.label ?? ""} className={inputCls} placeholder="Bengaluru 2025" />
                    </Field>
                  </div>
                  <Field label="Thumbnail URL (optional)">
                    <input name="thumbnail_url" defaultValue={v?.thumbnail_url ?? ""} className={inputCls} placeholder="Auto-generated if blank" />
                  </Field>
                </>
              )
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Sort Order">
                <input name="sort_order" type="number" defaultValue={(editing as {sort_order?: number})?.sort_order ?? 0} className={inputCls} />
              </Field>
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="checkbox" name="is_active_cb" defaultChecked={editing ? (editing as {is_active: boolean}).is_active : true} className="w-4 h-4 rounded accent-[#e7ab1c]" />
                  Active
                </label>
              </div>
            </div>

            {error && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="bg-[#e7ab1c] text-white font-semibold rounded-lg px-5 py-2 text-sm hover:bg-[#d49c10] disabled:opacity-50 transition-colors">
                {submitting ? "Saving…" : editing ? "Update" : "Create"}
              </button>
              <button type="button" onClick={close}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Press outlets */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Newspaper size={14} /> Press Outlets
              </h3>
              <button onClick={() => openOutlet()} className="inline-flex items-center gap-1 text-xs text-[#e7ab1c] hover:text-[#d49c10] font-semibold">
                <Plus size={14} /> Add Outlet
              </button>
            </div>
            {outlets.length === 0 ? (
              <div className="px-5 py-6 text-sm text-gray-400">No outlets yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {outlets.map(o => (
                  <li key={o.id} className="px-5 py-3 flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200">
                      {o.sort_order}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {o.name}
                        {!o.is_active && <span className="ml-2 text-gray-500 uppercase tracking-wide text-[10px] font-semibold">Inactive</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{o.article_url ?? "no article URL"}</p>
                    </div>
                    <button onClick={() => openOutlet(o)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => handleDelete("outlet", o.id)} disabled={deletingId === o.id}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50">
                      {deletingId === o.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Videos */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Video size={14} /> Video Highlights
              </h3>
              <button onClick={() => openVideo()} className="inline-flex items-center gap-1 text-xs text-[#e7ab1c] hover:text-[#d49c10] font-semibold">
                <Plus size={14} /> Add Video
              </button>
            </div>
            {videos.length === 0 ? (
              <div className="px-5 py-6 text-sm text-gray-400">No videos yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {videos.map(v => (
                  <li key={v.id} className="px-5 py-3 flex items-start gap-3">
                    <div className="w-24 h-14 rounded bg-gray-100 overflow-hidden shrink-0">
                      {v.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : v.youtube_id ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><Video size={16} /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {v.title}
                        {v.label && <span className="ml-2 bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">{v.label}</span>}
                        {!v.is_active && <span className="ml-2 text-gray-500 uppercase tracking-wide text-[10px] font-semibold">Inactive</span>}
                      </p>
                      {v.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{v.description}</p>}
                      <p className="text-[11px] text-gray-400 mt-0.5">youtube: {v.youtube_id ?? "—"} · order {v.sort_order}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openVideo(v)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => handleDelete("video", v.id)} disabled={deletingId === v.id}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50">
                        {deletingId === v.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
