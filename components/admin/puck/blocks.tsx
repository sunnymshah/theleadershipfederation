/**
 * ── Puck section components ───────────────────────────────────────────
 *
 * Every block the admin can drop onto the event-page canvas. Mirrors the
 * legacy `components/site/EventSections.tsx` renderer 1:1 so the public
 * page looks identical whether it's rendered from `event_sections` rows
 * or from Puck `Data`.
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
import {
  Calendar, MapPin, User, Mic2, Ticket, ChevronRight, Building2,
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

/* ── HERO ─────────────────────────────────────────────────────────── */

export type HeroProps = {
  title: string
  subtitle: string
  ctaLabel: string
  ctaUrl: string
  backgroundImage: string
}

export function Hero({
  title, subtitle, ctaLabel, ctaUrl, backgroundImage,
  puck,
}: HeroProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { event } = getMeta(puck)
  const bg = backgroundImage || event.cover_image_url
  const shownTitle = title || event.title

  return (
    <section className="relative min-h-[520px] sm:min-h-[640px] flex items-end overflow-hidden bg-[#1a1a2e]">
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
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pb-16 pt-28 w-full">
        {event.start_date && (
          <div className="flex items-center gap-3 text-xs font-semibold text-[#e7ab1c] uppercase tracking-[0.22em] mb-4">
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
          className="text-4xl sm:text-5xl md:text-7xl font-bold text-white max-w-4xl leading-[1.05]"
          style={sfFont}
        >
          {shownTitle || "Untitled Event"}
        </h1>
        {subtitle && (
          <p className="mt-5 text-lg sm:text-xl text-white/80 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
        {ctaLabel && ctaUrl && (
          <div className="mt-8">
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

export type RichTextProps = { title: string; subtitle: string; body: string }

export function RichText({ title, subtitle, body }: RichTextProps) {
  if (!body && !title) return <SectionPlaceholder label="Rich text" />
  return (
    <section className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
      {title && (
        <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-4 tracking-tight" style={sfFont}>
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="text-base text-[#e7ab1c] font-semibold mb-6 uppercase tracking-[0.15em]">
          {subtitle}
        </p>
      )}
      {body && (
        <div className="prose prose-neutral max-w-none text-[#1a1a2e]/85 leading-relaxed text-[16px] whitespace-pre-wrap">
          {body}
        </div>
      )}
    </section>
  )
}

/* ── STATS ROW ────────────────────────────────────────────────────── */

export type StatsRowProps = {
  title: string
  subtitle: string
  stats: Array<{ value: string; label: string }>
}

export function StatsRow({ title, stats }: StatsRowProps) {
  if (!stats || stats.length === 0) return <SectionPlaceholder label="Stats (add rows in the right-hand inspector)" />
  return (
    <section className="bg-[#F4F8FF] py-14 sm:py-20">
      <div className="max-w-5xl mx-auto px-6">
        {title && (
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-[#1a1a2e] mb-10 tracking-tight" style={sfFont}>
            {title}
          </h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#e7ab1c] to-[#d49c10] bg-clip-text text-transparent" style={sfFont}>
                {stat.value}
              </div>
              <div className="text-xs text-[#1a1a2e]/60 uppercase tracking-[0.15em] mt-2 font-semibold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── SPEAKERS GRID ────────────────────────────────────────────────── */

export type SpeakersGridProps = {
  title: string
  subtitle: string
  layout: "grid-4" | "grid-3" | "row"
  frame: "circle" | "rounded" | "square"
  fit: "contain" | "cover"
}

export function SpeakersGrid({
  title, subtitle, layout, frame, fit,
  puck,
}: SpeakersGridProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { speakers } = getMeta(puck)
  if (speakers.length === 0) return <SectionPlaceholder label="Speakers grid (empty — add speakers to this event)" />

  const gridCls =
    layout === "row"    ? "flex flex-wrap items-start justify-center gap-6" :
    layout === "grid-3" ? "grid grid-cols-2 sm:grid-cols-3 gap-6" :
                          "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"
  const isCircle = frame === "circle"
  const fitCls = fit === "contain" ? "object-contain" : "object-cover"

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
      <div className="text-center mb-10">
        <span className="inline-block text-[10px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-3 px-3 py-1 rounded-full bg-[#e7ab1c]/10">
          Line-up
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] tracking-tight" style={sfFont}>
          {title || "Speakers"}
        </h2>
        {subtitle && <p className="mt-3 text-[#1a1a2e]/70 max-w-2xl mx-auto">{subtitle}</p>}
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
              <h3 className="mt-4 text-sm font-bold text-[#1a1a2e] leading-snug max-w-[180px]" style={sfFont}>{sp.name}</h3>
              {sp.designation && <p className="text-xs text-[#1a1a2e]/70 mt-1 max-w-[180px]">{sp.designation}</p>}
              {sp.company && <p className="text-[11px] text-[#e7ab1c] font-semibold mt-0.5 max-w-[180px] truncate">{sp.company}</p>}
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
    </section>
  )
}

/* ── AGENDA ───────────────────────────────────────────────────────── */

export type AgendaProps = { title: string; subtitle: string }

export function Agenda({
  title, subtitle,
  puck,
}: AgendaProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { sessions } = getMeta(puck)
  if (sessions.length === 0) return <SectionPlaceholder label="Agenda (empty — add sessions to this event)" dark />
  return (
    <section className="bg-[#1a1a2e] text-white py-16 sm:py-20">
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
    </section>
  )
}

/* ── TICKETS CTA ──────────────────────────────────────────────────── */

export type TicketsCtaProps = { title: string; subtitle: string; ctaLabel: string }

export function TicketsCta({
  title, subtitle, ctaLabel,
  puck,
}: TicketsCtaProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { tickets, event } = getMeta(puck)
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
      <div className="text-center mb-10">
        <span className="inline-block text-[10px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-3 px-3 py-1 rounded-full bg-[#e7ab1c]/10">
          Reserve Your Seat
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] tracking-tight" style={sfFont}>
          {title || "Tickets"}
        </h2>
        {subtitle && <p className="mt-3 text-[#1a1a2e]/70 max-w-2xl mx-auto">{subtitle}</p>}
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {tickets.length === 0 ? (
          <div className="md:col-span-3 text-center text-sm text-[#1a1a2e]/50 py-8">
            Ticket sales open soon.
          </div>
        ) : tickets.map((t) => (
          <div key={t.id} className="p-6 bg-white border border-[#1a1a2e]/[0.08] rounded-2xl">
            <h4 className="text-lg font-bold text-[#1a1a2e] mb-1">{t.name}</h4>
            {t.description && <p className="text-sm text-[#1a1a2e]/65 mb-4 line-clamp-3">{t.description}</p>}
            <div className="text-3xl font-bold text-[#1a1a2e] mb-5" style={sfFont}>
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
    </section>
  )
}

/* ── SPONSORS GRID ────────────────────────────────────────────────── */

export type SponsorsGridProps = { title: string }

export function SponsorsGrid({
  title,
  puck,
}: SponsorsGridProps & { puck: { metadata?: Record<string, unknown> } }) {
  const { sponsors } = getMeta(puck)
  if (sponsors.length === 0) return <SectionPlaceholder label="Sponsors grid (empty — add sponsors to this event)" />
  return (
    <section className="bg-[#F4F8FF] py-14 sm:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] tracking-tight" style={sfFont}>
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
    </section>
  )
}

/* ── VIDEO ────────────────────────────────────────────────────────── */

export type VideoProps = { title: string; videoUrl: string }

export function Video({ title, videoUrl }: VideoProps) {
  const id = extractYouTubeId(videoUrl)
  if (!id) return <SectionPlaceholder label="Video (paste a YouTube URL in the inspector)" />
  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      {title && (
        <h2 className="text-center text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-8 tracking-tight" style={sfFont}>
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
    </section>
  )
}

/* ── GALLERY ──────────────────────────────────────────────────────── */

export type GalleryProps = { title: string; images: Array<{ url: string }> }

export function Gallery({ title, images }: GalleryProps) {
  if (!images || images.length === 0) return <SectionPlaceholder label="Gallery (upload images in the inspector)" />
  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      {title && (
        <h2 className="text-center text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-8 tracking-tight" style={sfFont}>
          {title}
        </h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img, i) =>
          img.url ? (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#F4F8FF]">
              <Image src={img.url} alt="" fill className="object-cover" sizes="(max-width:768px) 50vw, 25vw" />
            </div>
          ) : null,
        )}
      </div>
    </section>
  )
}

/* ── CTA BUTTON ───────────────────────────────────────────────────── */

export type CtaButtonProps = { title: string; subtitle: string; ctaLabel: string; ctaUrl: string }

export function CtaButton({ title, subtitle, ctaLabel, ctaUrl }: CtaButtonProps) {
  if (!ctaLabel || !ctaUrl) return <SectionPlaceholder label="CTA button (set label + URL in the inspector)" />
  return (
    <section className="max-w-4xl mx-auto px-6 py-16 text-center">
      {title && (
        <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-3 tracking-tight" style={sfFont}>
          {title}
        </h2>
      )}
      {subtitle && <p className="text-[#1a1a2e]/70 mb-7 max-w-xl mx-auto">{subtitle}</p>}
      <Link
        href={ctaUrl}
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#e7ab1c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d49c10] transition-colors"
      >
        {ctaLabel}
        <ChevronRight size={14} />
      </Link>
    </section>
  )
}

/* ── FAQs ─────────────────────────────────────────────────────────── */

export type FaqsProps = {
  title: string
  faqs: Array<{ q: string; a: string }>
}

export function Faqs({ title, faqs }: FaqsProps) {
  if (!faqs || faqs.length === 0) return <SectionPlaceholder label="FAQs (add question/answer pairs in the inspector)" />
  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-8 tracking-tight text-center" style={sfFont}>
        {title || "Frequently Asked"}
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <details key={i} className="group bg-white border border-[#1a1a2e]/[0.06] rounded-xl px-5 py-4 open:bg-[#F4F8FF]">
            <summary className="font-semibold text-[#1a1a2e] cursor-pointer list-none flex justify-between items-center">
              {faq.q}
              <ChevronRight size={16} className="group-open:rotate-90 transition-transform" />
            </summary>
            <p className="mt-3 text-sm text-[#1a1a2e]/75 leading-relaxed whitespace-pre-wrap">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
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
