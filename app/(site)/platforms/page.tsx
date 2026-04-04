/* ═══════════════════════════════════════════════════════════════════════════
 *  PLATFORMS PAGE — Server Component
 *
 *  Showcases the three pillars of The Leadership Federation:
 *  Conclaves & Summits, The Inner Circle, and The Sunny Shah Show.
 * ═══════════════════════════════════════════════════════════════════════════ */

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
  BookOpen,
  MessageCircle,
  Lock,
  Sparkles,
  Radio,
  Video,
  TrendingUp,
} from "lucide-react"

export const metadata = {
  title: "Platforms",
  description:
    "Explore The Leadership Federation's three pillars: Global Conclaves & Summits, The Inner Circle, and The Sunny Shah Show.",
}

/* ─── Pillar data ─────────────────────────────────────────────────────────── */

const CONCLAVES_FEATURES = [
  { icon: Crown, text: "650+ CXOs and senior leaders per flagship event" },
  { icon: Globe, text: "Delegates from 30+ countries across every edition" },
  { icon: Award, text: "Asia Leadership Awards honouring transformational leaders" },
  { icon: Lightbulb, text: "Deep-dive tracks on AI, cybersecurity, talent, and sustainability" },
]

const CONCLAVES_EVENTS = [
  "GCC Leadership Conclave",
  "Asia Leadership Awards",
  "Bharat Leadership Summit",
]

const INNER_CIRCLE_FEATURES = [
  { icon: Lock, text: "Invite-only membership for CXOs and senior leaders" },
  { icon: MessageCircle, text: "Private roundtables with peers across industries" },
  { icon: Users, text: "Curated peer connections matched by role and interest" },
  { icon: Sparkles, text: "Strategic access to policymakers and thought leaders" },
]

const SHOW_FEATURES = [
  { icon: Radio, text: "Long-form interviews with global C-suite executives" },
  { icon: TrendingUp, text: "Industry insights and emerging trend analysis" },
  { icon: Video, text: "Multi-format content: video, audio, and editorial" },
  { icon: BookOpen, text: "Behind-the-scenes perspectives on leadership decisions" },
]

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function PlatformsPage() {
  return (
    <main className="bg-[#F4F8FF]">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold text-[#1a1a2e]/40 uppercase tracking-[0.25em] mb-6">
            The Ecosystem
          </span>
          <h1
            className="font-serif text-[#1a1a2e] leading-[1.08] mb-8"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
          >
            Our Platforms
          </h1>
          <p className="text-lg md:text-xl text-[#1a1a2e]/50 leading-relaxed max-w-3xl mx-auto">
            Three interconnected pillars that form the backbone of The
            Leadership Federation, each designed to create lasting value
            for the leaders who engage with them.
          </p>
        </div>
      </section>

      {/* ── Pillar 1: Global Conclaves & Summits ──────────────────── */}
      <section className="pb-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-[#1a1a2e] p-10 md:p-16 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              {/* Content */}
              <div>
                <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-8">
                  <CalendarDays size={26} strokeWidth={1.4} className="text-white/60" />
                </div>
                <h2
                  className="font-serif text-white leading-[1.12] mb-5"
                  style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}
                >
                  Global Conclaves & Summits
                </h2>
                <p className="text-white/40 text-[15px] leading-[1.75] mb-8">
                  India&rsquo;s largest and most influential gatherings of GCC
                  leaders. Over 50 flagship events have brought together CXOs,
                  transformation architects, policymakers, and innovators for
                  multi-day immersive experiences that shape the future of
                  industries.
                </p>

                {/* Flagship events */}
                <div className="mb-8">
                  <p className="text-[11px] font-bold text-white/25 uppercase tracking-[0.2em] mb-4">
                    Flagship Events
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {CONCLAVES_EVENTS.map((name) => (
                      <span
                        key={name}
                        className="text-[13px] text-white/50 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03]"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors duration-300"
                >
                  Explore Events <ArrowRight size={15} />
                </Link>
              </div>

              {/* Features */}
              <div className="flex flex-col justify-center gap-5">
                {CONCLAVES_FEATURES.map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-start gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <Icon size={20} strokeWidth={1.4} className="text-white/30 mt-0.5 shrink-0" />
                    <p className="text-[14px] text-white/50 leading-[1.6]">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pillar 2: The Inner Circle ────────────────────────────── */}
      <section className="py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-white border border-[#1a1a2e]/[0.06] p-10 md:p-16 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              {/* Content */}
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#1a1a2e]/[0.04] border border-[#1a1a2e]/[0.08] flex items-center justify-center mb-8">
                  <Users size={26} strokeWidth={1.4} className="text-[#1a1a2e]/50" />
                </div>
                <h2
                  className="font-serif text-[#1a1a2e] leading-[1.12] mb-5"
                  style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}
                >
                  The Inner Circle
                </h2>
                <p className="text-[#1a1a2e]/45 text-[15px] leading-[1.75] mb-8">
                  An exclusive, invite-only membership designed for senior
                  leaders who seek more than conferences. The Inner Circle
                  offers curated peer connections, private roundtables, and
                  strategic access to the decision-makers and policymakers
                  who shape the global business landscape.
                </p>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]/70 hover:text-[#1a1a2e] transition-colors duration-300"
                >
                  Apply for Membership <ArrowRight size={15} />
                </Link>
              </div>

              {/* Features */}
              <div className="flex flex-col justify-center gap-5">
                {INNER_CIRCLE_FEATURES.map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-start gap-4 p-5 rounded-xl bg-[#F4F8FF] border border-[#1a1a2e]/[0.04]"
                  >
                    <Icon size={20} strokeWidth={1.4} className="text-[#1a1a2e]/30 mt-0.5 shrink-0" />
                    <p className="text-[14px] text-[#1a1a2e]/50 leading-[1.6]">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pillar 3: The Sunny Shah Show ─────────────────────────── */}
      <section className="py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-white border border-[#1a1a2e]/[0.06] p-10 md:p-16 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              {/* Content */}
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#1a1a2e]/[0.04] border border-[#1a1a2e]/[0.08] flex items-center justify-center mb-8">
                  <Mic2 size={26} strokeWidth={1.4} className="text-[#1a1a2e]/50" />
                </div>
                <h2
                  className="font-serif text-[#1a1a2e] leading-[1.12] mb-5"
                  style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}
                >
                  The Sunny Shah Show
                </h2>
                <p className="text-[#1a1a2e]/45 text-[15px] leading-[1.75] mb-8">
                  A thought leadership media platform featuring in-depth
                  interviews with global C-suite executives, industry pioneers,
                  and visionary leaders. From AI transformation to geopolitical
                  strategy, the show explores the conversations that define the
                  future of business.
                </p>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]/70 hover:text-[#1a1a2e] transition-colors duration-300"
                >
                  Watch Episodes <ArrowRight size={15} />
                </Link>
              </div>

              {/* Features */}
              <div className="flex flex-col justify-center gap-5">
                {SHOW_FEATURES.map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-start gap-4 p-5 rounded-xl bg-[#F4F8FF] border border-[#1a1a2e]/[0.04]"
                  >
                    <Icon size={20} strokeWidth={1.4} className="text-[#1a1a2e]/30 mt-0.5 shrink-0" />
                    <p className="text-[14px] text-[#1a1a2e]/50 leading-[1.6]">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <section className="pt-16 pb-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="font-serif text-[#1a1a2e] leading-[1.12] mb-5"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}
          >
            Find Your Platform
          </h2>
          <p className="text-[#1a1a2e]/45 text-base leading-relaxed mb-10 max-w-xl mx-auto">
            Whether through our flagship conclaves, the exclusivity of the
            Inner Circle, or the insights of The Sunny Shah Show, there is a
            path for every leader.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/events"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#1a1a2e] text-white text-sm font-semibold tracking-wide transition-all duration-300 hover:bg-[#1a1a2e]/90 hover:shadow-[0_8px_32px_rgba(26,26,46,0.2)]"
            >
              Explore Events
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-transparent text-[#1a1a2e] text-sm font-semibold tracking-wide border border-[#1a1a2e]/15 transition-all duration-300 hover:border-[#1a1a2e]/30 hover:shadow-[0_4px_20px_rgba(26,26,46,0.06)]"
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
