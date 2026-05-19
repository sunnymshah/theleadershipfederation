"use client"

/**
 * ── BuilderMain ──────────────────────────────────────────────────────
 *
 * Clean rebuild of the event page builder on Puck's stock editor UI.
 *
 * MULTI-PAGE: a thin page strip sits above the editor. "Home" lives in
 * events.builder_draft / builder_data; every other page lives in
 * events.builder_pages(_draft) keyed by slug. Each page carries its own
 * Puck `Data`. Pages double as the public nav — a page added here shows
 * up as a nav link on the event microsite.
 *
 * It reuses the same block library (`puckConfig`) and data model as the
 * old PuckEventBuilder, so both stay compatible; the legacy builder
 * remains available as a fallback.
 */

import { useCallback, useRef, useState } from "react"
import Link from "next/link"
import { Puck, type Data } from "@measured/puck"
import "@measured/puck/puck.css"
import { ArrowLeft, ExternalLink, Plus, X, Home, History, Globe, Loader2, RotateCcw, LayoutTemplate } from "lucide-react"
import { puckConfig } from "../puck-config"
import type { BuilderMetadata } from "../blocks"
import {
  saveBuilderDraft,
  publishBuilderAtomic,
  saveBuilderPageDraft,
  addBuilderPage,
  deleteBuilderPage,
  listBuilderRevisions,
  restoreBuilderRevision,
  getBuilderSettings,
  saveBuilderSettingsGroup,
  type BuilderRevision,
} from "@/app/actions/eventBuilderActions"
import {
  sortPages,
  type BuilderPagesMap,
} from "@/lib/event-builder-pages"

type SaveState = "idle" | "saving" | "saved" | "error"

const HOME = "home"
const blankData: Data = { content: [], root: { props: {} }, zones: {} } as unknown as Data

// Starter templates — ordered lists of block types. Each is expanded to a
// full page using every block's own defaultProps from puckConfig, so a
// template drops in a complete, edit-ready layout.
const STARTER_TEMPLATES: Array<{ id: string; name: string; description: string; blocks: string[] }> = [
  {
    id: "conference",
    name: "Conference",
    description: "Hero, stats, speakers, agenda, tickets, sponsors, FAQ.",
    blocks: ["Hero", "StatsRow", "SpeakersGrid", "Agenda", "TicketsPricing", "SponsorsGrid", "Faqs"],
  },
  {
    id: "summit",
    name: "Summit",
    description: "Hero, about, speakers, schedule, sponsors, closing CTA.",
    blocks: ["Hero", "EventDescription", "SpeakersGrid", "ScheduleSummary", "SponsorsGrid", "CtaButton"],
  },
  {
    id: "expo",
    name: "Expo / Trade Show",
    description: "Hero, stats, exhibitors, sponsors, venue, hotels, FAQ.",
    blocks: ["Hero", "StatsRow", "ExhibitorsListing", "SponsorsGrid", "VenueMap", "HotelsListing", "Faqs"],
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "A lean page — hero, a short intro, ticket call-to-action.",
    blocks: ["Hero", "RichText", "TicketsCta"],
  },
]

interface BuilderMainProps {
  eventId: string
  eventTitle: string
  eventSlug: string
  initialData: Data
  initialPages: BuilderPagesMap
  metadata: BuilderMetadata
}

export function BuilderMain({
  eventId,
  eventTitle,
  eventSlug,
  initialData,
  initialPages,
  metadata,
}: BuilderMainProps) {
  // Live Puck data for every page, keyed by slug ("home" + sub-pages).
  const dataByPage = useRef<Record<string, Data>>({
    [HOME]: initialData,
    ...Object.fromEntries(
      Object.entries(initialPages).map(([slug, p]) => [slug, p.data as unknown as Data]),
    ),
  })
  // Page metadata (title/order) for the strip — home is implicit.
  const [pages, setPages] = useState<BuilderPagesMap>(initialPages)
  const [activeSlug, setActiveSlug] = useState<string>(HOME)
  const [puckKey, setPuckKey] = useState(0)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [busy, setBusy] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Revision history + SEO panels.
  const [showHistory, setShowHistory] = useState(false)
  const [revisions, setRevisions] = useState<BuilderRevision[] | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [showSeo, setShowSeo] = useState(false)
  const [seo, setSeo] = useState<{ title: string; description: string; ogImage: string } | null>(null)
  const [seoSaving, setSeoSaving] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  const pageList = sortPages(pages) // [slug, BuilderPage][]

  // Persist one page's data (debounced). Home → builder_draft; a sub-page
  // → builder_pages_draft[slug].
  const persist = useCallback(
    async (slug: string, data: Data) => {
      if (slug === HOME) {
        const res = await saveBuilderDraft(
          eventId,
          data as unknown as Parameters<typeof saveBuilderDraft>[1],
        )
        return res.success
      }
      const res = await saveBuilderPageDraft(
        eventId,
        slug,
        data as unknown as Parameters<typeof saveBuilderPageDraft>[2],
      )
      return res.success
    },
    [eventId],
  )

  const scheduleSave = useCallback(
    (slug: string, data: Data) => {
      setSaveState("saving")
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        const ok = await persist(slug, data)
        setSaveState(ok ? "saved" : "error")
      }, 700)
    },
    [persist],
  )

  // Puck reports an edit on the ACTIVE page.
  const onChange = useCallback(
    (d: Data) => {
      dataByPage.current[activeSlug] = d
      scheduleSave(activeSlug, d)
    },
    [activeSlug, scheduleSave],
  )

  // Switch pages — flush the current page's save first, then remount Puck.
  const switchPage = useCallback(
    async (slug: string) => {
      if (slug === activeSlug || busy) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      await persist(activeSlug, dataByPage.current[activeSlug])
      setSaveState("saved")
      setActiveSlug(slug)
      setPuckKey((k) => k + 1)
    },
    [activeSlug, busy, persist],
  )

  const handleAddPage = useCallback(async () => {
    const title = window.prompt("New page name (e.g. Agenda, Speakers, Sponsors)")
    if (!title || !title.trim()) return
    setBusy(true)
    const res = await addBuilderPage(eventId, title.trim())
    setBusy(false)
    if (!res.success || !res.slug) {
      alert(res.error ?? "Couldn't add the page.")
      return
    }
    const slug = res.slug
    dataByPage.current[slug] = blankData
    setPages((prev) => ({
      ...prev,
      [slug]: { title: title.trim(), data: blankData as unknown as BuilderPagesMap[string]["data"] },
    }))
    setActiveSlug(slug)
    setPuckKey((k) => k + 1)
  }, [eventId])

  const handleDeletePage = useCallback(
    async (slug: string) => {
      if (!window.confirm("Delete this page? Its content can't be recovered.")) return
      setBusy(true)
      const res = await deleteBuilderPage(eventId, slug)
      setBusy(false)
      if (!res.success) {
        alert(res.error ?? "Couldn't delete the page.")
        return
      }
      delete dataByPage.current[slug]
      setPages((prev) => {
        const next = { ...prev }
        delete next[slug]
        return next
      })
      if (activeSlug === slug) {
        setActiveSlug(HOME)
        setPuckKey((k) => k + 1)
      }
    },
    [eventId, activeSlug],
  )

  // Publish — flush every page draft, then snapshot to live.
  const handlePublish = useCallback(
    async (data: Data) => {
      setSaveState("saving")
      dataByPage.current[activeSlug] = data
      // Make sure all sub-page drafts are written before the atomic publish.
      for (const [slug, d] of Object.entries(dataByPage.current)) {
        if (slug === HOME) continue
        await persist(slug, d)
      }
      const res = await publishBuilderAtomic(
        eventId,
        dataByPage.current[HOME] as unknown as Parameters<typeof publishBuilderAtomic>[1],
      )
      setSaveState(res.success ? "saved" : "error")
    },
    [eventId, activeSlug, persist],
  )

  // Revision history — list past publishes, restore one into the draft.
  const openHistory = useCallback(async () => {
    setShowHistory(true)
    setRevisions(null)
    const res = await listBuilderRevisions(eventId)
    setRevisions(res.success ? res.revisions : [])
  }, [eventId])

  const restore = useCallback(
    async (revisionId: string) => {
      if (!window.confirm("Restore this version into the draft? Review it on the canvas, then Publish to go live.")) return
      setRestoringId(revisionId)
      const res = await restoreBuilderRevision(eventId, revisionId)
      setRestoringId(null)
      if (!res.success) {
        alert(res.error ?? "Restore failed.")
        return
      }
      window.location.reload()
    },
    [eventId],
  )

  // SEO — per-event search/social metadata.
  const openSeo = useCallback(async () => {
    setShowSeo(true)
    setSeo(null)
    const res = await getBuilderSettings(eventId)
    const s = (res.settings?.seo ?? {}) as Record<string, unknown>
    setSeo({
      title: typeof s.title === "string" ? s.title : "",
      description: typeof s.description === "string" ? s.description : "",
      ogImage: typeof s.ogImage === "string" ? s.ogImage : "",
    })
  }, [eventId])

  const saveSeo = useCallback(async () => {
    if (!seo) return
    setSeoSaving(true)
    const res = await saveBuilderSettingsGroup(eventId, "seo", { ...seo })
    setSeoSaving(false)
    if (!res.success) {
      alert(res.error ?? "Couldn't save SEO settings.")
      return
    }
    setShowSeo(false)
  }, [eventId, seo])

  // Templates — replace the active page's content with a starter layout.
  const applyTemplate = useCallback(
    (blocks: string[]) => {
      if (!window.confirm("Apply this template? It replaces the current page's content.")) return
      const comps = puckConfig.components as Record<string, { defaultProps?: Record<string, unknown> }>
      const content = blocks.map((type, i) => ({
        type,
        props: { ...(comps[type]?.defaultProps ?? {}), id: `${type}-${Date.now()}-${i}` },
      }))
      const data = { content, root: { props: {} }, zones: {} } as unknown as Data
      dataByPage.current[activeSlug] = data
      setShowTemplates(false)
      setPuckKey((k) => k + 1)
      scheduleSave(activeSlug, data)
    },
    [activeSlug, scheduleSave],
  )

  const statusLabel =
    saveState === "saving" ? "Saving…"
    : saveState === "saved" ? "All changes saved"
    : saveState === "error" ? "Save failed — retry"
    : ""

  const overrides = {
    headerActions: ({ children }: { children: React.ReactNode }) => (
      <div className="flex items-center gap-1.5">
        <Link
          href="/admin/builder"
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-[13px] font-medium text-[#1d1d1f]/65 hover:text-[#1d1d1f] hover:bg-black/[0.05] transition-colors"
        >
          <ArrowLeft size={15} /> Builders
        </Link>
        <a
          href={`/events/${eventSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-[13px] font-medium text-[#1d1d1f]/65 hover:text-[#1d1d1f] hover:bg-black/[0.05] transition-colors"
        >
          View live <ExternalLink size={13} />
        </a>
        {statusLabel && (
          <span
            className={
              "text-[12px] tabular-nums px-1.5 " +
              (saveState === "error" ? "text-red-500" : "text-[#1d1d1f]/45")
            }
          >
            {statusLabel}
          </span>
        )}
        <button
          type="button"
          onClick={() => setShowTemplates(true)}
          title="Starter templates"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[#1d1d1f]/60 hover:text-[#1d1d1f] hover:bg-black/[0.05] transition-colors"
        >
          <LayoutTemplate size={15} />
        </button>
        <button
          type="button"
          onClick={openHistory}
          title="Version history"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[#1d1d1f]/60 hover:text-[#1d1d1f] hover:bg-black/[0.05] transition-colors"
        >
          <History size={15} />
        </button>
        <button
          type="button"
          onClick={openSeo}
          title="SEO settings"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[#1d1d1f]/60 hover:text-[#1d1d1f] hover:bg-black/[0.05] transition-colors"
        >
          <Globe size={15} />
        </button>
        {children}
      </div>
    ),
  }

  return (
    <div
      className="builder-main h-screen flex flex-col"
      style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif" }}
    >
      {/* ── Page strip ─────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-1 h-11 px-3 bg-[#f5f5f7] border-b border-[#e5e7eb] overflow-x-auto">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1d1d1f]/40 pr-2 shrink-0">
          Pages
        </span>
        <PageTab
          label="Home"
          icon
          active={activeSlug === HOME}
          onClick={() => switchPage(HOME)}
        />
        {pageList.map(([slug, page]) => (
          <PageTab
            key={slug}
            label={page.title}
            active={activeSlug === slug}
            onClick={() => switchPage(slug)}
            onDelete={() => handleDeletePage(slug)}
          />
        ))}
        <button
          type="button"
          onClick={handleAddPage}
          disabled={busy}
          className="shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[12px] font-semibold text-[#0071e3] hover:bg-[#0071e3]/10 transition-colors disabled:opacity-50"
        >
          <Plus size={13} /> Add page
        </button>
      </div>

      {/* ── Puck editor ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        <Puck
          key={`${activeSlug}:${puckKey}`}
          config={puckConfig}
          data={dataByPage.current[activeSlug] ?? blankData}
          metadata={{
            ...(metadata as unknown as Record<string, unknown>),
            editor: true,
          }}
          headerTitle={
            activeSlug === HOME
              ? eventTitle
              : `${eventTitle} — ${pages[activeSlug]?.title ?? activeSlug}`
          }
          headerPath="Page Builder"
          onChange={(d) => onChange(d as Data)}
          onPublish={(d) => handlePublish(d as Data)}
          overrides={overrides}
          iframe={{ enabled: true }}
        />
      </div>

      {/* ── Version history ────────────────────────────────────────── */}
      {showHistory && (
        <Modal title="Version history" onClose={() => setShowHistory(false)}>
          {revisions === null ? (
            <div className="py-10 flex items-center justify-center gap-2 text-[13px] text-[#1d1d1f]/45">
              <Loader2 size={15} className="animate-spin" /> Loading…
            </div>
          ) : revisions.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-[#1d1d1f]/45">
              No published versions yet. Each time you Publish, a restore point is saved here.
            </p>
          ) : (
            <ul className="divide-y divide-[#e5e7eb] max-h-[60vh] overflow-y-auto">
              {revisions.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#1d1d1f]">
                      {new Date(r.created_at).toLocaleString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                    {r.label && <p className="text-[12px] text-[#1d1d1f]/50 truncate">{r.label}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => restore(r.id)}
                    disabled={restoringId !== null}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-semibold text-[#0071e3] hover:bg-[#0071e3]/10 transition-colors disabled:opacity-50"
                  >
                    {restoringId === r.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {/* ── SEO settings ───────────────────────────────────────────── */}
      {showSeo && (
        <Modal title="SEO & social preview" onClose={() => setShowSeo(false)}>
          {seo === null ? (
            <div className="py-10 flex items-center justify-center gap-2 text-[13px] text-[#1d1d1f]/45">
              <Loader2 size={15} className="animate-spin" /> Loading…
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">Page title</span>
                <span className="block text-[11px] text-[#1d1d1f]/45 mb-1.5">Search-result + browser-tab title (~60 chars)</span>
                <input
                  type="text"
                  value={seo.title}
                  onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                  placeholder={eventTitle}
                  className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-[13px] text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </label>
              <label className="block">
                <span className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">Meta description</span>
                <span className="block text-[11px] text-[#1d1d1f]/45 mb-1.5">The grey summary under the title in Google (~155 chars)</span>
                <textarea
                  rows={3}
                  value={seo.description}
                  onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-[13px] text-[#1d1d1f] resize-none focus:outline-none focus:border-[#0071e3]"
                />
              </label>
              <label className="block">
                <span className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">Social share image URL</span>
                <span className="block text-[11px] text-[#1d1d1f]/45 mb-1.5">Shown when the page is shared on LinkedIn / WhatsApp / X</span>
                <input
                  type="url"
                  value={seo.ogImage}
                  onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
                  placeholder="https://…"
                  className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-[13px] text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSeo(false)}
                  className="px-4 h-9 rounded-lg text-[13px] font-medium text-[#1d1d1f]/65 hover:bg-black/[0.05] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveSeo}
                  disabled={seoSaving}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg text-[13px] font-semibold bg-[#0071e3] text-white hover:bg-[#0077ed] transition-colors disabled:opacity-50"
                >
                  {seoSaving && <Loader2 size={13} className="animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
      {/* ── Starter templates ──────────────────────────────────────── */}
      {showTemplates && (
        <Modal title="Starter templates" onClose={() => setShowTemplates(false)}>
          <p className="text-[12px] text-[#1d1d1f]/55 mb-3">
            Pick a layout to drop a full set of sections onto the current page.
            Auto-filled blocks (speakers, agenda, sponsors) populate from the
            event&rsquo;s own data.
          </p>
          <ul className="space-y-2">
            {STARTER_TEMPLATES.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => applyTemplate(t.blocks)}
                  className="w-full text-left p-3 rounded-xl border border-[#e5e7eb] hover:border-[#0071e3] hover:bg-[#0071e3]/[0.03] transition-colors"
                >
                  <p className="text-[13px] font-semibold text-[#1d1d1f]">{t.name}</p>
                  <p className="text-[12px] text-[#1d1d1f]/55 mt-0.5">{t.description}</p>
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1d1d1f]/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-12 border-b border-[#e5e7eb]">
          <h2 className="text-[14px] font-semibold text-[#1d1d1f]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#1d1d1f]/50 hover:text-[#1d1d1f] hover:bg-black/[0.05] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function PageTab({
  label,
  active,
  icon,
  onClick,
  onDelete,
}: {
  label: string
  active: boolean
  icon?: boolean
  onClick: () => void
  onDelete?: () => void
}) {
  return (
    <div
      className={
        "group shrink-0 inline-flex items-center h-7 rounded-md text-[12.5px] font-medium transition-colors " +
        (active
          ? "bg-white text-[#1d1d1f] shadow-sm ring-1 ring-[#e5e7eb]"
          : "text-[#1d1d1f]/60 hover:text-[#1d1d1f] hover:bg-white/70")
      }
    >
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 pl-2.5 pr-2 h-7"
      >
        {icon && <Home size={12} />}
        <span className="max-w-[140px] truncate">{label}</span>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${label}`}
          className="pr-1.5 pl-0.5 h-7 text-[#1d1d1f]/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
