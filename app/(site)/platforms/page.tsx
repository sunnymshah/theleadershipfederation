import Link from "next/link"
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
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"
import { getPlatformFeatures } from "@/app/actions/cmsActions"

export const revalidate = 86400

export const metadata = {
  title: "Platforms | The Leadership Federation",
  description:
    "Explore The Leadership Federation's three pillars: Global Conclaves & Summits, The Inner Circle, and The Sunny Shah Show.",
}

/* ── Icon resolver: DB stores icon as string, mapped to Lucide component ── */

const ICON_MAP: Record<string, LucideIcon> = {
  Crown,
  Globe,
  Award,
  Lightbulb,
  Lock,
  MessageCircle,
  Users,
  Sparkles,
  Radio,
  TrendingUp,
  Video,
  BookOpen,
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

const CONCLAVES_EVENTS = [
  "GCC Leadership Conclave",
  "Asia Leadership Awards",
  "Bharat Leadership Summit",
]

const sfFont = { fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }

export default async function PlatformsPage() {
  let features: FeatureRow[] = []
  try {
    const res = await getPlatformFeatures(true)
    if (res.success && res.features) {
      features = res.features as FeatureRow[]
    }
  } catch {
    /* empty state */
  }

  const conclavesFeatures    = features.filter(f => f.platform === "conclave")
  const innerCircleFeatures  = features.filter(f => f.platform === "inner_circle")
  const showFeatures         = features.filter(f => f.platform === "show")

  return (
    <main className="">
      {/* Hero */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-6">
              The Ecosystem
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={120}>
            <h1
              className="text-[#1a1a2e] leading-[1.08] font-bold mb-8"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", ...sfFont }}
            >
              Our Platforms
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={240}>
            <p className="text-lg md:text-xl text-[#1a1a2e]/75 leading-relaxed max-w-3xl mx-auto">
              Three interconnected pillars that form the backbone of The
              Leadership Federation, each designed to create lasting value
              for the leaders who engage with them.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Pillar 1: Global Conclaves & Summits */}
      <AnimateOnScroll as="section" className="pb-10 px-6" animation="fade-up">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-white border border-[#1a1a2e]/[0.06] shadow-sm p-10 md:p-16 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#e7ab1c]/10 border border-[#e7ab1c]/20 flex items-center justify-center mb-8">
                  <CalendarDays size={26} strokeWidth={1.4} className="text-[#e7ab1c]" />
                </div>
                <h2
                  className="text-[#1a1a2e] leading-[1.12] font-bold mb-5"
                  style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", ...sfFont }}
                >
                  Global Conclaves & Summits
                </h2>
                <p className="text-[#1a1a2e]/75 text-[15px] leading-[1.75] mb-8">
                  India&rsquo;s largest and most influential gatherings of GCC
                  leaders. Over 50 flagship events have brought together CXOs,
                  transformation architects, policymakers, and innovators for
                  multi-day immersive experiences that shape the future of
                  industries.
                </p>

                <div className="mb-8">
                  <p className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.2em] mb-4">
                    Flagship Events
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {CONCLAVES_EVENTS.map((name) => (
                      <span
                        key={name}
                        className="text-[13px] text-[#a37410] font-semibold px-4 py-2 rounded-full border border-[#e7ab1c]/30 bg-[#e7ab1c]/10"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#e7ab1c] hover:text-[#e7ab1c]/80 transition-colors duration-300"
                >
                  Explore Events <ArrowRight size={15} />
                </Link>
              </div>

              {conclavesFeatures.length > 0 && (
                <StaggerChildren className="flex flex-col justify-center gap-5" animation="fade-up" stagger={80}>
                  {conclavesFeatures.map((f) => {
                    const Icon = resolveIcon(f.icon)
                    return (
                      <div
                        key={f.id}
                        className="flex items-start gap-4 p-5 rounded-xl bg-[#F4F8FF] border border-[#1a1a2e]/[0.06]"
                      >
                        <Icon size={20} strokeWidth={1.4} className="text-[#e7ab1c] mt-0.5 shrink-0" />
                        <p className="text-[14px] text-[#1a1a2e]/80 leading-[1.6]">{f.title}</p>
                      </div>
                    )
                  })}
                </StaggerChildren>
              )}
            </div>
          </div>
        </div>
      </AnimateOnScroll>

      {/* Pillar 2: The Inner Circle */}
      <AnimateOnScroll as="section" className="py-10 px-6" animation="fade-up">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-white border border-[#1a1a2e]/[0.06] shadow-sm p-10 md:p-16 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#e7ab1c]/10 border border-[#e7ab1c]/20 flex items-center justify-center mb-8">
                  <Users size={26} strokeWidth={1.4} className="text-[#e7ab1c]" />
                </div>
                <h2
                  className="text-[#1a1a2e] leading-[1.12] font-bold mb-5"
                  style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", ...sfFont }}
                >
                  The Inner Circle
                </h2>
                <p className="text-[#1a1a2e]/75 text-[15px] leading-[1.75] mb-8">
                  An exclusive, invite-only membership designed for senior
                  leaders who seek more than conferences. The Inner Circle
                  offers curated peer connections, private roundtables, and
                  strategic access to the decision-makers and policymakers
                  who shape the global business landscape.
                </p>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#e7ab1c] hover:text-[#d49c10] transition-colors duration-300"
                >
                  Apply for Membership <ArrowRight size={15} />
                </Link>
              </div>

              {innerCircleFeatures.length > 0 && (
                <StaggerChildren className="flex flex-col justify-center gap-5" animation="fade-up" stagger={80}>
                  {innerCircleFeatures.map((f) => {
                    const Icon = resolveIcon(f.icon)
                    return (
                      <div
                        key={f.id}
                        className="flex items-start gap-4 p-5 rounded-xl bg-[#F4F8FF] border border-[#1a1a2e]/[0.06]"
                      >
                        <Icon size={20} strokeWidth={1.4} className="text-[#e7ab1c] mt-0.5 shrink-0" />
                        <p className="text-[14px] text-[#1a1a2e]/80 leading-[1.6]">{f.title}</p>
                      </div>
                    )
                  })}
                </StaggerChildren>
              )}
            </div>
          </div>
        </div>
      </AnimateOnScroll>

      {/* Pillar 3: The Sunny Shah Show */}
      <AnimateOnScroll as="section" className="py-10 px-6" animation="fade-up">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-white border border-[#1a1a2e]/[0.06] shadow-sm p-10 md:p-16 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#e7ab1c]/10 border border-[#e7ab1c]/20 flex items-center justify-center mb-8">
                  <Mic2 size={26} strokeWidth={1.4} className="text-[#e7ab1c]" />
                </div>
                <h2
                  className="text-[#1a1a2e] leading-[1.12] font-bold mb-5"
                  style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", ...sfFont }}
                >
                  The Sunny Shah Show
                </h2>
                <p className="text-[#1a1a2e]/75 text-[15px] leading-[1.75] mb-8">
                  A thought leadership media platform featuring in-depth
                  interviews with global C-suite executives, industry pioneers,
                  and visionary leaders. From AI transformation to geopolitical
                  strategy, the show explores the conversations that define the
                  future of business.
                </p>

                <Link
                  href="/media"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#e7ab1c] hover:text-[#d49c10] transition-colors duration-300"
                >
                  Watch Episodes <ArrowRight size={15} />
                </Link>
              </div>

              {showFeatures.length > 0 && (
                <StaggerChildren className="flex flex-col justify-center gap-5" animation="fade-up" stagger={80}>
                  {showFeatures.map((f) => {
                    const Icon = resolveIcon(f.icon)
                    return (
                      <div
                        key={f.id}
                        className="flex items-start gap-4 p-5 rounded-xl bg-[#F4F8FF] border border-[#1a1a2e]/[0.06]"
                      >
                        <Icon size={20} strokeWidth={1.4} className="text-[#e7ab1c] mt-0.5 shrink-0" />
                        <p className="text-[14px] text-[#1a1a2e]/80 leading-[1.6]">{f.title}</p>
                      </div>
                    )
                  })}
                </StaggerChildren>
              )}
            </div>
          </div>
        </div>
      </AnimateOnScroll>

      {/* Bottom CTA */}
      <section className="pt-12 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-[#1a1a2e] leading-[1.12] font-bold mb-5"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", ...sfFont }}
          >
            Find Your Platform
          </h2>
          <p className="text-[#1a1a2e]/75 text-base leading-relaxed mb-10 max-w-xl mx-auto">
            Whether through our flagship conclaves, the exclusivity of the
            Inner Circle, or the insights of The Sunny Shah Show, there is a
            path for every leader.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/events"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#e7ab1c] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#d49c10] shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
            >
              Explore Events
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-white text-[#1a1a2e] text-sm font-semibold border border-[#1a1a2e]/[0.12] transition-all duration-200 hover:border-[#e7ab1c]/40 hover:text-[#e7ab1c]"
            >
              Apply for Inner Circle
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
