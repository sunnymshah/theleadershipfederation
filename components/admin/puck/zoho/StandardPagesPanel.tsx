"use client"

/**
 * Zoho-style Standard Pages panel.
 *
 * Reads the canonical 12 pages from event_standard_pages, lets the
 * admin toggle visibility, rename labels + slugs, reorder, and reset
 * each page back to its default Puck data.
 *
 * Replaces the older PagesPanel (which managed an arbitrary
 * builder_pages map). The 12 are fixed — no add / no delete.
 */

import { useEffect, useState, useTransition } from "react"
import {
  Eye, EyeOff, GripVertical, Pencil, RotateCcw, Loader2, Check, X,
  Home, Calendar, Users, MessageSquare, Ticket, Network, Building2, MapPin,
  ShoppingBag, Image as ImageIcon, ClipboardEdit, LogIn,
} from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import {
  listStandardPages,
  updateStandardPage,
  reorderStandardPages,
  resetStandardPage,
} from "@/app/actions/standardPageActions"
import type { StandardPageKind, StandardPageRow } from "@/lib/standard-pages"
import { normalizeSlug } from "@/lib/slug"

const KIND_ICONS: Record<StandardPageKind, typeof Home> = {
  home: Home,
  agenda: Calendar,
  speakers: Users,
  discussions: MessageSquare,
  tickets: Ticket,
  networking: Network,
  sponsors: Building2,
  venue: MapPin,
  exhibitors: ShoppingBag,
  gallery: ImageIcon,
  register: ClipboardEdit,
  signin: LogIn,
}

export function StandardPagesPanel({
  eventId,
  activeKind,
  onJump,
  onClose,
}: {
  eventId: string
  activeKind: StandardPageKind
  onJump: (kind: StandardPageKind) => void
  onClose?: () => void
}) {
  const [rows, setRows] = useState<StandardPageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    void listStandardPages(eventId).then((res) => {
      if (cancelled) return
      setRows(res.pages)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [eventId])

  function patch(kind: StandardPageKind, p: Partial<StandardPageRow>) {
    setRows((rs) => rs.map((r) => (r.kind === kind ? { ...r, ...p } : r)))
  }

  function toggleVisible(row: StandardPageRow) {
    const next = !row.visible
    patch(row.kind, { visible: next })
    startTransition(async () => {
      const res = await updateStandardPage(eventId, row.kind, { visible: next })
      if (!res.success) patch(row.kind, { visible: row.visible })
    })
  }

  function rename(row: StandardPageRow, label: string) {
    patch(row.kind, { label })
    startTransition(async () => {
      await updateStandardPage(eventId, row.kind, { label })
    })
  }

  function reslug(row: StandardPageRow, slug: string) {
    patch(row.kind, { slug })
    startTransition(async () => {
      await updateStandardPage(eventId, row.kind, { slug })
    })
  }

  function moveUp(idx: number) {
    if (idx <= 0) return
    const next = [...rows]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setRows(next)
    void reorderStandardPages(eventId, next.map((r) => r.kind))
  }
  function moveDown(idx: number) {
    if (idx >= rows.length - 1) return
    const next = [...rows]
    ;[next[idx + 1], next[idx]] = [next[idx], next[idx + 1]]
    setRows(next)
    void reorderStandardPages(eventId, next.map((r) => r.kind))
  }

  async function reset(row: StandardPageRow) {
    if (!confirm(`Reset "${row.label}" to default? This replaces its current content.`)) return
    const res = await resetStandardPage(eventId, row.kind)
    if (res.success) {
      const fresh = await listStandardPages(eventId)
      setRows(fresh.pages)
    }
  }

  return (
    <SecondaryPanel title="Pages" onClose={onClose}>
      {loading ? (
        <div className="z-empty mt-12">
          <Loader2 size={20} className="animate-spin z-empty-icon" />
          <p className="z-empty-desc mt-2">Loading…</p>
        </div>
      ) : (
        <div className="px-2 py-2 space-y-0.5">
          {rows.map((row, i) => {
            const Icon = KIND_ICONS[row.kind]
            const active = row.kind === activeKind
            return (
              <PageRow
                key={row.kind}
                row={row}
                Icon={Icon}
                active={active}
                onJump={() => onJump(row.kind)}
                onToggleVisible={() => toggleVisible(row)}
                onRenameLabel={(v) => rename(row, v)}
                onRenameSlug={(v) => reslug(row, v)}
                onReset={() => reset(row)}
                onMoveUp={i > 0 ? () => moveUp(i) : undefined}
                onMoveDown={i < rows.length - 1 ? () => moveDown(i) : undefined}
              />
            )
          })}
          <p className="px-3 pt-3 text-[11px] text-[var(--z-text-muted,#6b7280)] leading-relaxed">
            The 12 standard pages are fixed. Hide what you don&apos;t need —
            it disappears from the public top nav and 404s on the public URL.
          </p>
        </div>
      )}
    </SecondaryPanel>
  )
}

function PageRow({
  row,
  Icon,
  active,
  onJump,
  onToggleVisible,
  onRenameLabel,
  onRenameSlug,
  onReset,
  onMoveUp,
  onMoveDown,
}: {
  row: StandardPageRow
  Icon: typeof Home
  active: boolean
  onJump: () => void
  onToggleVisible: () => void
  onRenameLabel: (v: string) => void
  onRenameSlug: (v: string) => void
  onReset: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  const [editing, setEditing] = useState<"none" | "label" | "slug">("none")
  // Drafts are local-only and reset to the latest row value each time
  // we enter edit mode — no useEffect-sync needed.
  const [draftLabel, setDraftLabel] = useState(row.label)
  const [draftSlug, setDraftSlug] = useState(row.slug)
  function startEditing(field: "label" | "slug") {
    setDraftLabel(row.label)
    setDraftSlug(row.slug)
    setEditing(field)
  }

  function commitLabel() {
    const v = draftLabel.trim()
    if (v && v !== row.label) onRenameLabel(v)
    setEditing("none")
  }
  function commitSlug() {
    const v = draftSlug.trim()
    if (v && v !== row.slug) onRenameSlug(v)
    setEditing("none")
  }

  return (
    <div
      className={`group relative flex items-center gap-1 rounded-md px-2 py-1.5 ${
        active ? "bg-white shadow-sm border border-[var(--z-border,#e5e7eb)]" : "hover:bg-white"
      }`}
    >
      <div className="flex flex-col">
        <button
          type="button"
          onClick={onMoveUp}
          aria-label="Move up"
          disabled={!onMoveUp}
          className="text-[var(--z-text-subtle,#9ca3af)] disabled:opacity-30 hover:text-[var(--z-text,#1f2937)] leading-none"
        >
          <GripVertical size={10} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          aria-label="Move down"
          disabled={!onMoveDown}
          className="text-[var(--z-text-subtle,#9ca3af)] disabled:opacity-30 hover:text-[var(--z-text,#1f2937)] leading-none"
        >
          <GripVertical size={10} strokeWidth={1.5} />
        </button>
      </div>

      <button
        type="button"
        onClick={onToggleVisible}
        aria-label={row.visible ? "Hide" : "Show"}
        title={row.visible ? "Visible — click to hide" : "Hidden — click to show"}
        className={`shrink-0 inline-flex items-center justify-center w-6 h-6 rounded ${
          row.visible ? "text-[var(--z-text,#1f2937)]" : "text-[var(--z-text-subtle,#9ca3af)]"
        } hover:bg-[var(--z-bg-alt,#f7f8fa)]`}
      >
        {row.visible ? <Eye size={13} strokeWidth={1.6} /> : <EyeOff size={13} strokeWidth={1.6} />}
      </button>

      <Icon size={13} strokeWidth={1.5} className="text-[var(--z-text-muted,#6b7280)]" />

      {editing === "label" ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            autoFocus
            type="text"
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commitLabel() }
              if (e.key === "Escape") { setDraftLabel(row.label); setEditing("none") }
            }}
            className="flex-1 h-7 px-1.5 rounded-md border border-[var(--z-info,#3e7af7)] bg-white text-[12px] focus:outline-none"
            maxLength={80}
          />
          <button onClick={commitLabel} aria-label="Save" className="z-btn z-btn-icon !w-6 !h-6">
            <Check size={12} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onJump}
          onDoubleClick={() => startEditing("label")}
          className={`flex-1 text-left truncate text-[12px] font-medium ${
            row.visible ? "text-[var(--z-text,#1f2937)]" : "text-[var(--z-text-muted,#6b7280)]"
          }`}
          title={`${row.label} → /${row.slug}`}
        >
          {row.label}
        </button>
      )}

      <span className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
        <button
          type="button"
          onClick={() => (editing === "slug" ? setEditing("none") : startEditing("slug"))}
          aria-label="Edit URL slug"
          title={`URL: /${row.slug}`}
          className="z-btn z-btn-icon !w-6 !h-6"
        >
          <Pencil size={10} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset to default"
          title="Reset to default content"
          className="z-btn z-btn-icon !w-6 !h-6"
        >
          <RotateCcw size={10} strokeWidth={1.5} />
        </button>
      </span>

      {editing === "slug" && (
        <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-[var(--z-border,#e5e7eb)] rounded-md shadow-md p-2">
          <label className="block text-[11px] font-medium text-[var(--z-text-muted,#6b7280)] mb-1">URL slug</label>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[var(--z-text-muted,#6b7280)]">/events/.../</span>
            <input
              autoFocus
              type="text"
              value={draftSlug}
              onChange={(e) => setDraftSlug(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commitSlug() }
                if (e.key === "Escape") { setDraftSlug(row.slug); setEditing("none") }
              }}
              className="flex-1 h-7 px-1.5 rounded border border-[var(--z-border-strong,#d1d5db)] text-[11px]"
            />
            <button
              onClick={commitSlug}
              aria-label="Save slug"
              disabled={normalizeSlug(draftSlug).length === 0}
              className="z-btn z-btn-icon !w-6 !h-6 disabled:opacity-40"
            >
              <Check size={11} strokeWidth={2} />
            </button>
            <button onClick={() => { setDraftSlug(row.slug); setEditing("none") }} aria-label="Cancel" className="z-btn z-btn-icon !w-6 !h-6">
              <X size={11} strokeWidth={2} />
            </button>
          </div>
          {/* Live preview of the canonical (normalised) slug. */}
          {(() => {
            const cleaned = normalizeSlug(draftSlug)
            if (cleaned.length === 0) {
              return (
                <p className="mt-1.5 text-[10px] text-red-600">
                  Slug must contain at least one letter or digit.
                </p>
              )
            }
            if (cleaned !== draftSlug) {
              return (
                <p className="mt-1.5 text-[10px] text-[var(--z-text-muted,#6b7280)]">
                  → Will be saved as <span className="font-mono text-[var(--z-text,#1f2937)]">{cleaned}</span>
                </p>
              )
            }
            return null
          })()}
        </div>
      )}
    </div>
  )
}
