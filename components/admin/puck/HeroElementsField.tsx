"use client"

/**
 * Custom Puck inspector field for HeroSlide.elements[] (ITEM 3.4).
 *
 * Why this exists rather than Puck's built-in array field renderer:
 * the spec calls for explicit @dnd-kit/sortable drag-reorder, an "+ Add
 * element" picker that lists the 10 element kinds, and per-row inline
 * edit/delete chrome. Puck's built-in array field provides drag handles
 * but doesn't expose a typed picker — every new row is a blank
 * defaultItemProps clone. This field gives us:
 *
 *   - DnD reorder via @dnd-kit/sortable's vertical strategy
 *   - Click-to-add picker dialog with the 10 HeroElementKind values
 *   - Per-row "edit" expansion that surfaces only the fields relevant
 *     to that element's kind (so authors don't see countdown fields on
 *     a buttonGroup row)
 *   - Per-row delete with confirm
 *
 * The data shape is identical to Puck's built-in array — an array of
 * HeroElement objects — so storage is unchanged. Puck calls our render
 * fn with `value` (the current array) and `onChange` (a setter that
 * accepts a new array); the field is registered as `type: "custom"` in
 * puck-config.tsx.
 */

import { useId, useState } from "react"
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical, Plus, Trash2, ChevronDown, ChevronRight,
  Type, AlignLeft, Tag, Square, Clock, Globe, Image as ImageIco,
  Calendar, MapPin, X,
  Bold, Italic, Underline, Strikethrough,
  AlignLeft as AlignLeftIcon, AlignCenter, AlignRight,
  List, ListOrdered, Link as LinkIcon,
} from "lucide-react"
import {
  buildDefaultElements,
  type HeroElement, type HeroElementKind, type HeroElementButton, type EventNameFormat,
} from "./blocks"

const KIND_OPTIONS: Array<{ kind: HeroElementKind; label: string; Icon: typeof Type }> = [
  { kind: "eventName",        label: "Event Name",        Icon: Type },
  { kind: "shortDescription", label: "Short Description", Icon: AlignLeft },
  { kind: "label",            label: "Label",             Icon: Tag },
  { kind: "buttonGroup",      label: "Button Group",      Icon: Square },
  { kind: "countdown",        label: "Countdown",         Icon: Clock },
  { kind: "socialHandles",    label: "Social Handles",    Icon: Globe },
  { kind: "primaryMedia",     label: "Primary Media",     Icon: ImageIco },
  { kind: "secondaryMedia",   label: "Secondary Media",   Icon: ImageIco },
  { kind: "dateTime",         label: "Date / Time",       Icon: Calendar },
  { kind: "venue",            label: "Venue",             Icon: MapPin },
]

export function HeroElementsField({
  field,
  value,
  onChange,
}: {
  field: { label?: string }
  value: HeroElement[] | undefined
  onChange: (next: HeroElement[]) => void
}) {
  const list: HeroElement[] = Array.isArray(value) && value.length > 0
    ? value
    : buildDefaultElements()
  const [picker, setPicker] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const baseId = useId()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function patch(idx: number, partial: Partial<HeroElement>) {
    const next = list.map((el, i) => (i === idx ? { ...el, ...partial } : el))
    onChange(next)
  }
  function remove(idx: number) {
    const next = list.filter((_, i) => i !== idx)
    onChange(next.length > 0 ? next : buildDefaultElements())
  }
  function add(kind: HeroElementKind) {
    const id = `el-${baseId}-${list.length}-${Math.random().toString(36).slice(2, 6)}`
    const seed: HeroElement = { id, kind }
    if (kind === "buttonGroup") {
      seed.buttons = [{ id: `${id}-b1`, label: "Register Now", type: "register", url: "/tickets", style: "primary" }]
    }
    if (kind === "dateTime") {
      seed.showDate = true; seed.showTime = false; seed.showVenue = false
      seed.widgetSize = "md"; seed.iconStyle = "outline"
    }
    onChange([...list, seed])
    setPicker(false)
    setExpandedId(id)
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = list.findIndex((el) => el.id === active.id)
    const newIdx = list.findIndex((el) => el.id === over.id)
    if (oldIdx < 0 || newIdx < 0) return
    onChange(arrayMove(list, oldIdx, newIdx))
  }

  return (
    <div className="space-y-2 px-3 py-2 lf-zoho-field" data-z-cat="settings">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)]">
        {field.label ?? "Elements"}
      </span>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={list.map((el) => el.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {list.map((el, idx) => (
              <SortableRow
                key={el.id}
                el={el}
                expanded={expandedId === el.id}
                onToggle={() => setExpandedId(expandedId === el.id ? null : el.id)}
                onPatch={(p) => patch(idx, p)}
                onRemove={() => remove(idx)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {picker ? (
        <div className="rounded-md border border-[var(--z-border,#e5e7eb)] bg-white p-2 space-y-1 shadow-sm">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)]">Add element</span>
            <button type="button" onClick={() => setPicker(false)} aria-label="Close picker" className="z-btn z-btn-icon !w-5 !h-5"><X size={11} /></button>
          </div>
          {KIND_OPTIONS.map(({ kind, label, Icon }) => (
            <button
              key={kind}
              type="button"
              onClick={() => add(kind)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12px] font-medium text-[var(--z-text,#1f2937)] hover:bg-[var(--z-bg-alt,#f7f8fa)]"
            >
              <Icon size={13} strokeWidth={1.5} className="text-[var(--z-text-muted,#6b7280)]" />
              {label}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPicker(true)}
          className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-md border border-dashed border-[var(--z-border-strong,#d1d5db)] text-[12px] font-medium text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-info,#3e7af7)] hover:border-[var(--z-info,#3e7af7)]"
        >
          <Plus size={12} strokeWidth={1.5} />
          Add element
        </button>
      )}
    </div>
  )
}

function SortableRow({
  el, expanded, onToggle, onPatch, onRemove,
}: {
  el: HeroElement
  expanded: boolean
  onToggle: () => void
  onPatch: (p: Partial<HeroElement>) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: el.id })
  const opt = KIND_OPTIONS.find((o) => o.kind === el.kind)
  const Icon = opt?.Icon ?? Type
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className="rounded-md border border-[var(--z-border,#e5e7eb)] bg-white">
      <div className="flex items-center gap-1.5 px-1.5 py-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="cursor-grab text-[var(--z-text-subtle,#9ca3af)] hover:text-[var(--z-text,#1f2937)] p-1 -ml-0.5"
        >
          <GripVertical size={14} strokeWidth={1.5} />
        </button>
        <Icon size={12} strokeWidth={1.5} className="text-[var(--z-text-muted,#6b7280)] shrink-0" />
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 text-left text-[12px] font-medium text-[var(--z-text,#1f2937)] truncate"
        >
          {opt?.label ?? el.kind}
          {el.text ? <span className="ml-1 text-[var(--z-text-muted,#6b7280)] font-normal"> · {el.text.slice(0, 24)}</span> : null}
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Edit"
          className="z-btn z-btn-icon !w-6 !h-6"
        >
          {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </button>
        <button
          type="button"
          onClick={() => { if (confirm("Remove this element?")) onRemove() }}
          aria-label="Delete"
          className="z-btn z-btn-icon !w-6 !h-6 hover:!text-red-600"
        >
          <Trash2 size={11} />
        </button>
      </div>
      {expanded && (
        <div className="px-2.5 pb-2.5 pt-1 border-t border-[var(--z-border,#e5e7eb)] space-y-2">
          <KindFields el={el} onPatch={onPatch} />
        </div>
      )}
    </div>
  )
}

function KindFields({
  el, onPatch,
}: {
  el: HeroElement
  onPatch: (p: Partial<HeroElement>) => void
}) {
  switch (el.kind) {
    case "eventName":
    case "shortDescription":
    case "label":
      return (
        <>
          <Mini label="Text">
            <textarea
              value={el.text ?? ""}
              onChange={(e) => onPatch({ text: e.target.value })}
              rows={2}
              className="z-input z-textarea"
            />
          </Mini>
          {/* ITEM 4.3 — formatting toolbar with icon buttons */}
          <HeroFormatToolbar
            format={el.format}
            onChange={(format) => onPatch({ format })}
          />
        </>
      )
    case "buttonGroup":
      return <ButtonsEditor buttons={el.buttons ?? []} onChange={(buttons) => onPatch({ buttons })} />
    case "primaryMedia":
    case "secondaryMedia":
      return (
        <>
          <Mini label="Media kind">
            <select value={el.mediaKind ?? "image"} onChange={(e) => onPatch({ mediaKind: e.target.value as "image" | "video" })} className="z-input">
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </Mini>
          <Mini label="URL">
            <input value={el.url ?? ""} onChange={(e) => onPatch({ url: e.target.value })} className="z-input" placeholder="https://…" />
          </Mini>
          <Mini label="Alt text">
            <input value={el.alt ?? ""} onChange={(e) => onPatch({ alt: e.target.value })} className="z-input" />
          </Mini>
        </>
      )
    case "dateTime":
      // ITEM 5.3 — defaults match the renderer (showDate / showTime /
      // showVenue all default true via `!== false`, so the inspector
      // also reads `!== false`). textColor is a colour picker rather
      // than a free-text hex input.
      return (
        <>
          <Mini label="Show date">
            <BoolToggle value={el.showDate !== false} onChange={(v) => onPatch({ showDate: v })} />
          </Mini>
          <Mini label="Show time">
            <BoolToggle value={el.showTime !== false} onChange={(v) => onPatch({ showTime: v })} />
          </Mini>
          <Mini label="Show venue">
            <BoolToggle value={el.showVenue !== false} onChange={(v) => onPatch({ showVenue: v })} />
          </Mini>
          <Mini label="Widget size">
            <select value={el.widgetSize ?? "md"} onChange={(e) => onPatch({ widgetSize: e.target.value as "sm" | "md" | "lg" | "xl" })} className="z-input">
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra large</option>
            </select>
          </Mini>
          <Mini label="Format">
            <select value={el.formatType ?? "short"} onChange={(e) => onPatch({ formatType: e.target.value as "short" | "long" | "iso" | "us" | "eu" })} className="z-input">
              <option value="short">Short (DD MMM YYYY)</option>
              <option value="long">Long (Weekday, DD Month YYYY)</option>
              <option value="iso">ISO (YYYY-MM-DD)</option>
              <option value="us">US (MM/DD/YYYY)</option>
              <option value="eu">EU (DD/MM/YYYY)</option>
            </select>
          </Mini>
          <Mini label="Icon style">
            <select value={el.iconStyle ?? "outline"} onChange={(e) => onPatch({ iconStyle: e.target.value as "outline" | "solid" | "minimal" | "none" })} className="z-input">
              <option value="outline">Outline</option>
              <option value="solid">Solid</option>
              <option value="minimal">Minimal (no icon)</option>
              <option value="none">None (no icon, no label)</option>
            </select>
          </Mini>
          <Mini label="Text color">
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={isHex(el.textColor) ? (el.textColor as string) : "#e7ab1c"}
                onChange={(e) => onPatch({ textColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-[var(--z-border,#e5e7eb)] bg-white"
              />
              <input
                type="text"
                value={el.textColor ?? ""}
                onChange={(e) => onPatch({ textColor: e.target.value })}
                className="z-input flex-1 !text-[11px]"
                placeholder="#e7ab1c"
              />
            </div>
          </Mini>
        </>
      )
    case "countdown":
    case "socialHandles":
    case "venue":
      return <p className="text-[11px] text-[var(--z-text-muted,#6b7280)] italic">No per-element fields. Pulls from the event + Settings → General.</p>
  }
}

function ButtonsEditor({
  buttons, onChange,
}: {
  buttons: HeroElementButton[]
  onChange: (next: HeroElementButton[]) => void
}) {
  function patch(idx: number, p: Partial<HeroElementButton>) {
    onChange(buttons.map((b, i) => (i === idx ? { ...b, ...p } : b)))
  }
  function add() {
    onChange([
      ...buttons,
      { id: `b-${Date.now()}`, label: "Button", type: "url", url: "/", style: "secondary" },
    ])
  }
  function remove(idx: number) {
    onChange(buttons.filter((_, i) => i !== idx))
  }
  return (
    <div className="space-y-2">
      {buttons.map((b, idx) => (
        <div key={b.id} className="rounded border border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg-alt,#f7f8fa)] p-2 space-y-1.5 relative">
          <button type="button" onClick={() => remove(idx)} aria-label="Remove button" className="absolute top-1 right-1 z-btn z-btn-icon !w-5 !h-5 hover:!text-red-600"><Trash2 size={10} /></button>
          <Mini label="Label">
            <input value={b.label} onChange={(e) => patch(idx, { label: e.target.value })} className="z-input" />
          </Mini>
          <Mini label="Type">
            <select value={b.type} onChange={(e) => patch(idx, { type: e.target.value as HeroElementButton["type"] })} className="z-input">
              <option value="url">Open URL</option>
              <option value="register">Register</option>
              <option value="anchor">Scroll to anchor</option>
            </select>
          </Mini>
          {b.type === "url" && (
            <Mini label="URL">
              <input value={b.url ?? ""} onChange={(e) => patch(idx, { url: e.target.value })} className="z-input" placeholder="/path or https://…" />
            </Mini>
          )}
          {b.type === "anchor" && (
            <Mini label="Anchor (without #)">
              <input value={b.anchor ?? ""} onChange={(e) => patch(idx, { anchor: e.target.value })} className="z-input" placeholder="speakers" />
            </Mini>
          )}
          <Mini label="Style">
            <select value={b.style} onChange={(e) => patch(idx, { style: e.target.value as HeroElementButton["style"] })} className="z-input">
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
            </select>
          </Mini>
        </div>
      ))}
      <button type="button" onClick={add} className="w-full inline-flex items-center justify-center gap-1.5 h-7 rounded-md border border-dashed border-[var(--z-border-strong,#d1d5db)] text-[11px] font-medium text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-info,#3e7af7)] hover:border-[var(--z-info,#3e7af7)]">
        <Plus size={11} /> Add button
      </button>
    </div>
  )
}

/* ── ITEM 4.3 — icon-button format toolbar ─────────────────────── */
function HeroFormatToolbar({
  format, onChange,
}: {
  format: EventNameFormat | undefined
  onChange: (next: EventNameFormat) => void
}) {
  const f: EventNameFormat = format ?? {}
  function patch(p: Partial<EventNameFormat>) { onChange({ ...f, ...p }) }
  function toggle<K extends keyof EventNameFormat>(key: K) {
    patch({ [key]: !f[key] } as Partial<EventNameFormat>)
  }

  const ToggleBtn = ({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`inline-flex items-center justify-center w-7 h-7 rounded ${active ? "bg-[var(--z-info,#3e7af7)] text-white" : "bg-white text-[var(--z-text,#1f2937)] hover:bg-[var(--z-bg-alt,#f7f8fa)]"} border border-[var(--z-border,#e5e7eb)]`}
    >
      {children}
    </button>
  )
  return (
    <div className="space-y-1.5 rounded-md border border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg-alt,#f7f8fa)] p-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)]">Formatting</div>
      {/* Row 1 — bold / italic / underline / strikethrough */}
      <div className="flex flex-wrap items-center gap-1">
        <ToggleBtn active={!!f.bold}          onClick={() => toggle("bold")}          title="Bold">          <Bold size={12} /></ToggleBtn>
        <ToggleBtn active={!!f.italic}        onClick={() => toggle("italic")}        title="Italic">        <Italic size={12} /></ToggleBtn>
        <ToggleBtn active={!!f.underline}     onClick={() => toggle("underline")}     title="Underline">     <Underline size={12} /></ToggleBtn>
        <ToggleBtn active={!!f.strikethrough} onClick={() => toggle("strikethrough")} title="Strikethrough"> <Strikethrough size={12} /></ToggleBtn>
        <span className="w-px h-5 bg-[var(--z-border,#e5e7eb)] mx-0.5" aria-hidden />
        {/* Alignment toggle group */}
        <ToggleBtn active={f.textAlign === "left"}   onClick={() => patch({ textAlign: "left" })}   title="Align left">   <AlignLeftIcon size={12} /></ToggleBtn>
        <ToggleBtn active={f.textAlign === "center"} onClick={() => patch({ textAlign: "center" })} title="Align center"> <AlignCenter   size={12} /></ToggleBtn>
        <ToggleBtn active={f.textAlign === "right"}  onClick={() => patch({ textAlign: "right" })}  title="Align right">  <AlignRight    size={12} /></ToggleBtn>
        <span className="w-px h-5 bg-[var(--z-border,#e5e7eb)] mx-0.5" aria-hidden />
        {/* List toggle group */}
        <ToggleBtn active={f.listType === "bullet"}  onClick={() => patch({ listType: f.listType === "bullet" ? "none" : "bullet" })}   title="Bullet list">  <List        size={12} /></ToggleBtn>
        <ToggleBtn active={f.listType === "ordered"} onClick={() => patch({ listType: f.listType === "ordered" ? "none" : "ordered" })} title="Ordered list"> <ListOrdered size={12} /></ToggleBtn>
      </div>

      {/* Row 2 — colour pickers + transform + link */}
      <div className="flex flex-wrap items-center gap-1.5">
        <label className="inline-flex items-center gap-1 text-[10px] text-[var(--z-text-muted,#6b7280)]" title="Text color">
          <span>A</span>
          <input
            type="color"
            value={isHex(f.textColor) ? f.textColor as string : "#ffffff"}
            onChange={(e) => patch({ textColor: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border border-[var(--z-border,#e5e7eb)] bg-white"
          />
        </label>
        <label className="inline-flex items-center gap-1 text-[10px] text-[var(--z-text-muted,#6b7280)]" title="Text background">
          <span>BG</span>
          <input
            type="color"
            value={isHex(f.textBackground) ? f.textBackground as string : "#000000"}
            onChange={(e) => patch({ textBackground: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border border-[var(--z-border,#e5e7eb)] bg-white"
          />
        </label>
        <select
          value={f.textTransform ?? "none"}
          onChange={(e) => patch({ textTransform: e.target.value as EventNameFormat["textTransform"] })}
          className="z-input !h-7 !text-[11px] !py-0"
          title="Text transform"
        >
          <option value="none">Aa</option>
          <option value="uppercase">AA</option>
          <option value="lowercase">aa</option>
          <option value="capitalize">Aa</option>
        </select>
        <label className="inline-flex items-center gap-1 text-[10px] text-[var(--z-text-muted,#6b7280)]" title="Link URL">
          <LinkIcon size={12} />
          <input
            type="url"
            value={f.link ?? ""}
            onChange={(e) => patch({ link: e.target.value })}
            placeholder="https://…"
            className="z-input !h-7 !text-[11px]"
            style={{ minWidth: 100 }}
          />
        </label>
      </div>

      {/* Row 3 — line-height + letter-spacing sliders */}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-0.5">
            Line height: <span className="tabular-nums">{(f.lineHeight ?? 1.05).toFixed(2)}</span>
          </span>
          <input
            type="range" min={0.8} max={2.4} step={0.05}
            value={f.lineHeight ?? 1.05}
            onChange={(e) => patch({ lineHeight: parseFloat(e.target.value) })}
            className="w-full"
          />
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-0.5">
            Letter spacing: <span className="tabular-nums">{(f.letterSpacing ?? 0).toFixed(1)}px</span>
          </span>
          <input
            type="range" min={-3} max={12} step={0.5}
            value={f.letterSpacing ?? 0}
            onChange={(e) => patch({ letterSpacing: parseFloat(e.target.value) })}
            className="w-full"
          />
        </label>
      </div>
    </div>
  )
}
function isHex(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v)
}

function Mini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-0.5">{label}</span>
      {children}
    </label>
  )
}
function BoolToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-1">
      <button type="button" onClick={() => onChange(true)} className={`px-2 h-6 rounded text-[11px] font-semibold border ${value ? "bg-[var(--z-info,#3e7af7)] text-white border-[var(--z-info,#3e7af7)]" : "bg-white text-[var(--z-text,#1f2937)] border-[var(--z-border,#e5e7eb)] hover:border-[var(--z-info,#3e7af7)]"}`}>Yes</button>
      <button type="button" onClick={() => onChange(false)} className={`px-2 h-6 rounded text-[11px] font-semibold border ${!value ? "bg-[var(--z-info,#3e7af7)] text-white border-[var(--z-info,#3e7af7)]" : "bg-white text-[var(--z-text,#1f2937)] border-[var(--z-border,#e5e7eb)] hover:border-[var(--z-info,#3e7af7)]"}`}>No</button>
    </div>
  )
}

// Suppress unused-import warning for EventNameFormat (re-exported for
// downstream modules that import HeroElementsField alongside the
// format type in a single import statement).
export type { EventNameFormat }
