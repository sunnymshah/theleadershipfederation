import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin, User, Mic2, Ticket, ChevronRight } from "lucide-react"
import type { EventSection } from "@/lib/event-sections"

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

type Event = {
  id: string
  slug: string
  title: string
  start_date: string
  end_date: string | null
  venue: string | null
  description: string | null
  cover_image_url: string | null
}

type Speaker = { id: string; name: string; designation: string | null; company: string | null; image_url: string | null }
type Session = { id: string; title: string; starts_at: string; ends_at: string | null; speaker_names: string[] | null; track: string | null }
type Sponsor = { id: string; name: string; logo_url: string | null; tier: string | null; website: string | null }
type Ticket = { id: string; name: string; description: string | null; price_inr: number; sold: number; inventory_limit: number | null }

export function EventSectionsRenderer({
  sections,
  event,
  speakers,
  sessions,
  sponsors,
  tickets,
}: {
  sections: EventSection[]
  event: Event
  speakers: Speaker[]
  sessions: Session[]
  sponsors: Sponsor[]
  tickets: Ticket[]
}) {
  return (
    <main className="min-h-screen bg-white">
      {sections.map((s) => (
        <SectionBlock
          key={s.id}
          section={s}
          event={event}
          speakers={speakers}
          sessions={sessions}
          sponsors={sponsors}
          tickets={tickets}
        />
      ))}
    </main>
  )
}

function SectionBlock({
  section: s,
  event,
  speakers,
  sessions,
  sponsors,
  tickets,
}: {
  section: EventSection
  event: Event
  speakers: Speaker[]
  sessions: Session[]
  sponsors: Sponsor[]
  tickets: Ticket[]
}) {
  switch (s.kind) {
    case "hero":
      return <HeroBlock s={s} event={event} />
    case "rich_text":
      return <RichTextBlock s={s} />
    case "stats_row":
      return <StatsRowBlock s={s} />
    case "speakers_grid":
      return <SpeakersGridBlock s={s} speakers={speakers} />
    case "agenda":
      return <AgendaBlock s={s} sessions={sessions} />
    case "tickets_cta":
      return <TicketsCtaBlock s={s} tickets={tickets} eventSlug={event.slug} />
    case "sponsors_grid":
      return <SponsorsGridBlock s={s} sponsors={sponsors} />
    case "video":
      return <VideoBlock s={s} />
    case "gallery":
      return <GalleryBlock s={s} />
    case "cta_button":
      return <CtaButtonBlock s={s} />
    case "faqs":
      return <FaqsBlock s={s} />
    default:
      return null
  }
}

/* ── HERO ────────────────────────────────────────────────────────────── */
function HeroBlock({ s, event }: { s: EventSection; event: Event }) {
  const bg = s.image_url || event.cover_image_url
  const title = s.title || event.title
  const subtitle = s.subtitle
  return (
    <section className="relative min-h-[520px] sm:min-h-[640px] flex items-end overflow-hidden bg-[#1a1a2e]">
      {bg && (
        <Image
          src={bg}
          alt={title}
          fill
          priority
          className="object-cover opacity-60"
          sizes="100vw"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pb-16 pt-28 w-full">
        <div className="flex items-center gap-3 text-xs font-semibold text-[#e7ab1c] uppercase tracking-[0.22em] mb-4">
          <Calendar size={13} /> {fmtDate(event.start_date, event.end_date)}
          {event.venue && (
            <>
              <span className="opacity-40">·</span>
              <MapPin size={13} /> {event.venue}
            </>
          )}
        </div>
        <h1
          className="text-4xl sm:text-5xl md:text-7xl font-bold text-white max-w-4xl leading-[1.05]"
          style={sfFont}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-5 text-lg sm:text-xl text-white/80 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
        {s.cta_label && s.cta_url && (
          <div className="mt-8">
            <Link
              href={s.cta_url}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#e7ab1c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d49c10] transition-colors"
            >
              {s.cta_label}
              <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

/* ── RICH TEXT ───────────────────────────────────────────────────────── */
function RichTextBlock({ s }: { s: EventSection }) {
  if (!s.body && !s.title) return null
  return (
    <section className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
      {s.title && (
        <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-4 tracking-tight" style={sfFont}>
          {s.title}
        </h2>
      )}
      {s.subtitle && (
        <p className="text-base text-[#e7ab1c] font-semibold mb-6 uppercase tracking-[0.15em]">
          {s.subtitle}
        </p>
      )}
      {s.body && (
        <div className="prose prose-neutral max-w-none text-[#1a1a2e]/85 leading-relaxed text-[16px] whitespace-pre-wrap">
          {s.body}
        </div>
      )}
    </section>
  )
}

/* ── STATS ROW ───────────────────────────────────────────────────────── */
function StatsRowBlock({ s }: { s: EventSection }) {
  const stats = ((s.data as Record<string, unknown>)?.stats as Array<{ value: string; label: string }>) ?? []
  if (stats.length === 0) return null
  return (
    <section className="bg-[#F4F8FF] py-14 sm:py-20">
      <div className="max-w-5xl mx-auto px-6">
        {s.title && (
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-[#1a1a2e] mb-10 tracking-tight" style={sfFont}>
            {s.title}
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

/* ── SPEAKERS GRID ───────────────────────────────────────────────────── */
function SpeakersGridBlock({ s, speakers }: { s: EventSection; speakers: Speaker[] }) {
  if (speakers.length === 0) return null
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
      <div className="text-center mb-10">
        <span className="inline-block text-[10px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-3 px-3 py-1 rounded-full bg-[#e7ab1c]/10">
          Line-up
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] tracking-tight" style={sfFont}>
          {s.title || "Speakers"}
        </h2>
        {s.subtitle && <p className="mt-3 text-[#1a1a2e]/70 max-w-2xl mx-auto">{s.subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {speakers.map((sp) => (
          <div key={sp.id} className="group bg-white border border-[#1a1a2e]/[0.06] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#e7ab1c]/25 transition-all duration-300">
            <div className="relative aspect-[4/5] bg-[#F4F8FF]">
              {sp.image_url ? (
                <Image src={sp.image_url} alt={sp.name} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-500" sizes="(max-width: 640px) 50vw, 25vw" />
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
        ))}
      </div>
    </section>
  )
}

/* ── AGENDA (from sessions) ─────────────────────────────────────────── */
function AgendaBlock({ s, sessions }: { s: EventSection; sessions: Session[] }) {
  if (sessions.length === 0) return null
  return (
    <section className="bg-[#1a1a2e] text-white py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <span className="inline-block text-[10px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-3 px-3 py-1 rounded-full bg-[#e7ab1c]/15 border border-[#e7ab1c]/20">
            Schedule
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={sfFont}>
            {s.title || "Agenda"}
          </h2>
          {s.subtitle && <p className="mt-3 text-white/70 max-w-2xl mx-auto">{s.subtitle}</p>}
        </div>
        <div className="space-y-3">
          {sessions.map((sess) => (
            <div key={sess.id} className="flex gap-5 p-5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-[#e7ab1c]/40 transition-colors">
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

/* ── TICKETS CTA ─────────────────────────────────────────────────────── */
function TicketsCtaBlock({ s, tickets, eventSlug }: { s: EventSection; tickets: Ticket[]; eventSlug: string }) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
      <div className="text-center mb-10">
        <span className="inline-block text-[10px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-3 px-3 py-1 rounded-full bg-[#e7ab1c]/10">
          Reserve Your Seat
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] tracking-tight" style={sfFont}>
          {s.title || "Tickets"}
        </h2>
        {s.subtitle && <p className="mt-3 text-[#1a1a2e]/70 max-w-2xl mx-auto">{s.subtitle}</p>}
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {tickets.length === 0 ? (
          <div className="md:col-span-3 text-center text-sm text-[#1a1a2e]/50 py-8">
            Ticket sales open soon.
          </div>
        ) : tickets.map((t) => (
          <div key={t.id} className="p-6 bg-white border border-[#1a1a2e]/[0.08] rounded-2xl hover:border-[#e7ab1c]/40 transition-colors">
            <h4 className="text-lg font-bold text-[#1a1a2e] mb-1">{t.name}</h4>
            {t.description && <p className="text-sm text-[#1a1a2e]/65 mb-4 line-clamp-3">{t.description}</p>}
            <div className="text-3xl font-bold text-[#1a1a2e] mb-5" style={sfFont}>
              ₹{t.price_inr.toLocaleString("en-IN")}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href={`/events/${eventSlug}/tickets`}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#1a1a2e] text-white text-sm font-bold hover:bg-[#2a2a4e] transition-colors"
        >
          <Ticket size={14} />
          {s.cta_label || "Buy Tickets"}
          <ChevronRight size={14} />
        </Link>
      </div>
    </section>
  )
}

/* ── SPONSORS GRID ───────────────────────────────────────────────────── */
function SponsorsGridBlock({ s, sponsors }: { s: EventSection; sponsors: Sponsor[] }) {
  if (sponsors.length === 0) return null
  return (
    <section className="bg-[#F4F8FF] py-14 sm:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] tracking-tight" style={sfFont}>
            {s.title || "Our Partners"}
          </h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 items-center">
          {sponsors.map((sp) => (
            <div key={sp.id} className="aspect-[3/2] bg-white rounded-xl border border-[#1a1a2e]/[0.06] flex items-center justify-center p-4 hover:shadow-sm transition-shadow">
              {sp.logo_url ? (
                <Image src={sp.logo_url} alt={sp.name} width={120} height={60} className="object-contain max-h-12" />
              ) : (
                <span className="text-xs font-semibold text-[#1a1a2e]/70 text-center">{sp.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── VIDEO ───────────────────────────────────────────────────────────── */
function VideoBlock({ s }: { s: EventSection }) {
  if (!s.video_url) return null
  const id = extractYouTubeId(s.video_url)
  if (!id) return null
  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      {s.title && (
        <h2 className="text-center text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-8 tracking-tight" style={sfFont}>
          {s.title}
        </h2>
      )}
      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={s.title ?? "Video"}
        />
      </div>
    </section>
  )
}

/* ── GALLERY ─────────────────────────────────────────────────────────── */
function GalleryBlock({ s }: { s: EventSection }) {
  const images = ((s.data as Record<string, unknown>)?.images as string[]) ?? []
  if (images.length === 0) return null
  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      {s.title && (
        <h2 className="text-center text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-8 tracking-tight" style={sfFont}>
          {s.title}
        </h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#F4F8FF]">
            <Image src={url} alt="" fill className="object-cover hover:scale-105 transition-transform duration-500" sizes="(max-width:768px) 50vw, 25vw" />
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── CTA BUTTON ──────────────────────────────────────────────────────── */
function CtaButtonBlock({ s }: { s: EventSection }) {
  if (!s.cta_label || !s.cta_url) return null
  return (
    <section className="max-w-4xl mx-auto px-6 py-16 text-center">
      {s.title && (
        <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-3 tracking-tight" style={sfFont}>
          {s.title}
        </h2>
      )}
      {s.subtitle && <p className="text-[#1a1a2e]/70 mb-7 max-w-xl mx-auto">{s.subtitle}</p>}
      <Link
        href={s.cta_url}
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#e7ab1c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d49c10] transition-colors"
      >
        {s.cta_label}
        <ChevronRight size={14} />
      </Link>
    </section>
  )
}

/* ── FAQs ────────────────────────────────────────────────────────────── */
function FaqsBlock({ s }: { s: EventSection }) {
  const faqs = ((s.data as Record<string, unknown>)?.faqs as Array<{ q: string; a: string }>) ?? []
  if (faqs.length === 0) return null
  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-8 tracking-tight text-center" style={sfFont}>
        {s.title || "Frequently Asked"}
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

/* ── helpers ─────────────────────────────────────────────────────────── */
function fmtDate(d: string, end?: string | null) {
  const start = new Date(d)
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }
  if (!end) return start.toLocaleDateString("en-IN", opts)
  const endDate = new Date(end)
  return `${start.toLocaleDateString("en-IN", { day: "numeric", month: "long" })} – ${endDate.toLocaleDateString("en-IN", opts)}`
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
}
function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}
