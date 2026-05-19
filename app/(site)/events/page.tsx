/**
 * /events — public events landing.
 *
 * Soft-Monochrome / liquid-glass. A light, airy hero with a framed
 * photograph, then ONE unified upcoming-events list (the soonest event
 * as a wide showpiece card, the rest in a grid). No dead-end sections.
 * Fully responsive across phone / tablet / desktop. Event data is live
 * from Supabase — only upcoming events surface (past → /archive).
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import Image from "next/image"
import {
  Calendar, MapPin, ArrowRight, Mic2, Ticket, Sparkles,
  Network, Lightbulb, Award, Quote, Bell, Mail, Plus, Star,
} from "lucide-react"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"

export const revalidate = 60

export const metadata = {
  title: "Events | The Leadership Federation",
  description:
    "World-class leadership summits, conclaves, and forums bringing together CXOs, policymakers, and thought leaders from 30+ countries.",
}

/* ── Date helpers ──────────────────────────────────────────────────── */
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  })
}
function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}
function fmtMonth(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { month: "short" }).toUpperCase()
}
function fmtDay(d: string) {
  return new Date(d).getDate().toString().padStart(2, "0")
}
function getDaysUntil(d: string) {
  const diff = new Date(d).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const VALUE_PROPS = [
  {
    Icon: Network,
    title: "Curated Network",
    body: "Closed-door rooms with chairmen, founders, regulators and operators — invite-only by design.",
  },
  {
    Icon: Lightbulb,
    title: "Frontier Thinking",
    body: "Conversations that don't happen on stage anywhere else — capital allocation, GCC strategy, AI in regulated industries.",
  },
  {
    Icon: Award,
    title: "Quiet Influence",
    body: "Where India's growth story gets shaped — joint papers, policy roundtables, MoUs signed between sessions.",
  },
] as const

const TESTIMONIALS = [
  {
    quote: "The most substantive room I sit in all year. Conversations get real because the line-up is tight, not theatrical.",
    name: "K. Subramanian",
    role: "Chairman & Managing Director, Tier-1 GCC",
  },
  {
    quote: "TLF understood the brief that other operators don't — leaders show up to LISTEN, not perform. That changes the quality of every dialogue.",
    name: "Anita Raghavan",
    role: "Group CFO, Listed Conglomerate",
  },
  {
    quote: "Every conclave produces at least one partnership and one hire. That's the metric that matters, and they consistently deliver.",
    name: "Vikram Mehta",
    role: "Founding Partner, Growth-Stage Fund",
  },
] as const

const FAQ = [
  {
    q: "Who attends a Leadership Federation event?",
    a: "Each event is invite-curated. Typical rooms include CXOs of large enterprises and listed mid-caps, GCC heads, fund GPs, regulators, ministers, and a small cohort of operating founders. Capacity is intentionally capped — no event exceeds 350 senior leaders.",
  },
  {
    q: "How do I get invited?",
    a: "Most attendees come via referrals from existing members or the Advisory Board. You can also apply directly via the Membership page — applications are reviewed monthly and you'll hear back within 4 weeks.",
  },
  {
    q: "Are there speaking opportunities?",
    a: "Yes — we curate panels and keynotes per theme. Pitches go to the programme team via the contact page; we typically commit speakers 90 days before each event.",
  },
  {
    q: "Can my company sponsor or partner?",
    a: "Sponsorship is selective — typically 6-10 partners per event with category exclusivity. The Sponsorship deck is shared after a brief alignment call.",
  },
  {
    q: "Do you publish proceedings?",
    a: "Selected sessions are published as long-form essays + executive summaries 4-6 weeks after the event. Members receive the full archive; non-members see a curated public set.",
  },
] as const

const HERO_IMAGE = "/events/conclave-2026.jpg"

export default async function EventsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, slug, start_date, end_date, venue, description, cover_image_url, thumbnail_url, status, external_url, speakers(id), tickets(id)",
    )
    .eq("status", "published")
    .is("external_url", null)
    .order("start_date", { ascending: true })

  const now = new Date()
  const allEvents = events ?? []
  const upcoming = allEvents.filter((e) => new Date(e.start_date) >= now)
  const past = allEvents.filter((e) => new Date(e.start_date) < now)

  const lead = upcoming[0] ?? null
  const rest = upcoming.slice(1)

  return (
    <main className="bg-white">
      {/* ══════════════ HERO ══════════════ */}
      <section className="relative bg-white pt-32 lg:pt-40 pb-14 sm:pb-16 lg:pb-20 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(58% 56% at 50% 0%, rgba(0,113,227,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              Leadership Federation Events
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={110}>
            <h1 className="mt-4 sm:mt-5 text-[clamp(2.4rem,6vw,4.6rem)] font-bold text-[#1d1d1f] tracking-[-0.04em] leading-[1.0]">
              Where India&apos;s leadership
              <br className="hidden sm:block" />{" "}
              <span className="text-[#0071e3]">converges</span>
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={220}>
            <p className="mt-5 sm:mt-6 text-[15px] sm:text-[17px] lg:text-[19px] text-[#1d1d1f]/60 leading-relaxed max-w-2xl mx-auto">
              Closed-room conclaves, summits and policy roundtables for the
              CXOs, founders and regulators shaping the next decade — invite-curated,
              capacity-capped, deliberately quiet.
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={300}>
            <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <Link
                href="#events"
                className="group inline-flex items-center gap-2 px-7 sm:px-8 py-[14px] sm:py-[15px] rounded-full font-bold text-[14px] sm:text-[15px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_12px_30px_-10px_rgba(0,113,227,0.6)]"
              >
                See upcoming events
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/memberships"
                className="lf-glass inline-flex items-center px-6 sm:px-7 py-[13px] sm:py-[14px] rounded-full font-bold text-[14px] sm:text-[15px] text-[#1d1d1f] transition-all duration-200"
              >
                Apply for membership
              </Link>
            </div>
          </AnimateOnScroll>

          {/* Stats — wrap on small screens */}
          <AnimateOnScroll animation="fade-up" delay={380}>
            <div className="mt-9 sm:mt-11 flex flex-wrap items-stretch justify-center gap-3">
              <HeroStat value={upcoming.length} label={upcoming.length === 1 ? "Event upcoming" : "Events upcoming"} />
              <HeroStat value={past.length} label="Editions delivered" />
              <HeroStat value="30+" label="Countries" />
            </div>
          </AnimateOnScroll>
        </div>

        {/* Framed hero photograph */}
        <AnimateOnScroll animation="fade-up" delay={440}>
          <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 mt-12 sm:mt-14">
            <div className="lf-glass rounded-[20px] sm:rounded-[28px] p-1.5 sm:p-2.5">
              <div className="relative aspect-[16/10] sm:aspect-[16/8] rounded-[14px] sm:rounded-[20px] overflow-hidden">
                <Image
                  src={HERO_IMAGE}
                  alt="The GCC Leadership Conclave"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 1100px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <div className="absolute bottom-3.5 left-4 sm:bottom-5 sm:left-6 lf-glass-dark rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5">
                  <span className="text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.14em] text-white">
                    The GCC Leadership Conclave
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ══════════════ UPCOMING EVENTS ══════════════ */}
      <section
        id="events"
        className="relative bg-[#f5f5f7] py-16 sm:py-20 lg:py-28 overflow-hidden scroll-mt-24"
      >
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 50% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
              "radial-gradient(50% 56% at 88% 96%, rgba(0,113,227,0.09) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-10 sm:mb-12">
              <div>
                <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
                  Programme {new Date().getFullYear()}
                </span>
                <h2 className="mt-3 sm:mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
                  {upcoming.length === 0
                    ? "No public events listed yet"
                    : upcoming.length === 1
                      ? "The next conclave"
                      : `${upcoming.length} upcoming events`}
                </h2>
              </div>
              {past.length > 0 && (
                <Link
                  href="/archive"
                  className="lf-glass inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-bold text-[#1d1d1f] hover:gap-2.5 transition-all duration-200"
                >
                  Browse the archive <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </AnimateOnScroll>

          {lead ? (
            <div className="space-y-6">
              <AnimateOnScroll animation="fade-up">
                <LeadEventCard event={lead} />
              </AnimateOnScroll>
              {rest.length > 0 && (
                <StaggerChildren animation="fade-up" stagger={80}>
                  <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
                    {rest.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </StaggerChildren>
              )}
            </div>
          ) : (
            <AnimateOnScroll animation="fade-up">
              <NotifyCard />
            </AnimateOnScroll>
          )}
        </div>
      </section>

      {/* ══════════════ WHY LEADERS SHOW UP ══════════════ */}
      <section className="relative bg-white py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(56% 48% at 50% 0%, rgba(0,113,227,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up" className="max-w-2xl mb-10 sm:mb-14">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              Why Leaders Show Up
            </span>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              Not a conference. A room.
            </h2>
          </AnimateOnScroll>

          <StaggerChildren
            animation="fade-up"
            stagger={90}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5"
          >
            {VALUE_PROPS.map((vp) => (
              <div
                key={vp.title}
                className="lf-glass rounded-[24px] p-7 sm:p-8 transition-all duration-300 hover:-translate-y-1.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#0071e3] flex items-center justify-center mb-5 shadow-[0_10px_24px_-8px_rgba(0,113,227,0.6)]">
                  <vp.Icon size={22} strokeWidth={1.8} className="text-white" />
                </div>
                <h3 className="text-[18px] font-bold text-[#1d1d1f] mb-2.5 tracking-[-0.015em]">
                  {vp.title}
                </h3>
                <p className="text-[14px] text-[#1d1d1f]/60 leading-[1.7]">
                  {vp.body}
                </p>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section className="relative bg-[#f5f5f7] py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 50% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
              "radial-gradient(52% 56% at 90% 96%, rgba(0,113,227,0.09) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up" className="max-w-2xl mb-10 sm:mb-14">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              From the Room
            </span>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              What leaders say after
            </h2>
          </AnimateOnScroll>

          <StaggerChildren
            animation="fade-up"
            stagger={90}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="lf-glass rounded-[26px] p-7 sm:p-8 flex flex-col">
                <Quote size={26} className="text-[#0071e3] mb-5" fill="currentColor" />
                <blockquote className="text-[16px] sm:text-[17px] leading-[1.6] text-[#1d1d1f]/85 font-medium flex-1">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-6 pt-5 border-t border-black/[0.07]">
                  <p className="text-[14px] font-bold text-[#1d1d1f]">{t.name}</p>
                  <p className="text-[12.5px] text-[#1d1d1f]/55 mt-0.5">{t.role}</p>
                </figcaption>
              </figure>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ══════════════ FAQ ══════════════ */}
      <section className="relative bg-white py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up" className="text-center mb-10 sm:mb-12">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              Frequently Asked
            </span>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              Before you ask
            </h2>
          </AnimateOnScroll>

          <StaggerChildren className="space-y-3" animation="fade-up" stagger={60}>
            {FAQ.map((row) => (
              <details key={row.q} className="group lf-glass rounded-[18px] overflow-hidden">
                <summary className="flex items-start justify-between gap-4 sm:gap-5 px-5 sm:px-6 py-5 cursor-pointer list-none select-none">
                  <span className="text-[14.5px] sm:text-[15.5px] font-semibold text-[#1d1d1f] leading-snug">
                    {row.q}
                  </span>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#0071e3]/[0.1] text-[#0071e3] group-open:rotate-45 transition-transform duration-300 shrink-0">
                    <Plus size={15} strokeWidth={2.2} />
                  </span>
                </summary>
                <p className="px-5 sm:px-6 pb-6 text-[13.5px] sm:text-[14px] leading-[1.75] text-[#1d1d1f]/65">
                  {row.a}
                </p>
              </details>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ══════════════ CLOSING CTA ══════════════ */}
      <section id="notify" className="relative bg-[#f5f5f7] py-16 sm:py-20 lg:py-28 overflow-hidden scroll-mt-24">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 56% at 50% 100%, rgba(0,113,227,0.12) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up">
            <div className="lf-glass-strong rounded-[28px] sm:rounded-[32px] p-8 sm:p-12 lg:p-16">
              <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-center">
                <div>
                  <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
                    Stay in the Room
                  </span>
                  <h2 className="mt-4 text-[clamp(1.7rem,3.6vw,2.8rem)] font-bold text-[#1d1d1f] tracking-[-0.03em] leading-[1.1]">
                    Be first to know when an event opens
                  </h2>
                  <p className="mt-4 text-[#1d1d1f]/60 text-[14px] sm:text-[15px] leading-relaxed">
                    We open registrations 90 days out. Subscribers get the date,
                    agenda and invitation a week before public release.
                  </p>
                </div>
                <div>
                  <form action="/api/builder-form" method="post" className="flex flex-col gap-2.5">
                    <label className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1d1d1f]/35" />
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="you@company.com"
                        className="w-full h-12 pl-11 pr-4 rounded-full bg-white border border-black/[0.08] text-[#1d1d1f] placeholder:text-[#1d1d1f]/40 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 transition-all"
                      />
                    </label>
                    <button
                      type="submit"
                      className="group inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-[#0071e3] text-white text-[14px] font-bold hover:bg-[#0077ed] transition-all duration-200 shadow-[0_12px_30px_-10px_rgba(0,113,227,0.6)]"
                    >
                      Notify me
                      <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                  <p className="text-[11px] text-[#1d1d1f]/40 mt-3 leading-relaxed">
                    No spam. Unsubscribe in one click — a maximum of 6 emails per year.
                  </p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  )
}

/* ════════════════════════════════════════════════════════════════════
 * Sub-components
 * ════════════════════════════════════════════════════════════════════ */

type EventRow = {
  id: string
  title: string
  slug: string | null
  start_date: string
  end_date: string | null
  venue: string | null
  description: string | null
  cover_image_url: string | null
  thumbnail_url?: string | null
  status: string
  speakers?: Array<{ id: string }> | null
  tickets?: Array<{ id: string }> | null
}

function HeroStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="lf-glass rounded-2xl px-5 sm:px-7 py-3.5 sm:py-4 text-center min-w-[100px]">
      <p className="text-[24px] sm:text-[30px] font-bold leading-none text-[#1d1d1f] tabular-nums tracking-[-0.03em]">
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#1d1d1f]/50 mt-1.5 font-semibold">
        {label}
      </p>
    </div>
  )
}

/** The soonest upcoming event — a wide showpiece card. Stacks on mobile. */
function LeadEventCard({ event }: { event: EventRow }) {
  const slug = (event.slug ?? "").trim()
  const days = getDaysUntil(event.start_date)
  const cover = event.thumbnail_url || event.cover_image_url
  const speakerCount = Array.isArray(event.speakers) ? event.speakers.length : 0

  return (
    <div className="lf-glass-strong rounded-[24px] sm:rounded-[30px] overflow-hidden shadow-[0_40px_90px_-40px_rgba(0,0,0,0.4)]">
      <div className="grid lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[420px] bg-[#0a0a14]">
          {cover && (
            <Image
              src={cover}
              alt={event.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14]/55 via-transparent to-transparent" />
          <span className="absolute top-4 left-4 sm:top-5 sm:left-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#1d1d1f] text-[10px] font-bold uppercase tracking-[0.14em] shadow-lg">
            <Star size={11} strokeWidth={2} className="text-[#0071e3] fill-[#0071e3]" />
            Next Event
          </span>
          <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 flex items-center gap-2.5 sm:gap-3">
            <div className="bg-white rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 text-center shadow-lg">
              <p className="text-[9px] sm:text-[10px] font-bold text-[#0071e3] uppercase tracking-wider leading-none">
                {fmtMonth(event.start_date)}
              </p>
              <p className="text-[20px] sm:text-[24px] font-bold text-[#1d1d1f] leading-none mt-0.5 tabular-nums">
                {fmtDay(event.start_date)}
              </p>
            </div>
            {days > 0 && (
              <span className="lf-glass-dark rounded-full px-3.5 py-2 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-white">
                {days} {days === 1 ? "day" : "days"} away
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-7 sm:p-10 lg:p-12 flex flex-col justify-center">
          <h3 className="text-[clamp(1.5rem,3vw,2.3rem)] font-bold text-[#1d1d1f] tracking-[-0.03em] leading-[1.1]">
            {event.title}
          </h3>
          {event.description && (
            <p className="mt-3.5 text-[14px] text-[#1d1d1f]/60 leading-[1.7] line-clamp-3">
              {event.description}
            </p>
          )}
          <ul className="mt-5 space-y-2.5 text-[13.5px] text-[#1d1d1f]/70">
            <li className="flex items-center gap-2.5">
              <Calendar size={15} className="text-[#0071e3] shrink-0" />
              {fmtDate(event.start_date)}
              {event.end_date && event.end_date !== event.start_date && ` — ${fmtDate(event.end_date)}`}
            </li>
            {event.venue && (
              <li className="flex items-center gap-2.5">
                <MapPin size={15} className="text-[#0071e3] shrink-0" />
                {event.venue}
              </li>
            )}
            {speakerCount > 0 && (
              <li className="flex items-center gap-2.5">
                <Mic2 size={15} className="text-[#0071e3] shrink-0" />
                {speakerCount} speaker{speakerCount === 1 ? "" : "s"} confirmed
              </li>
            )}
          </ul>
          <div className="mt-7 flex flex-wrap gap-2.5 sm:gap-3">
            <Link
              href={`/events/${slug}#tickets`}
              className="group inline-flex items-center gap-2 px-7 py-[14px] rounded-full font-bold text-[14px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_14px_34px_-12px_rgba(0,113,227,0.7)]"
            >
              Register Now
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={`/events/${slug}`}
              className="inline-flex items-center px-6 py-[14px] rounded-full font-bold text-[14px] text-[#1d1d1f] bg-white border border-black/[0.08] hover:border-black/20 transition-all duration-200"
            >
              Full details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function EventCard({ event }: { event: EventRow }) {
  const slug = (event.slug ?? "").trim()
  const speakerCount = Array.isArray(event.speakers) ? event.speakers.length : 0
  const ticketCount = Array.isArray(event.tickets) ? event.tickets.length : 0
  const days = getDaysUntil(event.start_date)
  const cover = event.thumbnail_url || event.cover_image_url

  return (
    <Link
      href={`/events/${slug}`}
      className="lf-glass group block rounded-[22px] overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
    >
      <div className="relative aspect-[16/9] bg-[#0a0a14] overflow-hidden">
        {cover && (
          <Image
            src={cover}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14]/55 to-transparent" />
        <span className="absolute top-4 right-4 inline-flex items-center px-2.5 py-1 rounded-full bg-white text-[#1d1d1f] text-[11px] font-bold tabular-nums shadow">
          {days}d
        </span>
        <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 text-white text-[12px] font-bold uppercase tracking-wider">
          <Calendar size={12} className="text-[#4c9df2]" />
          {fmtDateShort(event.start_date)}
          {event.end_date && event.end_date !== event.start_date && ` – ${fmtDateShort(event.end_date)}`}
        </div>
      </div>
      <div className="p-6 sm:p-7">
        <h3 className="text-[19px] sm:text-[21px] font-bold leading-tight text-[#1d1d1f] tracking-[-0.02em] mb-2.5 line-clamp-2">
          {event.title}
        </h3>
        {event.description && (
          <p className="text-[13.5px] text-[#1d1d1f]/60 leading-relaxed line-clamp-2 mb-5">
            {event.description}
          </p>
        )}
        <div className="flex items-center justify-between pt-5 border-t border-black/[0.07]">
          <div className="flex items-center gap-3.5 text-[12px] text-[#1d1d1f]/55">
            {event.venue && (
              <span className="inline-flex items-center gap-1.5 truncate max-w-[140px]" title={event.venue}>
                <MapPin size={12} className="text-[#0071e3] shrink-0" />
                <span className="truncate">{event.venue}</span>
              </span>
            )}
            {speakerCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Mic2 size={12} className="text-[#0071e3]" /> {speakerCount}
              </span>
            )}
            {ticketCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Ticket size={12} className="text-[#0071e3]" /> {ticketCount}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#0071e3] group-hover:gap-2.5 transition-all">
            View <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  )
}

function NotifyCard() {
  return (
    <div className="lf-glass-strong rounded-[28px] p-10 sm:p-14 lg:p-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#0071e3] flex items-center justify-center mx-auto mb-6 shadow-[0_14px_32px_-10px_rgba(0,113,227,0.7)]">
        <Sparkles size={28} className="text-white" />
      </div>
      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0071e3] mb-2">
        Programme in Build
      </p>
      <h3 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-[#1d1d1f] tracking-[-0.025em] mb-3">
        The next conclave is being curated
      </h3>
      <p className="text-[15px] text-[#1d1d1f]/60 max-w-md mx-auto leading-relaxed mb-7">
        We open registrations 90 days before each event. Join the early-access
        list and you&apos;ll be the first to hear when dates are confirmed.
      </p>
      <Link
        href="#notify"
        className="inline-flex items-center gap-2 px-7 py-[14px] rounded-full text-[14px] font-bold text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_14px_34px_-12px_rgba(0,113,227,0.7)]"
      >
        <Bell size={15} /> Notify me
      </Link>
    </div>
  )
}
