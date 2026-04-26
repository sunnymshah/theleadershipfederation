"use client"

/**
 * Undo / Redo pair for the Zoho-style top bar's centre zone.
 * Subscribes to PuckBridge's history-state via subscribePuckHistory so
 * the disabled state updates in sync with Puck's internal history slice.
 */

import { useSyncExternalStore } from "react"
import { Undo2, Redo2 } from "lucide-react"
import { getPuckHistory, subscribePuckHistory } from "./zoho/PuckBridge"

function getSnapshot() {
  const h = getPuckHistory()
  return h ? `${h.hasPast ? "1" : "0"}${h.hasFuture ? "1" : "0"}` : "00"
}
function getServerSnapshot() { return "00" }

export function UndoRedoButtons() {
  // Re-render whenever history changes.
  useSyncExternalStore(subscribePuckHistory, getSnapshot, getServerSnapshot)
  const h = getPuckHistory()
  const hasPast = !!h?.hasPast
  const hasFuture = !!h?.hasFuture

  return (
    <>
      <button
        type="button"
        onClick={() => h?.back()}
        disabled={!hasPast}
        aria-label="Undo"
        title="Undo (⌘Z)"
        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)] disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Undo2 size={14} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={() => h?.forward()}
        disabled={!hasFuture}
        aria-label="Redo"
        title="Redo (⌘⇧Z)"
        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)] disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Redo2 size={14} strokeWidth={1.5} />
      </button>
    </>
  )
}
