"use client"

/**
 * Per-section overflow menu — Zoho-style Duplicate / Move up / Move
 * down / Hide / Lock / Save as template / Delete actions.
 *
 * Mounted via Puck's overrides.actionBar wrapper so it appears next to
 * the existing drag handle on the selection toolbar of every block.
 *
 * "Hide", "Lock", and "Save as template" are stored on each block's
 * props as `__hidden`, `__locked`, `__templateName`. The renderer can
 * read these to gate visibility (Phase 5 will surface them to the public
 * page; for now they round-trip through Puck's store untouched).
 */

import { useEffect, useRef, useState } from "react"
import { ActionBar, usePuck } from "@measured/puck"
import {
  Copy, ArrowUp, ArrowDown, Eye, EyeOff, Lock, Unlock, BookmarkPlus,
  Trash2, MoreHorizontal,
} from "lucide-react"
import {
  duplicateBlockById, moveBlockById, removeBlockById,
} from "./PuckBridge"

export function SectionActionBarOverflow({
  label, children, parentAction,
}: {
  label?: string
  children?: React.ReactNode
  parentAction?: React.ReactNode
}) {
  const { appState } = usePuck()
  const selectedId = appState.ui.itemSelector
    ? findIdAt(appState.data.content as Array<{ props?: { id?: string } }>, appState.ui.itemSelector.index)
    : null

  return (
    <ActionBar label={label}>
      {parentAction}
      {children}
      {selectedId && (
        <ActionBar.Group>
          <SectionMenu id={selectedId} />
        </ActionBar.Group>
      )}
    </ActionBar>
  )
}

function findIdAt(content: Array<{ props?: { id?: string } }>, index: number | undefined): string | null {
  if (typeof index !== "number") return null
  return content[index]?.props?.id ?? null
}

function SectionMenu({ id }: { id: string }) {
  const { appState, dispatch } = usePuck()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("mousedown", close)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("mousedown", close)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  // Read hidden / locked flags off the selected block so the menu can
  // toggle them.
  const block = (appState.data.content as Array<{ props?: Record<string, unknown> }>)
    .find((c) => c.props?.id === id)
  const hidden = Boolean(block?.props?.__hidden)
  const locked = Boolean(block?.props?.__locked)

  function patchProp(key: string, value: unknown) {
    // Use Puck's `replace` action to update one block's props. We must
    // preserve the existing id (Puck keys blocks by props.id).
    const idx = (appState.data.content as Array<{ props?: { id?: string } }>)
      .findIndex((c) => c.props?.id === id)
    if (idx === -1) return
    const existing = appState.data.content[idx] as { type: string; props: Record<string, unknown> }
    dispatch({
      type: "replace",
      // ComponentData requires id in props; spread existing then overwrite.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { type: existing.type, props: { ...existing.props, [key]: value } } as any,
      destinationIndex: idx,
      destinationZone: "default-zone",
    })
  }

  function saveAsTemplate() {
    const name = window.prompt("Save this section as a template — name?")
    if (!name || !name.trim()) return
    // Stash on block props for now; Phase 5 wires this up to a templates table.
    patchProp("__templateName", name.trim())
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        title="More actions"
        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-white/80 hover:text-white hover:bg-white/10"
      >
        <MoreHorizontal size={14} strokeWidth={1.5} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-48 rounded-md bg-white border border-[var(--z-border,#e5e7eb)] shadow-[var(--z-shadow-lg,0_8px_24px_rgba(15,23,42,0.10))] py-1 z-[2000] text-[var(--z-text,#1f2937)]"
        >
          <MenuItem icon={Copy}    label="Duplicate"  onClick={() => { duplicateBlockById(id); setOpen(false) }} />
          <MenuItem icon={ArrowUp} label="Move up"    onClick={() => { moveBlockById(id, -1);   setOpen(false) }} />
          <MenuItem icon={ArrowDown} label="Move down" onClick={() => { moveBlockById(id,  1);   setOpen(false) }} />
          <Divider />
          <MenuItem
            icon={hidden ? Eye : EyeOff}
            label={hidden ? "Show" : "Hide"}
            onClick={() => { patchProp("__hidden", !hidden); setOpen(false) }}
          />
          <MenuItem
            icon={locked ? Unlock : Lock}
            label={locked ? "Unlock" : "Lock"}
            onClick={() => { patchProp("__locked", !locked); setOpen(false) }}
          />
          <MenuItem icon={BookmarkPlus} label="Save as template" onClick={saveAsTemplate} />
          <Divider />
          <MenuItem
            icon={Trash2}
            label="Delete"
            tone="danger"
            onClick={() => {
              if (window.confirm("Delete this section?")) {
                removeBlockById(id)
              }
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

function MenuItem({
  icon: Icon, label, onClick, tone = "default",
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  label: string
  onClick: () => void
  tone?: "default" | "danger"
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[var(--z-bg-alt,#f7f8fa)] ${
        tone === "danger" ? "text-[var(--z-danger,#dc2626)] hover:!bg-red-50" : ""
      }`}
    >
      <Icon size={13} strokeWidth={1.5} />
      <span>{label}</span>
    </button>
  )
}

function Divider() {
  return <div className="h-px my-1 bg-[var(--z-border,#e5e7eb)]" />
}
