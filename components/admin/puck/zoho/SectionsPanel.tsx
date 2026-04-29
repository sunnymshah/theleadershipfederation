"use client"

/**
 * Sections panel — the catalog of block types the user can add to their
 * page. Replaces Puck's text-only single-column block list with Zoho's
 * 2-column tile layout.
 *
 * Tiles are draggable into the canvas the same way Puck's default
 * components are — we still mount Puck and use its dispatch to add
 * blocks. This component just renders nicer-looking tiles that defer to
 * the Puck-managed drag layer beneath.
 *
 * For now, since Puck's drag layer is the source of truth, this panel
 * is largely a "browse + click-to-add" UI: clicking a tile dispatches
 * the Puck `addItem` action.
 */

import { useMemo, useState, useEffect } from "react"
import {
  Layout, Type, BarChart3, Users, Clock, Ticket as TicketIcon,
  Building2, Image as ImageIcon, Hash, Quote, Newspaper, Mail,
  Minus, RectangleHorizontal, Columns2, GripVertical,
  Calendar, Map as MapIcon, Sparkles, BookText, ListChecks,
  ImagePlus, Share2, Target, Star, FormInput, ArrowDownAZ,
  type LucideIcon,
} from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"

type Tile = {
  type: string             // matches Puck config component name
  label: string
  description: string
  Icon: LucideIcon
  category: "Headers" | "Story" | "Speakers" | "Program" | "Tickets" | "Sponsors" | "Media" | "Venue" | "CTAs" | "FAQs" | "Layout" | "Discovery"
}

const TILES: Tile[] = [
  // Headers
  { type: "Hero",       label: "Hero",       description: "Cover image + title + CTA", Icon: Layout,    category: "Headers" },
  { type: "Countdown",  label: "Countdown",  description: "4-up days/hours/min/sec",   Icon: Clock,     category: "Headers" },
  { type: "Carousel",   label: "Carousel",   description: "Sliding banner with dots",  Icon: Sparkles,  category: "Headers" },
  // Story
  { type: "RichText",       label: "Rich text",  description: "Markdown body",         Icon: Type,        category: "Story" },
  { type: "TextBox",        label: "Text box",   description: "Freeform paragraph",    Icon: BookText,    category: "Story" },
  { type: "StatsRow",       label: "Stats",      description: "By-the-numbers row",    Icon: BarChart3,   category: "Story" },
  { type: "TwoColumn",      label: "Two column", description: "Image + body",          Icon: Columns2,    category: "Story" },
  { type: "Testimonial",    label: "Testimonial",description: "Pull quote",            Icon: Quote,       category: "Story" },
  { type: "TabsBlock",      label: "Tabs",       description: "Horizontal tabbed body",Icon: ListChecks,  category: "Story" },
  { type: "AccordionBlock", label: "Accordion",  description: "Stacked collapsibles",  Icon: ArrowDownAZ, category: "Story" },
  // Speakers
  { type: "SpeakersGrid", label: "Speakers grid", description: "Cards or circles", Icon: Users, category: "Speakers" },
  // Program
  { type: "Agenda", label: "Agenda", description: "Sessions timeline",  Icon: Clock, category: "Program" },
  // Tickets
  { type: "TicketsCta",     label: "Tickets CTA",     description: "Compact CTA + 3 cards",  Icon: TicketIcon, category: "Tickets" },
  { type: "TicketsPricing", label: "Pricing cards",   description: "Tier cards w/ features", Icon: TicketIcon, category: "Tickets" },
  // Sponsors
  { type: "SponsorsGrid", label: "Sponsors grid", description: "Logo grid (tier groupable)", Icon: Building2, category: "Sponsors" },
  { type: "LogosStrip",   label: "Logos strip",   description: "Inline logos row",            Icon: Building2, category: "Sponsors" },
  // Media
  { type: "Video",         label: "Video",         description: "YouTube/Vimeo/Loom/MP4", Icon: Newspaper, category: "Media" },
  { type: "Gallery",       label: "Gallery",       description: "Image grid + lightbox",  Icon: ImageIcon, category: "Media" },
  { type: "ImageBlock",    label: "Image",         description: "Single image w/ caption", Icon: ImagePlus, category: "Media" },
  { type: "ImageHotspots", label: "Image hotspots",description: "Numbered overlays",       Icon: Target,    category: "Media" },
  // Venue
  { type: "VenueMap", label: "Venue map", description: "Google Maps embed", Icon: MapIcon, category: "Venue" },
  // CTAs
  { type: "CtaButton", label: "Call-to-action", description: "Single CTA button",   Icon: Star,         category: "CTAs" },
  { type: "FormBlock", label: "Form",           description: "Custom form + webhook", Icon: FormInput,  category: "CTAs" },
  { type: "Newsletter",label: "Newsletter",     description: "Deprecated — use Form", Icon: Mail,       category: "CTAs" },
  { type: "StickyCta", label: "Sticky CTA",     description: "Fixed bottom bar",      Icon: RectangleHorizontal, category: "CTAs" },
  { type: "SocialBar", label: "Social bar",     description: "Platform links row",    Icon: Share2,     category: "CTAs" },
  // FAQs
  { type: "Faqs", label: "FAQs", description: "Question/answer rows", Icon: Hash, category: "FAQs" },
  // Layout
  { type: "Spacer",  label: "Spacer",  description: "Vertical gap",        Icon: Minus, category: "Layout" },
  { type: "Divider", label: "Divider", description: "Horizontal divider",  Icon: Minus, category: "Layout" },
  // Discovery
  { type: "EventCardGrid", label: "Other events", description: "Cross-promote events", Icon: Calendar, category: "Discovery" },
]

export function SectionsPanel({
  onClose,
  onAddBlock,
  allowedTypes,
}: {
  onClose?: () => void
  /** Caller dispatches a Puck addItem with this block type. */
  onAddBlock: (blockType: string) => void
  /** When provided, the palette is filtered to ONLY these block types
   *  + the always-allowed building blocks (Spacer / Divider). When
   *  omitted, every registered block type is shown. */
  allowedTypes?: string[]
}) {
  const [search, setSearch] = useState("")
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  // Listen for the "/" keyboard shortcut from PuckEventBuilder.
  useEffect(() => {
    const onFocusSearch = () => {
      const el = document.querySelector<HTMLInputElement>('input[type="search"]')
      el?.focus()
    }
    window.addEventListener("builder:focus-search", onFocusSearch)
    return () => window.removeEventListener("builder:focus-search", onFocusSearch)
  }, [])

  const allowedSet = useMemo(() => {
    if (!allowedTypes) return null
    // Always permit the most general layout blocks regardless of page kind.
    return new Set([...allowedTypes, "Spacer", "Divider"])
  }, [allowedTypes])

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = allowedSet
      ? TILES.filter((t) => allowedSet.has(t.type))
      : TILES
    const visible = q
      ? filtered.filter((t) => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
      : filtered
    const byCat = new Map<Tile["category"], Tile[]>()
    for (const t of visible) {
      if (!byCat.has(t.category)) byCat.set(t.category, [])
      byCat.get(t.category)!.push(t)
    }
    return byCat
  }, [search, allowedSet])

  return (
    <SecondaryPanel
      title="Sections"
      onClose={onClose}
      searchPlaceholder="Search blocks…"
      searchValue={search}
      onSearchChange={setSearch}
    >
      {grouped.size === 0 ? (
        <div className="z-empty">
          <Layout size={32} strokeWidth={1.5} className="z-empty-icon" />
          <p className="z-empty-title">No matching blocks</p>
          <p className="z-empty-desc">Try a different keyword.</p>
        </div>
      ) : (
        <div className="px-3 pb-4">
          {Array.from(grouped.entries()).map(([category, tiles]) => {
            const isCollapsed = collapsed[category]
            return (
              <div key={category} className="pt-3">
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => ({ ...c, [category]: !isCollapsed }))}
                  className="w-full flex items-center justify-between px-1 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-text,#1f2937)]"
                >
                  <span>{category}</span>
                  <span className="text-[14px] leading-none">{isCollapsed ? "+" : "−"}</span>
                </button>
                {!isCollapsed && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {tiles.map((t) => (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => onAddBlock(t.type)}
                        title={t.description}
                        className="group relative flex flex-col items-start gap-1 p-2.5 h-20 rounded-[6px] border border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg,#fff)] hover:bg-[var(--z-bg-alt,#f7f8fa)] hover:border-[var(--z-border-strong,#d1d5db)] hover:-translate-y-px hover:shadow-[var(--z-shadow-sm)] transition-all text-left"
                      >
                        <span className="absolute right-1.5 top-1.5 text-[var(--z-text-subtle,#9ca3af)] opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical size={12} strokeWidth={1.5} />
                        </span>
                        <span className="text-[var(--z-text,#1f2937)]">
                          <t.Icon size={16} strokeWidth={1.5} />
                        </span>
                        <span className="text-[12px] font-semibold text-[var(--z-text,#1f2937)] leading-tight">
                          {t.label}
                        </span>
                        <span className="text-[10px] text-[var(--z-text-muted,#6b7280)] leading-tight line-clamp-1">
                          {t.description}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </SecondaryPanel>
  )
}
