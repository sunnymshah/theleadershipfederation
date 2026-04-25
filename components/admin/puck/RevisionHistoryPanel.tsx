"use client"

/**
 * Revision-history side panel for the event builder.
 *
 * Slides in from the right when the admin clicks "History" in the header.
 * Lists the last 20 published revisions newest-first with a Restore
 * button per row. Restoring writes the revision back into the draft —
 * the admin then explicitly publishes to make it live.
 */

import { useEffect, useState } from "react"
import { Loader2, RotateCcw, X, Clock } from "lucide-react"
import {
  listBuilderRevisions,
  restoreBuilderRevision,
  type BuilderRevision,
} from "@/app/actions/eventBuilderActions"

export function RevisionHistoryPanel({
  open,
  eventId,
  onClose,
  onRestored,
}: {
  open: boolean
  eventId: string
  onClose: () => void
  /** Called after a successful restore — caller should refresh the
   *  editor to pick up the new draft. */
  onRestored: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revisions, setRevisions] = useState<BuilderRevision[]>([])
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    // Reset request-scoped state when the panel opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    ;(async () => {
      const res = await listBuilderRevisions(eventId, 20)
      if (cancelled) return
      if (!res.success) setError(res.error ?? "Couldn't load revisions.")
      setRevisions(res.revisions)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [open, eventId])

  async function handleRestore(rev: BuilderRevision) {
    setRestoring(rev.id)
    setError(null)
    const res = await restoreBuilderRevision(eventId, rev.id)
    setRestoring(null)
    if (!res.success) {
      setError(res.error ?? "Restore failed.")
      return
    }
    onRestored()
    onClose()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[800] pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1a1a2e]/30 pointer-events-auto"
        onClick={onClose}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Publish history"
        className="absolute top-0 right-0 h-full w-full sm:w-[380px] bg-white shadow-2xl border-l border-[#1a1a2e]/10 flex flex-col pointer-events-auto"
      >
        <header className="flex items-center justify-between px-4 h-14 border-b border-[#1a1a2e]/[0.08]">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#1a1a2e]/60" />
            <h2 className="text-sm font-bold text-[#1a1a2e]">Publish history</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close history"
            className="p-1.5 rounded-md text-[#1a1a2e]/60 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.04]"
          >
            <X size={14} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading && (
            <div className="flex items-center justify-center py-12 text-[12px] text-[#1a1a2e]/55 gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          )}

          {!loading && error && (
            <p className="m-3 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-md p-2.5">
              {error}
            </p>
          )}

          {!loading && !error && revisions.length === 0 && (
            <p className="m-3 text-[12px] text-[#1a1a2e]/55 leading-relaxed">
              No publish history yet — publish at least once to start tracking.
            </p>
          )}

          {!loading && !error && revisions.length > 0 && (
            <ul className="space-y-1">
              {revisions.map((rev, idx) => (
                <li
                  key={rev.id}
                  className="rounded-lg border border-[#1a1a2e]/[0.06] hover:border-[#1a1a2e]/15 p-3 bg-white"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1a1a2e]">
                        {idx === 0 ? "Latest publish" : `Publish #${revisions.length - idx}`}
                      </p>
                      <p className="text-[11px] text-[#1a1a2e]/55 mt-0.5">
                        {new Date(rev.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      {rev.label && (
                        <p className="text-[11px] text-[#1a1a2e]/70 mt-1">{rev.label}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestore(rev)}
                      disabled={restoring === rev.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-[#1a1a2e]/80 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.05] border border-[#1a1a2e]/10 disabled:opacity-50 shrink-0"
                      title="Load this version into the draft"
                    >
                      {restoring === rev.id
                        ? <Loader2 size={11} className="animate-spin" />
                        : <RotateCcw size={11} />}
                      Restore
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="px-4 py-3 border-t border-[#1a1a2e]/[0.08] text-[11px] text-[#1a1a2e]/55 leading-relaxed">
          Restoring loads a version into the draft. Hit <strong>Publish</strong> to make it live.
        </footer>
      </aside>
    </div>
  )
}
