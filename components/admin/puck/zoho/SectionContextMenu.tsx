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
  Trash2, MoreHorizontal, Beaker, SlidersHorizontal,
} from "lucide-react"
import {
  duplicateBlockById, moveBlockById, removeBlockById,
} from "./PuckBridge"
import { ABTestCreateDialog } from "../ABTestCreateDialog"
import { saveAsTemplate as saveTemplateAction } from "@/app/actions/templateActions"

export function SectionActionBarOverflow({
  label, children, parentAction,
}: {
  label?: string
  children?: React.ReactNode
  parentAction?: React.ReactNode
}) {
  const { appState, dispatch } = usePuck()
  const selectedIndex = appState.ui.itemSelector?.index
  const selectedId = selectedIndex !== undefined
    ? findIdAt(appState.data.content as Array<{ props?: { id?: string } }>, selectedIndex)
    : null
  const selectedBlock = selectedIndex !== undefined
    ? (appState.data.content[selectedIndex] as { type: string; props: Record<string, unknown> } | undefined)
    : undefined
  const isHidden = !!(selectedBlock?.props as { __hidden?: boolean } | undefined)?.__hidden

  function toggleHidden() {
    if (selectedIndex === undefined || !selectedBlock) return
    dispatch({
      type: "replace",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        type: selectedBlock.type,
        props: { ...selectedBlock.props, __hidden: !isHidden },
      } as any,
      destinationIndex: selectedIndex,
      destinationZone: "root:default-zone",
    })
  }

  function openInspector() {
    window.dispatchEvent(new CustomEvent("builder:open-inspector"))
  }

  return (
    <ActionBar label={label}>
      {parentAction}
      {selectedId && (
        <ActionBar.Group>
          <ActionBar.Action label={isHidden ? "Show" : "Hide"} onClick={toggleHidden}>
            {isHidden ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
          </ActionBar.Action>
          <ActionBar.Action label="Settings" onClick={openInspector}>
            <SlidersHorizontal size={14} strokeWidth={1.5} />
          </ActionBar.Action>
        </ActionBar.Group>
      )}
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
      destinationZone: "root:default-zone",
    })
  }

  async function saveAsTemplate() {
    const name = window.prompt("Save this section as a template — name?")
    if (!name || !name.trim()) return
    setOpen(false)
    // Pull the eventId from the current URL path (/admin/events/{id}/builder).
    const m = window.location.pathname.match(/\/admin\/events\/([^/]+)\/builder/)
    const eventId = m?.[1] ?? ""
    if (!eventId) {
      alert("Couldn't find the event id in the URL.")
      patchProp("__templateName", name.trim())
      return
    }
    // Wrap the single block in a one-block Puck data tree so it can be
    // applied later as either a replace or append.
    const data = {
      content: [block].filter(Boolean),
      root: { props: {} },
      zones: {},
    } as unknown as Parameters<typeof saveTemplateAction>[0]["data"]
    const res = await saveTemplateAction({ eventId, name: name.trim(), data })
    if (!res.success) {
      alert(`Couldn't save template: ${res.error ?? "unknown error"}`)
      return
    }
    patchProp("__templateName", name.trim())
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
          <MenuItem
            icon={Beaker}
            label="A/B test"
            onClick={() => {
              // Fire a global event — PuckEventBuilder owns the dialog
              // because it already has eventId + activePage in scope.
              const event = new CustomEvent("builder:open-ab-dialog", {
                detail: {
                  blockId: id,
                  blockType: (block as { type?: string } | undefined)?.type ?? "",
                  blockProps: (block?.props ?? {}) as Record<string, unknown>,
                },
              })
              window.dispatchEvent(event)
              setOpen(false)
            }}
          />
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
