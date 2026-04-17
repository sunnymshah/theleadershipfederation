"use client"

/**
 * ─── EVENT PAGE BUILDER (Zoho-Backstage-style) ───────────────────────
 *
 * Live editor for the /events/[slug] page. Add / edit / reorder /
 * delete section blocks; each block is a row from event_sections.
 *
 * Live preview = "View Page" opens the public /events/[slug] in a new
 * tab. Public ISR is revalidated on every save via revalidatePath, so
 * refresh to see changes instantly.
 */

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import {
  getEventSections,
  createEventSection,
  updateEventSection,
  deleteEventSection,
  moveEventSection,
  duplicateEventSection,
} from "@/app/actions/eventSectionActions"
import { SECTION_KINDS, type EventSection, type SectionKind } from "@/lib/event-sections"
import {
  ArrowUp, ArrowDown, Copy, Trash2, Plus, Eye, Loader2, Save, ChevronDown, ExternalLink, LayoutPanelTop, Type, BarChart3, Users, Clock, Ticket, Building2, PlayCircle, ImageIcon, MousePointerClick, HelpCircle, ArrowLeft,
} from "lucide-react"

const KIND_META: Record<
  SectionKind,
  { label: string; desc: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  hero:          { label: "Hero",            desc: "Banner with title, subtitle, background image", icon: LayoutPanelTop },
  rich_text:     { label: "Rich Text",       desc: "Long-form about / description",                 icon: Type },
  stats_row:     { label: "Stats Row",       desc: "Up to 4 headline metrics",                       icon: BarChart3 },
  speakers_grid: { label: "Speakers Grid",   desc: "Auto-populates from event speakers",             icon: Users },
  agenda:        { label: "Agenda",          desc: "Auto-populates from event sessions",             icon: Clock },
  tickets_cta:   { label: "Tickets + CTA",   desc: "Ticket tiers with Buy button",                   icon: Ticket },
  sponsors_grid: { label: "Sponsors Grid",   desc: "Auto-populates from event sponsors",             icon: Building2 },
  video:         { label: "Video",           desc: "YouTube embed",                                   icon: PlayCircle },
  gallery:       { label: "Gallery",         desc: "Image grid (paste URLs in data)",                icon: ImageIcon },
  cta_button:    { label: "CTA Button",      desc: "Centered call-to-action button",                  icon: MousePointerClick },
  faqs:          { label: "FAQ",             desc: "Question + answer accordion",                     icon: HelpCircle },
}

export default function EventBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [eventTitle, setEventTitle] = useState<string>("")
  const [eventSlug, setEventSlug] = useState<string>("")
  const [sections, setSections] = useState<EventSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null) // id of section being worked on

  const refresh = useCallback(async () => {
    setLoading(true)
    const res = await getEventSections(id as string)
    if (res.success) setSections(res.sections)
    else setError(res.error ?? "Failed to load sections")
    setLoading(false)
  }, [id])

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("title, slug").eq("id", id).maybeSingle()
      setEventTitle((data?.title as string) ?? "Event")
      setEventSlug((data?.slug as string) ?? "")
    })()
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleAdd(kind: SectionKind) {
    setAddOpen(false)
    setBusy("add")
    const defaults: Partial<Record<string, string>> = {
      hero:        "Welcome to the event",
      rich_text:   "About this event",
      stats_row:   "By the Numbers",
      speakers_grid: "Speakers",
      agenda:      "Agenda",
      tickets_cta: "Reserve Your Seat",
      sponsors_grid: "Our Partners",
      video:       "Highlight Reel",
      gallery:     "Gallery",
      cta_button:  "Register Now",
      faqs:        "Frequently Asked",
    }
    const defaultData: Record<string, unknown> = {}
    if (kind === "stats_row") defaultData.stats = [{ value: "30+", label: "Countries" }, { value: "500+", label: "CXOs" }]
    if (kind === "faqs") defaultData.faqs = [{ q: "How do I register?", a: "Click the Register button above." }]
    if (kind === "gallery") defaultData.images = []

    const res = await createEventSection({
      eventId: id as string,
      kind,
      title: defaults[kind] ?? "",
      data: defaultData,
    })
    setBusy(null)
    if (res.success) await refresh()
    else setError(res.error ?? "Failed to add section")
  }

  async function handleMove(sectionId: string, dir: "up" | "down") {
    setBusy(sectionId)
    const res = await moveEventSection(sectionId, dir)
    setBusy(null)
    if (!res.success) setError(res.error ?? "Reorder failed")
    await refresh()
  }

  async function handleDelete(sectionId: string) {
    if (!confirm("Delete this section? This cannot be undone.")) return
    setBusy(sectionId)
    const res = await deleteEventSection(sectionId)
    setBusy(null)
    if (!res.success) setError(res.error ?? "Delete failed")
    await refresh()
  }

  async function handleDuplicate(sectionId: string) {
    setBusy(sectionId)
    const res = await duplicateEventSection(sectionId)
    setBusy(null)
    if (!res.success) setError(res.error ?? "Duplicate failed")
    await refresh()
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href={`/admin/events/${id}`} className="inline-flex items-center gap-1.5 text-xs text-[#888] hover:text-[#333] mb-2">
            <ArrowLeft size={12} /> Back to event
          </Link>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Page Builder</h1>
          <p className="text-sm text-[#888] mt-1">
            Build the public <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">/events/{eventSlug}</code> page.
            Sections render top to bottom in the order below.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {eventSlug && (
            <Link
              href={`/events/${eventSlug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-[#1a1a2e] hover:bg-gray-50"
            >
              <Eye size={14} /> Preview <ExternalLink size={12} />
            </Link>
          )}
          <div className="relative">
            <button
              onClick={() => setAddOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1a1a2e] text-white text-sm font-bold hover:bg-[#2a2a4e]"
            >
              <Plus size={14} /> Add Section <ChevronDown size={12} />
            </button>
            {addOpen && (
              <div className="absolute right-0 mt-2 w-[360px] bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 max-h-[540px] overflow-y-auto">
                {SECTION_KINDS.map((kind) => {
                  const meta = KIND_META[kind]
                  const Icon = meta.icon
                  return (
                    <button
                      key={kind}
                      onClick={() => handleAdd(kind)}
                      className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#e7ab1c]/10 flex items-center justify-center text-[#a37410] shrink-0">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1a1a2e]">{meta.label}</p>
                        <p className="text-xs text-[#888] leading-snug">{meta.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline">dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : sections.length === 0 ? (
        <EmptyState eventTitle={eventTitle} onAddClick={() => setAddOpen(true)} />
      ) : (
        <div className="space-y-4">
          {sections.map((s, i) => (
            <SectionEditor
              key={s.id}
              section={s}
              index={i}
              total={sections.length}
              busy={busy === s.id}
              onMove={handleMove}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ eventTitle, onAddClick }: { eventTitle: string; onAddClick: () => void }) {
  return (
    <div className="text-center py-16 px-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/40">
      <LayoutPanelTop size={36} className="mx-auto text-[#c9a84c] mb-4" />
      <h3 className="text-lg font-semibold text-[#1a1a2e]">Start building {eventTitle}&apos;s page</h3>
      <p className="text-sm text-[#888] mt-1 max-w-md mx-auto">
        Click <span className="font-semibold">+ Add Section</span> to add your first block. Most events start with a <span className="font-semibold">Hero</span>, followed by <span className="font-semibold">About</span>, <span className="font-semibold">Speakers</span>, <span className="font-semibold">Agenda</span>, and <span className="font-semibold">Tickets</span>.
      </p>
      <button
        onClick={onAddClick}
        className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1a1a2e] text-white text-sm font-bold hover:bg-[#2a2a4e]"
      >
        <Plus size={14} /> Add your first section
      </button>
    </div>
  )
}

function SectionEditor({
  section,
  index,
  total,
  busy,
  onMove,
  onDelete,
  onDuplicate,
  onRefresh,
}: {
  section: EventSection
  index: number
  total: number
  busy: boolean
  onMove: (id: string, dir: "up" | "down") => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onRefresh: () => void
}) {
  const meta = KIND_META[section.kind]
  const Icon = meta.icon

  const [title, setTitle] = useState(section.title ?? "")
  const [subtitle, setSubtitle] = useState(section.subtitle ?? "")
  const [body, setBody] = useState(section.body ?? "")
  const [imageUrl, setImageUrl] = useState(section.image_url ?? "")
  const [videoUrl, setVideoUrl] = useState(section.video_url ?? "")
  const [ctaLabel, setCtaLabel] = useState(section.cta_label ?? "")
  const [ctaUrl, setCtaUrl] = useState(section.cta_url ?? "")
  const [dataJson, setDataJson] = useState(JSON.stringify(section.data ?? {}, null, 2))
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [open, setOpen] = useState(true)

  async function save() {
    setErr(null)
    setSaving(true)
    let dataParsed: Record<string, unknown> | null = {}
    try {
      dataParsed = JSON.parse(dataJson || "{}")
    } catch {
      setErr("Advanced data is not valid JSON")
      setSaving(false)
      return
    }
    const res = await updateEventSection(section.id, {
      title, subtitle, body, imageUrl, videoUrl, ctaLabel, ctaUrl, data: dataParsed ?? {},
    })
    setSaving(false)
    if (res.success) {
      setSavedAt(new Date().toLocaleTimeString())
      onRefresh()
    } else {
      setErr(res.error ?? "Save failed")
    }
  }

  const usesBody       = ["rich_text", "hero"].includes(section.kind)
  const usesImage      = ["hero", "gallery"].includes(section.kind)
  const usesVideo      = section.kind === "video"
  const usesCta        = ["hero", "cta_button", "tickets_cta"].includes(section.kind)
  const usesAdvanced   = ["stats_row", "faqs", "gallery"].includes(section.kind)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-3 min-w-0 text-left">
          <span className="w-8 h-8 rounded-lg bg-[#e7ab1c]/10 flex items-center justify-center text-[#a37410]">
            <Icon size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[#888] uppercase tracking-wider">{meta.label}</p>
            <p className="text-sm font-semibold text-[#1a1a2e] truncate">
              {title || <span className="text-[#ccc] italic">Untitled</span>}
            </p>
          </div>
          <ChevronDown size={14} className={`text-[#888] transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            disabled={busy || index === 0}
            onClick={() => onMove(section.id, "up")}
            title="Move up"
            className="p-1.5 rounded-md text-[#888] hover:text-[#1a1a2e] hover:bg-white disabled:opacity-30"
          >
            <ArrowUp size={14} />
          </button>
          <button
            disabled={busy || index === total - 1}
            onClick={() => onMove(section.id, "down")}
            title="Move down"
            className="p-1.5 rounded-md text-[#888] hover:text-[#1a1a2e] hover:bg-white disabled:opacity-30"
          >
            <ArrowDown size={14} />
          </button>
          <button
            disabled={busy}
            onClick={() => onDuplicate(section.id)}
            title="Duplicate"
            className="p-1.5 rounded-md text-[#888] hover:text-[#1a1a2e] hover:bg-white disabled:opacity-30"
          >
            <Copy size={14} />
          </button>
          <button
            disabled={busy}
            onClick={() => onDelete(section.id)}
            title="Delete"
            className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
          >
            <Trash2 size={14} />
          </button>
          {busy && <Loader2 size={14} className="text-[#888] animate-spin ml-1" />}
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="p-5 space-y-4">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder={meta.label}
            />
          </Field>
          <Field label="Subtitle">
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className={inputClass}
              placeholder="Optional — shown beneath the title"
            />
          </Field>
          {usesBody && (
            <Field label="Body">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className={`${inputClass} font-mono text-[13px] leading-relaxed resize-y`}
                placeholder="Paragraphs — use blank lines for breaks."
              />
            </Field>
          )}
          {usesImage && (
            <Field label="Background image URL">
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={inputClass}
                placeholder="https://... (or upload via admin event cover)"
              />
            </Field>
          )}
          {usesVideo && (
            <Field label="YouTube URL or video ID">
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className={inputClass}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </Field>
          )}
          {usesCta && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="CTA label">
                <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className={inputClass} placeholder="Register Now" />
              </Field>
              <Field label="CTA URL">
                <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className={inputClass} placeholder="/register or https://..." />
              </Field>
            </div>
          )}
          {usesAdvanced && (
            <Field
              label={
                section.kind === "stats_row"
                  ? "Stats (JSON)"
                  : section.kind === "faqs"
                    ? "FAQs (JSON)"
                    : "Gallery images (JSON)"
              }
              hint={
                section.kind === "stats_row"
                  ? `e.g. { "stats": [ { "value": "30+", "label": "Countries" } ] }`
                  : section.kind === "faqs"
                    ? `e.g. { "faqs": [ { "q": "When?", "a": "15 March 2026" } ] }`
                    : `e.g. { "images": ["https://..."] }`
              }
            >
              <textarea
                value={dataJson}
                onChange={(e) => setDataJson(e.target.value)}
                rows={6}
                className={`${inputClass} font-mono text-[12px] resize-y bg-gray-50`}
              />
            </Field>
          )}

          {(section.kind === "speakers_grid" || section.kind === "agenda" || section.kind === "sponsors_grid") && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-[12px] text-blue-700">
              <span className="font-semibold">Auto-populated:</span>
              {section.kind === "speakers_grid"
                ? " this section pulls from the event's Speakers (Admin → Speakers tab)."
                : section.kind === "agenda"
                  ? " this section pulls from the event's Sessions (Admin → Sessions / Agenda Builder)."
                  : " this section pulls from the event's Sponsors (Admin → Sponsors tab)."}
            </div>
          )}

          {err && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{err}</div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            {savedAt && <span className="text-xs text-[#888]">Saved at {savedAt}</span>}
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1a1a2e] text-white text-sm font-bold hover:bg-[#2a2a4e] disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Saving</>
              ) : (
                <><Save size={14} /> Save Section</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const inputClass =
  "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#e7ab1c]/30 focus:border-[#e7ab1c]/50 transition-colors"

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-[#aaa] mt-1">{hint}</span>}
    </label>
  )
}
