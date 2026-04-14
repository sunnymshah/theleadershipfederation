"use client"

/**
 * ─── EVENT WINNER MANAGER ───────────────────────────────────────────────
 *
 * Event-scoped CRUD for award winners. Appears as a tab on
 * /admin/events/[id] so every event can have its own list of winners.
 */

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import {
  createEventWinner,
  updateEventWinner,
  deleteEventWinner,
  type EventWinner,
} from "@/app/actions/eventWinnerActions"
import { Plus, Pencil, Trash2, X, Loader2, Trophy, Search } from "lucide-react"
import { cn } from "@/lib/utils"

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

export function EventWinnerManager({ eventId }: { eventId: string }) {
  const [winners, setWinners] = useState<EventWinner[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<EventWinner | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const supabase = createClient()

  const fetchWinners = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("event_winners")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    setWinners((data ?? []) as EventWinner[])
    setLoading(false)
  }, [eventId, supabase])

  useEffect(() => {
    fetchWinners()
  }, [fetchWinners])

  function openCreate() {
    setEditing(null)
    setActionError(null)
    setDrawerOpen(true)
  }

  function openEdit(winner: EventWinner) {
    setEditing(winner)
    setActionError(null)
    setDrawerOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)

    const formData = new FormData(e.currentTarget)
    formData.set("event_id", eventId)

    const result = editing
      ? await updateEventWinner(editing.id, formData)
      : await createEventWinner(formData)

    setSubmitting(false)

    if (!result.success) {
      setActionError(result.error ?? "Failed to save")
      return
    }
    setDrawerOpen(false)
    await fetchWinners()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this winner?")) return
    setDeletingId(id)
    const result = await deleteEventWinner(id, eventId)
    setDeletingId(null)
    if (!result.success) {
      alert(result.error ?? "Failed to delete")
      return
    }
    await fetchWinners()
  }

  const filtered = winners.filter(w =>
    !search ||
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.company ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (w.award_category ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#333] flex items-center gap-2">
            <Trophy size={18} className="text-[#c9a84c]" />
            Award Winners
          </h2>
          <p className="text-[13px] text-[#777] mt-1">
            Winners announced at this event. Shown publicly under the event page.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] text-white text-sm font-semibold hover:bg-[#d4b85c] transition-colors"
        >
          <Plus size={14} /> Add Winner
        </button>
      </div>

      {/* Search */}
      {winners.length > 0 && (
        <div className="mb-5 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
          <input
            type="text"
            placeholder="Search by name, company, or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-[#e0e0e0] text-sm text-[#333] placeholder-[#aaa] focus:outline-none focus:border-[#c9a84c]"
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#aaa]">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#e0e0e0] py-16 text-center">
          <Trophy size={28} className="mx-auto mb-3 text-[#ccc]" />
          <p className="text-sm text-[#888] mb-1">
            {winners.length === 0 ? "No winners yet." : "No matches."}
          </p>
          {winners.length === 0 && (
            <p className="text-[12px] text-[#aaa]">
              Add the award winners announced at this event.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <div
              key={w.id}
              className="rounded-xl bg-white border border-[#e0e0e0] p-4 hover:border-[#c9a84c]/40 transition-colors group"
            >
              <div className="flex items-start gap-3">
                {w.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={w.image_url}
                    alt={w.name}
                    className="w-14 h-14 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#c9a84c]/15 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-[#c9a84c]">
                      {getInitials(w.name)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#333] truncate">{w.name}</p>
                  {w.award_category && (
                    <p className="text-[11px] text-[#c9a84c] uppercase tracking-wider font-medium mt-0.5">
                      {w.award_category}
                    </p>
                  )}
                  {(w.designation || w.company) && (
                    <p className="text-[12px] text-[#888] mt-1 truncate">
                      {[w.designation, w.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(w)}
                  className="p-1.5 rounded text-[#888] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDelete(w.id)}
                  disabled={deletingId === w.id}
                  className="p-1.5 rounded text-[#888] hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  title="Delete"
                >
                  {deletingId === w.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-[#333]">
                  {editing ? "Edit Winner" : "Add Winner"}
                </h3>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-md text-[#888] hover:text-[#333] hover:bg-[#f0f0f0] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <Field label="Name" required>
                <input
                  name="name"
                  defaultValue={editing?.name ?? ""}
                  required
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Designation">
                  <input
                    name="designation"
                    defaultValue={editing?.designation ?? ""}
                    className={inputCls}
                  />
                </Field>
                <Field label="Company">
                  <input
                    name="company"
                    defaultValue={editing?.company ?? ""}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Award Category">
                <input
                  name="award_category"
                  defaultValue={editing?.award_category ?? ""}
                  placeholder="e.g. CEO of the Year"
                  className={inputCls}
                />
              </Field>

              <Field label="Image URL">
                <input
                  name="image_url"
                  defaultValue={editing?.image_url ?? ""}
                  placeholder="https://…"
                  className={inputCls}
                />
              </Field>

              <Field label="LinkedIn URL">
                <input
                  name="linkedin_url"
                  defaultValue={editing?.linkedin_url ?? ""}
                  placeholder="https://linkedin.com/in/…"
                  className={inputCls}
                />
              </Field>

              <Field label="Sort order">
                <input
                  name="sort_order"
                  type="number"
                  defaultValue={editing?.sort_order ?? 0}
                  className={inputCls}
                />
              </Field>

              {actionError && (
                <p className="text-[13px] text-red-500 bg-red-50 px-3 py-2 rounded-md">
                  {actionError}
                </p>
              )}

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-white text-sm font-bold",
                    "hover:bg-[#d4b85c] disabled:opacity-50 transition-colors",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {editing ? "Save Changes" : "Add Winner"}
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-[#e0e0e0] text-sm font-semibold text-[#555] hover:bg-[#fafafa] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-white border border-[#e0e0e0] text-sm text-[#333] placeholder-[#aaa] focus:outline-none focus:border-[#c9a84c]"

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#555] mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
