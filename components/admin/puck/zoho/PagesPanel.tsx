"use client"

/**
 * Pages tree panel — replicates the existing tab strip in panel form,
 * with click-to-jump per page and "+ Add page" tile at the bottom.
 *
 * The actual reordering / rename / duplicate / delete actions are handled
 * by the existing tab strip on the secondary row inside the builder, so
 * this panel is currently view + jump only. Drag-reorder + inline rename
 * inside the panel are filed for Phase 4.
 */

import { Plus, Home, FileText } from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import type { BuilderPagesMap } from "@/lib/event-builder-pages"
import { sortPages } from "@/lib/event-builder-pages"

export function PagesPanel({
  pages,
  activePage,
  onJump,
  onAdd,
  onClose,
}: {
  pages: BuilderPagesMap
  activePage: string  // "home" or a sub-page slug
  onJump: (slugOrHome: string) => void
  onAdd: () => void
  onClose?: () => void
}) {
  const list = sortPages(pages)
  return (
    <SecondaryPanel title="Pages" onClose={onClose}>
      <div className="px-2 pt-2 pb-1">
        <button
          type="button"
          onClick={() => onJump("home")}
          className={`z-panel-item w-full ${activePage === "home" ? "is-active" : ""}`}
        >
          <Home size={14} strokeWidth={1.5} />
          <span className="flex-1 text-left">Home</span>
        </button>
      </div>
      <div className="px-2 pb-2">
        {list.length === 0 ? (
          <p className="px-3 py-2 text-[11px] text-[var(--z-text-muted,#6b7280)]">No sub-pages yet.</p>
        ) : (
          list.map(([slug, p]) => (
            <button
              key={slug}
              type="button"
              onClick={() => onJump(slug)}
              className={`z-panel-item w-full ${activePage === slug ? "is-active" : ""}`}
            >
              <FileText size={14} strokeWidth={1.5} />
              <span className="flex-1 text-left truncate">{p.title}</span>
            </button>
          ))
        )}
      </div>
      <div className="px-3 py-2">
        <button
          type="button"
          onClick={onAdd}
          className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-md border border-dashed border-[var(--z-border-strong,#d1d5db)] text-[12px] font-medium text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-info,#3e7af7)] hover:border-[var(--z-info,#3e7af7)] hover:bg-[rgba(62,122,247,0.05)] transition-colors"
        >
          <Plus size={14} strokeWidth={1.5} />
          Add page
        </button>
      </div>
    </SecondaryPanel>
  )
}
