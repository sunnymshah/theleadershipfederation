/**
 * /events — public events landing.
 *
 * Editorial redesign: asymmetric hero (text + featured event preview side-by-side
 * at lg+), value-props strip, cleaner upcoming-event grid, testimonials carousel,
 * year-grouped past events timeline, FAQ, and a closing CTA. Generous whitespace,
 * Playfair Display for headlines, no button collisions — every element owns
 * its own row/column.
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import Image from "next/image"
import {
  Calendar, MapPin, ArrowRight, Mic2, Ticket, Sparkles,
  Network, Lightbulb, Award,
  Quote, Bell, Mail, Plus, Star,
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
function fmtYear(d: string) {
  return new Date(d).getFullYear().toString()
}
function getDaysUntil(d: string) {
  const diff = new Date(d).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/* Display fonts — keep inline so we don't depend on a CSS import.
 * The site already loads Playfair Display via the marketing layout. */
const serifFont = { fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif" }
const sansFont  = { fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }

/* Editorial value props for the "Why attend" strip. */
const VALUE_PROPS = [
  {
    Icon: Network,
    title: "Curated Network",
    body: "Closed-door rooms with chairmen, founders, regulators, and operators — invite-only by design.",
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

/* Editorial testimonial set. Hardcoded for now; admin-managed
 * testimonials can swap into this slot later via an action. */
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

/* Editorial FAQ. Light, focused on attendance logistics. */
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

export default async function EventsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, slug, start_date, end_date, venue, description, cover_image_url, status, speakers(id), tickets(id)",
    )
    .eq("status", "published")
    .order("start_date", { ascending: true })

  const now = new Date()
  const allEvents = events ?? []
  const upcoming = allEvents.filter((e) => new Date(e.start_date) >= now)
  const past = allEvents.filter((e) => new Date(e.start_date) < now)

  // Featured = nearest upcoming. Other upcoming render in the grid.
  const featured = upcoming[0] ?? null
  const otherUpcoming = upcoming.slice(1)

  // Group past events by year, newest year first.
  const pastByYear = past.reduce<Record<string, typeof past>>((acc, e) => {
    const y = fmtYear(e.start_date)
    if (!acc[y]) acc[y] = []
    acc[y].push(e)
    return acc
  }, {})
  const pastYears = Object.keys(pastByYear).sort((a, b) => Number(b) - Number(a))

  return (
    <main className="min-h-screen bg-white text-[#1a1a2e]">

      {/* ════════════════════════════════════════════════════════════
       * HERO — editorial, asymmetric. Text on the left, featured-event
       * preview card on the right. Calm, confident, no clutter.
       * ════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background art — subtle topographic feel via two layered radials. */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 90% 60% at 0% 0%, rgba(231,171,28,0.05) 0%, transparent 60%)," +
              "radial-gradient(ellipse 80% 50% at 100% 100%, rgba(26,26,46,0.04) 0%, transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #1a1a2e 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-14 pb-16 sm:pt-24 sm:pb-24 lg:pt-32 lg:pb-32">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* TEXT COLUMN */}
            <div className="lg:col-span-7">
              <AnimateOnScroll animation="fade-up">
                <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#1a1a2e]/55 mb-7">
                  <span className="inline-block w-8 h-px bg-[#e7ab1c]" />
                  Leadership Federation Events
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={80}>
                <h1
                  className="text-[44px] sm:text-[64px] lg:text-[80px] leading-[0.98] font-medium text-[#1a1a2e] tracking-tight mb-7"
                  style={serifFont}
                >
                  Where India&apos;s
                  <br />
                  leadership
                  <br />
                  <span className="italic text-[#1a1a2e]/85">converges.</span>
                </h1>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={160}>
                <p className="text-[17px] sm:text-[19px] leading-relaxed text-[#1a1a2e]/65 max-w-xl mb-10">
                  Closed-room conclaves, summits, and policy roundtables for the
                  CXOs, founders, and regulators shaping the next decade of
                  industry. Invite-curated, capacity-capped, deliberately quiet.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={240}>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                  <Link
                    href="/memberships"
                    className="group inline-flex items-center gap-2 px-6 h-11 rounded-md bg-[#1a1a2e] text-white text-[13px] font-semibold tracking-wide hover:bg-[#2a2a4e] transition-colors"
                  >
                    Apply for membership
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 h-11 text-[13px] font-medium text-[#1a1a2e]/70 hover:text-[#1a1a2e] border-b border-transparent hover:border-[#1a1a2e]/30 transition-colors"
                  >
                    Speak with the programme team
                  </Link>
                </div>
              </AnimateOnScroll>

              {/* Quiet stats row */}
              <AnimateOnScroll animation="fade-up" delay={320}>
                <div className="mt-14 grid grid-cols-3 gap-6 max-w-md">
                  <Stat value={upcoming.length} label={upcoming.length === 1 ? "Event upcoming" : "Events upcoming"} />
                  <Stat value={past.length} label="Editions delivered" />
                  <Stat value="30+" label="Countries represented" />
                </div>
              </AnimateOnScroll>
            </div>

            {/* FEATURED EVENT — vertical card on the right */}
            <div className="lg:col-span-5">
              {featured ? (
                <AnimateOnScroll animation="fade-up" delay={140}>
                  <FeaturedEventCard event={featured} />
                </AnimateOnScroll>
              ) : (
                <AnimateOnScroll animation="fade-up" delay={140}>
                  <div className="rounded-3xl border border-[#1a1a2e]/10 bg-white p-8 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-[#e7ab1c]/8 border border-[#e7ab1c]/15 flex items-center justify-center mx-auto mb-5">
                      <Sparkles size={28} className="text-[#e7ab1c]" />
                    </div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1a1a2e]/55 mb-2">
                      Programme in build
                    </p>
                    <h3 className="text-xl font-semibold text-[#1a1a2e] mb-2" style={serifFont}>
                      Next conclave being curated
                    </h3>
                    <p className="text-[14px] text-[#1a1a2e]/60 max-w-xs mx-auto leading-relaxed">
                      We open registrations 90 days before each event. Get on
                      the early-access list to be notified.
                    </p>
                    <Link
                      href="#notify"
                      className="inline-flex items-center gap-2 mt-6 px-5 h-10 rounded-md text-[13px] font-semibold border border-[#1a1a2e]/15 hover:border-[#e7ab1c] hover:text-[#e7ab1c] transition-colors"
                    >
                      <Bell size={13} /> Notify me
                    </Link>
                  </div>
                </AnimateOnScroll>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
       * WHY ATTEND — three editorial value props
       * ════════════════════════════════════════════════════════════ */}
      <section className="border-y border-[#1a1a2e]/[0.06] bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-16 sm:py-20">
          <AnimateOnScroll animation="fade-up">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#1a1a2e]/55 mb-10 flex items-center gap-3">
              <span className="inline-block w-8 h-px bg-[#e7ab1c]" />
              Why leaders show up
            </p>
          </AnimateOnScroll>
          <div className="grid sm:grid-cols-3 gap-10 sm:gap-14">
            {VALUE_PROPS.map((vp, i) => (
              <AnimateOnScroll key={vp.title} animation="fade-up" delay={i * 80}>
                <div>
                  <vp.Icon
                    size={26}
                    strokeWidth={1.4}
                    className="text-[#e7ab1c] mb-5"
                  />
                  <h3 className="text-[22px] font-semibold text-[#1a1a2e] mb-3 leading-tight" style={serifFont}>
                    {vp.title}
                  </h3>
                  <p className="text-[15px] text-[#1a1a2e]/65 leading-relaxed">
                    {vp.body}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
       * UPCOMING EVENTS GRID
       * ════════════════════════════════════════════════════════════ */}
      <section
        id="upcoming"
        className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-20 sm:py-28 scroll-mt-24"
      >
        <AnimateOnScroll animation="fade-up">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 mb-12">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#1a1a2e]/55 mb-3 flex items-center gap-3">
                <span className="inline-block w-8 h-px bg-[#e7ab1c]" />
                Programme {new Date().getFullYear()}
              </p>
              <h2 className="text-[34px] sm:text-[44px] font-medium text-[#1a1a2e] leading-tight" style={serifFont}>
                {upcoming.length === 0
                  ? "No public events listed at the moment."
                  : upcoming.length === 1
                    ? "One upcoming event."
                    : `${upcoming.length} upcoming events.`}
              </h2>
            </div>
            {past.length > 0 && (
              <Link
                href="/archive"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1a1a2e]/75 hover:text-[#e7ab1c] transition-colors"
              >
                Browse the archive
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </AnimateOnScroll>

        {otherUpcoming.length > 0 ? (
          <StaggerChildren animation="fade-up" stagger={80}>
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {otherUpcoming.map((event) => (
                <UpcomingEventCard key={event.id} event={event} />
              ))}
            </div>
          </StaggerChildren>
        ) : upcoming.length > 0 ? (
          <p className="text-[15px] text-[#1a1a2e]/55 max-w-xl">
            Featured above is the next confirmed event. Additional events for
            this season will be announced as the programme is finalised — get
            on the notify list to be alerted first.
          </p>
        ) : (
          <EmptyUpcoming />
        )}
      </section>

      {/* ════════════════════════════════════════════════════════════
       * TESTIMONIALS
       * ════════════════════════════════════════════════════════════ */}
      <section className="bg-[#1a1a2e] text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-20 sm:py-28">
          <AnimateOnScroll animation="fade-up">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#e7ab1c]/85 mb-10 flex items-center gap-3">
              <span className="inline-block w-8 h-px bg-[#e7ab1c]/40" />
              From the room
            </p>
          </AnimateOnScroll>
          <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">
            {TESTIMONIALS.map((t, i) => (
              <AnimateOnScroll key={i} animation="fade-up" delay={i * 80}>
                <figure>
                  <Quote size={22} className="text-[#e7ab1c] mb-6" strokeWidth={1.4} />
                  <blockquote
                    className="text-[19px] sm:text-[21px] leading-[1.55] text-white/90 mb-7"
                    style={serifFont}
                  >
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="text-[13px]">
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-white/55 mt-0.5">{t.role}</p>
                  </figcaption>
                </figure>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
       * PAST EVENTS — year-grouped editorial timeline
       * ════════════════════════════════════════════════════════════ */}
      {pastYears.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-20 sm:py-28">
          <AnimateOnScroll animation="fade-up">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 mb-14">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#1a1a2e]/55 mb-3 flex items-center gap-3">
                  <span className="inline-block w-8 h-px bg-[#e7ab1c]" />
                  Recent editions
                </p>
                <h2 className="text-[34px] sm:text-[44px] font-medium text-[#1a1a2e] leading-tight" style={serifFont}>
                  Where we&apos;ve gathered.
                </h2>
              </div>
              <Link
                href="/archive"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1a1a2e]/75 hover:text-[#e7ab1c] transition-colors"
              >
                Full archive
                <ArrowRight size={14} />
              </Link>
            </div>
          </AnimateOnScroll>

          <div className="space-y-16 sm:space-y-20">
            {pastYears.map((year) => (
              <AnimateOnScroll key={year} animation="fade-up">
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                  <div className="lg:col-span-3">
                    <p
                      className="text-[64px] sm:text-[80px] font-medium leading-none text-[#1a1a2e]/15 select-none"
                      style={serifFont}
                    >
                      {year}
                    </p>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1a1a2e]/55 mt-3">
                      {pastByYear[year].length} {pastByYear[year].length === 1 ? "edition" : "editions"}
                    </p>
                  </div>
                  <div className="lg:col-span-9 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastByYear[year].map((event) => (
                      <PastEventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════
       * FAQ
       * ════════════════════════════════════════════════════════════ */}
      <section className="border-t border-[#1a1a2e]/[0.06] bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-14 py-20 sm:py-28">
          <AnimateOnScroll animation="fade-up">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#1a1a2e]/55 mb-3 flex items-center gap-3">
              <span className="inline-block w-8 h-px bg-[#e7ab1c]" />
              Frequently asked
            </p>
            <h2 className="text-[34px] sm:text-[44px] font-medium text-[#1a1a2e] leading-tight mb-12" style={serifFont}>
              Before you ask.
            </h2>
          </AnimateOnScroll>
          <div className="divide-y divide-[#1a1a2e]/10">
            {FAQ.map((row, i) => (
              <AnimateOnScroll key={i} animation="fade-up" delay={i * 60}>
                <details className="group py-6">
                  <summary className="flex items-start justify-between gap-6 cursor-pointer list-none">
                    <span className="text-[18px] sm:text-[20px] font-semibold text-[#1a1a2e] leading-snug" style={serifFont}>
                      {row.q}
                    </span>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#1a1a2e]/15 text-[#1a1a2e]/60 group-open:rotate-45 transition-transform shrink-0 mt-0.5">
                      <Plus size={14} strokeWidth={1.5} />
                    </span>
                  </summary>
                  <p className="mt-4 text-[15px] leading-relaxed text-[#1a1a2e]/70 max-w-3xl">
                    {row.a}
                  </p>
                </details>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
       * CLOSING CTA
       * ════════════════════════════════════════════════════════════ */}
      <section id="notify" className="bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-20 sm:py-28">
          <div className="rounded-[28px] bg-[#1a1a2e] text-white p-10 sm:p-16 lg:p-20 relative overflow-hidden">
            {/* Decorative gold arc */}
            <div
              aria-hidden
              className="absolute -right-20 -bottom-20 w-[420px] h-[420px] rounded-full opacity-20 blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(231,171,28,0.6) 0%, transparent 70%)" }}
            />
            <div className="relative grid lg:grid-cols-12 gap-10 lg:gap-16 items-end">
              <div className="lg:col-span-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#e7ab1c] mb-6 flex items-center gap-3">
                  <span className="inline-block w-8 h-px bg-[#e7ab1c]" />
                  Stay in the room
                </p>
                <h2
                  className="text-[36px] sm:text-[48px] lg:text-[58px] leading-[1.05] font-medium mb-6"
                  style={serifFont}
                >
                  Get notified the day a new event opens.
                </h2>
                <p className="text-[16px] sm:text-[17px] text-white/70 leading-relaxed max-w-xl">
                  We open registrations 90 days out. Subscribers get the date,
                  agenda, and invitation a week before public release — no
                  newsletter, just the events themselves.
                </p>
              </div>
              <div className="lg:col-span-5">
                <form
                  action="/api/builder-form"
                  method="post"
                  className="flex flex-col sm:flex-row gap-2 lg:flex-col xl:flex-row"
                >
                  <label className="flex-1 min-w-0 relative">
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="you@company.com"
                      className="w-full h-12 pl-11 pr-4 rounded-md bg-white/[0.06] border border-white/15 text-white placeholder:text-white/35 text-[14px] focus:outline-none focus:border-[#e7ab1c] focus:bg-white/[0.10] transition-colors"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-md bg-[#e7ab1c] text-[#1a1a2e] text-[13px] font-bold tracking-wide hover:bg-[#d49c10] transition-colors whitespace-nowrap"
                  >
                    Notify me
                    <ArrowRight size={14} />
                  </button>
                </form>
                <p className="text-[11px] text-white/40 mt-4 leading-relaxed">
                  No spam. Unsubscribe in one click. We email a maximum of 6
                  times per year.
                </p>
              </div>
            </div>
          </div>
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
  status: string
  speakers?: Array<{ id: string }> | null
  tickets?: Array<{ id: string }> | null
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="text-[28px] sm:text-[34px] font-medium leading-none text-[#1a1a2e] tabular-nums" style={serifFont}>
        {value}
      </p>
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#1a1a2e]/55 mt-2">
        {label}
      </p>
    </div>
  )
}

function FeaturedEventCard({ event }: { event: EventRow }) {
  const slug = (event.slug ?? "").trim()
  const days = getDaysUntil(event.start_date)
  return (
    <Link
      href={`/events/${slug}`}
      className="group block rounded-[24px] overflow-hidden bg-white border border-[#1a1a2e]/[0.08] shadow-[0_24px_60px_-24px_rgba(26,26,46,0.18)] hover:shadow-[0_32px_80px_-24px_rgba(26,26,46,0.28)] hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Cover */}
      <div className="relative aspect-[5/4] bg-[#1a1a2e]">
        {event.cover_image_url && (
          <Image
            src={event.cover_image_url}
            alt={event.title}
            fill
            priority
            className="object-cover opacity-80 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700 ease-out"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-[#0a0a14]/30 to-transparent" />
        {/* Featured pill */}
        <span className="absolute top-5 left-5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 text-[#1a1a2e] text-[10px] font-bold uppercase tracking-[0.16em]">
          <Star size={10} strokeWidth={2} className="text-[#e7ab1c] fill-[#e7ab1c]" />
          Featured
        </span>
        {/* Date pill */}
        <div className="absolute bottom-5 left-5 flex items-baseline gap-3">
          <div className="bg-white/95 rounded-xl px-3 py-2 text-center min-w-[58px]">
            <p className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-wider leading-none">
              {fmtMonth(event.start_date)}
            </p>
            <p className="text-[24px] font-semibold text-[#1a1a2e] leading-none mt-0.5 tabular-nums" style={serifFont}>
              {fmtDay(event.start_date)}
            </p>
          </div>
          <p className="text-white/90 text-[12px] font-semibold uppercase tracking-wider">
            {days} {days === 1 ? "day" : "days"} away
          </p>
        </div>
      </div>
      {/* Body */}
      <div className="p-7 sm:p-8">
        <h3
          className="text-[26px] sm:text-[28px] font-medium leading-[1.15] text-[#1a1a2e] group-hover:text-[#1a1a2e] mb-4 line-clamp-3"
          style={serifFont}
        >
          {event.title}
        </h3>
        <ul className="space-y-2.5 text-[13px] text-[#1a1a2e]/65 mb-7">
          <li className="flex items-center gap-2.5">
            <Calendar size={13} className="text-[#e7ab1c] shrink-0" />
            {fmtDate(event.start_date)}
            {event.end_date && event.end_date !== event.start_date && ` — ${fmtDate(event.end_date)}`}
          </li>
          {event.venue && (
            <li className="flex items-center gap-2.5">
              <MapPin size={13} className="text-[#e7ab1c] shrink-0" />
              {event.venue}
            </li>
          )}
          {Array.isArray(event.speakers) && event.speakers.length > 0 && (
            <li className="flex items-center gap-2.5">
              <Mic2 size={13} className="text-[#e7ab1c] shrink-0" />
              {event.speakers.length} speaker{event.speakers.length === 1 ? "" : "s"} confirmed
            </li>
          )}
        </ul>
        <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#1a1a2e] group-hover:text-[#e7ab1c] group-hover:gap-3 transition-all">
          Open event page
          <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  )
}

function UpcomingEventCard({ event }: { event: EventRow }) {
  const slug = (event.slug ?? "").trim()
  const speakerCount = Array.isArray(event.speakers) ? event.speakers.length : 0
  const ticketCount  = Array.isArray(event.tickets)  ? event.tickets.length  : 0
  const days = getDaysUntil(event.start_date)

  return (
    <Link
      href={`/events/${slug}`}
      className="group block rounded-[20px] overflow-hidden bg-white border border-[#1a1a2e]/[0.08] hover:border-[#1a1a2e]/20 hover:shadow-[0_20px_60px_-20px_rgba(26,26,46,0.16)] transition-all duration-300"
    >
      {event.cover_image_url && (
        <div className="relative aspect-[16/9] bg-[#1a1a2e] overflow-hidden">
          <Image
            src={event.cover_image_url}
            alt={event.title}
            fill
            className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14]/40 to-transparent" />
          <span className="absolute top-4 right-4 inline-flex items-center px-2.5 py-1 rounded-full bg-white/95 text-[#1a1a2e] text-[11px] font-semibold tabular-nums">
            {days}d
          </span>
          <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 text-white text-[12px] font-semibold uppercase tracking-wider">
            <Calendar size={12} className="text-[#e7ab1c]" />
            {fmtDateShort(event.start_date)}
            {event.end_date && event.end_date !== event.start_date && ` – ${fmtDateShort(event.end_date)}`}
          </div>
        </div>
      )}
      <div className="p-7">
        <h3 className="text-[22px] sm:text-[24px] font-medium leading-tight text-[#1a1a2e] mb-3 line-clamp-2" style={serifFont}>
          {event.title}
        </h3>
        {event.description && (
          <p className="text-[14px] text-[#1a1a2e]/60 leading-relaxed line-clamp-2 mb-5">
            {event.description}
          </p>
        )}
        <div className="flex items-center justify-between pt-5 border-t border-[#1a1a2e]/[0.07]">
          <div className="flex items-center gap-4 text-[12px] text-[#1a1a2e]/55">
            {event.venue && (
              <span className="inline-flex items-center gap-1.5 truncate max-w-[140px]" title={event.venue}>
                <MapPin size={11} className="text-[#1a1a2e]/35 shrink-0" />
                <span className="truncate">{event.venue}</span>
              </span>
            )}
            {speakerCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Mic2 size={11} className="text-[#1a1a2e]/35" /> {speakerCount}
              </span>
            )}
            {ticketCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Ticket size={11} className="text-[#1a1a2e]/35" /> {ticketCount}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1a1a2e]/75 group-hover:text-[#e7ab1c] group-hover:gap-2 transition-all">
            View
            <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  )
}

function PastEventCard({ event }: { event: EventRow }) {
  const slug = (event.slug ?? "").trim()
  return (
    <Link
      href={`/events/${slug}`}
      className="group block rounded-2xl overflow-hidden border border-[#1a1a2e]/[0.08] bg-white hover:border-[#1a1a2e]/20 hover:shadow-[0_12px_40px_-16px_rgba(26,26,46,0.18)] transition-all duration-300"
    >
      {event.cover_image_url ? (
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={event.cover_image_url}
            alt={event.title}
            fill
            className="object-cover grayscale-[0.4] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14]/30 to-transparent" />
        </div>
      ) : (
        <div className="aspect-[16/10] bg-gradient-to-br from-[#1a1a2e]/[0.04] to-[#e7ab1c]/[0.06]" />
      )}
      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1a1a2e]/45 mb-2">
          {fmtDateShort(event.start_date)}
          {event.end_date && event.end_date !== event.start_date && ` – ${fmtDateShort(event.end_date)}`}
        </p>
        <h3 className="text-[16px] font-semibold text-[#1a1a2e] leading-snug line-clamp-2 group-hover:text-[#e7ab1c] transition-colors" style={serifFont}>
          {event.title}
        </h3>
        {event.venue && (
          <p className="text-[12px] text-[#1a1a2e]/55 mt-1.5 truncate" title={event.venue}>
            {event.venue}
          </p>
        )}
      </div>
    </Link>
  )
}

function EmptyUpcoming() {
  return (
    <div className="rounded-3xl border border-dashed border-[#1a1a2e]/15 bg-[#fafafa] p-12 sm:p-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#e7ab1c]/8 border border-[#e7ab1c]/15 flex items-center justify-center mx-auto mb-6">
        <Sparkles size={28} className="text-[#e7ab1c]" />
      </div>
      <h3 className="text-[24px] sm:text-[28px] font-medium text-[#1a1a2e] mb-3" style={serifFont}>
        Programme in build.
      </h3>
      <p className="text-[15px] text-[#1a1a2e]/65 max-w-md mx-auto leading-relaxed mb-7">
        We open public registrations 90 days before each event. Get on the
        notify list — you&apos;ll hear first.
      </p>
      <Link
        href="#notify"
        className="inline-flex items-center gap-2 px-6 h-11 rounded-md text-[13px] font-semibold border border-[#1a1a2e]/15 hover:border-[#e7ab1c] hover:text-[#e7ab1c] transition-colors"
      >
        <Bell size={13} />
        Notify me
      </Link>
    </div>
  )
}
