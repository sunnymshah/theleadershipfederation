"use client"

/**
 * First-use tooltip ("Click to edit") that renders once per browser
 * the first time the user hovers an inline-editable element on the
 * canvas. Anchors to the cursor and auto-dismisses after 4s, on click,
 * or when the user starts editing (the inline-edit hook also writes
 * the dismissal flag on focus).
 *
 * Single instance — mount at the top of PuckEventBuilder's shell.
 */

import { useInlineEditTip } from "@/lib/inline-edit"

export function InlineEditTip() {
  const { visible, pos, dismiss } = useInlineEditTip()
  if (!visible) return null
  return (
    <div
      role="tooltip"
      onClick={dismiss}
      style={{
        position: "fixed",
        left: pos.x + 14,
        top: Math.max(8, pos.y - 28),
        zIndex: 10000,
        pointerEvents: "auto",
      }}
      className="px-2.5 py-1.5 rounded-md bg-[#1a1a2e] text-white text-[11px] font-semibold shadow-lg ring-1 ring-white/15 select-none"
    >
      Click to edit
    </div>
  )
}
