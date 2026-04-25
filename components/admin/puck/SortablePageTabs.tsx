"use client"

/**
 * Drag-to-reorder wrapper for the builder's sub-page tab strip.
 *
 * Wraps a list of slug-keyed tabs in @dnd-kit's SortableContext. The
 * "Home" tab is always first and never sortable — only the children of
 * this component are.
 *
 * The actual tab UI (label, rename/delete buttons) is rendered by the
 * caller via `renderTab` so we don't duplicate the styling that lives in
 * PuckEventBuilder. We just add the sortable handle.
 */

import { useState, type ReactNode } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export type SortableTab = { slug: string; title: string }

export function SortablePageTabs({
  tabs,
  onReorder,
  renderTab,
}: {
  tabs: SortableTab[]
  /** Called with the new slug order on drop. */
  onReorder: (slugs: string[]) => void
  renderTab: (tab: SortableTab) => ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Local state for the dragged-over order — keeps the UI snappy even if
  // the persistence call below is in flight.
  const [order, setOrder] = useState<string[]>(() => tabs.map((t) => t.slug))

  // Keep local order in sync when tabs prop changes (add/delete page).
  if (tabs.length !== order.length || tabs.some((t, i) => order[i] !== t.slug)) {
    // Only resync when the SET of slugs differs — preserve ordering
    // mid-drag otherwise.
    const local = new Set(order)
    const remote = new Set(tabs.map((t) => t.slug))
    if (local.size !== remote.size || [...local].some((s) => !remote.has(s))) {
      setOrder(tabs.map((t) => t.slug))
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = order.indexOf(String(active.id))
    const newIndex = order.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    const next = arrayMove(order, oldIndex, newIndex)
    setOrder(next)
    onReorder(next)
  }

  const orderedTabs = order
    .map((slug) => tabs.find((t) => t.slug === slug))
    .filter((t): t is SortableTab => Boolean(t))

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={horizontalListSortingStrategy}>
        {orderedTabs.map((tab) => (
          <SortableItem key={tab.slug} id={tab.slug}>
            {renderTab(tab)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}

function SortableItem({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="shrink-0">
      {children}
    </div>
  )
}
