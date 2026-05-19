import Link from "next/link"
import Image from "next/image"
import {
  CalendarDays,
  Users,
  Mic2,
  ArrowRight,
  Crown,
  Globe,
  Lightbulb,
  Award,
  Lock,
  MessageCircle,
  Sparkles,
  Radio,
  Video,
  TrendingUp,
  BookOpen,
  Star,
  Handshake,
  Gem,
  Trophy,
  Gavel,
  Megaphone,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"
import { getPlatformFeatures } from "@/app/actions/cmsActions"

export const revalidate = 86400

export const metadata = {
  title: "Platforms & Services | The Leadership Federation",
  description:
    "The Leadership Federation's platforms and services — global conclaves, the Inner Circle, The Sunny Shah Show, sponsorship partnerships, executive membership, awards, advisory and bespoke leadership experiences.",
}

/* ── Icon resolver: DB stores icon as string, mapped to Lucide component ── */
const ICON_MAP: Record<string, LucideIcon> = {
  Crown, Globe, Award, Lightbulb, Lock, MessageCircle,
  Users, Sparkles, Radio, TrendingUp, Video, BookOpen,
}
function resolveIcon(name?: string | null): LucideIcon {
  if (!name) return Star
  return ICON_MAP[name] ?? Star
}

type FeatureRow = {
  id: string
  platform: "conclave" | "inner_circle" | "show"
  title: string
  icon: string | null
  sort_order: number
}

/* ── The three platforms ────────────────────────────────────────────── */
const PLATFORMS = [
  {
    key: "conclave" as const,
    icon: CalendarDays,
    image: "/platforms/conclave-stage.jpg",
    eyebrow: "Platform 01",
    title: "Global Conclaves & Summits",
    blurb:
      "India's largest and most influential gatherings of leadership. More than 50 flagship events have convened CXOs, transformation architects, policymakers and innovators for multi-day, immersive experiences that move whole industries.",
    flagship: ["GCC Leadership Conclave", "Asia Leadership Awards", "Bharat Leadership Summit"],
    cta: { label: "Explore Events", href: "/events" },
  },
  {
    key: "inner_circle" as const,
    icon: Crown,
    image: "/platforms/conclave-pune.jpg",
    eyebrow: "Platform 02",
    title: "The Inner Circle",
    blurb:
      "An invite-only membership for leaders who seek more than a conference. Curated peer connections, private roundtables and strategic access to the decision-makers and policymakers shaping the global business landscape.",
    flagship: ["Private Roundtables", "Curated CXO Dinners", "Year-Round Access"],
    cta: { label: "Apply for Membership", href: "/inner-circle" },
  },
  {
    key: "show" as const,
    icon: Mic2,
    image: "/events/asia-leadership-awards.jpg",
    eyebrow: "Platform 03",
    title: "The Sunny Shah Show",
    blurb:
      "A thought-leadership media platform of in-depth interviews with global C-suite executives and visionary leaders — from AI transformation to geopolitical strategy, the conversations defining the future of business.",
    flagship: ["C-Suite Interviews", "Media Spotlights", "Leadership Podcasts"],
    cta: { label: "Watch Episodes", href: "/media" },
  },
]

/* ── The services ───────────────────────────────────────────────────── */
const SERVICES = [
  {
    icon: Handshake,
    title: "Sponsorship & Brand Partnerships",
    desc: "Title, strategic and category partnerships — co-branded activations and meaningful presence in front of a verified room of decision-makers.",
    href: "/partners",
    link: "Partner with us",
  },
  {
    icon: Gem,
    title: "Executive Membership",
    desc: "Tiered membership for CXOs, founders and decision-makers — event credits, a private directory, and year-round leadership opportunities.",
    href: "/memberships",
    link: "View membership tiers",
  },
  {
    icon: Trophy,
    title: "Awards & Recognition",
    desc: "Juried recognition programmes — including the Asia Leadership Awards — that honour the people and institutions raising the bar.",
    href: "/events",
    link: "See the awards",
  },
  {
    icon: Gavel,
    title: "Advisory Board & Jury",
    desc: "Seats at the table that shapes the agenda — advisory counsel and award jury participation alongside the Federation's most senior voices.",
    href: "/advisory-board",
    link: "Meet the board",
  },
  {
    icon: Megaphone,
    title: "Speaker Engagements",
    desc: "A curated speaker bureau — keynote placement and thought-leadership stages for leaders with something real to say.",
    href: "/register?type=speaker",
    link: "Apply to speak",
  },
  {
    icon: Sparkles,
    title: "Bespoke Leadership Experiences",
    desc: "Private convenings designed end-to-end — closed-door roundtables, curated dinners and custom gatherings built around your objective.",
    href: "/contact",
    link: "Start a conversation",
  },
]

/* ── How an engagement works ────────────────────────────────────────── */
const PROCESS = [
  { n: "01", title: "Discover", desc: "We learn your objective — visibility, access, recognition or community." },
  { n: "02", title: "Design", desc: "We match you to the right platform and shape the engagement around it." },
  { n: "03", title: "Convene", desc: "You step into the room — on stage, in the circle, or beside the brand." },
  { n: "04", title: "Compound", desc: "Relationships and reputation built here keep returning value, year on year." },
]

export default async function PlatformsPage() {
  let features: FeatureRow[] = []
  try {
    const res = await getPlatformFeatures(true)
    if (res.success && res.features) features = res.features as FeatureRow[]
  } catch {
    /* empty state */
  }

  return (
    <main>
      {/* ─────────────── Hero ─────────────── */}
      <section className="relative bg-white pt-32 lg:pt-40 pb-16 lg:pb-20 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(58% 56% at 50% 0%, rgba(0,113,227,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              Platforms &amp; Services
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={120}>
            <h1 className="mt-5 text-[clamp(2.6rem,5.4vw,4.4rem)] font-bold text-[#1d1d1f] tracking-[-0.04em] leading-[1.0]">
              One Federation.
              <br />
              <span className="text-[#0071e3]">Every door into leadership.</span>
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={240}>
            <p className="mt-6 text-[17px] lg:text-[19px] text-[#1d1d1f]/60 leading-relaxed max-w-2xl mx-auto">
              Three platforms convene the room. A suite of services lets every
              leader, brand and institution find their place within it.
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={340}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="#platforms"
                className="inline-flex items-center gap-2 px-8 py-[15px] rounded-full font-bold text-[14px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_12px_30px_-10px_rgba(0,113,227,0.6)]"
              >
                The Platforms <ArrowRight size={15} />
              </Link>
              <Link
                href="#services"
                className="lf-glass inline-flex items-center px-7 py-[14px] rounded-full font-bold text-[14px] text-[#1d1d1f] transition-all duration-200"
              >
                The Services
              </Link>
            </div>
          </AnimateOnScroll>
        </div>

        {/* Hero image — a real conclave photograph. */}
        <AnimateOnScroll animation="fade-up" delay={420}>
          <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 mt-14">
            <div className="lf-glass rounded-[28px] p-2 sm:p-2.5">
              <div className="relative aspect-[16/7] rounded-[20px] overflow-hidden">
                <Image
                  src="/platforms/conclave-stage.jpg"
                  alt="The GCC Leadership Conclave in session"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 1100px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-5 sm:bottom-6 sm:left-7 lf-glass-dark rounded-xl px-4 py-2.5">
                  <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.14em] text-white">
                    The GCC Leadership Conclave
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ─────────────── Platforms ─────────────── */}
      <section
        id="platforms"
        className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden scroll-mt-24"
      >
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 50% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
              "radial-gradient(50% 56% at 90% 96%, rgba(0,113,227,0.09) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up" className="max-w-2xl mb-12 lg:mb-14">
            <span className="text-[12px] tracking-[0.2em] uppercase text-[#0071e3] font-semibold">
              The Platforms
            </span>
            <h2 className="mt-4 text-[clamp(2rem,4.2vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.04]">
              Three pillars, one ecosystem
            </h2>
            <p className="mt-4 text-[#1d1d1f]/55 text-[16px] leading-relaxed">
              Each platform stands on its own — together they form the backbone
              of The Leadership Federation.
            </p>
          </AnimateOnScroll>

          <div className="space-y-6">
            {PLATFORMS.map((p, idx) => {
              const Icon = p.icon
              const pFeatures = features.filter((f) => f.platform === p.key)
              return (
                <AnimateOnScroll
                  key={p.key}
                  animation="fade-up"
                  delay={idx * 90}
                >
                  <div className="lf-glass-strong relative rounded-[30px] overflow-hidden">
                    <div className="grid lg:grid-cols-2">
                      {/* Real conclave photograph */}
                      <div
                        className={
                          "relative min-h-[260px] lg:min-h-[480px] " +
                          (idx % 2 === 1 ? "lg:order-2" : "")
                        }
                      >
                        <Image
                          src={p.image}
                          alt={p.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 560px"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                        <span className="absolute top-5 left-5 lf-glass-dark rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                          {p.eyebrow}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
                        <span className="w-14 h-14 rounded-2xl bg-[#0071e3] flex items-center justify-center mb-6 shadow-[0_12px_28px_-8px_rgba(0,113,227,0.65)]">
                          <Icon size={24} className="text-white" strokeWidth={1.7} />
                        </span>
                        <h3 className="text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold text-[#1d1d1f] tracking-[-0.025em] leading-[1.1] mb-4">
                          {p.title}
                        </h3>
                        <p className="text-[15px] text-[#1d1d1f]/65 leading-[1.75] mb-6">
                          {p.blurb}
                        </p>

                        {pFeatures.length > 0 && (
                          <ul className="space-y-2 mb-6">
                            {pFeatures.map((f) => {
                              const FIcon = resolveIcon(f.icon)
                              return (
                                <li key={f.id} className="flex items-start gap-2.5">
                                  <FIcon
                                    size={16}
                                    strokeWidth={2}
                                    className="text-[#0071e3] mt-0.5 shrink-0"
                                  />
                                  <span className="text-[13.5px] text-[#1d1d1f]/70 leading-[1.55]">
                                    {f.title}
                                  </span>
                                </li>
                              )
                            })}
                          </ul>
                        )}

                        <div className="flex flex-wrap gap-2 mb-7">
                          {p.flagship.map((name) => (
                            <span
                              key={name}
                              className="text-[12.5px] font-semibold text-[#0071e3] px-3.5 py-1.5 rounded-full bg-[#0071e3]/[0.08] border border-[#0071e3]/15"
                            >
                              {name}
                            </span>
                          ))}
                        </div>

                        <Link
                          href={p.cta.href}
                          className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#0071e3] hover:gap-2.5 transition-all duration-200"
                        >
                          {p.cta.label} <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </AnimateOnScroll>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─────────────── Services ─────────────── */}
      <section
        id="services"
        className="relative bg-white py-20 lg:py-28 overflow-hidden scroll-mt-24"
      >
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(56% 50% at 50% 0%, rgba(0,113,227,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up" className="max-w-2xl mb-12 lg:mb-14">
            <span className="text-[12px] tracking-[0.2em] uppercase text-[#0071e3] font-semibold">
              The Services
            </span>
            <h2 className="mt-4 text-[clamp(2rem,4.2vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.04]">
              Six ways to engage
            </h2>
            <p className="mt-4 text-[#1d1d1f]/55 text-[16px] leading-relaxed">
              However you want to show up — on stage, beside the brand, or
              inside the circle — there is a service shaped for it.
            </p>
          </AnimateOnScroll>

          <StaggerChildren
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            animation="fade-up"
            stagger={80}
          >
            {SERVICES.map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.title}
                  href={s.href}
                  className="lf-glass group rounded-[24px] p-7 flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                >
                  <span className="w-12 h-12 rounded-2xl bg-[#0071e3]/[0.1] border border-[#0071e3]/15 flex items-center justify-center mb-5 group-hover:bg-[#0071e3] transition-colors duration-300">
                    <Icon
                      size={21}
                      strokeWidth={1.8}
                      className="text-[#0071e3] group-hover:text-white transition-colors duration-300"
                    />
                  </span>
                  <h3 className="text-[17px] font-bold text-[#1d1d1f] tracking-[-0.015em] mb-2.5 leading-[1.25]">
                    {s.title}
                  </h3>
                  <p className="text-[13.5px] text-[#1d1d1f]/60 leading-[1.65] mb-5 flex-1">
                    {s.desc}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#0071e3] group-hover:gap-2.5 transition-all duration-200">
                    {s.link} <ArrowRight size={14} />
                  </span>
                </Link>
              )
            })}
          </StaggerChildren>
        </div>
      </section>

      {/* ─────────────── How it works ─────────────── */}
      <section className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 50% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
              "radial-gradient(52% 56% at 14% 96%, rgba(0,113,227,0.09) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up" className="text-center max-w-2xl mx-auto mb-12 lg:mb-14">
            <span className="text-[12px] tracking-[0.2em] uppercase text-[#0071e3] font-semibold">
              How It Works
            </span>
            <h2 className="mt-4 text-[clamp(2rem,4.2vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.04]">
              From first call to lasting reputation
            </h2>
          </AnimateOnScroll>

          <StaggerChildren
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            animation="fade-up"
            stagger={90}
          >
            {PROCESS.map((step) => (
              <div key={step.n} className="lf-glass rounded-[24px] p-7">
                <div className="text-[clamp(2.4rem,4vw,3rem)] font-bold text-[#0071e3]/25 leading-none tracking-[-0.04em]">
                  {step.n}
                </div>
                <h3 className="mt-4 text-[16px] font-bold text-[#1d1d1f]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13.5px] text-[#1d1d1f]/60 leading-[1.65]">
                  {step.desc}
                </p>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ─────────────── Closing CTA ─────────────── */}
      <section className="relative bg-white py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(52% 56% at 50% 100%, rgba(0,113,227,0.1) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up">
            <div className="lf-glass-strong rounded-[32px] p-10 sm:p-14 text-center">
              <h2 className="text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold text-[#1d1d1f] tracking-[-0.03em] leading-[1.08]">
                Find your place in the room
              </h2>
              <p className="mt-4 text-[#1d1d1f]/60 text-[16px] leading-relaxed max-w-md mx-auto">
                Tell us what you want from leadership — visibility, access,
                recognition or community — and we will point you to the right door.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-9 py-[16px] rounded-full font-bold text-[15px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_14px_34px_-10px_rgba(0,113,227,0.6)]"
                >
                  Start a Conversation <ArrowRight size={16} />
                </Link>
                <Link
                  href="/events"
                  className="lf-glass inline-flex items-center px-7 py-[15px] rounded-full font-bold text-[15px] text-[#1d1d1f] transition-all duration-200"
                >
                  Explore Events
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  )
}
