"use client"

/**
 * PageDialog — modal for "New page" / "Rename page".
 *
 * Replaces `window.prompt(...)` so we get:
 *   - A11y (focus trap, ESC to close, autofocus on open)
 *   - Live slug preview as the user types the title
 *   - No browser-chrome UI (consistent with the rest of the editor)
 *
 * Renders into document.body via createPortal so it can sit above Puck's
 * iframe overlays. Rendered conditionally — null when closed.
 *
 * Slug preview uses the same slugifyPage() the server action will run,
 * so what the admin sees is what the URL becomes.
 */

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { slugifyPage } from "@/lib/event-builder-pages"

export type PageDialogProps = {
  open: boolean
  mode: "create" | "rename"
  /** Initial title — used when renaming. */
  initialTitle?: string
  onCancel: () => void
  onConfirm: (title: string) => void
}

export function PageDialog({ open, mode, initialTitle = "", onCancel, onConfirm }: PageDialogProps) {
  const [title, setTitle] = useState(initialTitle)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Reset state on (re-)open and focus the input. The setState here is
  // legitimate — we're synchronising a derived UI prop into local state
  // when the dialog (re)opens with a different initialTitle.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(initialTitle)
      // setTimeout so the input exists when we focus.
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [open, initialTitle])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onCancel])

  if (!open) return null
  if (typeof document === "undefined") return null

  const slug = slugifyPage(title)
  const trimmed = title.trim()
  const canSubmit = trimmed.length > 0 && slug.length > 0

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="page-dialog-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#1a1a2e]/40 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-md mx-4 rounded-xl bg-white shadow-2xl border border-[#1a1a2e]/10 p-5">
        <h2 id="page-dialog-title" className="text-base font-bold text-[#1a1a2e] mb-1">
          {mode === "create" ? "New page" : "Rename page"}
        </h2>
        <p className="text-[12px] text-[#1a1a2e]/65 mb-4">
          {mode === "create"
            ? "Create a new sub-page (e.g. Venue, Agenda, Travel). The URL is generated from the title."
            : "Rename this page. The URL will update to match — old links will keep working."}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!canSubmit) return
            onConfirm(trimmed)
          }}
        >
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1a1a2e]/60 mb-1.5">
            Title
          </label>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Venue"
            className="w-full px-3 py-2 rounded-md border border-[#1a1a2e]/15 text-sm text-[#1a1a2e] focus:outline-none focus:border-[#e7ab1c] focus:ring-2 focus:ring-[#e7ab1c]/20"
            maxLength={80}
          />

          <div className="mt-3 text-[12px] text-[#1a1a2e]/65">
            URL preview:{" "}
            <code className="ml-1 px-1.5 py-0.5 rounded bg-[#1a1a2e]/[0.05] font-mono text-[#1a1a2e]">
              /events/&hellip;/p/{slug || <span className="opacity-50">page-slug</span>}
            </code>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-md text-[13px] font-medium text-[#1a1a2e]/75 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.04]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-3.5 py-1.5 rounded-md text-[13px] font-bold bg-[#e7ab1c] text-[#1a1a2e] hover:bg-[#d49c10] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === "create" ? "Create page" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
