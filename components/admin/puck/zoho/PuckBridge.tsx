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

/* Module-level ref so callers outside Puck can grab the latest. */
const refs: { dispatch: DispatchFn | null; getState: AppStateGetter | null } = {
  dispatch: null,
  getState: null,
}

export function PuckBridge() {
  const { dispatch, appState } = usePuck()
  // Re-bind the ref every render so it always points at the latest closure.
  useEffect(() => {
    refs.dispatch = dispatch
    refs.getState = () => appState.data as unknown as Data
    return () => {
      refs.dispatch = null
      refs.getState = null
    }
  }, [dispatch, appState])
  return null
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
  const id = `${componentType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  // The default zone for the root canvas in Puck v0.20 is "default-zone".
  dispatch({
    type: "insert",
    componentType,
    destinationIndex: idx,
    destinationZone: "default-zone",
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
    zone: "default-zone",
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
    sourceZone: "default-zone",
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
    destinationZone: "default-zone",
  })
  return true
}
