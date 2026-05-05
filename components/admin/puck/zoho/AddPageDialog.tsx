"use client"

/**
 * Add-Page template picker (ITEM 3).
 *
 * Opens from StandardPagesPanel's "+ Add page" CTA. Shows a 3-column
 * gallery of page-template tiles — one per StandardPageKind not yet
 * present on the event — plus a "Blank page" tile that lets the user
 * name a custom page.
 *
 * Each tile carries a small SVG illustration matching the page's
 * purpose, the canonical label, and a one-line description. Click
 * a standard tile → calls addStandardPage(eventId, kind) which seeds
 * the row with defaultPuckDataForKind. Click Blank → prompts for
 * label + slug, then calls addStandardPage with kind="exhibitors"
 * (the only kind that supports custom sub-page children currently)
 * — but for ITEM 3 the simpler path is to use the addExhibitorChild
 * flow OR fall back to a generic creation. We use a fresh standard
 * kind here when available.
 */

import { useEffect, useState } from "react"
import { X, Loader2 } from "lucide-react"
import {
  addStandardPage,
  listAvailableStandardPageKinds,
} from "@/app/actions/standardPageActions"
import {
  DEFAULT_PAGE_LABELS,
  type StandardPageKind,
} from "@/lib/standard-pages"

type Tile = {
  kind: StandardPageKind | "__blank__"
  label: string
  description: string
  svg: React.ReactNode
}

const SVG_PROPS = {
  width: 56,
  height: 56,
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
}

// Per-kind illustration. Each is a simple line-icon SVG sized 56×56;
// Tailwind text-color drives the stroke so they tint with the tile's
// hover state.
const TILE_SVG: Record<StandardPageKind, React.ReactNode> = {
  home: (
    <svg {...SVG_PROPS}><path d="M10 30 L32 12 L54 30" /><path d="M16 28 V52 H48 V28" /><rect x="26" y="38" width="12" height="14" /></svg>
  ),
  agenda: (
    <svg {...SVG_PROPS}><rect x="10" y="14" width="44" height="40" rx="3" /><path d="M10 24 H54" /><path d="M20 8 V18 M44 8 V18" /><path d="M16 32 H32 M16 40 H40 M16 48 H28" /></svg>
  ),
  speakers: (
    <svg {...SVG_PROPS}><circle cx="32" cy="22" r="8" /><path d="M16 52 C16 42 24 38 32 38 C40 38 48 42 48 52" /><path d="M28 30 L28 36 M36 30 L36 36 M30 36 H34" /></svg>
  ),
  discussions: (
    <svg {...SVG_PROPS}><path d="M12 18 H44 V36 H30 L22 44 V36 H12 Z" /><path d="M22 22 H34 M22 28 H34" /><path d="M52 28 H56 V46 H42 L34 54 V46 H50" /></svg>
  ),
  tickets: (
    <svg {...SVG_PROPS}><path d="M8 22 V42 A4 4 0 0 0 12 46 A4 4 0 0 1 12 54 H52 A4 4 0 0 1 52 46 A4 4 0 0 0 56 42 V22 A4 4 0 0 0 52 18 A4 4 0 0 1 52 10 H12 A4 4 0 0 1 12 18 A4 4 0 0 0 8 22 Z" /><path d="M28 12 V52" strokeDasharray="2 4" /></svg>
  ),
  networking: (
    <svg {...SVG_PROPS}><circle cx="32" cy="14" r="6" /><circle cx="14" cy="42" r="6" /><circle cx="50" cy="42" r="6" /><path d="M32 20 L18 38 M32 20 L46 38 M20 42 H44" /></svg>
  ),
  sponsors: (
    <svg {...SVG_PROPS}><rect x="10" y="20" width="44" height="32" rx="3" /><path d="M22 20 V12 H42 V20" /><path d="M16 32 H22 M28 32 H36 M42 32 H48 M16 42 H28 M34 42 H48" /></svg>
  ),
  venue: (
    <svg {...SVG_PROPS}><path d="M32 8 L8 22 L8 56 L24 56 L24 40 H40 V56 H56 V22 Z" /><path d="M14 30 H20 M28 30 H34 M44 30 H50" /></svg>
  ),
  exhibitors: (
    <svg {...SVG_PROPS}><rect x="8" y="20" width="48" height="32" rx="3" /><path d="M22 20 V12 A2 2 0 0 1 24 10 H40 A2 2 0 0 1 42 12 V20" /><path d="M8 32 H56" /><path d="M28 32 V36 H36 V32" /></svg>
  ),
  gallery: (
    <svg {...SVG_PROPS}><rect x="8" y="14" width="48" height="36" rx="3" /><circle cx="22" cy="26" r="3" /><path d="M8 42 L22 30 L34 42 L44 34 L56 46" /></svg>
  ),
  register: (
    <svg {...SVG_PROPS}><rect x="14" y="10" width="36" height="44" rx="3" /><path d="M22 22 H42 M22 30 H42 M22 38 H34" /><path d="M40 44 L46 50 L56 38" /></svg>
  ),
  signin: (
    <svg {...SVG_PROPS}><path d="M28 14 H50 V50 H28" /><path d="M14 32 H40" /><path d="M30 22 L40 32 L30 42" /></svg>
  ),
}

const TILE_DESCRIPTION: Record<StandardPageKind, string> = {
  home:        "Landing page with hero, dates and CTAs.",
  agenda:      "Schedule of sessions across days.",
  speakers:    "Grid of speakers with photos and bios.",
  discussions: "Q&A and conversation threads.",
  tickets:     "Pricing tiers and registration CTA.",
  networking:  "Attendee directory and chat tools.",
  sponsors:    "Partner logos grouped by tier.",
  venue:       "Map, directions and venue details.",
  exhibitors:  "Booths grouped by category.",
  gallery:     "Photo gallery from previous editions.",
  register:    "Registration form for attendees.",
  signin:      "Sign-in entry for returning attendees.",
}

const BLANK_TILE: Tile = {
  kind: "__blank__",
  label: "Blank page",
  description: "Start with a clean canvas.",
  svg: (
    <svg {...SVG_PROPS}>
      <rect x="14" y="10" width="36" height="44" rx="3" strokeDasharray="3 4" />
      <path d="M32 22 V42 M22 32 H42" />
    </svg>
  ),
}

export function AddPageDialog({
  eventId,
  onClose,
  onAdded,
}: {
  eventId: string
  onClose: () => void
  onAdded: (kind: StandardPageKind) => void
}) {
  const [available, setAvailable] = useState<StandardPageKind[]>([])
  const [loading, setLoading] = useState(true)
  const [busyKind, setBusyKind] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showBlankForm, setShowBlankForm] = useState(false)

  useEffect(() => {
    let cancelled = false
    void listAvailableStandardPageKinds(eventId).then((res) => {
      if (cancelled) return
      setAvailable(res.kinds)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [eventId])

  // Esc closes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [onClose])

  async function pick(kind: StandardPageKind) {
    setBusyKind(kind); setError(null)
    const res = await addStandardPage(eventId, kind)
    setBusyKind(null)
    if (!res.success) {
      setError(res.error ?? "Failed to add page")
      return
    }
    onAdded(kind)
    onClose()
  }

  const tiles: Tile[] = [
    ...available.map((kind) => ({
      kind,
      label: DEFAULT_PAGE_LABELS[kind],
      description: TILE_DESCRIPTION[kind],
      svg: TILE_SVG[kind],
    })),
    BLANK_TILE,
  ]

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[640px] max-w-[90vw] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 px-5 h-12 flex items-center border-b border-[var(--z-border,#e5e7eb)]">
          <h2 className="flex-1 text-[14px] font-bold text-[var(--z-text,#1f2937)]">Add a page</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="z-btn z-btn-icon">
            <X size={14} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-[var(--z-text-muted,#6b7280)]" />
            </div>
          ) : showBlankForm ? (
            <BlankPageForm
              eventId={eventId}
              onCancel={() => setShowBlankForm(false)}
              onAdded={(kind) => { onAdded(kind); onClose() }}
            />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {tiles.map((t) => {
                const isBlank = t.kind === "__blank__"
                const busy = busyKind === t.kind
                return (
                  <button
                    key={t.kind}
                    type="button"
                    disabled={busy}
                    onClick={() => isBlank ? setShowBlankForm(true) : pick(t.kind as StandardPageKind)}
                    className="group relative flex flex-col items-center gap-2 rounded-lg border border-[var(--z-border,#e5e7eb)] bg-white p-4 text-center hover:border-[var(--z-info,#3e7af7)] hover:shadow-md hover:-translate-y-px transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-wait"
                  >
                    <span className="w-14 h-14 grid place-items-center text-[var(--z-text-muted,#6b7280)] group-hover:text-[var(--z-info,#3e7af7)] transition-colors">
                      {busy ? <Loader2 size={22} className="animate-spin" /> : t.svg}
                    </span>
                    <span className="block text-[12px] font-bold text-[var(--z-text,#1f2937)]">{t.label}</span>
                    <span className="block text-[11px] text-[var(--z-text-muted,#6b7280)] leading-snug">{t.description}</span>
                  </button>
                )
              })}
            </div>
          )}
          {error && <p className="mt-3 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
        </div>
      </div>
    </div>
  )
}

function BlankPageForm({
  eventId, onCancel, onAdded,
}: {
  eventId: string
  onCancel: () => void
  onAdded: (kind: StandardPageKind) => void
}) {
  const [label, setLabel] = useState("New page")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true); setError(null)
    // Look for any unused standard kind to use as the holder. The
    // user's blank page becomes one of the canonical kinds (most
    // commonly 'discussions' / 'networking' / 'gallery' since those
    // tend to be unused). The label they entered overrides the
    // canonical label so the nav shows what they typed.
    const avail = await listAvailableStandardPageKinds(eventId)
    const fallback = avail.kinds[0]
    if (!fallback) {
      setError("Every canonical page kind is already in use. Hide one before adding another, or rename an existing page in Pages → Settings.")
      setBusy(false)
      return
    }
    const addRes = await addStandardPage(eventId, fallback)
    if (!addRes.success) {
      setError(addRes.error ?? "Failed to create page")
      setBusy(false)
      return
    }
    // Rename the new row's label to whatever the user typed. We do this
    // via updateStandardPage to keep slug + visibility on the canonical
    // defaults.
    const { updateStandardPage } = await import("@/app/actions/standardPageActions")
    await updateStandardPage(eventId, fallback, { label: label.trim() || "New page" })
    setBusy(false)
    onAdded(fallback)
  }

  return (
    <div className="max-w-md mx-auto py-4 space-y-3">
      <h3 className="text-[14px] font-bold">Name your blank page</h3>
      <p className="text-[11px] text-[var(--z-text-muted,#6b7280)]">The page is created with no preset blocks. You can add sections from the left rail once it opens.</p>
      <label className="block">
        <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">Label</span>
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="z-input"
          maxLength={80}
        />
      </label>
      {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
      <div className="flex items-center gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} disabled={busy} className="z-btn">Back</button>
        <button type="button" onClick={submit} disabled={busy || !label.trim()} className="z-btn-primary">
          {busy && <Loader2 size={12} className="animate-spin" />}
          Create page
        </button>
      </div>
    </div>
  )
}
