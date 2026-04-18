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
import type { CSSProperties, ReactNode } from "react"
import {
  Calendar, MapPin, User, Mic2, Ticket, ChevronRight, Building2, Quote,
} from "lucide-react"

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
}
export type SpeakerShape = { id: string; name: string; designation: string | null; company: string | null; image_url: string | null }
export type SessionShape = { id: string; title: string; starts_at: string; ends_at: string | null; speaker_names: string[] | null; track: string | null }
export type SponsorShape = { id: string; name: string; logo_url: string | null; tier: string | null; website: string | null }
export type TicketShape  = { id: string; name: string; description: string | null; price_inr: number; sold: number; inventory_limit: number | null }

export type BuilderMetadata = {
  event: EventShape
  speakers: SpeakerShape[]
  sessions: SessionShape[]
  sponsors: SponsorShape[]
  tickets: TicketShape[]
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
    },
    speakers: m.speakers ?? [],
    sessions: m.sessions ?? [],
    sponsors: m.sponsors ?? [],
    tickets: m.tickets ?? [],
  }
}

/* ── Shared layout prop (applied by <SectionShell/>) ───────────────── */

export type LayoutProps = {
  paddingY?: "none" | "sm" | "md" | "lg" | "xl"
  backgroundColor?: string       // hex or empty
  backgroundImage?: string       // URL or empty
  backgroundOverlay?: number     // 0..100, dark overlay percent on bg image
  textColor?: string             // hex or empty
  textAlign?: "left" | "center" | "right"
  fullBleed?: boolean
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
}: {
  layout?: LayoutProps
  children: ReactNode
  baseClass?: string
  dark?: boolean
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
    style.backgroundImage = `linear-gradient(rgba(0,0,0,${overlayPct / 100}), rgba(0,0,0,${overlayPct / 100})), url('${l.backgroundImage}')`
    style.backgroundSize = "cover"
    style.backgroundPosition = "center"
  }

  return (
    <section
      className={`${padding} ${align} ${baseClass} ${hasBgImage ? "text-white" : ""}`.trim()}
      style={style}
    >
      {children}
    </section>
  )
}

function fmtDate(d: string, end?: string | null) {
  const start = new Date(d)
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }
  if (!end) return start.toLocaleDateString("en-IN", opts)
  const endDate = new Date(end)
  return `${start.toLocaleDateString("en-IN", { day: "numeric", month: "long" })} – ${endDate.toLocaleDateString("en-IN", opts)}`
}
function fmtTime(iso: string) {
  if (!iso) return ""
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
}
function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

/* ── ROOT (theme cascade) ─────────────────────────────────────────── */

export type RootProps = {
  title?: string
  primaryColor?: string     // hex
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

export function Root({ children, primaryColor, textColor, bgColor, fontFamily }: RootProps & { children: ReactNode }) {
  const ff = FONT_STACKS[fontFamily ?? "sf"]
  const style: CSSProperties = {
    fontFamily: ff,
    ...(bgColor ? { backgroundColor: bgColor } : {}),
    ...(textColor ? { color: textColor } : {}),
    // CSS custom properties for blocks that want to opt in later.
    ["--lf-primary" as unknown as string]: primaryColor || "#e7ab1c",
    ["--lf-text" as unknown as string]: textColor || "#1a1a2e",
    ["--lf-bg" as unknown as string]: bgColor || "#ffffff",
  }
  return <div style={style}>{children}</div>
}

/* ── HERO ─────────────────────────────────────────────────────────── */

export type HeroProps = {
  title: string
  subtitle: string
  ctaLabel: string
  ctaUrl: string
  backgroundImage: string
  alignment?: "left" | "center"
  minHeight?: "short" | "tall" | "full"
}

export function Hero({
  title, subtitle, ctaLabel, ctaUrl, backgroundImage, alignment, minHeight,
  puck,
}: HeroProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { event } = getMeta(puck)
  const bg = backgroundImage || event.cover_image_url
  const shownTitle = title || event.title
  const height =
    minHeight === "full" ? "min-h-[calc(100vh-48px)]" :
    minHeight === "short" ? "min-h-[380px] sm:min-h-[460px]" :
                            "min-h-[520px] sm:min-h-[640px]"
  const centered = alignment === "center"

  return (
    <section className={`relative ${height} flex items-end overflow-hidden bg-[#1a1a2e]`}>
      {bg && (
        <Image
          src={bg}
          alt={shownTitle || "Event"}
          fill
          priority
          className="object-cover opacity-60"
          sizes="100vw"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent" />
      <div className={`relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pb-16 pt-28 w-full ${centered ? "text-center" : ""}`}>
        {event.start_date && (
          <div className={`flex items-center gap-3 text-xs font-semibold text-[#e7ab1c] uppercase tracking-[0.22em] mb-4 ${centered ? "justify-center" : ""}`}>
            <Calendar size={13} /> {fmtDate(event.start_date, event.end_date)}
            {event.venue && (
              <>
                <span className="opacity-40">·</span>
                <MapPin size={13} /> {event.venue}
              </>
            )}
          </div>
        )}
        <h1
          className={`text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-[1.05] ${centered ? "max-w-4xl mx-auto" : "max-w-4xl"}`}
          style={sfFont}
        >
          {shownTitle || "Untitled Event"}
        </h1>
        {subtitle && (
          <p className={`mt-5 text-lg sm:text-xl text-white/80 leading-relaxed ${centered ? "max-w-2xl mx-auto" : "max-w-2xl"}`}>
            {subtitle}
          </p>
        )}
        {ctaLabel && ctaUrl && (
          <div className={`mt-8 ${centered ? "flex justify-center" : ""}`}>
            <Link
              href={ctaUrl}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#e7ab1c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d49c10] transition-colors"
            >
              {ctaLabel}
              <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

/* ── RICH TEXT ────────────────────────────────────────────────────── */

export type RichTextProps = {
  title: string; subtitle: string; body: string
  layout?: LayoutProps
}

export function RichText({ title, subtitle, body, layout }: RichTextProps) {
  if (!body && !title) return <SectionPlaceholder label="Rich text" />
  return (
    <SectionShell layout={layout}>
      <div className="max-w-3xl mx-auto px-6">
        {subtitle && (
          <p className="text-xs font-bold uppercase tracking-[0.22em] mb-4" style={{ color: "var(--lf-primary, #e7ab1c)" }}>
            {subtitle}
          </p>
        )}
        {title && (
          <h2 className="text-3xl sm:text-4xl font-bold mb-5 tracking-tight" style={sfFont}>
            {title}
          </h2>
        )}
        {body && (
          <div className="prose prose-neutral max-w-none leading-relaxed text-[16px] whitespace-pre-wrap" style={{ opacity: 0.9 }}>
            {body}
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
  stats: Array<{ value: string; label: string }>
  layout?: LayoutProps
}

export function StatsRow({ title, stats, layout }: StatsRowProps) {
  if (!stats || stats.length === 0) return <SectionPlaceholder label="Stats (add rows in the right-hand inspector)" />
  const baseBg = layout?.backgroundColor || layout?.backgroundImage ? "" : "bg-[#F4F8FF]"
  return (
    <SectionShell layout={layout} baseClass={baseBg}>
      <div className="max-w-5xl mx-auto px-6">
        {title && (
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-10 tracking-tight" style={sfFont}>
            {title}
          </h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#e7ab1c] to-[#d49c10] bg-clip-text text-transparent" style={sfFont}>
                {stat.value}
              </div>
              <div className="text-xs uppercase tracking-[0.15em] mt-2 font-semibold opacity-70">
                {stat.label}
              </div>
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
}

export function SpeakersGrid({
  title, subtitle, layout, gridLayout, frame, fit,
  puck,
}: SpeakersGridProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { speakers } = getMeta(puck)
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
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-[#F4F8FF] border-4 border-white shadow-[0_8px_24px_rgba(26,26,46,0.12)]">
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
              </div>
            ))}
          </div>
        ) : (
          <div className={gridCls}>
            {speakers.map((sp) => {
              const radius = frame === "square" ? "rounded-none" : "rounded-2xl"
              return (
                <div key={sp.id} className={`bg-white border border-[#1a1a2e]/[0.06] overflow-hidden shadow-sm ${radius}`}>
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
                    {sp.company && <p className="text-[11px] text-[#e7ab1c] font-semibold mt-0.5 truncate">{sp.company}</p>}
                  </div>
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

export type AgendaProps = { title: string; subtitle: string; layout?: LayoutProps }

export function Agenda({
  title, subtitle, layout,
  puck,
}: AgendaProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { sessions } = getMeta(puck)
  if (sessions.length === 0) return <SectionPlaceholder label="Agenda (empty — add sessions to this event)" dark />
  const hasOverride = layout?.backgroundColor || layout?.backgroundImage
  const baseBg = hasOverride ? "" : "bg-[#1a1a2e] text-white"
  return (
    <SectionShell layout={layout} baseClass={baseBg} dark>
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <span className="inline-block text-[10px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-3 px-3 py-1 rounded-full bg-[#e7ab1c]/15 border border-[#e7ab1c]/20">
            Schedule
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={sfFont}>
            {title || "Agenda"}
          </h2>
          {subtitle && <p className="mt-3 text-white/70 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
        <div className="space-y-3">
          {sessions.map((sess) => (
            <div key={sess.id} className="flex gap-5 p-5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <div className="shrink-0 text-[#e7ab1c] font-mono text-sm w-20">
                {fmtTime(sess.starts_at)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold leading-snug">{sess.title}</h4>
                {sess.track && <p className="text-xs text-[#e7ab1c] mt-1">{sess.track}</p>}
                {sess.speaker_names && sess.speaker_names.length > 0 && (
                  <p className="text-xs text-white/60 mt-1">
                    <Mic2 size={11} className="inline mr-1" />
                    {sess.speaker_names.join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
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
          <span className="inline-block text-[10px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-3 px-3 py-1 rounded-full bg-[#e7ab1c]/10">
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

export type SponsorsGridProps = { title: string; layout?: LayoutProps }

export function SponsorsGrid({
  title, layout,
  puck,
}: SponsorsGridProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { sponsors } = getMeta(puck)
  if (sponsors.length === 0) return <SectionPlaceholder label="Sponsors grid (empty — add sponsors to this event)" />
  const hasOverride = layout?.backgroundColor || layout?.backgroundImage
  const baseBg = hasOverride ? "" : "bg-[#F4F8FF]"
  return (
    <SectionShell layout={layout} baseClass={baseBg}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={sfFont}>
            {title || "Our Partners"}
          </h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 items-center">
          {sponsors.map((sp) => (
            <div key={sp.id} className="aspect-[3/2] bg-white rounded-xl border border-[#1a1a2e]/[0.06] flex items-center justify-center p-4">
              {sp.logo_url ? (
                <Image src={sp.logo_url} alt={sp.name} width={120} height={60} className="object-contain max-h-12" />
              ) : (
                <span className="text-xs font-semibold text-[#1a1a2e]/70 text-center inline-flex items-center gap-1.5">
                  <Building2 size={14} />
                  {sp.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

/* ── VIDEO ────────────────────────────────────────────────────────── */

export type VideoProps = { title: string; videoUrl: string; layout?: LayoutProps }

export function Video({ title, videoUrl, layout }: VideoProps) {
  const id = extractYouTubeId(videoUrl)
  if (!id) return <SectionPlaceholder label="Video (paste a YouTube URL in the inspector)" />
  return (
    <SectionShell layout={layout}>
      <div className="max-w-5xl mx-auto px-6">
        {title && (
          <h2 className="text-center text-3xl sm:text-4xl font-bold mb-8 tracking-tight" style={sfFont}>
            {title}
          </h2>
        )}
        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg">
          <iframe
            src={`https://www.youtube.com/embed/${id}`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title || "Video"}
          />
        </div>
      </div>
    </SectionShell>
  )
}

/* ── GALLERY ──────────────────────────────────────────────────────── */

export type GalleryProps = {
  title: string
  images: Array<{ url: string }>
  columns?: 2 | 3 | 4
  layout?: LayoutProps
}

export function Gallery({ title, images, columns, layout }: GalleryProps) {
  if (!images || images.length === 0) return <SectionPlaceholder label="Gallery (upload images in the inspector)" />
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
          {images.map((img, i) =>
            img.url ? (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#F4F8FF]">
                <Image src={img.url} alt="" fill className="object-cover" sizes="(max-width:768px) 50vw, 25vw" />
              </div>
            ) : null,
          )}
        </div>
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

export function CtaButton({ title, subtitle, ctaLabel, ctaUrl, variant, layout }: CtaButtonProps) {
  if (!ctaLabel || !ctaUrl) return <SectionPlaceholder label="CTA button (set label + URL in the inspector)" />
  const btnCls =
    variant === "outline" ? "border-2 border-[#1a1a2e] text-[#1a1a2e] hover:bg-[#1a1a2e] hover:text-white" :
    variant === "secondary" ? "bg-[#1a1a2e] text-white hover:bg-[#2a2a4e]" :
    "bg-[#e7ab1c] text-[#1a1a2e] hover:bg-[#d49c10]"
  return (
    <SectionShell layout={layout}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        {title && (
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight" style={sfFont}>
            {title}
          </h2>
        )}
        {subtitle && <p className="opacity-80 mb-7 max-w-xl mx-auto">{subtitle}</p>}
        <Link
          href={ctaUrl}
          className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-colors ${btnCls}`}
        >
          {ctaLabel}
          <ChevronRight size={14} />
        </Link>
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

export function Faqs({ title, faqs, layout }: FaqsProps) {
  if (!faqs || faqs.length === 0) return <SectionPlaceholder label="FAQs (add question/answer pairs in the inspector)" />
  return (
    <SectionShell layout={layout}>
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl sm:text-4xl font-bold mb-8 tracking-tight text-center" style={sfFont}>
          {title || "Frequently Asked"}
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-white border border-[#1a1a2e]/[0.06] rounded-xl px-5 py-4 open:bg-[#F4F8FF] text-[#1a1a2e]">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                {faq.q}
                <ChevronRight size={16} className="group-open:rotate-90 transition-transform" />
              </summary>
              <p className="mt-3 text-sm opacity-75 leading-relaxed whitespace-pre-wrap">{faq.a}</p>
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
  caption?: string
  width?: "narrow" | "wide" | "full"
  rounded?: boolean
  layout?: LayoutProps
}

export function ImageBlock({ imageUrl, caption, width, rounded, layout }: ImageBlockProps) {
  if (!imageUrl) return <SectionPlaceholder label="Image (upload or paste URL in the inspector)" />
  const max =
    width === "full" ? "max-w-none" :
    width === "narrow" ? "max-w-2xl" :
    "max-w-5xl"
  const r = rounded === false ? "" : "rounded-2xl"
  return (
    <SectionShell layout={layout}>
      <div className={`${max} mx-auto px-6`}>
        <div className={`relative w-full overflow-hidden ${r} shadow-lg`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={caption || ""} className="w-full h-auto object-cover" />
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
  layout?: LayoutProps
}

export function Testimonial({ quote, attribution, role, avatar, layout }: TestimonialProps) {
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
              <img src={avatar} alt={attribution} className="w-full h-full object-cover" />
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

export function Newsletter({ title, subtitle, ctaLabel, ctaUrl, layout }: NewsletterProps) {
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
          action={ctaUrl || "/#subscribe"}
          method="post"
          className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
        >
          <input
            type="email"
            name="email"
            placeholder="you@company.com"
            required
            className="flex-1 px-4 py-3 rounded-xl bg-white/90 border border-[#1a1a2e]/10 text-[#1a1a2e] text-sm placeholder:text-[#1a1a2e]/40 focus:outline-none focus:border-[#e7ab1c]"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#e7ab1c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d49c10] transition-colors"
          >
            {ctaLabel || "Subscribe"}
          </button>
        </form>
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
