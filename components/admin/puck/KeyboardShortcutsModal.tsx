"use client"

/**
 * Keyboard-shortcuts cheatsheet — opened by the "?" button in the
 * builder header. Mirrors Zoho Backstage's shortcuts panel.
 *
 * The actual key bindings (Cmd/Ctrl+Z, +Shift+Z, +S, +P, +Shift+P,
 * +D, Delete, Esc, /) are wired in PuckEventBuilder via a useEffect
 * that listens at the window level. This component is just the modal
 * that shows the cheatsheet.
 */

import { useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

const ROWS: Array<{ keys: string[]; label: string }> = [
  { keys: ["⌘", "Z"],          label: "Undo" },
  { keys: ["⌘", "⇧", "Z"],     label: "Redo" },
  { keys: ["⌘", "S"],          label: "Save (force)" },
  { keys: ["⌘", "P"],          label: "Preview" },
  { keys: ["⌘", "⇧", "P"],     label: "Publish" },
  { keys: ["⌘", "D"],          label: "Duplicate selected" },
  { keys: ["Delete"],          label: "Delete selected" },
  { keys: ["Esc"],             label: "Deselect" },
  { keys: ["/"],               label: "Focus block search" },
]

export function KeyboardShortcutsModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null
  if (typeof document === "undefined") return null

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kbd-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#1a1a2e]/40 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md mx-4 rounded-xl bg-white shadow-2xl border border-[var(--bs-border,#e5e7eb)] p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 id="kbd-title" className="text-base font-bold text-[var(--bs-text,#1f2937)]">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
        <ul className="space-y-1.5">
          {ROWS.map((row) => (
            <li key={row.label} className="flex items-center justify-between py-1.5 text-[13px]">
              <span className="text-[var(--bs-text,#1f2937)]">{row.label}</span>
              <span className="flex items-center gap-1">
                {row.keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[11px] font-mono font-medium rounded border border-[var(--bs-border,#e5e7eb)] bg-[var(--bs-bg-alt,#f7f8fa)] text-[var(--bs-text,#1f2937)]"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 pt-3 border-t border-[var(--bs-border,#e5e7eb)] text-[11px] text-[var(--bs-text-muted,#6b7280)]">
          ⌘ on macOS / Ctrl on Windows-Linux. Bindings work whenever the editor is focused.
        </p>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
