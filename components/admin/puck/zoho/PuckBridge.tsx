"use client"

/**
 * PuckBridge — exposes Puck's `dispatch` function and current `appState`
 * to anything outside Puck's React tree (e.g. our PrimaryRail-driven
 * SectionsPanel).
 *
 * `usePuck()` only works inside `<Puck>`'s tree, so we render this
 * bridge via `overrides.iframe` (which mounts inside Puck) and have it
 * register the dispatch function on a module-level ref. The ref is
 * exposed via `getPuckDispatch()` for outside callers.
 *
 * The bridge component itself renders nothing visible.
 */

import { usePuck } from "@measured/puck"
import { useEffect } from "react"
import type { Data } from "@measured/puck"

type DispatchFn = ReturnType<typeof usePuck>["dispatch"]
type AppStateGetter = () => Data

/**
 * Puck's canonical root content zone — what their internal dispatch
 * uses when the user drags a block into the top-level canvas. The
 * combined `<rootAreaId>:<rootZone>` form is what Puck's `walk-tree`
 * helpers expect; using just "default-zone" inserts into a phantom
 * zone Puck never reads back.
 */
const ROOT_ZONE = "root:default-zone"

type HistoryHandle = {
  back: () => void
  forward: () => void
  hasPast: boolean
  hasFuture: boolean
}

/* Module-level ref so callers outside Puck can grab the latest. */
const refs: {
  dispatch: DispatchFn | null
  getState: AppStateGetter | null
  history: HistoryHandle | null
} = {
  dispatch: null,
  getState: null,
  history: null,
}

// External listeners for history-state changes — the top bar enables/
// disables Undo/Redo buttons in real time without polling.
const historyListeners = new Set<() => void>()
function notifyHistory() {
  for (const fn of historyListeners) {
    try { fn() } catch {}
  }
}

export function PuckBridge() {
  const { dispatch, appState, history } = usePuck()
  // Re-bind the ref every render so it always points at the latest closure.
  useEffect(() => {
    refs.dispatch = dispatch
    refs.getState = () => appState.data as unknown as Data
    refs.history = {
      back: history.back,
      forward: history.forward,
      hasPast: history.hasPast,
      hasFuture: history.hasFuture,
    }
    notifyHistory()
    return () => {
      refs.dispatch = null
      refs.getState = null
      refs.history = null
    }
  }, [dispatch, appState, history.hasPast, history.hasFuture, history.back, history.forward])

  // Mirror the currently-selected block id onto window so keyboard
  // handlers in PuckEventBuilder (Cmd+D / Delete) can act on it
  // without subscribing to Puck's React tree.
  useEffect(() => {
    if (typeof window === "undefined") return
    const w = window as unknown as { __lfSelectedBlockId?: string }
    const sel = appState.ui.itemSelector
    if (sel && typeof sel.index === "number") {
      const block = appState.data.content[sel.index] as { props?: { id?: string } } | undefined
      w.__lfSelectedBlockId = block?.props?.id ?? undefined
    } else {
      w.__lfSelectedBlockId = undefined
    }
  }, [appState.ui.itemSelector, appState.data.content])

  return null
}

/** Get current undo/redo state — returns null when Puck isn't mounted. */
export function getPuckHistory(): HistoryHandle | null {
  return refs.history
}

/** Subscribe to history-state changes. Fired on mount/unmount + every time
 *  hasPast/hasFuture flips. Returns an unsubscribe function. */
export function subscribePuckHistory(listener: () => void): () => void {
  historyListeners.add(listener)
  return () => { historyListeners.delete(listener) }
}

/** Try to obtain Puck's dispatch. Returns null when Puck hasn't mounted. */
export function getPuckDispatch(): DispatchFn | null {
  return refs.dispatch
}

/** Returns the current Puck data snapshot, or null when not mounted. */
export function getPuckData(): Data | null {
  return refs.getState ? refs.getState() : null
}

/**
 * Helper used by SectionsPanel to add a new block at the end of the
 * current page. Generates a stable id so undo/redo behaves.
 */
export function insertBlockAtEnd(componentType: string): boolean {
  const dispatch = getPuckDispatch()
  const data = getPuckData()
  if (!dispatch || !data) return false
  const idx = Array.isArray(data.content) ? data.content.length : 0
  return insertBlockAtIndex(componentType, idx)
}

/**
 * Insert a block at a specific index in the root content. Used by the
 * "+ Add optional section" button between sections. When `index` is
 * negative or beyond the array length, falls back to append.
 */
export function insertBlockAtIndex(componentType: string, index: number): boolean {
  const dispatch = getPuckDispatch()
  const data = getPuckData()
  if (!dispatch || !data) return false
  const len = Array.isArray(data.content) ? data.content.length : 0
  const idx = index < 0 || index > len ? len : index
  const id = `${componentType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  dispatch({
    type: "insert",
    componentType,
    destinationIndex: idx,
    destinationZone: ROOT_ZONE,
    id,
  })
  return true
}

/**
 * Patch a subset of Root.props (theme preset / colours / font / etc.)
 * without mutating the rest. Used by ThemePanel.
 */
export function patchRootProps(patch: Record<string, unknown>): boolean {
  const dispatch = getPuckDispatch()
  const data = getPuckData()
  if (!dispatch || !data) return false
  const root = (data.root ?? { props: {} }) as { props?: Record<string, unknown> }
  const nextProps = { ...(root.props ?? {}), ...patch }
  dispatch({
    type: "replaceRoot",
    // RootData type from Puck — we know our shape; cast to any to satisfy
    // the union without dragging in Puck's deep generic types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    root: { ...root, props: nextProps } as any,
  })
  return true
}

/**
 * Remove the block with the given id (used by C12 context menu /
 * keyboard Delete). Returns true when something was removed.
 */
export function removeBlockById(id: string): boolean {
  const dispatch = getPuckDispatch()
  const data = getPuckData()
  if (!dispatch || !data) return false
  const arr = Array.isArray(data.content) ? data.content : []
  const idx = arr.findIndex((c) => (c as unknown as { props?: { id?: string } })?.props?.id === id)
  if (idx === -1) return false
  dispatch({
    type: "remove",
    index: idx,
    zone: ROOT_ZONE,
  })
  return true
}

/**
 * Duplicate the block with the given id at its current position + 1.
 */
export function duplicateBlockById(id: string): boolean {
  const dispatch = getPuckDispatch()
  const data = getPuckData()
  if (!dispatch || !data) return false
  const arr = Array.isArray(data.content) ? data.content : []
  const idx = arr.findIndex((c) => (c as unknown as { props?: { id?: string } })?.props?.id === id)
  if (idx === -1) return false
  dispatch({
    type: "duplicate",
    sourceIndex: idx,
    sourceZone: ROOT_ZONE,
  })
  return true
}

/** Move a block up/down by one within the root zone. */
export function moveBlockById(id: string, delta: -1 | 1): boolean {
  const dispatch = getPuckDispatch()
  const data = getPuckData()
  if (!dispatch || !data) return false
  const arr = Array.isArray(data.content) ? data.content : []
  const idx = arr.findIndex((c) => (c as unknown as { props?: { id?: string } })?.props?.id === id)
  if (idx === -1) return false
  const target = Math.max(0, Math.min(arr.length - 1, idx + delta))
  if (target === idx) return false
  dispatch({
    type: "reorder",
    sourceIndex: idx,
    destinationIndex: target,
    destinationZone: ROOT_ZONE,
  })
  return true
}
