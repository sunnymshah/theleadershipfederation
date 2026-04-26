"use client"

/**
 * Builder side panel listing all open comments on the event's pages.
 * Realtime via Supabase channel `builder-comments:{eventId}` so multiple
 * editors see new comments instantly.
 */

import { useEffect, useState, useTransition } from "react"
import { Loader2, MessageSquare, Check, Trash2 } from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import {
  listComments, addComment, resolveComment, deleteComment,
  type BuilderComment,
} from "@/app/actions/builderCommentActions"
import { createClient } from "@/utils/supabase/client"

export function CommentsPanel({ eventId, onClose }: { eventId: string; onClose?: () => void }) {
  const [items, setItems] = useState<BuilderComment[]>([])
  const [loading, setLoading] = useState(true)
  const [showResolved, setShowResolved] = useState(false)
  const [draft, setDraft] = useState("")
  const [pending, start] = useTransition()

  useEffect(() => {
    let cancelled = false
    void listComments({ eventId, includeResolved: showResolved }).then((res) => {
      if (cancelled) return
      setItems(res.comments)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [eventId, showResolved])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`builder-comments:${eventId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "event_builder_comments", filter: `event_id=eq.${eventId}` },
        () => {
          void listComments({ eventId, includeResolved: showResolved }).then((res) => setItems(res.comments))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId, showResolved])

  function postComment() {
    const body = draft.trim()
    if (!body) return
    start(async () => {
      await addComment({ eventId, pageKind: "global", blockId: "global", body })
      setDraft("")
    })
  }

  return (
    <SecondaryPanel title="Comments" onClose={onClose}>
      <div className="px-3 py-3 border-b border-[var(--z-border,#e5e7eb)]">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Leave a note for your team…"
          className="z-input z-textarea text-[12px]"
        />
        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-1.5 text-[11px] text-[var(--z-text-muted,#6b7280)]">
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
            Show resolved
          </label>
          <button
            type="button"
            onClick={postComment}
            disabled={pending || !draft.trim()}
            className="z-btn-primary text-[11px] h-7"
          >
            Post
          </button>
        </div>
      </div>
      {loading ? (
        <div className="z-empty mt-12">
          <Loader2 size={20} className="animate-spin z-empty-icon" />
        </div>
      ) : items.length === 0 ? (
        <div className="z-empty mt-8">
          <MessageSquare size={20} className="z-empty-icon" />
          <p className="z-empty-desc mt-2">No comments yet.</p>
        </div>
      ) : (
        <ul className="px-2 py-2 space-y-1">
          {items.map((c) => (
            <li
              key={c.id}
              className={`group rounded-md px-2.5 py-2 ${c.resolved ? "opacity-50" : "hover:bg-[var(--z-bg-alt,#f7f8fa)]"}`}
            >
              <div className="flex items-start gap-2">
                <MessageSquare size={12} strokeWidth={1.5} className="mt-0.5 text-[var(--z-text-muted,#6b7280)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[var(--z-text-muted,#6b7280)]">
                    {c.page_kind} · {c.block_id} · {new Date(c.created_at).toLocaleString()}
                  </p>
                  <p className="text-[12px] text-[var(--z-text,#1f2937)] whitespace-pre-wrap mt-0.5">{c.body}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                  <button
                    onClick={() => start(async () => { await resolveComment(c.id, !c.resolved) })}
                    className="z-btn z-btn-icon !w-6 !h-6"
                    title={c.resolved ? "Reopen" : "Resolve"}
                  >
                    <Check size={11} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => start(async () => { if (confirm("Delete this comment?")) await deleteComment(c.id) })}
                    className="z-btn z-btn-icon !w-6 !h-6 hover:!text-red-700 hover:!bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={11} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SecondaryPanel>
  )
}
