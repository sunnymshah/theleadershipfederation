"use client"

/**
 * Zoho-style Standard Pages panel.
 *
 * Reads the user's current pages from event_standard_pages. Home is
 * always present; the rest (Agenda / Speakers / etc.) are added on
 * demand via the "+ Add page" picker at the bottom (A1 model).
 *
 * Per-page actions are consolidated into a single Settings cog (C1)
 * that opens a tabbed mini-modal:
 *   - General  — label + URL slug + visibility + delete
 *   - SEO      — page title / description (stored on row.settings.seo)
 *   - Banner   — banner image + heading override (row.settings.banner)
 *
 * The hover toolbar previously held three separate buttons (pencil /
 * slug-edit / reset). All three live inside the modal now.
 */

import { useEffect, useState, useTransition } from "react"
import {
  Eye, EyeOff, GripVertical, Settings as SettingsIcon, Loader2, Plus, X, Trash2, RotateCcw,
  Home, Calendar, Users, MessageSquare, Ticket, Network, Building2, MapPin,
  ShoppingBag, Image as ImageIcon, ClipboardEdit, LogIn,
} from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import {
  listStandardPages,
  updateStandardPage,
  reorderStandardPages,
  resetStandardPage,
  addStandardPage,
  deleteStandardPage,
  listAvailableStandardPageKinds,
  updateStandardPageSettings,
} from "@/app/actions/standardPageActions"
import type { StandardPageKind, StandardPageRow } from "@/lib/standard-pages"
import { DEFAULT_PAGE_LABELS } from "@/lib/standard-pages"
import { normalizeSlug } from "@/lib/slug"
import { ImageUploadCrop } from "@/components/admin/ImageUploadCrop"

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
  const [available, setAvailable] = useState<StandardPageKind[]>([])
  const [openSettingsKind, setOpenSettingsKind] = useState<StandardPageKind | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [, startTransition] = useTransition()

  async function refresh() {
    const [list, avail] = await Promise.all([
      listStandardPages(eventId),
      listAvailableStandardPageKinds(eventId),
    ])
    setRows(list.pages)
    setAvailable(avail.kinds)
  }

  useEffect(() => {
    let cancelled = false
    void refresh().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function onAddKind(kind: StandardPageKind) {
    const res = await addStandardPage(eventId, kind)
    if (res.success) {
      await refresh()
      setShowPicker(false)
      onJump(kind)
    } else if (res.error) {
      alert(res.error)
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
                onOpenSettings={() => setOpenSettingsKind(row.kind)}
                onMoveUp={i > 0 ? () => moveUp(i) : undefined}
                onMoveDown={i < rows.length - 1 ? () => moveDown(i) : undefined}
              />
            )
          })}

          {/* "+ Add page" picker (A1) */}
          <div className="pt-2">
            {showPicker ? (
              <div className="rounded-md border border-[var(--z-border,#e5e7eb)] bg-white p-2 space-y-1">
                <div className="flex items-center justify-between px-1 pb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)]">
                    Add a page
                  </span>
                  <button onClick={() => setShowPicker(false)} aria-label="Close picker" className="z-btn z-btn-icon !w-5 !h-5">
                    <X size={11} strokeWidth={2} />
                  </button>
                </div>
                {available.length === 0 ? (
                  <p className="px-1 py-2 text-[11px] text-[var(--z-text-muted,#6b7280)]">
                    All canonical pages are already on this event.
                  </p>
                ) : (
                  available.map((kind) => {
                    const Icon = KIND_ICONS[kind]
                    return (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => void onAddKind(kind)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12px] font-medium text-[var(--z-text,#1f2937)] hover:bg-[var(--z-bg-alt,#f7f8fa)]"
                      >
                        <Icon size={13} strokeWidth={1.5} className="text-[var(--z-text-muted,#6b7280)]" />
                        {DEFAULT_PAGE_LABELS[kind]}
                      </button>
                    )
                  })
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-md border border-dashed border-[var(--z-border-strong,#d1d5db)] text-[12px] font-medium text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-info,#3e7af7)] hover:border-[var(--z-info,#3e7af7)]"
              >
                <Plus size={12} strokeWidth={1.5} />
                Add page
              </button>
            )}
          </div>

          <p className="px-3 pt-3 text-[11px] text-[var(--z-text-muted,#6b7280)] leading-relaxed">
            Home is always present. Hide pages you don&apos;t want in nav,
            or delete them entirely from the Settings menu.
          </p>
        </div>
      )}

      {/* Settings modal (C1) */}
      {openSettingsKind && (
        <PageSettingsModal
          eventId={eventId}
          row={rows.find((r) => r.kind === openSettingsKind)!}
          onClose={() => setOpenSettingsKind(null)}
          onChanged={async () => { await refresh() }}
          onDeleted={async () => {
            setOpenSettingsKind(null)
            await refresh()
            // Drop back to home if the active page was just deleted.
            if (openSettingsKind === activeKind) onJump("home")
          }}
        />
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
  onOpenSettings,
  onMoveUp,
  onMoveDown,
}: {
  row: StandardPageRow
  Icon: typeof Home
  active: boolean
  onJump: () => void
  onToggleVisible: () => void
  onOpenSettings: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
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

      <button
        type="button"
        onClick={onJump}
        className={`flex-1 text-left truncate text-[12px] font-medium ${
          row.visible ? "text-[var(--z-text,#1f2937)]" : "text-[var(--z-text-muted,#6b7280)]"
        }`}
        title={`${row.label} → /${row.slug}`}
      >
        {row.label}
      </button>

      <span className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Page settings"
          title="General · SEO · Banner"
          className="z-btn z-btn-icon !w-6 !h-6"
        >
          <SettingsIcon size={11} strokeWidth={1.5} />
        </button>
      </span>
    </div>
  )
}

/* ── Page settings modal (C1) ─────────────────────────────────────────
 *
 * Three tabs:
 *   - General  → label, URL slug, visibility, delete (non-home)
 *   - SEO      → title, description (row.settings.seo)
 *   - Banner   → image URL + heading override (row.settings.banner)
 *
 * General writes to top-level columns via updateStandardPage.
 * SEO + Banner are stored under row.settings.{seo,banner} via a helper
 * action — we extend the existing updateStandardPage to also accept a
 * `settingsPatch` shape and merge it into the JSONB.
 */
function PageSettingsModal({
  eventId, row, onClose, onChanged, onDeleted,
}: {
  eventId: string
  row: StandardPageRow
  onClose: () => void
  onChanged: () => Promise<void>
  onDeleted: () => Promise<void>
}) {
  const [tab, setTab] = useState<"general" | "seo" | "banner">("general")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  // Local drafts.
  const [label, setLabel] = useState(row.label)
  const [slug, setSlug] = useState(row.slug)
  const [visible, setVisible] = useState(row.visible)
  const settings = (row.settings ?? {}) as Record<string, unknown>
  const seo = (settings.seo ?? {}) as Record<string, unknown>
  const banner = (settings.banner ?? {}) as Record<string, unknown>
  const [seoTitle, setSeoTitle] = useState(typeof seo.title === "string" ? seo.title : "")
  const [seoDesc, setSeoDesc] = useState(typeof seo.description === "string" ? seo.description : "")
  const [bannerImage, setBannerImage] = useState(typeof banner.image === "string" ? banner.image : "")
  const [bannerHeading, setBannerHeading] = useState(typeof banner.heading === "string" ? banner.heading : "")

  const cleanedSlug = normalizeSlug(slug)
  const slugInvalid = cleanedSlug.length === 0

  async function saveGeneral() {
    setBusy(true); setError(null)
    const res = await updateStandardPage(eventId, row.kind, {
      label: label.trim() || row.label,
      slug,
      visible,
    })
    setBusy(false)
    if (!res.success) {
      setError(res.error ?? "Save failed")
      return
    }
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1500)
    await onChanged()
  }

  async function saveSeoOrBanner() {
    setBusy(true); setError(null)
    // Patch only the sub-objects we care about — settings.puckData and
    // settings.children (Exhibitors sub-pages) are preserved server-side
    // because updateStandardPageSettings shallow-merges.
    const res = await updateStandardPageSettings(eventId, row.kind, {
      seo: { title: seoTitle, description: seoDesc },
      banner: { image: bannerImage, heading: bannerHeading },
    })
    setBusy(false)
    if (!res.success) {
      setError(res.error ?? "Save failed")
      return
    }
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1500)
    await onChanged()
  }

  async function reset() {
    if (!confirm(`Reset "${row.label}" to default? This replaces its current content.`)) return
    setBusy(true); setError(null)
    const res = await resetStandardPage(eventId, row.kind)
    setBusy(false)
    if (!res.success) {
      setError(res.error ?? "Reset failed")
      return
    }
    await onChanged()
    onClose()
  }

  async function remove() {
    if (row.kind === "home") return
    if (!confirm(`Delete "${row.label}" page entirely? This cannot be undone.`)) return
    setBusy(true); setError(null)
    const res = await deleteStandardPage(eventId, row.kind)
    setBusy(false)
    if (!res.success) {
      setError(res.error ?? "Delete failed")
      return
    }
    await onDeleted()
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-[var(--z-border,#e5e7eb)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 h-11 border-b border-[var(--z-border,#e5e7eb)]">
          <h3 className="text-[13px] font-bold text-[var(--z-text,#1f2937)]">{row.label} — Page settings</h3>
          <button onClick={onClose} aria-label="Close" className="z-btn z-btn-icon">
            <X size={14} />
          </button>
        </div>
        <div className="flex border-b border-[var(--z-border,#e5e7eb)] text-[12px] font-medium">
          {(["general", "seo", "banner"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 h-9 capitalize ${tab === t ? "bg-white text-[var(--z-text,#1f2937)] border-b-2 border-[var(--z-info,#3e7af7)] -mb-px" : "bg-[var(--z-bg-alt,#f7f8fa)] text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-text,#1f2937)]"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="p-4 space-y-3">
          {tab === "general" && (
            <>
              <ModalField label="Label">
                <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} className="z-input" />
              </ModalField>
              <ModalField label="URL slug">
                <input value={slug} onChange={(e) => setSlug(e.target.value)} className="z-input" />
                {slugInvalid && <p className="mt-1 text-[10px] text-red-600">Slug must contain at least one letter or digit.</p>}
                {!slugInvalid && cleanedSlug !== slug && (
                  <p className="mt-1 text-[10px] text-[var(--z-text-muted,#6b7280)]">
                    → Will be saved as <span className="font-mono">{cleanedSlug}</span>
                  </p>
                )}
              </ModalField>
              <label className="flex items-center gap-2 text-[12px] py-1.5">
                <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
                <span>Show in public navigation</span>
              </label>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--z-border,#e5e7eb)]">
                <button type="button" onClick={() => void reset()} disabled={busy} className="z-btn !text-[var(--z-warning,#d97706)] inline-flex items-center gap-1.5">
                  <RotateCcw size={12} /> Reset content
                </button>
                {row.kind !== "home" && (
                  <button type="button" onClick={() => void remove()} disabled={busy} className="z-btn !text-[var(--z-danger,#dc2626)] inline-flex items-center gap-1.5">
                    <Trash2 size={12} /> Delete page
                  </button>
                )}
              </div>
            </>
          )}
          {tab === "seo" && (
            <>
              <ModalField label="Page title (SEO)">
                <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={120} className="z-input" placeholder="Falls back to event title" />
              </ModalField>
              <ModalField label="Meta description">
                <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={3} maxLength={160} className="z-input z-textarea" placeholder="160 char max" />
              </ModalField>
            </>
          )}
          {tab === "banner" && (
            <>
              <ModalField label="Banner image">
                <ImageUploadCrop value={bannerImage} onChange={(v) => setBannerImage(v ?? "")} aspectRatio={16 / 5} folder="sections" label="" help="Used at the top of this page (when the active block reads metadata.banner)." />
              </ModalField>
              <ModalField label="Banner heading override">
                <input value={bannerHeading} onChange={(e) => setBannerHeading(e.target.value)} className="z-input" placeholder={row.label} />
              </ModalField>
            </>
          )}
          {error && <p className="text-[12px] text-[var(--z-danger,#dc2626)] bg-red-50 border border-red-200 rounded-md px-2.5 py-1.5">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg-alt,#f7f8fa)]">
          {savedFlash && <span className="text-[12px] text-[var(--z-success,#10b981)] mr-auto">Saved.</span>}
          <button type="button" onClick={onClose} disabled={busy} className="z-btn">Close</button>
          <button
            type="button"
            disabled={busy || (tab === "general" && slugInvalid)}
            onClick={() => void (tab === "general" ? saveGeneral() : saveSeoOrBanner())}
            className="z-btn-primary"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">{label}</span>
      {children}
    </label>
  )
}
