"use client"

/**
 * Zoho-style Pages tree panel.
 *
 * Features:
 *   - Home pinned at top (not draggable, not deletable)
 *   - Sub-pages drag-reorder via @dnd-kit/sortable
 *   - Double-click a page to inline-rename
 *   - Per-row actions on hover: rename / duplicate / delete
 *   - "+ Add page" tile at the bottom
 *
 * Persistence is delegated to the caller via the on* handlers; the panel
 * only owns transient UI state (active dragged item, in-flight rename).
 */

import { useState, useRef, useEffect } from "react"
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove, SortableContext, verticalListSortingStrategy,
  sortableKeyboardCoordinates, useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Plus, Home, FileText, GripVertical, Pencil, Copy, Trash2, Check, X,
} from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import type { BuilderPagesMap } from "@/lib/event-builder-pages"
import { sortPages } from "@/lib/event-builder-pages"

export function PagesPanel({
  pages,
  activePage,
  onJump,
  onAdd,
  onClose,
  onReorder,
  onRename,
  onDuplicate,
  onDelete,
}: {
  pages: BuilderPagesMap
  activePage: string
  onJump: (slugOrHome: string) => void
  onAdd: () => void
  onClose?: () => void
  onReorder?: (slugs: string[]) => void
  onRename?: (slug: string, newTitle: string) => void
  onDuplicate?: (slug: string) => void
  onDelete?: (slug: string) => void
}) {
  const list = sortPages(pages)
  const [order, setOrder] = useState<string[]>(() => list.map(([s]) => s))

  // Re-sync local order when the parent's pages map mutates by add/delete.
  useEffect(() => {
    const next = list.map(([s]) => s)
    const sameSet = next.length === order.length && next.every((s, i) => order.includes(s))
    if (!sameSet) setOrder(next)
  }, [list, order])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = order.indexOf(String(active.id))
    const newIdx = order.indexOf(String(over.id))
    if (oldIdx === -1 || newIdx === -1) return
    const next = arrayMove(order, oldIdx, newIdx)
    setOrder(next)
    onReorder?.(next)
  }

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
        {order.length === 0 ? (
          <p className="px-3 py-2 text-[11px] text-[var(--z-text-muted,#6b7280)]">
            No sub-pages yet.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              {order.map((slug) => {
                const page = pages[slug]
                if (!page) return null
                return (
                  <SortablePageRow
                    key={slug}
                    slug={slug}
                    title={page.title}
                    isActive={activePage === slug}
                    onJump={() => onJump(slug)}
                    onRename={onRename ? (next) => onRename(slug, next) : undefined}
                    onDuplicate={onDuplicate ? () => onDuplicate(slug) : undefined}
                    onDelete={onDelete ? () => onDelete(slug) : undefined}
                  />
                )
              })}
            </SortableContext>
          </DndContext>
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

function SortablePageRow({
  slug, title, isActive, onJump, onRename, onDuplicate, onDelete,
}: {
  slug: string
  title: string
  isActive: boolean
  onJump: () => void
  onRename?: (next: string) => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slug })
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(title)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  // Keep local draft in sync when prop changes (after a save).
  useEffect(() => { setDraftTitle(title) }, [title])

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  function commit() {
    const t = draftTitle.trim()
    if (!t || t === title) {
      setDraftTitle(title)
      setEditing(false)
      return
    }
    onRename?.(t)
    setEditing(false)
  }

  function cancel() {
    setDraftTitle(title)
    setEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-1 ${editing ? "" : "z-panel-item"} ${isActive && !editing ? "is-active" : ""}`}
    >
      {/* drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="text-[var(--z-text-subtle,#9ca3af)] hover:text-[var(--z-text,#1f2937)] cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <GripVertical size={12} strokeWidth={1.5} />
      </button>

      <FileText size={14} strokeWidth={1.5} className="text-[var(--z-text-muted,#6b7280)]" />

      {editing ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commit() }
              if (e.key === "Escape") { e.preventDefault(); cancel() }
            }}
            className="flex-1 h-7 px-1.5 rounded-md border border-[var(--z-info,#3e7af7)] bg-white text-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--z-info,#3e7af7)]/30"
            maxLength={80}
          />
          <button
            type="button"
            onClick={commit}
            aria-label="Confirm rename"
            className="z-btn z-btn-icon !w-6 !h-6"
          >
            <Check size={12} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={cancel}
            aria-label="Cancel rename"
            className="z-btn z-btn-icon !w-6 !h-6"
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onJump}
            onDoubleClick={() => onRename && setEditing(true)}
            className="flex-1 text-left truncate text-[13px]"
            title={title}
          >
            {title}
          </button>
          <span className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
            {onRename && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Rename"
                className="z-btn z-btn-icon !w-6 !h-6"
              >
                <Pencil size={11} strokeWidth={1.5} />
              </button>
            )}
            {onDuplicate && (
              <button
                type="button"
                onClick={onDuplicate}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Duplicate"
                className="z-btn z-btn-icon !w-6 !h-6"
              >
                <Copy size={11} strokeWidth={1.5} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Delete"
                className="z-btn z-btn-icon !w-6 !h-6 hover:!bg-red-50 hover:!text-red-700"
              >
                <Trash2 size={11} strokeWidth={1.5} />
              </button>
            )}
          </span>
        </>
      )}
    </div>
  )
}
