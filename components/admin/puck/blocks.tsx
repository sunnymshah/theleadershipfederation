/**
 * ── Puck section components ───────────────────────────────────────────
 *
 * Every block the admin can drop onto the event-page canvas. Mirrors the
 * legacy `components/site/EventSections.tsx` renderer 1:1 so the public
 * page looks identical whether it's rendered from `event_sections` rows
 * or from Puck `Data`.
 *
 * Each block accepts a shared `LayoutProps` object (padding, background
 * colour/image, text align) via a `layout?` prop — applied by
 * `SectionShell`. Most blocks also accept `backgroundImage` so any
 * section can sit over a hero image.
 *
 * Shared data (speakers / sessions / sponsors / tickets / event) is passed
 * via Puck's `metadata` object — `puck.metadata.event` etc. — populated by
 * the builder and the public renderer.
 *
 * These components are used on BOTH the server (public Render) and the
 * client (editor). Keep them side-effect free.
 */

"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Calendar, MapPin, User, Mic2, Ticket, ChevronRight, Building2, Quote, Check,
  Briefcase,
} from "lucide-react"
import { resolveUrl, urlIsExternal } from "./UrlPicker"
import { GalleryLightbox } from "./GalleryLightbox"
import { CarouselInner } from "./CarouselInner"
import { HeroSliderInner } from "./HeroSliderInner"
import { FormBlockClient, type FormField } from "./FormBlockClient"
import { parseFocalPoint } from "@/components/admin/ImageUploadCrop"
import {
  useInlineEdit, isEditorRender,
  patchBlockProps, patchBlockArrayItem,
} from "@/lib/inline-edit"
import { getString, type StringKey, type TextOverrides } from "@/lib/i18n"

export const sfFont = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

/* ── Shared event data types ───────────────────────────────────────── */

export type EventShape = {
  id: string
  slug: string
  title: string
  start_date: string
  end_date: string | null
  venue: string | null
  description: string | null
  cover_image_url: string | null
  /** A2: optional event logo (with optional ?fp=x,y focal point suffix).
   *  Powers EventTopNav left-edge logo, Hero useEventLogo, Footer logo. */
  logo_url?: string | null
}
export type SpeakerShape = {
  id: string
  name: string
  designation: string | null
  company: string | null
  image_url: string | null
  /** Optional URL slug — when set, SpeakersGrid + Agenda can link to a detail page (B18). */
  slug?: string | null
}
export type SessionShape = {
  id: string
  title: string
  starts_at: string
  ends_at: string | null
  speaker_names: string[] | null
  track: string | null
  /** Optional slug for Agenda's linkToDetailPages (B19). */
  slug?: string | null
}
export type SponsorShape = { id: string; name: string; logo_url: string | null; tier: string | null; website: string | null }
export type TicketShape  = {
  id: string
  name: string
  description: string | null
  price_inr: number
  sold: number
  inventory_limit: number | null
  /** Optional feature bullets (B16). */
  features?: string[] | null
  /** Optional early-bird countdown end (B16). */
  early_bird_ends_at?: string | null
}

export type SocialHandles = {
  twitter?: string
  linkedin?: string
  instagram?: string
  facebook?: string
  youtube?: string
  website?: string
}

export type ExhibitorShape = {
  id: string
  name: string
  logo_url: string | null
  category: string | null
  booth: string | null
  description: string | null
  website: string | null
}

export type ExhibitorCategoryShape = {
  id: string
  name: string
  color: string | null
}

export type HotelShape = {
  id: string
  name: string
  image_url: string | null
  address: string | null
  distance_km: number | null
  price_range: string | null
  booking_url: string | null
  description: string | null
}

export type BuilderMetadata = {
  event: EventShape
  speakers: SpeakerShape[]
  sessions: SessionShape[]
  sponsors: SponsorShape[]
  tickets: TicketShape[]
  /** ITEM 2.4 — wired into Hero inline social row + Footer. */
  socialHandles?: SocialHandles
  /** ITEM 6 — populated when an Exhibitors block is rendered. */
  exhibitors?: ExhibitorShape[]
  exhibitorCategories?: ExhibitorCategoryShape[]
  /** ITEM 7 — populated for the Hotels block. */
  hotels?: HotelShape[]
  /** ITEM 10.2 — Agenda + Footer copyright year reads this. */
  timeFormat?: { dateFormat?: string; timeFormat?: string; showTimezone?: boolean }
  /** ITEM 10.3 — VenueMap reads provider/zoom/directions. */
  mapSettings?: { provider?: "google" | "openstreetmap"; defaultZoom?: number; showDirectionsButton?: boolean }
  /** ITEM 4.4 — per-locale string overrides (events.text_overrides) +
   *  the resolved current locale. Blocks pull these into getString()
   *  so the admin's Customize Text panel beats the English defaults. */
  textOverrides?: TextOverrides
  defaultLocale?: string
}

/** Pull metadata off the puck context. Components receive `puck.metadata`
 *  from both the editor and the public renderer. */
export function getMeta(puck: { metadata?: Record<string, unknown> }): BuilderMetadata {
  const m = (puck?.metadata ?? {}) as Partial<BuilderMetadata>
  return {
    event: m.event ?? {
      id: "",
      slug: "",
      title: "",
      start_date: new Date().toISOString(),
      end_date: null,
      venue: null,
      description: null,
      cover_image_url: null,
      logo_url: null,
    },
    speakers: m.speakers ?? [],
    sessions: m.sessions ?? [],
    sponsors: m.sponsors ?? [],
    tickets: m.tickets ?? [],
    socialHandles: m.socialHandles ?? {},
    exhibitors: m.exhibitors ?? [],
    exhibitorCategories: m.exhibitorCategories ?? [],
    hotels: m.hotels ?? [],
    timeFormat: m.timeFormat ?? {},
    mapSettings: m.mapSettings ?? {},
    textOverrides: m.textOverrides ?? {},
    defaultLocale: m.defaultLocale ?? "en",
  }
}

/** ITEM 4.4 — resolve a public-string with the meta-bound overrides. */
export function metaString(
  meta: BuilderMetadata,
  key: StringKey,
  vars?: Record<string, string | number>,
): string {
  return getString(key, meta.defaultLocale ?? "en", meta.textOverrides ?? {}, vars)
}

/* ── Inline-edit primitives shared across blocks (ITEMS 3 + 4) ──────
 *
 * `EditableText` wraps a single string prop on a top-level block.
 * `EditableArrayText` wraps a string field inside an array entry
 * (used by StatsRow.stats[i] / Faqs.faqs[i]).
 *
 * Both gate the contentEditable wrapper on isEditorRender(puck) so the
 * public renderer never gets contentEditable nodes.
 */
type Tag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"

function EditableText({
  as = "span",
  value,
  blockId,
  propKey,
  className,
  style,
  multiline,
  editor,
}: {
  as?: Tag
  value: string
  blockId: string | undefined
  propKey: string
  className?: string
  style?: CSSProperties
  multiline?: boolean
  editor: boolean
}) {
  if (!editor || !blockId) {
    const Static = as
    return <Static className={className} style={style}>{value}</Static>
  }
  return (
    <EditableTextInner
      as={as}
      value={value}
      blockId={blockId}
      propKey={propKey}
      className={className}
      style={style}
      multiline={multiline}
    />
  )
}
function EditableTextInner({
  as, value, blockId, propKey, className, style, multiline,
}: {
  as: Tag
  value: string
  blockId: string
  propKey: string
  className?: string
  style?: CSSProperties
  multiline?: boolean
}) {
  const bag = useInlineEdit(value, (next) => {
    patchBlockProps(blockId, () => ({ [propKey]: next }))
  }, { multiline })
  const Tag = as
  return <Tag className={className} style={style} {...bag} />
}

function EditableArrayText({
  as = "span",
  value,
  blockId,
  arrayKey,
  index,
  itemKey,
  className,
  style,
  multiline,
  editor,
}: {
  as?: Tag
  value: string
  blockId: string | undefined
  arrayKey: string
  index: number
  itemKey: string
  className?: string
  style?: CSSProperties
  multiline?: boolean
  editor: boolean
}) {
  if (!editor || !blockId) {
    const Static = as
    return <Static className={className} style={style}>{value}</Static>
  }
  return (
    <EditableArrayTextInner
      as={as}
      value={value}
      blockId={blockId}
      arrayKey={arrayKey}
      index={index}
      itemKey={itemKey}
      className={className}
      style={style}
      multiline={multiline}
    />
  )
}
function EditableArrayTextInner({
  as, value, blockId, arrayKey, index, itemKey, className, style, multiline,
}: {
  as: Tag
  value: string
  blockId: string
  arrayKey: string
  index: number
  itemKey: string
  className?: string
  style?: CSSProperties
  multiline?: boolean
}) {
  const bag = useInlineEdit(value, (next) => {
    patchBlockArrayItem(blockId, arrayKey, index, { [itemKey]: next })
  }, { multiline })
  const Tag = as
  return <Tag className={className} style={style} {...bag} />
}

/* ── Shared layout prop (applied by <SectionShell/>) ───────────────── */

export type LayoutProps = {
  paddingY?: "none" | "sm" | "md" | "lg" | "xl"
  backgroundColor?: string       // hex or empty
  backgroundImage?: string       // URL or empty
  backgroundOverlay?: number     // 0..100, overlay opacity on bg image
  /** Hex/rgb colour for the overlay tint. Defaults to black when blank. */
  overlayColor?: string
  textColor?: string             // hex or empty
  textAlign?: "left" | "center" | "right"
  fullBleed?: boolean
  /** Advanced — set the section's HTML id (anchor link target). */
  anchor?: string
  /** Advanced — append a custom className to the SectionShell wrapper. */
  cssClass?: string
  /** Advanced — when true, renders pointer-events:none for non-admin viewers. */
  locked?: boolean
}

const padY = {
  none: "py-0",
  sm: "py-8 sm:py-10",
  md: "py-14 sm:py-16",
  lg: "py-16 sm:py-20",
  xl: "py-24 sm:py-28",
} as const

function SectionShell({
  layout,
  children,
  baseClass = "",
  dark = false,
  hidden = false,
}: {
  layout?: LayoutProps
  children: ReactNode
  baseClass?: string
  dark?: boolean
  /** When true, SectionShell adds data-lf-hidden so the editor CSS
   *  paints the diagonal-stripe overlay. The public renderer filters
   *  hidden blocks before this ever runs (see PuckPublicRenderer). */
  hidden?: boolean
}) {
  const l = layout ?? {}
  const padding = padY[l.paddingY ?? "lg"]
  const align =
    l.textAlign === "center" ? "text-center" :
    l.textAlign === "right"  ? "text-right" : ""
  const hasBgImage = Boolean(l.backgroundImage)
  const overlayPct = typeof l.backgroundOverlay === "number"
    ? Math.max(0, Math.min(100, l.backgroundOverlay))
    : (dark && hasBgImage ? 55 : 0)

  const style: CSSProperties = {}
  if (l.backgroundColor) style.backgroundColor = l.backgroundColor
  if (l.textColor) style.color = l.textColor
  if (hasBgImage) {
    // Translate (overlayColor + opacityPct) into an rgba() string so any
    // hex / "white" / etc. the user pastes in works. Falls back to black.
    const overlayRgba = makeOverlayColor(l.overlayColor, overlayPct)
    style.backgroundImage = `linear-gradient(${overlayRgba}, ${overlayRgba}), url('${l.backgroundImage}')`
    style.backgroundSize = "cover"
    style.backgroundPosition = "center"
  }

  // Only force white text when there's a background image AND the user
  // hasn't explicitly chosen a text colour — otherwise their custom
  // textColor gets nuked by `text-white` on the section.
  const forcesWhite = hasBgImage && !l.textColor

  // Advanced: anchor + cssClass + locked. Anchor renders as the section
  // id so #anchor links scroll to it. cssClass appends to className.
  // locked gates pointer-events for non-admin viewers (admin Puck editor
  // overrides this via its own click-blocker so editing still works).
  const anchorId = (l.anchor ?? "").trim() || undefined
  const extraClass = (l.cssClass ?? "").trim()
  const lockedClass = l.locked ? "pointer-events-none select-none" : ""

  return (
    <section
      id={anchorId}
      data-lf-hidden={hidden ? "true" : undefined}
      className={`${padding} ${align} ${baseClass} ${forcesWhite ? "text-white" : ""} ${extraClass} ${lockedClass}`.trim()}
      style={style}
    >
      {children}
    </section>
  )
}

/** Convert a hex (or short-hex) overlay colour + 0..100 opacity into an
 *  rgba() string. Falls back to black when the input isn't a parseable
 *  hex. Accepts "#rgb", "#rrggbb", "rgb(...)", or "rgba(...)" passthroughs. */
function makeOverlayColor(input: string | undefined, opacityPct: number): string {
  const a = Math.max(0, Math.min(100, opacityPct)) / 100
  const v = (input ?? "").trim()
  if (!v) return `rgba(0,0,0,${a})`
  // Pass through existing rgb()/rgba() values; replace alpha if present.
  if (/^rgba?\(/i.test(v)) {
    const inside = v.replace(/^rgba?\(|\)$/g, "").split(",").map((s) => s.trim())
    const [r, g, b] = inside
    if (r && g && b) return `rgba(${r}, ${g}, ${b}, ${a})`
    return `rgba(0,0,0,${a})`
  }
  // Hex (#RGB or #RRGGBB). Strip leading hash, expand short form.
  let h = v.startsWith("#") ? v.slice(1) : v
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) return `rgba(0,0,0,${a})`
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

function fmtDate(d: string, end?: string | null) {
  const start = new Date(d)
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }
  if (!end) return start.toLocaleDateString("en-IN", opts)
  const endDate = new Date(end)
  return `${start.toLocaleDateString("en-IN", { day: "numeric", month: "long" })} – ${endDate.toLocaleDateString("en-IN", opts)}`
}
function fmtTime(iso: string, opts?: { timeFormat?: string; showTimezone?: boolean; tz?: string }) {
  if (!iso) return ""
  const hour12 = (opts?.timeFormat ?? "12h") === "12h"
  const out: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12 }
  if (opts?.tz) out.timeZone = opts.tz
  if (opts?.showTimezone) out.timeZoneName = "short"
  return new Date(iso).toLocaleTimeString("en-IN", out)
}
function fmtDateWith(iso: string, format?: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = String(d.getFullYear())
  if (format === "MM/DD/YYYY") return `${mm}/${dd}/${yyyy}`
  if (format === "YYYY-MM-DD") return `${yyyy}-${mm}-${dd}`
  // Default DD/MM/YYYY
  return `${dd}/${mm}/${yyyy}`
}
function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

/** Detect the video provider + return an embed URL (or direct file URL).
 *  Supports: YouTube, Vimeo, Loom, raw mp4/webm. */
type VideoEmbed =
  | { kind: "youtube"; embedUrl: string }
  | { kind: "vimeo";   embedUrl: string }
  | { kind: "loom";    embedUrl: string }
  | { kind: "file";    fileUrl:  string; mimeType: string }
  | { kind: "unknown" }

function detectVideo(url: string): VideoEmbed {
  if (!url) return { kind: "unknown" }
  const u = url.trim()

  // YouTube — re-use the existing extractor.
  const yt = extractYouTubeId(u)
  if (yt) return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${yt}` }

  // Vimeo — both vimeo.com/<id> and player.vimeo.com/video/<id>.
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return { kind: "vimeo", embedUrl: `https://player.vimeo.com/video/${vimeo[1]}` }

  // Loom — share URLs use /share/<id>.
  const loom = u.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
  if (loom) return { kind: "loom", embedUrl: `https://www.loom.com/embed/${loom[1]}` }

  // Raw video files.
  const ext = u.split("?")[0].split(".").pop()?.toLowerCase()
  if (ext === "mp4")  return { kind: "file", fileUrl: u, mimeType: "video/mp4" }
  if (ext === "webm") return { kind: "file", fileUrl: u, mimeType: "video/webm" }
  if (ext === "mov")  return { kind: "file", fileUrl: u, mimeType: "video/quicktime" }

  return { kind: "unknown" }
}

/* ── ROOT (theme cascade + 20 presets) ───────────────────────────── *
 * Pick a preset from the dropdown OR set explicit colour + font fields.
 * A preset wins over individual fields so the user can "set and forget".
 * Colours are published as CSS custom properties so child blocks can
 * read them without hardcoding.                                       */

export type ThemePresetKey =
  | "custom"
  | "classicGold"   | "midnightGold" | "ivorySerif"  | "techBlue"
  | "forest"        | "sunset"       | "royalPurple" | "crimson"
  | "slatePro"      | "neonNoir"     | "roseQuartz"  | "emerald"
  | "amberLuxe"     | "navyLinen"    | "peach"       | "mint"
  | "dusk"          | "paper"        | "ocean"       | "monochrome"

type ThemePreset = {
  label: string
  primary: string
  text: string
  bg: string
  font: NonNullable<RootProps["fontFamily"]>
}

export const THEME_PRESETS: Record<ThemePresetKey, ThemePreset> = {
  custom:       { label: "Custom (use fields below)", primary: "#e7ab1c", text: "#1a1a2e", bg: "#ffffff", font: "sf" },
  classicGold:  { label: "1. Classic Gold",  primary: "#e7ab1c", text: "#1a1a2e", bg: "#ffffff", font: "sf" },
  midnightGold: { label: "2. Midnight Gold", primary: "#e7ab1c", text: "#f5f5f5", bg: "#0a0a14", font: "sf" },
  ivorySerif:   { label: "3. Ivory Serif",   primary: "#8a6b3a", text: "#2a1a0a", bg: "#fdfaf3", font: "serif" },
  techBlue:     { label: "4. Tech Blue",     primary: "#2563eb", text: "#0f172a", bg: "#f8fafc", font: "inter" },
  forest:       { label: "5. Forest",        primary: "#065f46", text: "#022c22", bg: "#f0fdf4", font: "inter" },
  sunset:       { label: "6. Sunset",        primary: "#f97316", text: "#431407", bg: "#fffbeb", font: "inter" },
  royalPurple:  { label: "7. Royal Purple",  primary: "#7c3aed", text: "#1e1b4b", bg: "#faf5ff", font: "inter" },
  crimson:      { label: "8. Crimson",       primary: "#dc2626", text: "#450a0a", bg: "#fef2f2", font: "serif" },
  slatePro:     { label: "9. Slate Pro",     primary: "#475569", text: "#0f172a", bg: "#f1f5f9", font: "sf" },
  neonNoir:     { label: "10. Neon Noir",    primary: "#22d3ee", text: "#e2e8f0", bg: "#020617", font: "mono" },
  roseQuartz:   { label: "11. Rose Quartz",  primary: "#e11d48", text: "#4c0519", bg: "#fff1f2", font: "serif" },
  emerald:      { label: "12. Emerald",      primary: "#10b981", text: "#064e3b", bg: "#ecfdf5", font: "sf" },
  amberLuxe:    { label: "13. Amber Luxe",   primary: "#d97706", text: "#451a03", bg: "#fffbeb", font: "serif" },
  navyLinen:    { label: "14. Navy Linen",   primary: "#f59e0b", text: "#f8f7f4", bg: "#1e293b", font: "serif" },
  peach:        { label: "15. Peach",        primary: "#fb923c", text: "#7c2d12", bg: "#fff7ed", font: "inter" },
  mint:         { label: "16. Mint",         primary: "#14b8a6", text: "#134e4a", bg: "#f0fdfa", font: "sf" },
  dusk:         { label: "17. Dusk",         primary: "#c4b5fd", text: "#f5f3ff", bg: "#1e1b4b", font: "inter" },
  paper:        { label: "18. Paper",        primary: "#dc2626", text: "#1f2937", bg: "#fef2f2", font: "serif" },
  ocean:        { label: "19. Ocean",        primary: "#0891b2", text: "#0c4a6e", bg: "#f0f9ff", font: "sf" },
  monochrome:   { label: "20. Monochrome",   primary: "#000000", text: "#111111", bg: "#ffffff", font: "mono" },
}

export type RootProps = {
  title?: string
  themePreset?: ThemePresetKey
  primaryColor?: string     // hex (overridden by preset unless preset = custom)
  textColor?: string        // hex
  bgColor?: string          // hex
  fontFamily?: "sf" | "inter" | "serif" | "mono"
}

const FONT_STACKS: Record<NonNullable<RootProps["fontFamily"]>, string> = {
  sf:    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
  inter: "'Inter', system-ui, sans-serif",
  serif: "'Playfair Display', 'Georgia', serif",
  mono:  "'JetBrains Mono', 'Menlo', monospace",
}

export function Root({ children, themePreset, primaryColor, textColor, bgColor, fontFamily }: RootProps & { children: ReactNode }) {
  // Preset wins unless set to "custom" — then fall back to explicit fields.
  const preset =
    themePreset && themePreset !== "custom"
      ? THEME_PRESETS[themePreset]
      : null
  const effPrimary = preset ? preset.primary : (primaryColor || "#e7ab1c")
  const effText    = preset ? preset.text    : (textColor    || "#1a1a2e")
  const effBg      = preset ? preset.bg      : (bgColor      || "#ffffff")
  const effFont    = preset ? preset.font    : (fontFamily   || "sf")
  const ff = FONT_STACKS[effFont]
  const style: CSSProperties = {
    fontFamily: ff,
    backgroundColor: effBg,
    color: effText,
    ["--lf-primary" as unknown as string]: effPrimary,
    ["--lf-text" as unknown as string]: effText,
    ["--lf-bg" as unknown as string]: effBg,
  }
  return <div style={style}>{children}</div>
}

/* ── HERO ─────────────────────────────────────────────────────────── */

/* ── ITEM 1 — per-slide background variants ──────────────────────── */
export type SlideBgColor = {
  mode: "flat" | "gradient"
  color: string
  gradientTo?: string
  /** 0..1 */
  opacity: number
}
export type SlideBgImage = {
  url: string
  /** 0..1 */
  opacity: number
  fit: "cover" | "contain" | "tile"
  position: { x: number; y: number }
  overlayEnabled: boolean
  overlayColor: string
  overlayOpacity: number
}
export type SlideBgVideo = {
  url: string
  loop: boolean
  overlayColor: string
  overlayOpacity: number
}
export type SlideBackground = {
  type: "color" | "image" | "video"
  color?: SlideBgColor
  image?: SlideBgImage
  video?: SlideBgVideo
  /** Optional override applied when window.innerWidth < 768. */
  mobile?: SlideBackground
}

export type HeroSlide = {
  id: string
  title: string
  subtitle: string
  ctaPrimaryLabel: string
  ctaPrimaryUrl: string
  ctaSecondaryLabel?: string
  ctaSecondaryUrl?: string
  backgroundImage: string
  alignment?: "left" | "center"
  useEventLogo?: boolean
  /** ITEM 1 — per-slide background. When set, overrides backgroundImage. */
  background?: SlideBackground
  /** ITEM 2 — slide layout + media size. */
  layout?: "media-left" | "media-right" | "media-top" | "media-bottom" | "background-only"
  mediaSize?: "xs" | "sm" | "md" | "lg" | "xl"
  horizontalAlign?: "left" | "center" | "right"
  verticalAlign?: "top" | "center" | "bottom"
  /** Side media element rendered next to copy when layout != background-only. */
  primaryMedia?: { kind: "image" | "video"; url: string; alt?: string }
  /** ITEM 3 — ordered element list. When present takes precedence over the
   *  legacy title/subtitle/cta props (kept for backwards compat). */
  elements?: HeroElement[]
}

/* ── ITEM 3 — slide elements library ─────────────────────────────── */
export type EventNameFormat = {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  textAlign?: "left" | "center" | "right"
  listType?: "none" | "ordered" | "bullet"
  textColor?: string
  textBackground?: string
  lineHeight?: number
  letterSpacing?: number
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize"
  link?: string
}
export type HeroElementButton = {
  id: string
  label: string
  type: "register" | "url" | "anchor"
  url?: string
  anchor?: string
  style: "primary" | "secondary" | "outline"
  icon?: string
}
/**
 * ITEM 3 — element shape. Storage form is FLAT (one Puck array field
 * with all possible per-kind keys, irrelevant ones simply ignored at
 * runtime) because Puck v0.20's array fields can't describe a true
 * discriminated union.  The renderer narrows on `kind` at runtime.
 *
 * `HeroElementOf<K>` and `NarrowedHeroElement` (alias of the union of
 * narrowed forms keyed by `kind`) are exported so consumers and tests
 * get a type-safe view without losing the storage flatness.
 */
export type HeroElementKind =
  | "eventName"
  | "shortDescription"
  | "label"
  | "buttonGroup"
  | "countdown"
  | "socialHandles"
  | "secondaryMedia"
  | "primaryMedia"
  | "dateTime"
  | "venue"

export type HeroElement = {
  id: string
  kind: HeroElementKind
  // Text-bearing kinds (eventName / shortDescription / label).
  text?: string
  format?: EventNameFormat
  // buttonGroup
  buttons?: HeroElementButton[]
  // primaryMedia / secondaryMedia
  url?: string
  alt?: string
  mediaKind?: "image" | "video"
  // dateTime
  showVenue?: boolean
  showDate?: boolean
  showTime?: boolean
  widgetSize?: "sm" | "md" | "lg" | "xl"
  formatType?: "short" | "long" | "iso" | "us" | "eu"
  iconStyle?: "outline" | "solid" | "minimal" | "none"
  textColor?: string
}

/** Discriminated narrow form — useful when a caller needs the type
 *  system to enforce per-kind field requirements. Narrow with `narrow()`
 *  below at runtime; the storage shape stays flat. */
export type NarrowedHeroElement =
  | { id: string; kind: "eventName";        text?: string; format?: EventNameFormat }
  | { id: string; kind: "shortDescription"; text?: string; format?: EventNameFormat }
  | { id: string; kind: "label";            text?: string; format?: EventNameFormat }
  | { id: string; kind: "buttonGroup";      buttons: HeroElementButton[] }
  | { id: string; kind: "countdown" }
  | { id: string; kind: "socialHandles" }
  | { id: string; kind: "secondaryMedia";   url?: string; alt?: string; mediaKind?: "image" | "video" }
  | { id: string; kind: "primaryMedia";     url?: string; alt?: string; mediaKind?: "image" | "video" }
  | {
      id: string; kind: "dateTime";
      showVenue?: boolean; showDate?: boolean; showTime?: boolean;
      widgetSize?: "sm" | "md" | "lg" | "xl";
      formatType?: "short" | "long" | "iso" | "us" | "eu";
      iconStyle?: "outline" | "solid" | "minimal" | "none";
      textColor?: string;
    }
  | { id: string; kind: "venue" }

/** Narrow a flat HeroElement into its discriminated form. The runtime
 *  shape is unchanged; this is purely a type-system bridge. */
export function narrowHeroElement(el: HeroElement): NarrowedHeroElement {
  return el as unknown as NarrowedHeroElement
}

/** ITEM 3.2 — default element list for a brand-new slide. Five sensible
 *  defaults: eventName / dateTime / venue / shortDescription /
 *  buttonGroup with one Register button. Caller passes a unique id
 *  prefix so the ids don't collide across slides. */
export function buildDefaultElements(idPrefix = "el"): HeroElement[] {
  return [
    { id: `${idPrefix}-name`,  kind: "eventName" },
    { id: `${idPrefix}-dt`,    kind: "dateTime", showVenue: false, showDate: true, showTime: false, widgetSize: "md", iconStyle: "outline" },
    { id: `${idPrefix}-venue`, kind: "venue" },
    { id: `${idPrefix}-desc`,  kind: "shortDescription" },
    {
      id: `${idPrefix}-btns`,
      kind: "buttonGroup",
      buttons: [
        { id: `${idPrefix}-btn-1`, label: "Register Now", type: "register", url: "/tickets", style: "primary" },
      ],
    },
  ]
}

export type SliderControls = {
  arrowsVisible?: boolean
  arrowColor?: string
  arrowSize?: "sm" | "md" | "lg"
  /** ITEM 6.1 — chrome variants for the prev/next arrows. */
  arrowDesign?: "stroke" | "stroke-circle" | "filled" | "filled-box"
  navigatorVisible?: boolean
  /** ITEM 6.2 — adds dashes / lines alongside dots / numbers. */
  navigatorStyle?: "dots" | "dashes" | "lines" | "numbers"
  autoplay?: boolean
  intervalSec?: number
  transition?: "slide" | "fade"
  /** ITEM 6.3 — when true, autoplay pauses while the cursor is over the hero. */
  pauseOnHover?: boolean
}

export type HeroProps = {
  title: string
  subtitle: string
  ctaLabel: string
  ctaUrl: string
  /** Optional secondary CTA — renders an outline button next to the primary. */
  secondaryCtaLabel?: string
  secondaryCtaUrl?: string
  backgroundImage: string
  alignment?: "left" | "center"
  minHeight?: "short" | "tall" | "full"
  /** A2: when true, render the event logo (events.logo_url) above the title. */
  useEventLogo?: boolean
  /** ITEM 1: when slides[].length >= 1, Hero renders a slider; otherwise
   *  it renders the legacy single-slide layout from the top-level props. */
  slides?: HeroSlide[]
  sliderControls?: SliderControls
  /** ITEM 2: per-element visibility toggles. Default true. */
  showEventName?: boolean
  showDateTime?: boolean
  showLocation?: boolean
  showCountdown?: boolean
  showSocialHandles?: boolean
  showButtons?: boolean
}

export function Hero({
  title, subtitle, ctaLabel, ctaUrl, secondaryCtaLabel, secondaryCtaUrl,
  backgroundImage, alignment, minHeight, useEventLogo,
  slides, sliderControls,
  showEventName = true, showDateTime = true, showLocation = true,
  showCountdown = true, showSocialHandles = true, showButtons = true,
  puck,
}: HeroProps & { puck: { metadata?: Record<string, unknown>; dragRef?: unknown; id?: string } }) {
  const metaFull = getMeta(puck)
  const { event } = metaFull
  const bg = backgroundImage || event.cover_image_url
  const shownTitle = title || event.title
  const logo = useEventLogo ? event.logo_url ?? null : null
  // ITEM 4.4 — when the admin hasn't supplied custom CTA labels, fall
  // back to the per-locale Customize-Text override (or the English
  // default in lib/i18n.ts).
  const resolvedCtaLabel = (ctaLabel?.trim()) || metaString(metaFull, "hero.cta.default")
  const resolvedSecondaryCtaLabel =
    (secondaryCtaLabel?.trim()) || metaString(metaFull, "hero.cta.secondary")
  if (typeof window !== "undefined" && bg && !shownTitle) {
    console.warn("[Hero] background image present but no title for alt text — provide a Title or event.title")
  }
  // Only mark the cover image priority when this Hero is the first
  // content block on the page. PuckPublicRenderer stamps
  // metadata.firstBlockId with the id of the first content node.
  const meta = (puck?.metadata ?? {}) as Record<string, unknown>
  const firstBlockId = (meta.firstBlockId as string | null | undefined) ?? null
  const myId = puck?.id ?? null
  const isFirstBlock = firstBlockId !== null && myId !== null && firstBlockId === myId
  const height =
    minHeight === "full" ? "min-h-[calc(100vh-48px)]" :
    minHeight === "short" ? "min-h-[380px] sm:min-h-[460px]" :
                            "min-h-[520px] sm:min-h-[640px]"
  const centered = alignment === "center"

  // Read social handles from event-level builder_settings.general (passed
  // via metadata.socialHandles). Fall back to none.
  const socialHandles = (meta.socialHandles ?? {}) as {
    twitter?: string; linkedin?: string; instagram?: string;
    facebook?: string; youtube?: string; website?: string;
  }

  // ITEM 1: when slides are configured, hand off to the embla slider.
  if (Array.isArray(slides) && slides.length >= 1) {
    return (
      <HeroSliderInner
        slides={slides}
        event={event}
        controls={sliderControls ?? {}}
        height={height}
        isFirstBlock={isFirstBlock}
        socialHandles={socialHandles}
        editorMode={(meta as { editor?: boolean }).editor === true}
        blockId={puck?.id}
      />
    )
  }

  const hasAnySocial = !!(socialHandles.twitter || socialHandles.linkedin
    || socialHandles.instagram || socialHandles.facebook
    || socialHandles.youtube || socialHandles.website)

  return (
    <section className={`relative ${height} flex items-end overflow-hidden bg-[#1a1a2e]`}>
      {bg && (() => {
        const { src, objectPosition } = parseFocalPoint(bg)
        return (
          <Image
            src={src}
            alt={shownTitle || "Event"}
            fill
            priority={isFirstBlock}
            fetchPriority={isFirstBlock ? "high" : "auto"}
            className="object-cover opacity-60"
            style={{ objectPosition }}
            sizes="100vw"
          />
        )
      })()}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent" />
      <div className={`relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pb-16 pt-28 w-full ${centered ? "text-center" : ""}`}>
        {logo && (() => {
          const { src } = parseFocalPoint(logo)
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={`${event.title || "Event"} logo`}
              className={`h-14 sm:h-16 w-auto mb-6 drop-shadow-md ${centered ? "mx-auto" : ""}`}
            />
          )
        })()}
        {(showDateTime || showLocation) && event.start_date && (
          <div
            className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] mb-4 ${centered ? "justify-center" : ""}`}
            style={{ color: "var(--lf-primary, #e7ab1c)" }}
          >
            {showDateTime && (<><Calendar size={13} /> {fmtDate(event.start_date, event.end_date)}</>)}
            {showLocation && event.venue && (
              <>
                {showDateTime && <span className="opacity-40">·</span>}
                <MapPin size={13} /> {event.venue}
              </>
            )}
          </div>
        )}
        {showEventName && (
          <h1
            className={`text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-[1.05] ${centered ? "max-w-4xl mx-auto" : "max-w-4xl"}`}
            style={sfFont}
          >
            {shownTitle || "Untitled Event"}
          </h1>
        )}
        {subtitle && (
          <p className={`mt-5 text-lg sm:text-xl text-white/80 leading-relaxed ${centered ? "max-w-2xl mx-auto" : "max-w-2xl"}`}>
            {subtitle}
          </p>
        )}
        {showCountdown && event.start_date && (
          <HeroInlineCountdown to={event.start_date} centered={centered} />
        )}
        {showButtons && ((resolvedCtaLabel && ctaUrl) || (resolvedSecondaryCtaLabel && secondaryCtaUrl)) ? (
          <div className={`mt-8 flex flex-wrap items-center gap-3 ${centered ? "justify-center" : ""}`}>
            {resolvedCtaLabel && ctaUrl && (
              <Link
                href={resolveUrl(ctaUrl, event.slug)}
                target={urlIsExternal(ctaUrl) ? "_blank" : undefined}
                rel={urlIsExternal(ctaUrl) ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-[#1a1a2e] text-sm font-bold transition-colors hover:brightness-95"
                style={{ backgroundColor: "var(--lf-primary, #e7ab1c)" }}
              >
                {resolvedCtaLabel}
                <ChevronRight size={14} />
              </Link>
            )}
            {resolvedSecondaryCtaLabel && secondaryCtaUrl && (
              <Link
                href={resolveUrl(secondaryCtaUrl, event.slug)}
                target={urlIsExternal(secondaryCtaUrl) ? "_blank" : undefined}
                rel={urlIsExternal(secondaryCtaUrl) ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white border-2 border-white/80 text-sm font-bold hover:bg-white/10 transition-colors"
              >
                {resolvedSecondaryCtaLabel}
              </Link>
            )}
          </div>
        ) : null}
        {showSocialHandles && hasAnySocial && (
          <HeroInlineSocialHandles handles={socialHandles} centered={centered} />
        )}
      </div>
    </section>
  )
}

/** ITEM 2.3 — compact 4-up Days/Hours/Minutes/Seconds rendered INSIDE
 *  the hero. Smaller than the standalone Countdown block. */
function HeroInlineCountdown({ to, centered }: { to: string; centered: boolean }) {
  // ITEM 8.1 — Zoho-parity styling: thin transparent pills with a
  // primary-color border, transparent fill, white digit + soft white
  // label, and an inner divider via border-t between digit and label.
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const target = new Date(to).getTime()
  const ms = Math.max(0, target - now)
  const days = Math.floor(ms / 86_400_000)
  const hours = Math.floor((ms % 86_400_000) / 3_600_000)
  const mins = Math.floor((ms % 3_600_000) / 60_000)
  const secs = Math.floor((ms % 60_000) / 1000)
  const cell = (n: number, label: string) => (
    <div
      className="flex flex-col items-stretch min-w-[60px] sm:min-w-[72px] rounded-md border-2 bg-transparent text-white"
      style={{ borderColor: "var(--lf-primary, #e7ab1c)" }}
    >
      <span className="px-3 py-2 text-2xl sm:text-3xl font-bold text-white tabular-nums leading-none text-center">
        {String(n).padStart(2, "0")}
      </span>
      <span
        className="px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70 text-center border-t"
        style={{ borderTopColor: "var(--lf-primary, #e7ab1c)" }}
      >
        {label}
      </span>
    </div>
  )
  return (
    <div className={`mt-6 flex flex-wrap items-center gap-2.5 ${centered ? "justify-center" : ""}`}>
      {cell(days, "Days")}{cell(hours, "Hrs")}{cell(mins, "Min")}{cell(secs, "Sec")}
    </div>
  )
}

/** ITEM 2.4 — small inline social-icon row inside the hero. Pulls
 *  builder_settings.general.socialHandles via metadata. */
function HeroInlineSocialHandles({
  handles, centered,
}: {
  handles: { twitter?: string; linkedin?: string; instagram?: string; facebook?: string; youtube?: string; website?: string }
  centered: boolean
}) {
  const links: Array<{ key: string; href: string; label: string }> = []
  if (handles.twitter)   links.push({ key: "tw", href: handles.twitter,   label: "X / Twitter" })
  if (handles.linkedin)  links.push({ key: "li", href: handles.linkedin,  label: "LinkedIn" })
  if (handles.instagram) links.push({ key: "ig", href: handles.instagram, label: "Instagram" })
  if (handles.facebook)  links.push({ key: "fb", href: handles.facebook,  label: "Facebook" })
  if (handles.youtube)   links.push({ key: "yt", href: handles.youtube,   label: "YouTube" })
  if (handles.website)   links.push({ key: "ww", href: handles.website,   label: "Website" })
  if (links.length === 0) return null
  return (
    <div className={`mt-6 flex flex-wrap items-center gap-2.5 ${centered ? "justify-center" : ""}`}>
      {links.map((l) => (
        <a
          key={l.key}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 text-white text-[10px] font-bold uppercase"
        >
          {l.key.toUpperCase()}
        </a>
      ))}
    </div>
  )
}

/* ── RICH TEXT ────────────────────────────────────────────────────── */

export type RichTextProps = {
  title: string; subtitle: string; body: string
  layout?: LayoutProps
}

export function RichText({
  title, subtitle, body, layout, puck,
}: RichTextProps & { puck?: { metadata?: Record<string, unknown>; id?: string } }) {
  if (!body && !title) return <SectionPlaceholder label="Rich text" />
  // ITEM 3.1 — title + subtitle inline-editable. Body stays inspector-
  // only because it's markdown — pasting markdown source into a
  // contentEditable would surprise the user.
  const editor = isEditorRender(puck)
  const blockId = puck?.id
  return (
    <SectionShell layout={layout}>
      <div className="max-w-3xl mx-auto px-6">
        {(subtitle || editor) && (
          <EditableText
            as="p"
            editor={editor}
            blockId={blockId}
            propKey="subtitle"
            value={subtitle ?? ""}
            className="text-xs font-bold uppercase tracking-[0.22em] mb-4"
            style={{ color: "var(--lf-primary, #e7ab1c)" }}
          />
        )}
        {(title || editor) && (
          <EditableText
            as="h2"
            editor={editor}
            blockId={blockId}
            propKey="title"
            value={title ?? ""}
            className="text-3xl sm:text-4xl font-bold mb-5 tracking-tight"
            style={sfFont}
          />
        )}
        {body && (
          <div className="prose prose-neutral max-w-none leading-relaxed text-[16px]" style={{ opacity: 0.9 }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {body}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </SectionShell>
  )
}

/* ── STATS ROW ────────────────────────────────────────────────────── */

export type StatsRowProps = {
  title: string
  subtitle: string
  stats: Array<{ value: string; label: string; icon?: string }>
  /** Animate numbers from 0 → value when they enter the viewport. */
  animated?: boolean
  layout?: LayoutProps
}

/** Pull a digit-portion from "30+" / "1.2k" / "10" etc. so we can ramp it. */
function parseStatNumber(raw: string): { num: number; prefix: string; suffix: string } | null {
  const m = raw.match(/^(\D*)([\d,.]+)(.*)$/)
  if (!m) return null
  const num = parseFloat(m[2].replace(/,/g, ""))
  if (!Number.isFinite(num)) return null
  return { num, prefix: m[1] ?? "", suffix: m[3] ?? "" }
}

function AnimatedNumber({ value }: { value: string }) {
  const parsed = parseStatNumber(value)
  const ref = useRef<HTMLSpanElement | null>(null)
  const [displayed, setDisplayed] = useState<number>(0)
  useEffect(() => {
    if (!parsed) return
    const node = ref.current
    if (!node) return
    let started = false
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !started) {
          started = true
          const start = performance.now()
          const dur = 1100
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / dur)
            const eased = 1 - Math.pow(1 - p, 3)
            setDisplayed(parsed.num * eased)
            if (p < 1) requestAnimationFrame(tick)
            else setDisplayed(parsed.num)
          }
          requestAnimationFrame(tick)
          obs.disconnect()
        }
      }
    }, { threshold: 0.4 })
    obs.observe(node)
    return () => obs.disconnect()
  }, [parsed])
  if (!parsed) return <span ref={ref}>{value}</span>
  const isInt = Number.isInteger(parsed.num)
  const out = isInt ? Math.round(displayed).toLocaleString("en-IN") : displayed.toFixed(1)
  return <span ref={ref}>{parsed.prefix}{out}{parsed.suffix}</span>
}

export function StatsRow({
  title, stats, animated, layout, puck,
}: StatsRowProps & { puck?: { metadata?: Record<string, unknown>; id?: string } }) {
  if (!stats || stats.length === 0) return <SectionPlaceholder label="Stats (add rows in the right-hand inspector)" />
  const editor = isEditorRender(puck)
  const blockId = puck?.id
  const baseBg = layout?.backgroundColor || layout?.backgroundImage ? "" : "bg-[#F4F8FF]"
  return (
    <SectionShell layout={layout} baseClass={baseBg}>
      <div className="max-w-5xl mx-auto px-6">
        {(title || editor) && (
          <EditableText
            as="h2"
            editor={editor}
            blockId={blockId}
            propKey="title"
            value={title ?? ""}
            className="text-center text-2xl sm:text-3xl font-bold mb-10 tracking-tight"
            style={sfFont}
          />
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              {/* In editor mode the animated counter is replaced with an
                  editable static value — animating a contentEditable
                  fights with caret + paint and overrides the user's
                  typed digits. Public renderer keeps the animation. */}
              {editor && blockId ? (
                <EditableArrayText
                  as="div"
                  editor={editor}
                  blockId={blockId}
                  arrayKey="stats"
                  index={i}
                  itemKey="value"
                  value={stat.value ?? ""}
                  className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent tabular-nums"
                  style={{
                    ...sfFont,
                    backgroundImage: "linear-gradient(to right, var(--lf-primary, #e7ab1c), color-mix(in srgb, var(--lf-primary, #e7ab1c) 80%, black))",
                  }}
                />
              ) : (
                <div
                  className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent tabular-nums"
                  style={{
                    ...sfFont,
                    backgroundImage: "linear-gradient(to right, var(--lf-primary, #e7ab1c), color-mix(in srgb, var(--lf-primary, #e7ab1c) 80%, black))",
                  }}
                >
                  {animated ? <AnimatedNumber value={stat.value} /> : stat.value}
                </div>
              )}
              <EditableArrayText
                as="div"
                editor={editor}
                blockId={blockId}
                arrayKey="stats"
                index={i}
                itemKey="label"
                value={stat.label ?? ""}
                className="text-xs uppercase tracking-[0.15em] mt-2 font-semibold opacity-70"
              />
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

/* ── SPEAKERS GRID ────────────────────────────────────────────────── */

export type SpeakersGridProps = {
  title: string
  subtitle: string
  layout?: LayoutProps
  gridLayout: "grid-4" | "grid-3" | "row"
  frame: "circle" | "rounded" | "square"
  fit: "contain" | "cover"
  /** Wrap each speaker card in a link to /events/<slug>/speakers/<speakerSlug>. */
  linkToDetailPages?: boolean
}

export function SpeakersGrid({
  title, subtitle, layout, gridLayout, frame, fit, linkToDetailPages,
  puck,
}: SpeakersGridProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { speakers, event } = getMeta(puck)
  function wrap(sp: SpeakerShape, child: React.ReactNode): React.ReactNode {
    if (!linkToDetailPages || !sp.slug) return child
    return (
      <Link href={`/events/${event.slug}/speakers/${sp.slug}`} className="block hover:opacity-90 transition-opacity">
        {child}
      </Link>
    )
  }
  if (speakers.length === 0) return <SectionPlaceholder label="Speakers grid (empty — add speakers to this event)" />

  const gridCls =
    gridLayout === "row"    ? "flex flex-wrap items-start justify-center gap-6" :
    gridLayout === "grid-3" ? "grid grid-cols-2 sm:grid-cols-3 gap-6" :
                              "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"
  const isCircle = frame === "circle"
  const fitCls = fit === "contain" ? "object-contain" : "object-cover"

  return (
    <SectionShell layout={layout}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] mb-3 px-3 py-1 rounded-full" style={{ color: "var(--lf-primary, #e7ab1c)", backgroundColor: "rgba(231,171,28,0.1)" }}>
            Line-up
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={sfFont}>
            {title || "Speakers"}
          </h2>
          {subtitle && <p className="mt-3 opacity-70 max-w-2xl mx-auto">{subtitle}</p>}
        </div>

        {isCircle ? (
          <div className={gridCls}>
            {speakers.map((sp) => (
              <div key={sp.id} className="group flex flex-col items-center text-center">
                {wrap(sp, (
                  <>
                    <div className="relative w-36 h-36 sm:w-40 sm:h-40 mx-auto rounded-full overflow-hidden bg-[#F4F8FF] border-4 border-white shadow-[0_8px_24px_rgba(26,26,46,0.12)]">
                      {sp.image_url ? (
                        <Image src={sp.image_url} alt={sp.name} fill className={fitCls} sizes="160px" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <User size={56} className="text-[#1a1a2e]/20" />
                        </div>
                      )}
                    </div>
                    <h3 className="mt-4 text-sm font-bold leading-snug max-w-[180px]" style={sfFont}>{sp.name}</h3>
                    {sp.designation && <p className="text-xs opacity-70 mt-1 max-w-[180px]">{sp.designation}</p>}
                    {sp.company && <p className="text-[11px] font-semibold mt-0.5 max-w-[180px] truncate" style={{ color: "var(--lf-primary, #e7ab1c)" }}>{sp.company}</p>}
                  </>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className={gridCls}>
            {speakers.map((sp) => {
              const radius = frame === "square" ? "rounded-none" : "rounded-2xl"
              return (
                <div key={sp.id}>
                  {wrap(sp, (
                    <div className={`bg-white border border-[#1a1a2e]/[0.06] overflow-hidden shadow-sm ${radius}`}>
                      <div className="relative aspect-[4/5] bg-[#F4F8FF]">
                        {sp.image_url ? (
                          <Image src={sp.image_url} alt={sp.name} fill className={fitCls} sizes="(max-width: 640px) 50vw, 25vw" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <User size={48} className="text-[#1a1a2e]/15" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-bold text-[#1a1a2e] leading-snug truncate" style={sfFont}>{sp.name}</h3>
                        {sp.designation && <p className="text-xs text-[#1a1a2e]/70 mt-0.5 truncate">{sp.designation}</p>}
                        {sp.company && <p className="text-[11px] font-semibold mt-0.5 truncate" style={{ color: "var(--lf-primary, #e7ab1c)" }}>{sp.company}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </SectionShell>
  )
}

/* ── AGENDA ───────────────────────────────────────────────────────── */

export type AgendaProps = {
  title: string
  subtitle: string
  layout?: LayoutProps
  /** Group sessions by date and render day tabs at the top. */
  groupByDay?: boolean
  /** Show track filter chips when any session has a track. */
  showTracks?: boolean
  /** Show "60 min" duration next to time. */
  showDuration?: boolean
  /** Show speaker names below the title. */
  showSpeakers?: boolean
  /** When true, link each session to /events/<slug>/sessions/<sessionSlug>. */
  linkToDetailPages?: boolean
}

function formatDayKey(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}
function durationMins(starts: string, ends: string | null) {
  if (!ends) return null
  const a = new Date(starts).getTime()
  const b = new Date(ends).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  return Math.max(0, Math.round((b - a) / 60000))
}

export function Agenda({
  title, subtitle, layout, groupByDay, showTracks, showDuration, showSpeakers, linkToDetailPages,
  puck,
}: AgendaProps & { puck: { metadata?: Record<string, unknown> } }) {
  const meta = getMeta(puck)
  const { sessions, event, timeFormat: tf = {} } = meta
  if (sessions.length === 0) {
    return <SectionPlaceholder label={metaString(meta, "agenda.empty")} dark />
  }
  const hasOverride = layout?.backgroundColor || layout?.backgroundImage
  const baseBg = hasOverride ? "" : "bg-[#1a1a2e] text-white"
  // ITEM 10.2 — local time helper that honours timeFormat settings.
  const fmtT = (iso: string) => fmtTime(iso, { timeFormat: tf.timeFormat, showTimezone: tf.showTimezone })

  // Day grouping
  const dayKeys: string[] = []
  const byDay = new Map<string, typeof sessions>()
  for (const s of sessions) {
    const key = new Date(s.starts_at).toDateString()
    if (!byDay.has(key)) {
      byDay.set(key, [])
      dayKeys.push(key)
    }
    byDay.get(key)!.push(s)
  }
  const tracks = Array.from(new Set(sessions.map((s) => s.track).filter((t): t is string => Boolean(t))))

  return (
    <SectionShell layout={layout} baseClass={baseBg} dark>
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] mb-3 px-3 py-1 rounded-full border"
            style={{
              color: "var(--lf-primary, #e7ab1c)",
              backgroundColor: "color-mix(in srgb, var(--lf-primary, #e7ab1c) 15%, transparent)",
              borderColor: "color-mix(in srgb, var(--lf-primary, #e7ab1c) 20%, transparent)",
            }}
          >
            Schedule
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={sfFont}>
            {title || "Agenda"}
          </h2>
          {subtitle && <p className="mt-3 text-white/70 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
        <AgendaInteractive
          dayKeys={dayKeys}
          byDay={byDay}
          tracks={tracks}
          eventSlug={event.slug}
          options={{
            groupByDay: groupByDay ?? false,
            showTracks: showTracks ?? false,
            showDuration: showDuration ?? false,
            showSpeakers: showSpeakers ?? true,
            linkToDetailPages: linkToDetailPages ?? false,
          }}
          timeOpts={{ timeFormat: tf.timeFormat, showTimezone: tf.showTimezone }}
          dayLabelTemplate={metaString(meta, "agenda.day_label", { n: "{n}" })}
          allTracksLabel={metaString(meta, "agenda.allTracks")}
        />
      </div>
    </SectionShell>
  )
}

/** Client-only inner with the interactive day tabs / track chips. */
function AgendaInteractive({
  dayKeys, byDay, tracks, eventSlug, options, timeOpts,
  dayLabelTemplate, allTracksLabel,
}: {
  dayKeys: string[]
  byDay: Map<string, SessionShape[]>
  tracks: string[]
  eventSlug: string
  options: {
    groupByDay: boolean
    showTracks: boolean
    showDuration: boolean
    showSpeakers: boolean
    linkToDetailPages: boolean
  }
  /** ITEM 10.2 — honours timeFormat builder setting. */
  timeOpts?: { timeFormat?: string; showTimezone?: boolean }
  /** ITEM 4.4 — locale-resolved day label (e.g. "Day {n}") + all-tracks
   *  filter chip. The template uses {n} so we can substitute the index
   *  per-tab without re-running getString. */
  dayLabelTemplate?: string
  allTracksLabel?: string
}) {
  // For non-interactive use we still render correctly. The "use client" at
  // the top of this module makes the hooks below safe.
  const [activeDay, setActiveDay] = useState<string>(dayKeys[0] ?? "")
  const [activeTrack, setActiveTrack] = useState<string>("")
  const fmtT = (iso: string) => fmtTime(iso, timeOpts)

  const visible = options.groupByDay
    ? (byDay.get(activeDay) ?? [])
    : Array.from(byDay.values()).flat()
  const filtered = activeTrack
    ? visible.filter((s) => s.track === activeTrack)
    : visible

  return (
    <>
      {options.groupByDay && dayKeys.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
          {dayKeys.map((d, i) => {
            const list = byDay.get(d) ?? []
            const sample = list[0]?.starts_at
            return (
              <button
                key={d}
                type="button"
                onClick={() => setActiveDay(d)}
                className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-medium transition-colors ${
                  activeDay === d
                    ? "bg-white text-[#1a1a2e]"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                <span className="font-bold">
                  {(dayLabelTemplate ?? "Day {n}").replace("{n}", String(i + 1))}
                </span>
                {sample && <span className="opacity-70">{formatDayKey(sample)}</span>}
              </button>
            )
          })}
        </div>
      )}
      {options.showTracks && tracks.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
          <button
            type="button"
            onClick={() => setActiveTrack("")}
            className={`inline-flex items-center px-3 h-7 rounded-full text-[11px] font-medium ${
              activeTrack === "" ? "bg-[var(--lf-primary,#e7ab1c)] text-[#1a1a2e]" : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            {allTracksLabel ?? "All tracks"}
          </button>
          {tracks.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTrack(t)}
              className={`inline-flex items-center px-3 h-7 rounded-full text-[11px] font-medium ${
                activeTrack === t ? "bg-[var(--lf-primary,#e7ab1c)] text-[#1a1a2e]" : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {filtered.map((sess) => {
          const dur = durationMins(sess.starts_at, sess.ends_at)
          const sessSlug = (sess as unknown as { slug?: string }).slug
          const titleEl = (
            <h4 className="text-base font-semibold leading-snug">{sess.title}</h4>
          )
          return (
            <div key={sess.id} className="flex gap-5 p-5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <div className="shrink-0 font-mono text-sm w-20" style={{ color: "var(--lf-primary, #e7ab1c)" }}>
                {fmtT(sess.starts_at)}
                {options.showDuration && dur ? <div className="text-[10px] opacity-70 mt-0.5">{dur} min</div> : null}
              </div>
              <div className="flex-1 min-w-0">
                {options.linkToDetailPages && sessSlug
                  ? <Link href={`/events/${eventSlug}/sessions/${sessSlug}`} className="hover:underline">{titleEl}</Link>
                  : titleEl}
                {sess.track && <p className="text-xs mt-1" style={{ color: "var(--lf-primary, #e7ab1c)" }}>{sess.track}</p>}
                {options.showSpeakers && sess.speaker_names && sess.speaker_names.length > 0 && (
                  <p className="text-xs text-white/60 mt-1">
                    <Mic2 size={11} className="inline mr-1" />
                    {sess.speaker_names.join(", ")}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ── TICKETS CTA ──────────────────────────────────────────────────── */

export type TicketsCtaProps = { title: string; subtitle: string; ctaLabel: string; layout?: LayoutProps }

export function TicketsCta({
  title, subtitle, ctaLabel, layout,
  puck,
}: TicketsCtaProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { tickets, event } = getMeta(puck)
  return (
    <SectionShell layout={layout}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] mb-3 px-3 py-1 rounded-full"
            style={{
              color: "var(--lf-primary, #e7ab1c)",
              backgroundColor: "color-mix(in srgb, var(--lf-primary, #e7ab1c) 10%, transparent)",
            }}
          >
            Reserve Your Seat
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={sfFont}>
            {title || "Tickets"}
          </h2>
          {subtitle && <p className="mt-3 opacity-70 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {tickets.length === 0 ? (
            <div className="md:col-span-3 text-center text-sm opacity-50 py-8">
              Ticket sales open soon.
            </div>
          ) : tickets.map((t) => (
            <div key={t.id} className="p-6 bg-white border border-[#1a1a2e]/[0.08] rounded-2xl text-[#1a1a2e]">
              <h4 className="text-lg font-bold mb-1">{t.name}</h4>
              {t.description && <p className="text-sm opacity-65 mb-4 line-clamp-3">{t.description}</p>}
              <div className="text-3xl font-bold mb-5" style={sfFont}>
                ₹{t.price_inr.toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>
        {event.slug && (
          <div className="mt-8 text-center">
            <Link
              href={`/events/${event.slug}/tickets`}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#1a1a2e] text-white text-sm font-bold hover:bg-[#2a2a4e] transition-colors"
            >
              <Ticket size={14} />
              {ctaLabel || "Buy Tickets"}
              <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </SectionShell>
  )
}

/* ── SPONSORS GRID ────────────────────────────────────────────────── */

export type SponsorsGridProps = {
  title: string
  layout?: LayoutProps
  /** When true, partition sponsors by `tier` and render per-tier columns
   *  instead of a single uniform grid. */
  groupByTier?: boolean
  /** Override the tier display order. Defaults to the standard ladder. */
  tierOrder?: string[]
}

const DEFAULT_TIER_ORDER = ["title", "platinum", "gold", "silver", "bronze", "partner"]
const TIER_LABELS: Record<string, string> = {
  title: "Title Sponsor",
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
  partner: "Partners",
}
const TIER_COLS: Record<string, string> = {
  // Headline tier — bigger cards, fewer per row.
  title:    "grid-cols-1 sm:grid-cols-2",
  platinum: "grid-cols-1 sm:grid-cols-2",
  gold:     "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  silver:   "grid-cols-3 sm:grid-cols-4 md:grid-cols-6",
  bronze:   "grid-cols-3 sm:grid-cols-4 md:grid-cols-6",
  partner:  "grid-cols-3 sm:grid-cols-4 md:grid-cols-6",
}

function SponsorCard({
  sponsor,
}: {
  sponsor: SponsorShape
}) {
  return (
    <div className="aspect-[3/2] bg-white rounded-xl border border-[#1a1a2e]/[0.06] flex items-center justify-center p-4">
      {sponsor.logo_url ? (
        <Image src={sponsor.logo_url} alt={sponsor.name} width={160} height={80} className="object-contain max-h-12" />
      ) : (
        <span className="text-xs font-semibold text-[#1a1a2e]/70 text-center inline-flex items-center gap-1.5">
          <Building2 size={14} />
          {sponsor.name}
        </span>
      )}
    </div>
  )
}

export function SponsorsGrid({
  title, layout, groupByTier, tierOrder,
  puck,
}: SponsorsGridProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { sponsors } = getMeta(puck)
  if (sponsors.length === 0) return <SectionPlaceholder label="Sponsors grid (empty — add sponsors to this event)" />
  const hasOverride = layout?.backgroundColor || layout?.backgroundImage
  const baseBg = hasOverride ? "" : "bg-[#F4F8FF]"

  // If grouping is on, partition by tier; unknown tiers fall through to a
  // generic "Other" bucket at the end so they're never silently dropped.
  if (groupByTier) {
    const order = (tierOrder && tierOrder.length > 0 ? tierOrder : DEFAULT_TIER_ORDER)
      .map((t) => t.toLowerCase())
    const partitions = new Map<string, SponsorShape[]>()
    for (const sp of sponsors) {
      const key = (sp.tier || "").toLowerCase() || "other"
      if (!partitions.has(key)) partitions.set(key, [])
      partitions.get(key)!.push(sp)
    }
    const orderedKeys: string[] = [...order, ...Array.from(partitions.keys()).filter((k) => !order.includes(k))]

    return (
      <SectionShell layout={layout} baseClass={baseBg}>
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={sfFont}>
              {title || "Our Partners"}
            </h2>
          </div>
          {orderedKeys.map((key) => {
            const list = partitions.get(key)
            if (!list || list.length === 0) return null
            const cols = TIER_COLS[key] ?? TIER_COLS.partner
            const label = TIER_LABELS[key] ?? key.replace(/^./, (c) => c.toUpperCase())
            return (
              <div key={key}>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] mb-4 text-center opacity-70">
                  {label}
                </h3>
                <div className={`grid gap-6 items-center ${cols}`}>
                  {list.map((sp) => <SponsorCard key={sp.id} sponsor={sp} />)}
                </div>
              </div>
            )
          })}
        </div>
      </SectionShell>
    )
  }

  // Default — single uniform grid.
  return (
    <SectionShell layout={layout} baseClass={baseBg}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={sfFont}>
            {title || "Our Partners"}
          </h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 items-center">
          {sponsors.map((sp) => <SponsorCard key={sp.id} sponsor={sp} />)}
        </div>
      </div>
    </SectionShell>
  )
}

/* ── VIDEO ────────────────────────────────────────────────────────── */

export type VideoProps = { title: string; videoUrl: string; layout?: LayoutProps }

export function Video({ title, videoUrl, layout }: VideoProps) {
  const embed = detectVideo(videoUrl ?? "")
  if (embed.kind === "unknown") {
    return (
      <SectionPlaceholder
        label="Video (paste a YouTube, Vimeo, Loom, or .mp4/.webm URL in the inspector)"
      />
    )
  }
  return (
    <SectionShell layout={layout}>
      <div className="max-w-5xl mx-auto px-6">
        {title && (
          <h2 className="text-center text-3xl sm:text-4xl font-bold mb-8 tracking-tight" style={sfFont}>
            {title}
          </h2>
        )}
        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg bg-black">
          {embed.kind === "file" ? (
            <video
              src={embed.fileUrl}
              controls
              playsInline
              className="absolute inset-0 w-full h-full"
              preload="metadata"
            >
              <source src={embed.fileUrl} type={embed.mimeType} />
              Your browser doesn&apos;t support embedded video.
            </video>
          ) : (
            <iframe
              src={embed.embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title || "Video"}
            />
          )}
        </div>
      </div>
    </SectionShell>
  )
}

/* ── GALLERY ──────────────────────────────────────────────────────── */

export type GalleryProps = {
  title: string
  images: Array<{ url: string; alt?: string; caption?: string }>
  columns?: 2 | 3 | 4
  /** When true, clicking an image opens a fullscreen lightbox (yet-another-react-lightbox). */
  lightbox?: boolean
  layout?: LayoutProps
}

export function Gallery({ title, images, columns, lightbox, layout }: GalleryProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  if (!images || images.length === 0) return <SectionPlaceholder label="Gallery (upload images in the inspector)" />
  if (typeof window !== "undefined") {
    const missing = images.filter((img) => img?.url && !img.alt).length
    if (missing > 0) console.warn(`[Gallery] ${missing} image(s) missing alt text`)
  }
  const grid =
    columns === 2 ? "grid-cols-2" :
    columns === 3 ? "grid-cols-2 md:grid-cols-3" :
                    "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
  return (
    <SectionShell layout={layout}>
      <div className="max-w-6xl mx-auto px-6">
        {title && (
          <h2 className="text-center text-3xl sm:text-4xl font-bold mb-8 tracking-tight" style={sfFont}>
            {title}
          </h2>
        )}
        <div className={`grid gap-3 ${grid}`}>
          {images.map((img, i) => {
            if (!img.url) return null
            const fp = parseFocalPoint(img.url)
            return (
              <figure key={i} className="m-0">
                <button
                  type="button"
                  onClick={() => lightbox ? setOpenIdx(i) : undefined}
                  className={`relative aspect-square w-full rounded-xl overflow-hidden bg-[#F4F8FF] ${lightbox ? "cursor-zoom-in hover:opacity-90 transition-opacity" : ""}`}
                  aria-label={img.caption || img.alt || `Image ${i + 1}`}
                  disabled={!lightbox}
                >
                  <Image
                    src={fp.src}
                    alt={img.alt || ""}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 50vw, 25vw"
                    style={{ objectPosition: fp.objectPosition }}
                  />
                </button>
                {img.caption && <figcaption className="mt-1.5 text-[11px] opacity-60 italic text-center">{img.caption}</figcaption>}
              </figure>
            )
          })}
        </div>
        {lightbox && openIdx !== null && (
          <GalleryLightbox
            images={images}
            startIndex={openIdx}
            onClose={() => setOpenIdx(null)}
          />
        )}
      </div>
    </SectionShell>
  )
}

/* ── CTA BUTTON ───────────────────────────────────────────────────── */

export type CtaButtonProps = {
  title: string; subtitle: string; ctaLabel: string; ctaUrl: string
  variant?: "primary" | "secondary" | "outline"
  layout?: LayoutProps
}

export function CtaButton({
  title, subtitle, ctaLabel, ctaUrl, variant, layout,
  puck,
}: CtaButtonProps & { puck: { metadata?: Record<string, unknown>; id?: string } }) {
  const editor = isEditorRender(puck)
  const blockId = puck?.id
  // In editor mode keep the section visible even without a CTA URL so
  // the user can click into title / subtitle / label even before
  // setting the URL in the inspector.
  if ((!ctaLabel || !ctaUrl) && !editor) return <SectionPlaceholder label="CTA button (set label + URL in the inspector)" />
  const btnCls =
    variant === "outline" ? "border-2 border-[#1a1a2e] text-[#1a1a2e] hover:bg-[#1a1a2e] hover:text-white" :
    variant === "secondary" ? "bg-[#1a1a2e] text-white hover:bg-[#2a2a4e]" :
    "text-[#1a1a2e] hover:brightness-95"
  const btnStyle: CSSProperties =
    variant === "outline" || variant === "secondary"
      ? {}
      : { backgroundColor: "var(--lf-primary, #e7ab1c)" }
  return (
    <SectionShell layout={layout}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        {(title || editor) && (
          <EditableText
            as="h2"
            editor={editor}
            blockId={blockId}
            propKey="title"
            value={title ?? ""}
            className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight"
            style={sfFont}
          />
        )}
        {(subtitle || editor) && (
          <EditableText
            as="p"
            editor={editor}
            blockId={blockId}
            propKey="subtitle"
            value={subtitle ?? ""}
            className="opacity-80 mb-7 max-w-xl mx-auto"
          />
        )}
        {/* In editor mode the anchor wrapper becomes a span so the
            contentEditable label can live inside without racing the
            link's click handler. */}
        {editor && blockId ? (
          <span className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-colors ${btnCls}`} style={btnStyle}>
            <EditableText
              as="span"
              editor={editor}
              blockId={blockId}
              propKey="ctaLabel"
              value={ctaLabel ?? ""}
            />
            <ChevronRight size={14} />
          </span>
        ) : (
          <Link
            href={resolveUrl(ctaUrl, getMeta(puck).event.slug)}
            target={urlIsExternal(ctaUrl) ? "_blank" : undefined}
            rel={urlIsExternal(ctaUrl) ? "noopener noreferrer" : undefined}
            className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-colors ${btnCls}`}
            style={btnStyle}
          >
            {ctaLabel}
            <ChevronRight size={14} />
          </Link>
        )}
      </div>
    </SectionShell>
  )
}

/* ── FAQs ─────────────────────────────────────────────────────────── */

export type FaqsProps = {
  title: string
  faqs: Array<{ q: string; a: string }>
  layout?: LayoutProps
}

export function Faqs({
  title, faqs, layout, puck,
}: FaqsProps & { puck?: { metadata?: Record<string, unknown>; id?: string } }) {
  const editor = isEditorRender(puck)
  const blockId = puck?.id
  if ((!faqs || faqs.length === 0) && !editor) {
    return <SectionPlaceholder label="FAQs (add question/answer pairs in the inspector)" />
  }
  const list = faqs ?? []
  return (
    <SectionShell layout={layout}>
      <div className="max-w-3xl mx-auto px-6">
        <EditableText
          as="h2"
          editor={editor}
          blockId={blockId}
          propKey="title"
          value={title || "Frequently Asked"}
          className="text-3xl sm:text-4xl font-bold mb-8 tracking-tight text-center"
          style={sfFont}
        />
        <div className="space-y-3">
          {list.map((faq, i) => (
            <details
              key={i}
              // ITEM 4 — open the disclosure in editor mode so the
              // answer is visible (and editable). The user can still
              // toggle individual entries closed via summary click.
              {...(editor ? { open: true } : {})}
              className="group bg-white border border-[#1a1a2e]/[0.06] rounded-xl px-5 py-4 open:bg-[#F4F8FF] text-[#1a1a2e]"
            >
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                {/* In editor mode the question must NOT toggle the
                    disclosure when clicked (otherwise focusing the
                    contentEditable closes the panel). Wrap inside a
                    span that stops propagation. */}
                {editor && blockId ? (
                  <span
                    onClick={(e) => e.preventDefault()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="flex-1"
                  >
                    <EditableArrayText
                      as="span"
                      editor={editor}
                      blockId={blockId}
                      arrayKey="faqs"
                      index={i}
                      itemKey="q"
                      value={faq.q}
                    />
                  </span>
                ) : (
                  <span className="flex-1">{faq.q}</span>
                )}
                <ChevronRight size={16} className="group-open:rotate-90 transition-transform" />
              </summary>
              <EditableArrayText
                as="p"
                editor={editor}
                blockId={blockId}
                arrayKey="faqs"
                index={i}
                itemKey="a"
                value={faq.a}
                className="mt-3 text-sm opacity-75 leading-relaxed whitespace-pre-wrap"
                multiline
              />
            </details>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

/* ── SPACER ───────────────────────────────────────────────────────── */

export type SpacerProps = { size: "xs" | "sm" | "md" | "lg" | "xl" }

export function Spacer({ size }: SpacerProps) {
  const h =
    size === "xs" ? "h-4" :
    size === "sm" ? "h-8" :
    size === "lg" ? "h-24" :
    size === "xl" ? "h-40" :
    "h-14"
  return <div className={h} aria-hidden="true" />
}

/* ── DIVIDER ──────────────────────────────────────────────────────── */

export type DividerProps = { style: "line" | "dots" | "gradient"; color?: string; layout?: LayoutProps }

export function Divider({ style, color, layout }: DividerProps) {
  return (
    <SectionShell layout={{ ...(layout ?? {}), paddingY: layout?.paddingY ?? "sm" }}>
      <div className="max-w-4xl mx-auto px-6">
        {style === "dots" ? (
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color || "var(--lf-primary, #e7ab1c)" }} />
            ))}
          </div>
        ) : style === "gradient" ? (
          <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${color || "var(--lf-primary, #e7ab1c)"}, transparent)` }} />
        ) : (
          <div className="h-px" style={{ backgroundColor: color || "rgba(26,26,46,0.1)" }} />
        )}
      </div>
    </SectionShell>
  )
}

/* ── IMAGE BLOCK ──────────────────────────────────────────────────── */

export type ImageBlockProps = {
  imageUrl: string
  /** Required-by-policy alt text. Falls back to caption when blank. */
  alt?: string
  caption?: string
  width?: "narrow" | "wide" | "full"
  rounded?: boolean
  layout?: LayoutProps
}

export function ImageBlock({ imageUrl, alt, caption, width, rounded, layout }: ImageBlockProps) {
  if (!imageUrl) return <SectionPlaceholder label="Image (upload or paste URL in the inspector)" />
  if (typeof window !== "undefined" && imageUrl && !alt && !caption) {
    console.warn("[ImageBlock] missing alt text for", imageUrl)
  }
  const max =
    width === "full" ? "max-w-none" :
    width === "narrow" ? "max-w-2xl" :
    "max-w-5xl"
  const r = rounded === false ? "" : "rounded-2xl"
  const fp = parseFocalPoint(imageUrl)
  return (
    <SectionShell layout={layout}>
      <div className={`${max} mx-auto px-6`}>
        <div className={`relative w-full overflow-hidden ${r} shadow-lg`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fp.src} alt={alt || caption || ""} className="w-full h-auto object-cover" style={{ objectPosition: fp.objectPosition }} />
        </div>
        {caption && (
          <p className="mt-3 text-center text-xs opacity-60 italic">{caption}</p>
        )}
      </div>
    </SectionShell>
  )
}

/* ── TWO COLUMN ───────────────────────────────────────────────────── */

export type TwoColumnProps = {
  leftTitle: string
  leftBody: string
  rightImage: string
  imageSide: "left" | "right"
  layout?: LayoutProps
}

export function TwoColumn({ leftTitle, leftBody, rightImage, imageSide, layout }: TwoColumnProps) {
  if (!leftTitle && !leftBody && !rightImage) return <SectionPlaceholder label="Two-column section (add content in the inspector)" />
  const imageLeft = imageSide === "left"
  return (
    <SectionShell layout={layout}>
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
        {imageLeft && rightImage && (
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#F4F8FF]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={rightImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className={imageLeft ? "order-last md:order-none" : ""}>
          {leftTitle && (
            <h2 className="text-3xl sm:text-4xl font-bold mb-5 tracking-tight" style={sfFont}>
              {leftTitle}
            </h2>
          )}
          {leftBody && (
            <div className="leading-relaxed text-[15px] whitespace-pre-wrap opacity-90">
              {leftBody}
            </div>
          )}
        </div>
        {!imageLeft && rightImage && (
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#F4F8FF]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={rightImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </SectionShell>
  )
}

/* ── TESTIMONIAL ──────────────────────────────────────────────────── */

export type TestimonialProps = {
  quote: string
  attribution: string
  role: string
  avatar: string
  /** Override for the avatar alt — falls back to attribution. */
  avatarAlt?: string
  layout?: LayoutProps
}

export function Testimonial({ quote, attribution, role, avatar, avatarAlt, layout }: TestimonialProps) {
  if (!quote) return <SectionPlaceholder label="Testimonial (add a quote in the inspector)" />
  return (
    <SectionShell layout={layout}>
      <div className="max-w-3xl mx-auto px-6 text-center">
        <Quote size={36} className="mx-auto mb-6 opacity-20" style={{ color: "var(--lf-primary, #e7ab1c)" }} />
        <blockquote className="text-xl sm:text-2xl font-medium leading-relaxed mb-6" style={sfFont}>
          &ldquo;{quote}&rdquo;
        </blockquote>
        <div className="flex items-center justify-center gap-3">
          {avatar && (
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#F4F8FF]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatar} alt={avatarAlt || attribution || ""} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="text-left">
            {attribution && <p className="text-sm font-bold">{attribution}</p>}
            {role && <p className="text-xs opacity-65">{role}</p>}
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

/* ── LOGOS STRIP ──────────────────────────────────────────────────── */

export type LogosStripProps = {
  title: string
  logos: Array<{ url: string; alt: string }>
  layout?: LayoutProps
}

export function LogosStrip({ title, logos, layout }: LogosStripProps) {
  if (!logos || logos.length === 0) return <SectionPlaceholder label="Logos strip (add logos in the inspector)" />
  if (typeof window !== "undefined") {
    const missing = logos.filter((lg) => lg?.url && !lg.alt).length
    if (missing > 0) console.warn(`[LogosStrip] ${missing} logo(s) missing alt text — fill the Brand name field`)
  }
  return (
    <SectionShell layout={{ ...(layout ?? {}), paddingY: layout?.paddingY ?? "md" }}>
      <div className="max-w-6xl mx-auto px-6">
        {title && (
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] mb-6 opacity-65">
            {title}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {logos.map((lg, i) =>
            lg.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={lg.url} alt={lg.alt || ""} className="h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
            ) : null,
          )}
        </div>
      </div>
    </SectionShell>
  )
}

/* ── NEWSLETTER CTA ───────────────────────────────────────────────── */

export type NewsletterProps = {
  title: string
  subtitle: string
  ctaLabel: string
  ctaUrl: string
  layout?: LayoutProps
}

export function Newsletter({
  title, subtitle, ctaLabel, ctaUrl, layout,
  puck,
}: NewsletterProps & { puck: { metadata?: Record<string, unknown> } }) {
  const eventSlug = getMeta(puck).event.slug
  return (
    <SectionShell layout={layout}>
      <div className="max-w-2xl mx-auto px-6 text-center">
        {title && (
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight" style={sfFont}>
            {title || "Stay in the loop"}
          </h2>
        )}
        {subtitle && <p className="opacity-80 mb-7">{subtitle}</p>}
        <form
          action={resolveUrl(ctaUrl, eventSlug) || "/#subscribe"}
          method="post"
          className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
        >
          <input
            type="email"
            name="email"
            placeholder="you@company.com"
            required
            className="flex-1 px-4 py-3 rounded-xl bg-white/90 border border-[#1a1a2e]/10 text-[#1a1a2e] text-sm placeholder:text-[#1a1a2e]/40 focus:outline-none focus:border-[var(--lf-primary,#e7ab1c)]"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[#1a1a2e] text-sm font-bold hover:brightness-95 transition-[filter,background-color]"
            style={{ backgroundColor: "var(--lf-primary, #e7ab1c)" }}
          >
            {ctaLabel || "Subscribe"}
          </button>
        </form>
      </div>
    </SectionShell>
  )
}

/* ── TEXT BOX ─────────────────────────────────────────────────────── *
 * Freeform paragraph/heading with full typography control. Use this
 * when RichText is too opinionated — gives the admin direct knobs for
 * size, weight, font, colour, bg, padding, width, alignment, and
 * rounded corners. Effectively a "resizable, styleable text box".    */

export type TextBoxProps = {
  content: string
  fontSize: "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl"
  fontWeight: "light" | "normal" | "medium" | "semibold" | "bold" | "extrabold"
  fontFamily: "inherit" | "sf" | "inter" | "serif" | "mono"
  italic: boolean
  underline: boolean
  textColor: string        // hex (blank = inherit)
  backgroundColor: string  // hex (blank = transparent)
  paddingY: "none" | "sm" | "md" | "lg"
  paddingX: "none" | "sm" | "md" | "lg"
  width: "narrow" | "wide" | "full"
  alignment: "left" | "center" | "right"
  rounded: "none" | "sm" | "md" | "lg" | "full"
  border: boolean
  layout?: LayoutProps
}

const TEXT_SIZE: Record<TextBoxProps["fontSize"], string> = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl sm:text-4xl",
  "4xl": "text-4xl sm:text-5xl",
  "5xl": "text-5xl sm:text-6xl",
  "6xl": "text-6xl sm:text-7xl",
}
const TEXT_WEIGHT: Record<TextBoxProps["fontWeight"], string> = {
  light: "font-light",
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
}
const PAD_Y: Record<TextBoxProps["paddingY"], string> = {
  none: "py-0",
  sm: "py-2",
  md: "py-5",
  lg: "py-10",
}
const PAD_X: Record<TextBoxProps["paddingX"], string> = {
  none: "px-0",
  sm: "px-3",
  md: "px-6",
  lg: "px-10",
}
const WIDTH: Record<TextBoxProps["width"], string> = {
  narrow: "max-w-2xl",
  wide:   "max-w-4xl",
  full:   "max-w-none",
}
const ROUND: Record<TextBoxProps["rounded"], string> = {
  none: "rounded-none",
  sm:   "rounded-md",
  md:   "rounded-xl",
  lg:   "rounded-2xl",
  full: "rounded-full",
}

export function TextBox({
  content, fontSize, fontWeight, fontFamily, italic, underline,
  textColor, backgroundColor, paddingY, paddingX, width, alignment, rounded,
  border, layout, puck,
}: TextBoxProps & { puck?: { metadata?: Record<string, unknown>; id?: string } }) {
  const editor = isEditorRender(puck)
  const blockId = puck?.id
  // Editor mode keeps the placeholder OFF when content is empty so
  // there's a visible target to click into.
  if (!content && !editor) return <SectionPlaceholder label="Text box (type content in the inspector)" />
  const ff = fontFamily === "inherit" ? undefined : FONT_STACKS[fontFamily]
  const boxStyle: CSSProperties = {
    ...(textColor ? { color: textColor } : {}),
    ...(backgroundColor ? { backgroundColor } : {}),
    ...(ff ? { fontFamily: ff } : {}),
  }
  const innerCls = [
    TEXT_SIZE[fontSize],
    TEXT_WEIGHT[fontWeight],
    PAD_Y[paddingY],
    PAD_X[paddingX],
    ROUND[rounded],
    italic ? "italic" : "",
    underline ? "underline decoration-[0.08em] underline-offset-4" : "",
    border ? "border border-current/15" : "",
    alignment === "center" ? "text-center"
      : alignment === "right" ? "text-right" : "text-left",
    "whitespace-pre-wrap leading-relaxed",
  ].filter(Boolean).join(" ")

  return (
    <SectionShell layout={layout}>
      <div className={`${WIDTH[width]} mx-auto px-6`}>
        {/* ITEM 3.2 — content inline-editable, multiline (Enter inserts a
            newline; the renderer already preserves whitespace via
            whitespace-pre-wrap so it round-trips). */}
        <EditableText
          as="div"
          editor={editor}
          blockId={blockId}
          propKey="content"
          value={content ?? ""}
          className={innerCls}
          style={boxStyle}
          multiline
        />
      </div>
    </SectionShell>
  )
}

/* ── TICKETS PRICING (B16) ────────────────────────────────────────── */

export type TicketsPricingProps = {
  title: string
  subtitle?: string
  /** Ticket id that should get the "Most popular" ribbon. */
  mostPopular?: string
  layout?: LayoutProps
}

function MiniCountdown({ targetIso }: { targetIso: string }) {
  const target = new Date(targetIso).getTime()
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!Number.isFinite(target)) return null
  const { days, hours, minutes, expired } = diffParts(target, now)
  if (expired) return null
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
      style={{
        color: "var(--lf-primary, #e7ab1c)",
        backgroundColor: "color-mix(in srgb, var(--lf-primary, #e7ab1c) 12%, transparent)",
      }}
    >
      Early bird ends in {days}d {hours}h {minutes}m
    </span>
  )
}

export function TicketsPricing({
  title, subtitle, mostPopular, layout,
  puck,
}: TicketsPricingProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { tickets, event } = getMeta(puck)
  if (!tickets || tickets.length === 0) {
    return <SectionPlaceholder label="Pricing cards (add tickets to this event)" />
  }
  return (
    <SectionShell layout={layout}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={sfFont}>
            {title || "Choose your ticket"}
          </h2>
          {subtitle && <p className="mt-3 opacity-70 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tickets.map((t) => {
            const isPopular = t.id === mostPopular
            const remaining = t.inventory_limit !== null && t.inventory_limit !== undefined
              ? Math.max(0, t.inventory_limit - (t.sold ?? 0))
              : null
            return (
              <div
                key={t.id}
                className={`relative rounded-2xl p-6 bg-white border ${
                  isPopular
                    ? "border-[var(--lf-primary,#e7ab1c)] shadow-lg"
                    : "border-[#1a1a2e]/[0.08]"
                }`}
              >
                {isPopular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#1a1a2e]"
                    style={{ backgroundColor: "var(--lf-primary, #e7ab1c)" }}
                  >
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-[#1a1a2e]">{t.name}</h3>
                {t.description && <p className="text-sm opacity-70 mt-1 line-clamp-3">{t.description}</p>}
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tabular-nums" style={sfFont}>
                    ₹{t.price_inr.toLocaleString("en-IN")}
                  </span>
                  {remaining !== null && remaining < 20 && remaining > 0 && (
                    <span className="text-[11px] font-medium text-red-600">{remaining} left</span>
                  )}
                </div>
                {t.early_bird_ends_at && (
                  <div className="mt-3">
                    <MiniCountdown targetIso={t.early_bird_ends_at} />
                  </div>
                )}
                {t.features && t.features.length > 0 && (
                  <ul className="mt-5 space-y-2">
                    {t.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check size={14} strokeWidth={2.5} className="mt-0.5 shrink-0" style={{ color: "var(--lf-primary, #e7ab1c)" }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href={`/events/${event.slug}/tickets`}
                  className={`mt-6 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-md text-sm font-bold transition-colors ${
                    isPopular
                      ? "text-[#1a1a2e] hover:brightness-95"
                      : "bg-[#1a1a2e] text-white hover:bg-[#2a2a4e]"
                  }`}
                  style={isPopular ? { backgroundColor: "var(--lf-primary, #e7ab1c)" } : undefined}
                >
                  <Ticket size={14} />
                  Buy {t.name}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </SectionShell>
  )
}

/* ── COUNTDOWN (B13) ──────────────────────────────────────────────── */

export type CountdownProps = {
  /** ISO datetime override; falls back to event.start_date. */
  targetDateOverride?: string
  title?: string
  subtitle?: string
  pastMessage?: string
  layout?: LayoutProps
}

function diffParts(target: number, now: number) {
  const diff = Math.max(0, target - now)
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)
  return { days, hours, minutes, seconds, expired: diff <= 0 }
}

export function Countdown({
  targetDateOverride, title, subtitle, pastMessage, layout, puck,
}: CountdownProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { event } = getMeta(puck)
  const target = (targetDateOverride && targetDateOverride.trim()) || event.start_date
  const targetTime = target ? new Date(target).getTime() : NaN
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!Number.isFinite(targetTime)) return <SectionPlaceholder label="Countdown (set a target date or use the event start date)" />
  const { days, hours, minutes, seconds, expired } = diffParts(targetTime, now)
  return (
    <SectionShell layout={layout}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        {title && <h2 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight" style={sfFont}>{title}</h2>}
        {subtitle && <p className="opacity-75 mb-6">{subtitle}</p>}
        {expired ? (
          <p className="text-xl font-semibold" style={{ color: "var(--lf-primary, #e7ab1c)" }}>
            {pastMessage || "We're live!"}
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-3 max-w-xl mx-auto">
            {[
              { v: days, l: "Days" },
              { v: hours, l: "Hours" },
              { v: minutes, l: "Minutes" },
              { v: seconds, l: "Seconds" },
            ].map((u) => (
              <div key={u.l} className="rounded-xl py-4" style={{ border: "1px solid color-mix(in srgb, var(--lf-primary, #e7ab1c) 30%, transparent)", backgroundColor: "color-mix(in srgb, var(--lf-primary, #e7ab1c) 10%, transparent)" }}>
                <div className="text-3xl sm:text-4xl font-bold tabular-nums" style={{ color: "var(--lf-primary, #e7ab1c)" }}>
                  {String(u.v).padStart(2, "0")}
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] opacity-70 mt-1">{u.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionShell>
  )
}

/* ── VENUE / MAP (B14) ────────────────────────────────────────────── */

export type VenueMapProps = {
  title?: string
  address: string
  lat?: number
  lng?: number
  height?: "sm" | "md" | "lg"
  layout?: LayoutProps
}

export function VenueMap({ title, address, lat, lng, height, layout, puck }: VenueMapProps & { puck?: { metadata?: Record<string, unknown> } }) {
  if (!address && (lat === undefined || lng === undefined)) {
    return <SectionPlaceholder label="Venue map (add an address or lat/lng)" />
  }
  // ITEM 10.3 — pull provider / zoom / directions toggle from settings.
  const meta = puck ? getMeta(puck) : null
  const map = (meta?.mapSettings ?? {}) as {
    provider?: "google" | "openstreetmap"; defaultZoom?: number; showDirectionsButton?: boolean
  }
  const provider = map.provider ?? "google"
  const zoom = Math.max(8, Math.min(18, Number(map.defaultZoom ?? 14)))
  const showDirections = map.showDirectionsButton !== false

  const q = lat !== undefined && lng !== undefined && (lat || lng)
    ? `${lat},${lng}`
    : encodeURIComponent(address || "")
  const src = provider === "openstreetmap"
    ? (lat !== undefined && lng !== undefined && (lat || lng)
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`
        : `https://www.openstreetmap.org/export/embed.html?bbox=72.7,18.9,72.9,19.1&layer=mapnik`)
    : `https://www.google.com/maps?q=${q}&z=${zoom}&output=embed`
  const directionsHref = provider === "openstreetmap"
    ? `https://www.openstreetmap.org/directions?to=${q}`
    : `https://www.google.com/maps/dir/?api=1&destination=${q}`
  const h = height === "sm" ? "h-64" : height === "lg" ? "h-[520px]" : "h-96"
  return (
    <SectionShell layout={layout}>
      <div className="max-w-5xl mx-auto px-6">
        {title && (
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight" style={sfFont}>{title}</h2>
        )}
        {address && <p className="opacity-80 mb-3">{address}</p>}
        <div className={`relative ${h} rounded-2xl overflow-hidden border border-[#1a1a2e]/10`}>
          <iframe
            src={src}
            className="absolute inset-0 w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={title || "Venue map"}
          />
        </div>
        {showDirections && (
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium hover:underline"
            style={{ color: "var(--lf-primary, #e7ab1c)" }}
          >
            Get directions
            <ChevronRight size={14} />
          </a>
        )}
      </div>
    </SectionShell>
  )
}

/* ── STICKY CTA (B15) ─────────────────────────────────────────────── */

export type StickyCtaProps = {
  ctaLabel: string
  ctaUrl: string
  subtext?: string
  visibleOn?: "always" | "after-hero" | "scroll-up"
  mobileOnly?: boolean
}

export function StickyCta({
  ctaLabel, ctaUrl, subtext, visibleOn, mobileOnly,
  puck,
}: StickyCtaProps & { puck: { metadata?: Record<string, unknown>; isEditing?: boolean } }) {
  const { event } = getMeta(puck)
  const [visible, setVisible] = useState<boolean>(visibleOn !== "after-hero" && visibleOn !== "scroll-up")
  const lastY = useRef<number>(typeof window !== "undefined" ? window.scrollY : 0)
  useEffect(() => {
    if (typeof window === "undefined") return
    if (visibleOn === "always" || visibleOn === undefined) {
      setVisible(true)
      return
    }
    const onScroll = () => {
      const y = window.scrollY
      if (visibleOn === "after-hero") {
        setVisible(y > 300)
      } else if (visibleOn === "scroll-up") {
        setVisible(y > 200 && y < lastY.current)
      }
      lastY.current = y
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [visibleOn])

  // Editor preview — show as a labelled card; renderer (front-end) sticks to the bottom.
  const isEditor = (puck as { isEditing?: boolean })?.isEditing
  if (!ctaLabel || !ctaUrl) return <SectionPlaceholder label="Sticky CTA (set a label and URL)" />
  if (isEditor) {
    return (
      <div className="border-2 border-dashed border-[var(--bs-border,#e5e7eb)] bg-[var(--bs-bg-alt,#f7f8fa)] rounded-xl mx-6 my-4 p-4 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--bs-text-muted,#6b7280)] mb-1">
          Sticky CTA — visible on the public page
        </p>
        <p className="text-sm font-semibold">{ctaLabel}</p>
        {subtext && <p className="text-xs opacity-70 mt-0.5">{subtext}</p>}
      </div>
    )
  }
  if (!visible) return null

  const cls = mobileOnly ? "fixed inset-x-0 bottom-0 z-40 sm:hidden" : "fixed inset-x-0 bottom-0 z-40"
  return (
    <div className={cls}>
      <div className="bg-[#1a1a2e] text-white border-t border-white/10 px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {subtext && <p className="text-[11px] opacity-70 truncate">{subtext}</p>}
        </div>
        <Link
          href={resolveUrl(ctaUrl, event.slug)}
          target={urlIsExternal(ctaUrl) ? "_blank" : undefined}
          rel={urlIsExternal(ctaUrl) ? "noopener noreferrer" : undefined}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-bold text-[#1a1a2e] shrink-0"
          style={{ backgroundColor: "var(--lf-primary, #e7ab1c)" }}
        >
          {ctaLabel}
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}

/* ── SOCIAL BAR (B25) ─────────────────────────────────────────────── */

export type SocialBarProps = {
  links: Array<{ platform: string; url: string }>
  style?: "icon" | "icon-label"
  alignment?: "left" | "center" | "right"
  layout?: LayoutProps
}

export function SocialBar({ links, style, alignment, layout }: SocialBarProps) {
  if (!links || links.length === 0) return <SectionPlaceholder label="Social bar (add at least one link)" />
  const align = alignment === "center" ? "justify-center" : alignment === "right" ? "justify-end" : "justify-start"
  return (
    <SectionShell layout={layout}>
      <div className="max-w-5xl mx-auto px-6">
        <ul className={`flex flex-wrap items-center gap-3 ${align}`}>
          {links.map((l, i) => (
            <li key={i}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 h-10 rounded-md border border-[#1a1a2e]/10 hover:bg-[#1a1a2e]/[0.04] text-sm"
                aria-label={l.platform}
              >
                <span className="font-semibold capitalize">{l.platform}</span>
                {style === "icon-label" && (
                  <span className="text-xs opacity-60 truncate max-w-[180px]">{l.url.replace(/^https?:\/\//, "")}</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  )
}

/* ── CAROUSEL (B20) ───────────────────────────────────────────────── */

export type CarouselSlide = {
  image: string
  heading?: string
  body?: string
  ctaLabel?: string
  ctaUrl?: string
}
export type CarouselProps = {
  slides: CarouselSlide[]
  autoplay?: boolean
  interval?: number
  layout?: LayoutProps
}

export function Carousel({
  slides, autoplay, interval, layout,
  puck,
}: CarouselProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { event } = getMeta(puck)
  if (!slides || slides.length === 0) return <SectionPlaceholder label="Carousel (add at least one slide)" />
  return (
    <SectionShell layout={layout}>
      <div className="max-w-6xl mx-auto px-6">
        <CarouselInner slides={slides} autoplay={autoplay} interval={interval} eventSlug={event.slug} />
      </div>
    </SectionShell>
  )
}

/* ── TABS (B21a) ──────────────────────────────────────────────────── */

export type TabsBlockProps = {
  items: Array<{ title: string; body: string }>
  layout?: LayoutProps
}

export function TabsBlock({ items, layout }: TabsBlockProps) {
  const [active, setActive] = useState<number>(0)
  if (!items || items.length === 0) return <SectionPlaceholder label="Tabs (add at least one tab)" />
  return (
    <SectionShell layout={layout}>
      <div className="max-w-3xl mx-auto px-6">
        <div role="tablist" className="flex flex-wrap gap-1 border-b border-[#1a1a2e]/[0.08] mb-6">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active === i}
              onClick={() => setActive(i)}
              className={`inline-flex items-center px-4 h-10 -mb-px text-[13px] font-medium border-b-2 transition-colors ${
                active === i
                  ? "border-[var(--lf-primary,#e7ab1c)] text-[#1a1a2e]"
                  : "border-transparent text-[#1a1a2e]/65 hover:text-[#1a1a2e]"
              }`}
            >
              {it.title || `Tab ${i + 1}`}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="prose prose-neutral max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{items[active]?.body ?? ""}</ReactMarkdown>
        </div>
      </div>
    </SectionShell>
  )
}

/* ── ACCORDION (B21b) ─────────────────────────────────────────────── */

export type AccordionBlockProps = {
  items: Array<{ title: string; body: string }>
  layout?: LayoutProps
}

export function AccordionBlock({ items, layout }: AccordionBlockProps) {
  if (!items || items.length === 0) return <SectionPlaceholder label="Accordion (add at least one row)" />
  return (
    <SectionShell layout={layout}>
      <div className="max-w-3xl mx-auto px-6 space-y-2">
        {items.map((it, i) => (
          <details key={i} className="group bg-white border border-[#1a1a2e]/[0.06] rounded-xl px-5 py-4 open:bg-[#F4F8FF]">
            <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
              {it.title || "Untitled"}
              <ChevronRight size={16} className="group-open:rotate-90 transition-transform" />
            </summary>
            <div className="mt-3 prose prose-neutral max-w-none text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{it.body ?? ""}</ReactMarkdown>
            </div>
          </details>
        ))}
      </div>
    </SectionShell>
  )
}

/* ── IMAGE HOTSPOTS (B26) ─────────────────────────────────────────── */

export type ImageHotspotsProps = {
  image: string
  alt?: string
  hotspots: Array<{ x: number; y: number; label: string; description?: string }>
  layout?: LayoutProps
}

export function ImageHotspots({ image, alt, hotspots, layout }: ImageHotspotsProps) {
  const [active, setActive] = useState<number | null>(null)
  if (!image) return <SectionPlaceholder label="Image hotspots (add an image)" />
  return (
    <SectionShell layout={layout}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative w-full overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={alt || ""} className="w-full h-auto block" />
          {hotspots?.map((h, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive((a) => a === i ? null : i)}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive((a) => a === i ? null : a)}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-white text-xs font-bold shadow-lg ring-2 ring-white/80"
              style={{
                left: `${Math.max(0, Math.min(100, h.x))}%`,
                top:  `${Math.max(0, Math.min(100, h.y))}%`,
                backgroundColor: "var(--lf-primary, #e7ab1c)",
              }}
              aria-label={h.label}
            >
              {i + 1}
              {active === i && (
                <span className="absolute left-1/2 top-full -translate-x-1/2 mt-2 w-56 bg-[#1a1a2e] text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10">
                  <span className="block font-semibold">{h.label}</span>
                  {h.description && <span className="block opacity-80 mt-0.5 text-[11px] leading-snug">{h.description}</span>}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

/* ── EVENT-CARD GRID (B24) ────────────────────────────────────────── */

export type EventCardGridProps = {
  title?: string
  mode?: "manual" | "upcoming-from-org"
  /** Comma-separated event UUIDs (used when mode = "manual"). */
  eventIds?: string
  layout?: LayoutProps
}

export function EventCardGrid({
  title, mode, eventIds, layout,
  puck,
}: EventCardGridProps & { puck: { metadata?: Record<string, unknown> } }) {
  // The metadata builder only carries the active event's data — we don't
  // ship a list of "other events" yet. This block renders a placeholder
  // until the metadata pipeline carries them. Editors can preview by
  // setting eventIds manually to see the layout.
  const meta = (puck?.metadata ?? {}) as Record<string, unknown>
  const otherEvents = Array.isArray(meta.otherEvents)
    ? (meta.otherEvents as Array<{ id: string; slug: string; title: string; start_date: string; venue: string | null; cover_image_url: string | null }>)
    : []
  const ids = mode === "manual" && typeof eventIds === "string"
    ? eventIds.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)
    : []
  const items = mode === "manual" && ids.length > 0
    ? otherEvents.filter((e) => ids.includes(e.id))
    : otherEvents
  if (items.length === 0) {
    return <SectionPlaceholder label="Event-card grid (no other published events to show — try 'Upcoming from org' once you have more events)" />
  }
  return (
    <SectionShell layout={layout}>
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center tracking-tight" style={sfFont}>{title}</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((ev) => (
            <Link key={ev.id} href={`/events/${ev.slug}`} className="group rounded-2xl overflow-hidden border border-[#1a1a2e]/[0.06] bg-white hover:shadow-lg transition-shadow">
              <div className="relative aspect-[16/10] bg-[#F4F8FF]">
                {ev.cover_image_url
                  ? <Image src={ev.cover_image_url} alt={ev.title} fill className="object-cover group-hover:scale-[1.02] transition-transform" sizes="(max-width:768px) 100vw, 33vw" />
                  : null}
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--lf-primary, #e7ab1c)" }}>
                  {fmtDate(ev.start_date)}
                </p>
                <h3 className="font-semibold mt-1 line-clamp-2">{ev.title}</h3>
                {ev.venue && <p className="text-xs opacity-70 mt-1">{ev.venue}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

/* ── FORM BLOCK (B23) ─────────────────────────────────────────────── */

export type FormBlockProps = {
  title: string
  subtitle?: string
  fields: FormField[]
  ctaLabel: string
  successMessage: string
  webhookUrl?: string
  layout?: LayoutProps
}

export function FormBlock({
  title, subtitle, fields, ctaLabel, successMessage, webhookUrl, layout,
  puck,
}: FormBlockProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { event } = getMeta(puck)
  if (!fields || fields.length === 0) {
    return <SectionPlaceholder label="Form (add at least one field in the inspector)" />
  }
  return (
    <SectionShell layout={layout}>
      <div className="max-w-xl mx-auto px-6">
        {title && <h2 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight" style={sfFont}>{title}</h2>}
        {subtitle && <p className="opacity-75 mb-6">{subtitle}</p>}
        <FormBlockClient
          eventId={event.id}
          sourcePage={event.slug}
          fields={fields}
          ctaLabel={ctaLabel || "Submit"}
          successMessage={successMessage || "Thanks — we got your submission."}
          webhookUrl={webhookUrl}
        />
      </div>
    </SectionShell>
  )
}

/* ── Placeholder shown in the editor when a block has no content yet. ── */

function SectionPlaceholder({ label, dark }: { label: string; dark?: boolean }) {
  return (
    <section
      className={`border-2 border-dashed rounded-xl mx-6 my-6 p-10 text-center text-sm font-medium ${
        dark
          ? "bg-[#1a1a2e]/5 border-[#1a1a2e]/20 text-[#1a1a2e]/65"
          : "bg-[#F4F8FF] border-[#1a1a2e]/15 text-[#1a1a2e]/65"
      }`}
    >
      {label}
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════
 * NEW BLOCKS (Phase 4 missing-five)
 * ──────────────────────────────────────────────────────────────────── */

/* ── EMBED HTML ──────────────────────────────────────────────────────
 * Lets admins paste an iframe / script for Calendly, Typeform, YouTube,
 * Vimeo etc. We sanitise by whitelisting iframe src hosts and stripping
 * <script> tags. Anything that isn't an iframe at all is dropped.
 */
const ALLOWED_EMBED_HOSTS = [
  "calendly.com", "typeform.com", "mailchimp.com", "docs.google.com",
  "airtable.com", "eventbrite.com", "hopin.com", "on24.com",
  "youtube.com", "youtube-nocookie.com", "vimeo.com", "loom.com",
  "soundcloud.com", "spotify.com", "open.spotify.com",
]

function sanitiseEmbedHtml(input: string): { html: string; error: string | null } {
  const trimmed = (input ?? "").trim()
  if (!trimmed) return { html: "", error: null }
  // Reject explicit script tags outright.
  if (/<script/i.test(trimmed)) {
    return { html: "", error: "Inline <script> is not allowed. Use an <iframe> from a trusted host." }
  }
  // Pull every iframe src and verify the host is whitelisted.
  const iframeRegex = /<iframe[^>]*\bsrc=["']([^"']+)["'][^>]*>([\s\S]*?)<\/iframe>/gi
  const matches: Array<{ full: string; src: string }> = []
  let m: RegExpExecArray | null
  while ((m = iframeRegex.exec(trimmed)) !== null) {
    matches.push({ full: m[0], src: m[1] })
  }
  if (matches.length === 0) {
    return { html: "", error: "No <iframe> found. Paste the embed code your tool gives you." }
  }
  for (const { src } of matches) {
    let host = ""
    try { host = new URL(src).hostname.toLowerCase() } catch { return { html: "", error: `Invalid iframe src: ${src}` } }
    const ok = ALLOWED_EMBED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))
    if (!ok) {
      return { html: "", error: `Host not allowed: ${host}. Allowed: ${ALLOWED_EMBED_HOSTS.join(", ")}.` }
    }
  }
  return { html: trimmed, error: null }
}

export type EmbedHtmlProps = {
  code: string
  height?: number
  layout?: LayoutProps
}

export function EmbedHtml({ code, height, layout }: EmbedHtmlProps) {
  const { html, error } = sanitiseEmbedHtml(code)
  return (
    <SectionShell layout={layout}>
      <div className="max-w-4xl mx-auto px-6">
        {error ? (
          <SectionPlaceholder label={`Embed HTML — ${error}`} />
        ) : !html ? (
          <SectionPlaceholder label="Embed HTML — paste an iframe from Calendly, YouTube, etc." />
        ) : (
          <div
            className="lf-embed"
            style={{ minHeight: height ? `${height}px` : undefined }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </SectionShell>
  )
}

/* ── FOOTER ─────────────────────────────────────────────────────────
 * Minimal multi-column footer with copyright + optional logo + social
 * links. Auto-mounted at the bottom of every standard-page default tree
 * via lib/standard-page-defaults.ts.
 */
export type FooterProps = {
  columns: 1 | 2 | 3 | 4
  copyright: string
  logoUrl?: string
  /** A2: when true and events.logo_url is set, render that instead of
   *  logoUrl. Useful when the same logo lives in nav + footer. */
  useEventLogo?: boolean
  showPoweredBy?: boolean
  socialLinks?: Array<{ label: string; url: string }>
  links?: Array<{ label: string; url: string; group?: string }>
  // ITEM 9 — Zoho-parity polish
  /** Optional secondary footer media (e.g. event logo lockup). When set,
   *  renders to the left of textField in the first column. Linkable
   *  via mediaHref. */
  mediaImage?: string
  mediaHref?: string
  /** Terms / Policies list — center-left column. */
  terms?: Array<{ label: string; url: string }>
  /** Social handles object — uses the same socialHandles shape as the
   *  Hero. Preferred over socialLinks when set; the right-most column. */
  useEventSocialHandles?: boolean
  /** Tertiary call-to-action buttons row — center-right column. */
  navButtons?: Array<{ label: string; url: string; style: "primary" | "secondary" | "outline" }>
  /** Free-text rich field rendered under the media image / logo. */
  textField?: string
  /** Visibility toggles (matches Zoho's footer-customisation pattern). */
  showMedia?: boolean
  showTerms?: boolean
  showSocial?: boolean
  showNavButtons?: boolean
  layout?: LayoutProps
}

export function Footer({
  columns = 4, copyright, logoUrl, useEventLogo, showPoweredBy, socialLinks, links, layout,
  mediaImage, mediaHref, terms, useEventSocialHandles, navButtons, textField,
  showMedia = true, showTerms = true, showSocial = true, showNavButtons = true,
  puck,
}: FooterProps & { puck?: { metadata?: Record<string, unknown> } }) {
  const meta = puck ? getMeta(puck) : null
  const eventLogo = useEventLogo && meta ? meta.event.logo_url ?? null : null
  const resolvedLogo = eventLogo
    ? parseFocalPoint(eventLogo).src
    : (logoUrl ?? "")
  // ITEM 4.4 — locale-aware copyright fallback. The admin still has
  // a free-text override via the `copyright` prop; when it's empty the
  // resolver substitutes the current year into the i18n template.
  const resolvedCopyright = (copyright?.trim()
    ? copyright
    : meta
      ? metaString(meta, "footer.copyright", { year: new Date().getFullYear() })
      : `© ${new Date().getFullYear()} The Leadership Federation. All rights reserved.`)
  const poweredByLabel = meta
    ? metaString(meta, "footer.poweredBy")
    : "Powered by The Leadership Federation"
  const grouped = new Map<string, Array<{ label: string; url: string }>>()
  for (const l of links ?? []) {
    const g = l.group?.trim() || "Links"
    const arr = grouped.get(g) ?? []
    arr.push({ label: l.label, url: l.url })
    grouped.set(g, arr)
  }
  const cols = Math.max(1, Math.min(4, columns))
  const gridCls = cols === 1 ? "grid-cols-1"
                : cols === 2 ? "grid-cols-1 md:grid-cols-2"
                : cols === 3 ? "grid-cols-1 md:grid-cols-3"
                :              "grid-cols-1 md:grid-cols-4"

  // Resolve social — prefer event-level handles when toggled.
  const eventHandles = (meta?.socialHandles ?? {}) as {
    twitter?: string; linkedin?: string; instagram?: string;
    facebook?: string; youtube?: string; website?: string;
  }
  const socialList: Array<{ label: string; url: string }> = (() => {
    if (useEventSocialHandles) {
      const out: Array<{ label: string; url: string }> = []
      if (eventHandles.twitter)   out.push({ label: "Twitter",   url: eventHandles.twitter })
      if (eventHandles.linkedin)  out.push({ label: "LinkedIn",  url: eventHandles.linkedin })
      if (eventHandles.instagram) out.push({ label: "Instagram", url: eventHandles.instagram })
      if (eventHandles.facebook)  out.push({ label: "Facebook",  url: eventHandles.facebook })
      if (eventHandles.youtube)   out.push({ label: "YouTube",   url: eventHandles.youtube })
      if (eventHandles.website)   out.push({ label: "Website",   url: eventHandles.website })
      return out
    }
    return socialLinks ?? []
  })()

  function btnCls(style: "primary" | "secondary" | "outline") {
    if (style === "primary")   return "bg-[var(--lf-primary,#e7ab1c)] text-[#1a1a2e] hover:brightness-95"
    if (style === "secondary") return "bg-white/10 text-white hover:bg-white/15 border border-white/15"
    return "border border-white/40 text-white hover:bg-white/10"
  }

  return (
    <SectionShell layout={{ ...(layout ?? {}), paddingY: layout?.paddingY ?? "md", backgroundColor: layout?.backgroundColor || "#0a0a14", textColor: layout?.textColor || "#ffffff" }} dark>
      <div className="max-w-6xl mx-auto px-6">
        <div className={`grid gap-8 ${gridCls}`}>
          {/* Column 1 — media + textField + (legacy) custom logo + copyright */}
          {showMedia && (
            <div>
              {(mediaImage || resolvedLogo) && (() => {
                const src = mediaImage ? parseFocalPoint(mediaImage).src : resolvedLogo
                const img = (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={src} alt="" className="h-10 w-auto mb-3" />
                )
                return mediaHref ? (
                  <a href={mediaHref} target={mediaHref.startsWith("http") ? "_blank" : undefined} rel={mediaHref.startsWith("http") ? "noopener noreferrer" : undefined} className="inline-block">
                    {img}
                  </a>
                ) : img
              })()}
              {!mediaImage && !resolvedLogo && (
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/65 mb-3">
                  {poweredByLabel}
                </p>
              )}
              {textField && (
                <div className="text-[12px] text-white/65 leading-relaxed mb-3 prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{textField}</ReactMarkdown>
                </div>
              )}
              <p className="text-[12px] text-white/55 leading-relaxed">{resolvedCopyright}</p>
            </div>
          )}

          {/* Column 2 — Terms / Policies */}
          {showTerms && terms && terms.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/65 mb-3">Terms &amp; Policies</p>
              <ul className="space-y-2">
                {terms.map((t) => (
                  <li key={t.url}>
                    <a href={t.url} className="text-[13px] text-white/75 hover:text-white">{t.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Column 3 — nav buttons */}
          {showNavButtons && navButtons && navButtons.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/65 mb-3">Quick links</p>
              <div className="flex flex-col gap-2 items-start">
                {navButtons.map((b) => (
                  <a
                    key={`${b.label}-${b.url}`}
                    href={b.url}
                    target={b.url.startsWith("http") ? "_blank" : undefined}
                    rel={b.url.startsWith("http") ? "noopener noreferrer" : undefined}
                    className={`inline-flex items-center px-4 py-2 rounded-md text-[12px] font-bold transition-colors ${btnCls(b.style)}`}
                  >
                    {b.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Column 4 — social handles */}
          {showSocial && socialList.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/65 mb-3">Follow</p>
              <ul className="flex flex-wrap gap-3">
                {socialList.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-white/65 hover:text-white">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Legacy grouped link columns (when user populates `links[]`). */}
          {[...grouped.entries()].map(([group, items]) => (
            <div key={group}>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/65 mb-3">{group}</p>
              <ul className="space-y-2">
                {items.map((it) => (
                  <li key={it.url}>
                    <a href={it.url} className="text-[13px] text-white/75 hover:text-white">{it.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {showPoweredBy && (
          <p className="mt-8 pt-6 border-t border-white/10 text-[11px] text-white/45">
            {poweredByLabel} event platform.
          </p>
        )}
      </div>
    </SectionShell>
  )
}

/* ── SPEAKER BIO CARD ───────────────────────────────────────────────
 * Single-speaker spotlight: large photo, name, role, long bio, social.
 * Picks the speaker by id from puck.metadata.speakers.
 */
export type SpeakerBioCardProps = {
  speakerId: string
  side?: "left" | "right"
  size?: "md" | "lg"
  layout?: LayoutProps
}

export function SpeakerBioCard({
  speakerId, side, size, layout,
  puck,
}: SpeakerBioCardProps & { puck: { metadata?: Record<string, unknown> } }) {
  const meta = (puck.metadata ?? {}) as { speakers?: Array<SpeakerShape & { bio?: string; linkedin_url?: string; twitter_url?: string }> }
  const sp = (meta.speakers ?? []).find((s) => s.id === speakerId)
  if (!sp) return <SectionPlaceholder label="Speaker bio — pick a speaker in the inspector" />
  const imgSize = size === "lg" ? "w-56 h-56" : "w-40 h-40"
  const order = side === "right" ? "md:flex-row-reverse" : "md:flex-row"
  return (
    <SectionShell layout={layout}>
      <div className={`max-w-5xl mx-auto px-6 flex flex-col gap-8 items-center ${order}`}>
        {sp.image_url ? (() => {
          const fp = parseFocalPoint(sp.image_url)
          return (
            <Image
              src={fp.src}
              alt={sp.name}
              width={224}
              height={224}
              className={`${imgSize} rounded-2xl object-cover shrink-0 ring-1 ring-[#1a1a2e]/10`}
              style={{ objectPosition: fp.objectPosition }}
            />
          )
        })() : (
          <div className={`${imgSize} rounded-2xl bg-[#1a1a2e]/5 flex items-center justify-center shrink-0`}>
            <User size={48} className="text-[#1a1a2e]/30" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e]" style={sfFont}>{sp.name}</h3>
          {(sp.designation || sp.company) && (
            <p className="text-[15px] text-[#1a1a2e]/70 mt-1">
              {[sp.designation, sp.company].filter(Boolean).join(" · ")}
            </p>
          )}
          {(sp as { bio?: string }).bio && (
            <p className="mt-4 text-[14px] leading-relaxed text-[#1a1a2e]/75 whitespace-pre-line">
              {(sp as { bio?: string }).bio}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {(sp as { linkedin_url?: string }).linkedin_url && (
              <a href={(sp as { linkedin_url?: string }).linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#0a66c2] hover:underline">LinkedIn</a>
            )}
            {(sp as { twitter_url?: string }).twitter_url && (
              <a href={(sp as { twitter_url?: string }).twitter_url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#1d9bf0] hover:underline">X</a>
            )}
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

/* ── SCHEDULE SUMMARY ────────────────────────────────────────────────
 * Compact alternative to Agenda — three modes: table, timeline, compact.
 * Reads sessions from puck.metadata.sessions, formats times in the
 * event's timezone (settings.general.timezone) when provided via
 * puck.metadata.timezone.
 */
export type ScheduleSummaryProps = {
  title: string
  mode: "table" | "timeline" | "compact"
  showSpeakers: boolean
  layout?: LayoutProps
}

export function ScheduleSummary({
  title, mode, showSpeakers, layout,
  puck,
}: ScheduleSummaryProps & { puck: { metadata?: Record<string, unknown> } }) {
  const meta = (puck.metadata ?? {}) as { sessions?: SessionShape[]; timezone?: string }
  const sessions = (meta.sessions ?? []).slice().sort((a, b) =>
    new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  )
  const tz = meta.timezone ?? "Asia/Kolkata"
  if (sessions.length === 0) {
    return <SectionPlaceholder label="Schedule summary — no sessions yet for this event" />
  }
  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: tz })
  }
  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: tz })
  }
  return (
    <SectionShell layout={layout}>
      <div className="max-w-4xl mx-auto px-6">
        {title && <h2 className="text-3xl sm:text-4xl font-bold mb-6 tracking-tight" style={sfFont}>{title}</h2>}
        {mode === "table" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[#1a1a2e]/10 text-[11px] uppercase tracking-wider text-[#1a1a2e]/55">
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Time</th>
                <th className="py-2 pr-3 font-medium">Session</th>
                {showSpeakers && <th className="py-2 font-medium">Speakers</th>}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-[#1a1a2e]/[0.06]">
                  <td className="py-2 pr-3 text-[#1a1a2e]/65 tabular-nums">{fmtDate(s.starts_at)}</td>
                  <td className="py-2 pr-3 text-[#1a1a2e]/65 font-mono text-[12px] tabular-nums">{fmtTime(s.starts_at)}{s.ends_at ? `–${fmtTime(s.ends_at)}` : ""}</td>
                  <td className="py-2 pr-3 font-semibold text-[#1a1a2e]">{s.title}</td>
                  {showSpeakers && (
                    <td className="py-2 text-[12px] text-[#1a1a2e]/65">{(s.speaker_names ?? []).join(", ")}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {mode === "compact" && (
          <ul className="space-y-1.5">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-baseline gap-3">
                <span className="font-mono text-[12px] text-[#1a1a2e]/55 tabular-nums w-32 shrink-0">{fmtDate(s.starts_at)} · {fmtTime(s.starts_at)}</span>
                <span className="text-[14px] text-[#1a1a2e]">{s.title}</span>
              </li>
            ))}
          </ul>
        )}
        {mode === "timeline" && (
          <ol className="relative border-l border-[#e7ab1c]/30 pl-6 space-y-5">
            {sessions.map((s) => (
              <li key={s.id} className="relative">
                <span className="absolute -left-[34px] top-1 w-3 h-3 rounded-full bg-[#e7ab1c]" />
                <div className="font-mono text-[11px] text-[#1a1a2e]/55 tabular-nums uppercase tracking-wider">
                  {fmtDate(s.starts_at)} · {fmtTime(s.starts_at)}
                </div>
                <div className="text-[15px] font-semibold text-[#1a1a2e] mt-0.5">{s.title}</div>
                {showSpeakers && (s.speaker_names?.length ?? 0) > 0 && (
                  <div className="text-[12px] text-[#1a1a2e]/55 mt-0.5">{(s.speaker_names ?? []).join(", ")}</div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </SectionShell>
  )
}

/* ── CTA WITH IMAGE ─────────────────────────────────────────────────
 * Two-column hero variant: image on one side, copy + dual CTA on the
 * other. Highest-converting CTA pattern.
 */
export type CtaWithImageProps = {
  image: string
  imageAlt?: string
  title: string
  body: string
  ctaLabel: string
  ctaUrl: string
  secondaryCtaLabel?: string
  secondaryCtaUrl?: string
  imageSide: "left" | "right"
  imageStyle: "rounded" | "square" | "rounded-full"
  layout?: LayoutProps
}

export function CtaWithImage({
  image, imageAlt, title, body, ctaLabel, ctaUrl,
  secondaryCtaLabel, secondaryCtaUrl,
  imageSide, imageStyle, layout,
  puck,
}: CtaWithImageProps & { puck: { metadata?: Record<string, unknown> } }) {
  const meta = (puck.metadata ?? {}) as { event?: { slug: string } }
  const eventSlug = meta.event?.slug ?? ""
  const order = imageSide === "left" ? "md:flex-row" : "md:flex-row-reverse"
  const radius = imageStyle === "rounded-full" ? "rounded-full" : imageStyle === "rounded" ? "rounded-2xl" : ""
  return (
    <SectionShell layout={layout}>
      <div className={`max-w-6xl mx-auto px-6 flex flex-col gap-10 items-center ${order}`}>
        <div className="flex-1 min-w-0">
          {image ? (() => {
            const fp = parseFocalPoint(image)
            return (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={fp.src}
                alt={imageAlt ?? ""}
                className={`w-full h-auto object-cover ${radius}`}
                style={{ objectPosition: fp.objectPosition }}
              />
            )
          })() : (
            <div className={`w-full aspect-[4/3] bg-[#1a1a2e]/5 ${radius} flex items-center justify-center text-[#1a1a2e]/30 text-sm`}>
              Add an image in the inspector
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1a1a2e] tracking-tight" style={sfFont}>{title}</h2>
          {body && <p className="mt-4 text-[15px] text-[#1a1a2e]/70 leading-relaxed whitespace-pre-line">{body}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            {ctaLabel && ctaUrl && (() => {
              const href = resolveUrl(ctaUrl, eventSlug)
              const ext = urlIsExternal(ctaUrl)
              return (
                <Link
                  href={href}
                  target={ext ? "_blank" : undefined}
                  rel={ext ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center px-6 h-11 rounded-md text-[13px] font-bold uppercase tracking-wider bg-[#e7ab1c] text-white hover:bg-[#d49c10]"
                >
                  {ctaLabel}
                </Link>
              )
            })()}
            {secondaryCtaLabel && secondaryCtaUrl && (() => {
              const href = resolveUrl(secondaryCtaUrl, eventSlug)
              const ext = urlIsExternal(secondaryCtaUrl)
              return (
                <Link
                  href={href}
                  target={ext ? "_blank" : undefined}
                  rel={ext ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center px-6 h-11 rounded-md text-[13px] font-bold uppercase tracking-wider bg-transparent text-[#1a1a2e] border border-[#1a1a2e]/15 hover:bg-[#1a1a2e]/5"
                >
                  {secondaryCtaLabel}
                </Link>
              )
            })()}
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

/* ── ITEM 3 — MEDIA WITH TEXT GROUP ──────────────────────────────────
 *
 * Series of two-column rows (image + heading + body + optional CTA).
 * Each row picks left or right for the image; "alternate" mode flips
 * automatically for visual rhythm.
 */
export type MediaWithTextItem = {
  id: string
  image: string
  heading: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
  side: "left" | "right" | "alternate"
}
export type MediaWithTextGroupProps = {
  title?: string
  subtitle?: string
  items: MediaWithTextItem[]
  layout?: LayoutProps
}
export function MediaWithTextGroup({ title, subtitle, items, layout, puck }: MediaWithTextGroupProps & { puck?: { metadata?: Record<string, unknown> } }) {
  const meta = puck ? getMeta(puck) : null
  const eventSlug = meta?.event.slug ?? ""
  return (
    <SectionShell layout={layout}>
      <div className="max-w-6xl mx-auto px-6">
        {(subtitle || title) && (
          <div className="mb-10">
            {subtitle && <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--lf-primary, #e7ab1c)" }}>{subtitle}</p>}
            {title && <h2 className="mt-2 text-3xl sm:text-4xl font-bold" style={sfFont}>{title}</h2>}
          </div>
        )}
        <div className="space-y-14">
          {items.map((it, i) => {
            const side: "left" | "right" =
              it.side === "alternate" ? (i % 2 === 0 ? "left" : "right") : it.side
            const imageOnLeft = side === "left"
            const { src: imgSrc, objectPosition } = parseFocalPoint(it.image)
            return (
              <div key={it.id || i} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                <div className={`relative aspect-[4/3] rounded-xl overflow-hidden bg-[#1a1a2e]/5 ${imageOnLeft ? "" : "md:order-2"}`}>
                  {it.image && (
                    <Image src={imgSrc} alt={it.heading || ""} fill className="object-cover" style={{ objectPosition }} sizes="(max-width:768px) 100vw, 50vw" />
                  )}
                </div>
                <div className={imageOnLeft ? "" : "md:order-1"}>
                  {it.heading && <h3 className="text-2xl sm:text-3xl font-bold mb-3" style={sfFont}>{it.heading}</h3>}
                  {it.body && (
                    <div className="prose prose-sm max-w-none text-[#1a1a2e]/75 leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{it.body}</ReactMarkdown>
                    </div>
                  )}
                  {it.ctaLabel && it.ctaUrl && (
                    <Link
                      href={resolveUrl(it.ctaUrl, eventSlug)}
                      target={urlIsExternal(it.ctaUrl) ? "_blank" : undefined}
                      rel={urlIsExternal(it.ctaUrl) ? "noopener noreferrer" : undefined}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold"
                      style={{ color: "var(--lf-primary, #e7ab1c)" }}
                    >
                      {it.ctaLabel} <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </SectionShell>
  )
}

/* ── ITEM 4 — TESTIMONIALS GROUP ─────────────────────────────────────
 * Carousel / Grid / List multi-testimonial display.
 */
export type TestimonialItem = {
  id: string
  quote: string
  attribution: string
  role: string
  avatar: string
  rating?: number
}
export type TestimonialsGroupProps = {
  title?: string
  subtitle?: string
  items: TestimonialItem[]
  displayStyle: "carousel" | "grid" | "list"
  layout?: LayoutProps
}
export function TestimonialsGroup({ title, subtitle, items, displayStyle, layout }: TestimonialsGroupProps) {
  return (
    <SectionShell layout={layout}>
      <div className="max-w-6xl mx-auto px-6">
        {(subtitle || title) && (
          <div className="mb-10 text-center">
            {subtitle && <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--lf-primary, #e7ab1c)" }}>{subtitle}</p>}
            {title && <h2 className="mt-2 text-3xl sm:text-4xl font-bold" style={sfFont}>{title}</h2>}
          </div>
        )}
        {displayStyle === "carousel" && <TestimonialCarousel items={items} />}
        {displayStyle === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((t, i) => <TestimonialCard key={t.id || i} t={t} />)}
          </div>
        )}
        {displayStyle === "list" && (
          <div className="space-y-5 max-w-3xl mx-auto">
            {items.map((t, i) => <TestimonialCard key={t.id || i} t={t} />)}
          </div>
        )}
      </div>
    </SectionShell>
  )
}
function TestimonialCard({ t }: { t: TestimonialItem }) {
  const r = Math.max(0, Math.min(5, t.rating ?? 0))
  return (
    <div className="rounded-xl border border-[#1a1a2e]/10 bg-white p-6">
      <Quote size={20} className="text-[#1a1a2e]/15 mb-3" />
      <p className="text-[14px] text-[#1a1a2e]/80 leading-relaxed">{t.quote}</p>
      <div className="mt-5 flex items-center gap-3">
        {t.avatar && (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1a1a2e]/5 relative shrink-0">
            <Image src={parseFocalPoint(t.avatar).src} alt="" fill className="object-cover" sizes="40px" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-[#1a1a2e] truncate">{t.attribution}</p>
          {t.role && <p className="text-[11px] text-[#1a1a2e]/55 truncate">{t.role}</p>}
        </div>
      </div>
      {r > 0 && (
        <div className="mt-3 flex items-center gap-1" aria-label={`${r} of 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < r ? "text-amber-400" : "text-[#1a1a2e]/15"}>★</span>
          ))}
        </div>
      )}
    </div>
  )
}
function TestimonialCarousel({ items }: { items: TestimonialItem[] }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (items.length <= 1) return
    const t = setInterval(() => setIdx((n) => (n + 1) % items.length), 6000)
    return () => clearInterval(t)
  }, [items.length])
  if (items.length === 0) return null
  const cur = items[idx]
  return (
    <div className="relative max-w-3xl mx-auto">
      <TestimonialCard t={cur} />
      {items.length > 1 && (
        <div className="mt-5 flex justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`w-2.5 h-2.5 rounded-full ${i === idx ? "bg-[#1a1a2e]" : "bg-[#1a1a2e]/20 hover:bg-[#1a1a2e]/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── ITEM 5 — FLOOR PLAN ─────────────────────────────────────────────
 * Single image + optional clickable hotspots.
 */
export type FloorPlanHotspot = { x: number; y: number; label: string; description?: string }
export type FloorPlanProps = {
  title?: string
  image: string
  caption?: string
  hotspots?: FloorPlanHotspot[]
  layout?: LayoutProps
}
export function FloorPlan({ title, image, caption, hotspots, layout }: FloorPlanProps) {
  const { src, objectPosition } = parseFocalPoint(image)
  const list = hotspots ?? []
  return (
    <SectionShell layout={layout}>
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center" style={sfFont}>{title}</h2>}
        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#1a1a2e]/5">
          {image ? (
            <Image src={src} alt={title || "Floor plan"} fill className="object-cover" style={{ objectPosition }} sizes="100vw" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-[#1a1a2e]/40 text-sm">
              Add a floor plan image
            </div>
          )}
          {list.map((h, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }}
            >
              <div className="w-7 h-7 rounded-full bg-[var(--lf-primary,#e7ab1c)] text-[#1a1a2e] text-[12px] font-bold grid place-items-center shadow-lg ring-2 ring-white">
                {i + 1}
              </div>
              {(h.label || h.description) && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 min-w-[180px] hidden group-hover:block bg-[#1a1a2e] text-white text-[12px] px-3 py-2 rounded-md shadow-xl">
                  <p className="font-bold">{h.label}</p>
                  {h.description && <p className="opacity-75 mt-0.5">{h.description}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
        {caption && <p className="mt-4 text-center text-[13px] text-[#1a1a2e]/60">{caption}</p>}
      </div>
    </SectionShell>
  )
}

/* ── ITEM 6 — EXHIBITORS LISTING ─────────────────────────────────────
 * Reads metadata.exhibitors + metadata.exhibitorCategories. When
 * groupByCategory is true, sections render per category.
 */
export type ExhibitorsListingProps = {
  title?: string
  groupByCategory: boolean
  layout?: LayoutProps
}
export function ExhibitorsListing({ title, groupByCategory, layout, puck }: ExhibitorsListingProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { exhibitors = [], exhibitorCategories = [] } = getMeta(puck)
  return (
    <SectionShell layout={layout}>
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center" style={sfFont}>{title}</h2>}
        {exhibitors.length === 0 ? (
          <p className="text-center text-[#1a1a2e]/55 italic">Exhibitor list coming soon.</p>
        ) : groupByCategory ? (
          (() => {
            // Group by category name; uncategorised at the end.
            const buckets = new Map<string, ExhibitorShape[]>()
            for (const e of exhibitors) {
              const k = (e.category ?? "").trim() || "Other"
              const arr = buckets.get(k) ?? []
              arr.push(e); buckets.set(k, arr)
            }
            const ordered = exhibitorCategories
              .map((c) => [c.name, buckets.get(c.name) ?? []] as const)
              .filter(([, arr]) => arr.length > 0)
            const seen = new Set(ordered.map(([k]) => k))
            for (const [k, arr] of buckets) if (!seen.has(k)) ordered.push([k, arr])
            return (
              <div className="space-y-12">
                {ordered.map(([cat, list]) => (
                  <div key={cat}>
                    <h3 className="text-xl font-bold mb-5" style={sfFont}>{cat}</h3>
                    <ExhibitorGrid list={list} />
                  </div>
                ))}
              </div>
            )
          })()
        ) : (
          <ExhibitorGrid list={exhibitors} />
        )}
      </div>
    </SectionShell>
  )
}
function ExhibitorGrid({ list }: { list: ExhibitorShape[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {list.map((e) => (
        <a
          key={e.id}
          href={e.website || "#"}
          target={e.website ? "_blank" : undefined}
          rel={e.website ? "noopener noreferrer" : undefined}
          className="group flex flex-col rounded-xl border border-[#1a1a2e]/10 bg-white p-5 hover:border-[var(--lf-primary,#e7ab1c)] hover:shadow-md transition"
        >
          <div className="h-16 mb-3 flex items-center justify-center">
            {e.logo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={parseFocalPoint(e.logo_url).src} alt={e.name} className="max-h-16 w-auto object-contain" />
            ) : (
              <Briefcase size={28} className="text-[#1a1a2e]/30" />
            )}
          </div>
          <p className="text-[13px] font-bold text-[#1a1a2e] truncate text-center">{e.name}</p>
          {e.booth && <p className="mt-0.5 text-[11px] text-[#1a1a2e]/55 text-center">Booth {e.booth}</p>}
        </a>
      ))}
    </div>
  )
}

/* ── ITEM 6 — EXHIBITOR CATEGORY ─────────────────────────────────────
 * Renders a single category subset.
 */
export type ExhibitorCategoryProps = {
  categoryId: string
  layout?: LayoutProps
}
export function ExhibitorCategoryBlock({ categoryId, layout, puck }: ExhibitorCategoryProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { exhibitors = [], exhibitorCategories = [] } = getMeta(puck)
  const cat = exhibitorCategories.find((c) => c.id === categoryId)
  if (!cat) {
    return (
      <SectionShell layout={layout}>
        <div className="max-w-6xl mx-auto px-6 text-center text-[#1a1a2e]/55 italic">
          Pick a category in the inspector.
        </div>
      </SectionShell>
    )
  }
  const list = exhibitors.filter((e) => (e.category ?? "").trim() === cat.name)
  return (
    <SectionShell layout={layout}>
      <div className="max-w-6xl mx-auto px-6">
        <h3 className="text-2xl font-bold mb-6" style={sfFont}>{cat.name}</h3>
        {list.length === 0 ? (
          <p className="text-[#1a1a2e]/55 italic">No exhibitors in this category yet.</p>
        ) : (
          <ExhibitorGrid list={list} />
        )}
      </div>
    </SectionShell>
  )
}

/* ── ITEM 7 — HOTELS LISTING ─────────────────────────────────────────
 * Reads metadata.hotels. Card renders image + name + distance + price
 * + Book button (links to booking_url).
 */
export type HotelsListingProps = {
  title?: string
  columns: 2 | 3 | 4
  layout?: LayoutProps
}
export function HotelsListing({ title, columns, layout, puck }: HotelsListingProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { hotels = [] } = getMeta(puck)
  const cols = Math.max(2, Math.min(4, columns))
  const gridCls = cols === 2 ? "grid-cols-1 md:grid-cols-2" : cols === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4"
  return (
    <SectionShell layout={layout}>
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center" style={sfFont}>{title}</h2>}
        {hotels.length === 0 ? (
          <p className="text-center text-[#1a1a2e]/55 italic">Hotels coming soon.</p>
        ) : (
          <div className={`grid gap-6 ${gridCls}`}>
            {hotels.map((h) => (
              <div key={h.id} className="rounded-xl overflow-hidden border border-[#1a1a2e]/10 bg-white flex flex-col">
                <div className="relative aspect-[16/10] bg-[#1a1a2e]/5">
                  {h.image_url && (
                    <Image src={parseFocalPoint(h.image_url).src} alt={h.name} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-[15px] font-bold text-[#1a1a2e]">{h.name}</p>
                  <div className="mt-1 flex items-center gap-3 text-[12px] text-[#1a1a2e]/65">
                    {typeof h.distance_km === "number" && <span>{h.distance_km.toFixed(1)} km away</span>}
                    {h.price_range && <span className="font-semibold">{h.price_range}</span>}
                  </div>
                  {h.address && <p className="mt-2 text-[12px] text-[#1a1a2e]/60 line-clamp-2">{h.address}</p>}
                  {h.description && <p className="mt-2 text-[13px] text-[#1a1a2e]/75 line-clamp-3">{h.description}</p>}
                  <div className="mt-auto pt-4">
                    {h.booking_url ? (
                      <a
                        href={h.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[#1a1a2e] text-[13px] font-bold"
                        style={{ backgroundColor: "var(--lf-primary, #e7ab1c)" }}
                      >
                        Book <ChevronRight size={12} />
                      </a>
                    ) : (
                      <span className="text-[12px] text-[#1a1a2e]/40 italic">No booking link</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionShell>
  )
}
