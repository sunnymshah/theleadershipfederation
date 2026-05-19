/**
 * /events — public events landing.
 *
 * A full-bleed cinematic hero with floating liquid-glass, then a fully
 * re-imagined body: an editorial programme list of wide glass event
 * rows, numbered value cards, a featured-quote bento, glass FAQ and a
 * glass closing panel. Soft-Monochrome palette, responsive across
 * phone / tablet / desktop. Event data is live from Supabase.
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import Image from "next/image"
import {
  Calendar, MapPin, ArrowRight, Mic2, Ticket, Sparkles,
  Network, Lightbulb, Award, Quote, Bell, Mail, Plus,
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
    quote: "The most substantive room I sit in all year. Conversations get real because the line-up is tight, not theatrical — leaders show up to listen, not perform.",
    name: "K. Subramanian",
    role: "Chairman & Managing Director, Tier-1 GCC",
  },
  {
    quote: "TLF understood the brief that other operators don't. That changes the quality of every dialogue in the room.",
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

  return (
    <main className="bg-white">
      {/* ══════════════ HERO — full-bleed background + liquid glass ══════════════ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#0a0a14]">
        <Image
          src={HERO_IMAGE}
          alt="The GCC Leadership Conclave in session"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-[#0a0a14]/68 to-[#0a0a14]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a14]/90 via-[#0a0a14]/35 to-transparent" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(55% 50% at 14% 88%, rgba(0,113,227,0.34) 0%, transparent 62%)",
          }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-36 pb-20 lg:py-32">
          <div className="grid lg:grid-cols-[1.35fr_1fr] gap-12 lg:gap-14 items-center">
            {/* Left — copy */}
            <div>
              <AnimateOnScroll animation="fade-up">
                <div className="inline-flex items-center gap-2 lf-glass-pill rounded-full px-4 py-1.5 mb-7">
                  <Sparkles size={13} className="text-[#4c9df2]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/85">
                    Leadership Federation Events
                  </span>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={90}>
                <h1 className="text-[clamp(3rem,7.8vw,6.6rem)] font-bold text-white tracking-[-0.05em] leading-[0.93]">
                  Where India&apos;s
                  <br />
                  leadership{" "}
                  <span className="text-[#4c9df2]">converges</span>
                </h1>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={180}>
                <p className="mt-6 text-[15px] sm:text-[18px] leading-relaxed text-white/65 max-w-lg">
                  Closed-room conclaves, summits and policy roundtables for the
                  CXOs, founders and regulators shaping the next decade —
                  invite-curated, capacity-capped, deliberately quiet.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={260}>
                <div className="mt-8">
                  <Link
                    href="/memberships"
                    className="group inline-flex items-center gap-2.5 px-8 sm:px-10 py-[15px] sm:py-[17px] rounded-full font-bold text-[14px] sm:text-[15px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_20px_48px_-12px_rgba(0,113,227,0.9)]"
                  >
                    Apply for Membership
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </AnimateOnScroll>

              {/* Glass stats strip */}
              <AnimateOnScroll animation="fade-up" delay={340}>
                <div className="mt-10 inline-grid grid-cols-3 gap-px rounded-2xl overflow-hidden lf-glass-dark">
                  {([
                    [upcoming.length, upcoming.length === 1 ? "Upcoming" : "Upcoming"],
                    [past.length, "Editions"],
                    ["30+", "Countries"],
                  ] as const).map(([v, l], i) => (
                    <div key={i} className="px-5 sm:px-7 py-4 text-center">
                      <p className="text-[24px] sm:text-[32px] font-bold leading-none text-white tabular-nums tracking-[-0.03em]">
                        {v}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/55 mt-1.5 font-semibold">
                        {l}
                      </p>
                    </div>
                  ))}
                </div>
              </AnimateOnScroll>
            </div>

            {/* Right — floating liquid-glass Next-Event card */}
            <AnimateOnScroll animation="fade-up" delay={220}>
              {lead ? <HeroNextEvent event={lead} /> : <HeroNoEvent />}
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ══════════════ THE PROGRAMME — editorial event rows ══════════════ */}
      <section
        id="programme"
        className="relative bg-[#f5f5f7] py-16 sm:py-20 lg:py-28 overflow-hidden scroll-mt-20"
      >
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 50% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
              "radial-gradient(50% 56% at 90% 96%, rgba(0,113,227,0.09) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-10 sm:mb-12">
              <div>
                <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
                  The Programme · {new Date().getFullYear()}
                </span>
                <h2 className="mt-3 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
                  {upcoming.length === 0
                    ? "Programme in build"
                    : upcoming.length === 1
                      ? "One conclave on the calendar"
                      : `${upcoming.length} conclaves on the calendar`}
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

          {upcoming.length > 0 ? (
            <StaggerChildren animation="fade-up" stagger={90} className="space-y-5">
              {upcoming.map((event, i) => (
                <ProgrammeRow key={event.id} event={event} index={i} />
              ))}
            </StaggerChildren>
          ) : (
            <AnimateOnScroll animation="fade-up">
              <NotifyCard />
            </AnimateOnScroll>
          )}
        </div>
      </section>

      {/* ══════════════ WHY LEADERS SHOW UP — numbered glass cards ══════════════ */}
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
            {VALUE_PROPS.map((vp, i) => (
              <div
                key={vp.title}
                className="lf-glass relative rounded-[24px] p-7 sm:p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
              >
                <span className="absolute -top-3 -right-1 text-[110px] font-bold text-[#0071e3]/[0.07] leading-none tracking-[-0.05em] select-none">
                  0{i + 1}
                </span>
                <div className="relative">
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
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ══════════════ FROM THE ROOM — featured-quote bento ══════════════ */}
      <section className="relative bg-[#f5f5f7] py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 50% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
              "radial-gradient(52% 56% at 88% 96%, rgba(0,113,227,0.1) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up" className="max-w-2xl mb-10 sm:mb-12">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              From the Room
            </span>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              What leaders say after
            </h2>
          </AnimateOnScroll>

          <div className="grid lg:grid-cols-5 gap-5">
            {/* Featured quote */}
            <AnimateOnScroll animation="fade-up" className="lg:col-span-3">
              <figure className="lf-glass-strong rounded-[28px] p-8 sm:p-11 h-full flex flex-col">
                <Quote size={34} className="text-[#0071e3] mb-5" fill="currentColor" />
                <blockquote className="text-[clamp(1.15rem,2.1vw,1.55rem)] font-semibold text-[#1d1d1f] leading-[1.5] tracking-[-0.015em] flex-1">
                  {TESTIMONIALS[0].quote}
                </blockquote>
                <figcaption className="mt-7 pt-6 border-t border-black/[0.07]">
                  <p className="text-[15px] font-bold text-[#1d1d1f]">{TESTIMONIALS[0].name}</p>
                  <p className="text-[13px] text-[#1d1d1f]/55 mt-0.5">{TESTIMONIALS[0].role}</p>
                </figcaption>
              </figure>
            </AnimateOnScroll>

            {/* Two stacked quotes */}
            <div className="lg:col-span-2 grid sm:grid-cols-2 lg:grid-cols-1 gap-5">
              {TESTIMONIALS.slice(1).map((t, i) => (
                <AnimateOnScroll key={t.name} animation="fade-up" delay={(i + 1) * 90}>
                  <figure className="lf-glass rounded-[24px] p-6 sm:p-7 h-full flex flex-col">
                    <Quote size={20} className="text-[#0071e3] mb-3.5" fill="currentColor" />
                    <blockquote className="text-[14px] text-[#1d1d1f]/80 leading-[1.65] font-medium flex-1">
                      {t.quote}
                    </blockquote>
                    <figcaption className="mt-5 pt-4 border-t border-black/[0.07]">
                      <p className="text-[13.5px] font-bold text-[#1d1d1f]">{t.name}</p>
                      <p className="text-[12px] text-[#1d1d1f]/55 mt-0.5">{t.role}</p>
                    </figcaption>
                  </figure>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
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
      <section id="notify" className="relative bg-[#f5f5f7] py-16 sm:py-20 lg:py-28 overflow-hidden scroll-mt-20">
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

/** Floating liquid-glass "Next Event" card inside the hero. */
function HeroNextEvent({ event }: { event: EventRow }) {
  const slug = (event.slug ?? "").trim()
  const days = getDaysUntil(event.start_date)
  const cover = event.thumbnail_url || event.cover_image_url

  return (
    <div className="lf-glass-panel rounded-[26px] p-3.5 sm:p-4">
      <div className="relative aspect-[16/10] rounded-[18px] overflow-hidden bg-[#0a0a14]">
        {cover && (
          <Image
            src={cover}
            alt={event.title}
            fill
            sizes="(max-width: 1024px) 100vw, 420px"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14]/60 to-transparent" />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[#1d1d1f] text-[9.5px] font-bold uppercase tracking-[0.14em]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse" />
          Next Event
        </span>
        {days > 0 && (
          <span className="absolute bottom-3 right-3 lf-glass-dark rounded-full px-3 py-1.5 text-[11px] font-bold text-white tabular-nums">
            {days} {days === 1 ? "day" : "days"} away
          </span>
        )}
      </div>
      <div className="px-2 pt-4 pb-1.5">
        <h3 className="text-[18px] font-bold text-white leading-[1.2] tracking-[-0.015em] line-clamp-2">
          {event.title}
        </h3>
        <div className="mt-3 space-y-1.5 text-[12.5px] text-white/65">
          <p className="flex items-center gap-2">
            <Calendar size={13} className="text-[#4c9df2] shrink-0" />
            {fmtDate(event.start_date)}
          </p>
          {event.venue && (
            <p className="flex items-center gap-2">
              <MapPin size={13} className="text-[#4c9df2] shrink-0" />
              <span className="truncate">{event.venue}</span>
            </p>
          )}
        </div>
        <Link
          href={`/events/${slug}#tickets`}
          className="group mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[#0071e3] text-white text-[13.5px] font-bold hover:bg-[#0077ed] transition-all duration-200 shadow-[0_12px_28px_-10px_rgba(0,113,227,0.7)]"
        >
          Register Now
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}

function HeroNoEvent() {
  return (
    <div className="lf-glass-panel rounded-[26px] p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#0071e3] flex items-center justify-center mx-auto mb-5 shadow-[0_12px_28px_-8px_rgba(0,113,227,0.7)]">
        <Sparkles size={24} className="text-white" />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#4c9df2] mb-1.5">
        Programme in Build
      </p>
      <h3 className="text-[19px] font-bold text-white leading-tight mb-2">
        The next conclave is being curated
      </h3>
      <p className="text-[13px] text-white/60 leading-relaxed mb-5">
        Join the early-access list to hear the moment dates are confirmed.
      </p>
      <Link
        href="#notify"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071e3] text-white text-[13px] font-bold hover:bg-[#0077ed] transition-all duration-200"
      >
        <Bell size={13} /> Notify me
      </Link>
    </div>
  )
}

/** Wide editorial programme row — the whole row is one link to the event. */
function ProgrammeRow({ event, index }: { event: EventRow; index: number }) {
  const slug = (event.slug ?? "").trim()
  const days = getDaysUntil(event.start_date)
  const cover = event.thumbnail_url || event.cover_image_url
  const speakerCount = Array.isArray(event.speakers) ? event.speakers.length : 0
  const ticketCount = Array.isArray(event.tickets) ? event.tickets.length : 0

  return (
    <Link
      href={`/events/${slug}`}
      className="lf-glass group block rounded-[26px] overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-[0_34px_80px_-44px_rgba(10,10,20,0.5)]"
    >
      <div className="grid sm:grid-cols-[260px_1fr] lg:grid-cols-[348px_1fr]">
        {/* Image */}
        <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-[272px] bg-[#0a0a14]">
          {cover && (
            <Image
              src={cover}
              alt={event.title}
              fill
              sizes="(max-width: 640px) 100vw, 348px"
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14]/60 to-transparent" />
          <div className="absolute top-4 left-4 bg-white rounded-xl px-3 py-1.5 text-center shadow-lg">
            <p className="text-[9px] font-bold text-[#0071e3] uppercase tracking-wider leading-none">
              {fmtMonth(event.start_date)}
            </p>
            <p className="text-[22px] font-bold text-[#1d1d1f] leading-none mt-0.5 tabular-nums">
              {fmtDay(event.start_date)}
            </p>
          </div>
          {index === 0 && (
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0071e3] text-white text-[9.5px] font-bold uppercase tracking-[0.16em]">
              <Sparkles size={10} /> Next Conclave
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
          <h3 className="text-[clamp(1.35rem,2.5vw,1.95rem)] font-bold text-[#1d1d1f] tracking-[-0.03em] leading-[1.12] line-clamp-2">
            {event.title}
          </h3>
          {event.description && (
            <p className="mt-3 text-[13.5px] text-[#1d1d1f]/60 leading-[1.65] line-clamp-2">
              {event.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-[#1d1d1f]/65">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-[#0071e3]" />
              {fmtDate(event.start_date)}
            </span>
            {event.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-[#0071e3]" />
                {event.venue}
              </span>
            )}
            {speakerCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Mic2 size={13} className="text-[#0071e3]" />
                {speakerCount} speaker{speakerCount === 1 ? "" : "s"}
              </span>
            )}
            {ticketCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Ticket size={13} className="text-[#0071e3]" />
                {ticketCount} ticket type{ticketCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <div className="mt-6 pt-5 border-t border-black/[0.07] flex items-center justify-between">
            {days > 0 ? (
              <span className="text-[12px] font-bold text-[#1d1d1f]/45 uppercase tracking-[0.12em] tabular-nums">
                {days} {days === 1 ? "day" : "days"} away
              </span>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[#0071e3] group-hover:gap-2.5 transition-all duration-200">
              View event <ArrowRight size={15} />
            </span>
          </div>
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
