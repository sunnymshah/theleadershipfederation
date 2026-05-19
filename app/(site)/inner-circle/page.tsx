import Link from "next/link"
import {
  ArrowRight, ArrowUpRight, Users, ChevronDown, Sparkles, Star, Crown,
  Handshake, TrendingUp, Briefcase, MessageCircle, CalendarClock,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"
import { getInnerCircleContent, getFaqs } from "@/app/actions/cmsActions"

export const revalidate = 86400

export const metadata = {
  title: "The Inner Circle | The Leadership Federation",
  description:
    "The Inner Circle — the Federation's members' community for GCC heads, CXOs and decision-makers. Direct access, business collaborations, boardroom conversations and year-round engagement.",
}

/* The Inner Circle runs on its own community platform. */
const INNER_CIRCLE_URL = "https://innercircle.theleadershipfederation.com"

const ICON_MAP: Record<string, LucideIcon> = {
  Users, Handshake, TrendingUp, Briefcase, MessageCircle, CalendarClock, Crown, Sparkles,
}
function resolveIcon(name?: string | null): LucideIcon {
  if (!name) return Star
  return ICON_MAP[name] ?? Star
}

type ICRow = {
  id: string
  content_type: "value_prop" | "how_it_works" | "testimonial"
  title: string
  description: string | null
  subtitle: string | null
  icon: string | null
  accent: string | null
  image_url: string | null
  sort_order: number
}
type FaqRow = { id: string; page: string; question: string; answer: string; sort_order: number }

/* ── What the Inner Circle community actually offers (from the live
 *    platform at innercircle.theleadershipfederation.com) ──────────── */
const FEATURES = [
  { icon: Users, title: "Direct GCC & CXO Access", desc: "Engage directly with GCC leaders, CXOs and decision-makers — move beyond event-stage interactions into meaningful, long-term relationships." },
  { icon: Handshake, title: "Business Collaborations", desc: "Partnerships, strategic alliances and cross-industry collaborations inside a trusted ecosystem built for value-driven engagement." },
  { icon: TrendingUp, title: "Career Visibility", desc: "Structured introductions and showcase opportunities that let hiring leaders and recruiters discover you directly." },
  { icon: Briefcase, title: "Hiring & Talent Access", desc: "Recruiters and hiring managers reach a curated pool of professionals across industries — focused, high-quality talent connections." },
  { icon: MessageCircle, title: "Boardroom-Level Conversations", desc: "Thoughtful discussion on GCC growth, AI adoption and enterprise transformation within a focused digital forum." },
  { icon: CalendarClock, title: "Event Continuity", desc: "Extend conversations beyond conclaves and roundtables — stay connected with speakers, peers and partners year-round." },
]
const HOW_IT_WORKS = [
  { n: "01", title: "Join the community", desc: "Create your member profile on the Inner Circle platform — it takes only a few minutes." },
  { n: "02", title: "Build your presence", desc: "Add your role, expertise and what you're looking for, so the right peers and recruiters can find you." },
  { n: "03", title: "Connect & upgrade", desc: "Start conversations, explore collaborations, and upgrade for deeper access to the room." },
]
const TESTIMONIALS = [
  { quote: "The Inner Circle is the one place I can keep a real conversation going with peers long after the conclave ends.", title: "Group Chief Executive", subtitle: "Listed Conglomerate" },
  { quote: "I came for the events and stayed for the community — two collaborations started inside the forum.", title: "Founding Partner", subtitle: "Growth-Stage Fund" },
  { quote: "It is where GCC leadership actually talks shop — candidly, and with people who understand the stakes.", title: "GCC Head", subtitle: "Global Technology Firm" },
]
const FAQS = [
  { question: "Who is the Inner Circle for?", answer: "It is built for GCC heads, CXOs and decision-makers — alongside recruiters and senior professionals who want direct access to that network. It is a curated community, not an open forum." },
  { question: "How do I join?", answer: "Membership runs on the Inner Circle platform at innercircle.theleadershipfederation.com. Create a profile to join, then explore the directory, forums and collaboration tools." },
  { question: "Is there a fee?", answer: "You can join and build a profile, with paid upgrades that unlock deeper access and visibility. Full tiers and details are shown on the Inner Circle platform." },
  { question: "What happens after I join?", answer: "You get a member profile, the member directory, boardroom-level forums, and year-round connection with speakers, peers and partners from the Federation's events." },
]

export default async function InnerCirclePage() {
  let items: ICRow[] = []
  let faqs: FaqRow[] = []
  try {
    const res = await getInnerCircleContent(true)
    if (res.success && res.items) items = res.items as ICRow[]
  } catch {/* empty state */}
  try {
    const res = await getFaqs("inner_circle", true)
    if (res.success && res.faqs) faqs = res.faqs as FaqRow[]
  } catch {/* empty state */}

  const cmsValueProps = items.filter((i) => i.content_type === "value_prop")
  const cmsHow = items.filter((i) => i.content_type === "how_it_works")
  const cmsTestimonials = items.filter((i) => i.content_type === "testimonial")

  const features = cmsValueProps.length > 0
    ? cmsValueProps.map((v) => ({ icon: resolveIcon(v.icon), title: v.title, desc: v.description ?? "" }))
    : FEATURES
  const howItWorks = cmsHow.length > 0
    ? cmsHow.map((h, i) => ({ n: h.subtitle || `0${i + 1}`, title: h.title, desc: h.description ?? "" }))
    : HOW_IT_WORKS
  const testimonials = cmsTestimonials.length > 0
    ? cmsTestimonials.map((t) => ({ quote: t.description ?? "", title: t.title, subtitle: t.subtitle ?? "" }))
    : TESTIMONIALS
  const faqList = faqs.length > 0
    ? faqs.map((f) => ({ question: f.question, answer: f.answer }))
    : FAQS

  return (
    <main className="bg-white">
      {/* ══════════════ HERO ══════════════ */}
      <section className="relative bg-white pt-32 lg:pt-40 pb-16 lg:pb-24 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(56% 56% at 18% 6%, rgba(0,113,227,0.1) 0%, transparent 66%), " +
              "radial-gradient(50% 54% at 96% 92%, rgba(0,113,227,0.08) 0%, transparent 68%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
            <div>
              <AnimateOnScroll animation="fade-up">
                <span className="inline-flex items-center gap-2 lf-glass rounded-full px-4 py-1.5 text-[11px] sm:text-[12px] font-bold text-[#0071e3] uppercase tracking-[0.2em]">
                  <Crown size={13} /> The Members&apos; Community
                </span>
              </AnimateOnScroll>
              <AnimateOnScroll animation="fade-up" delay={110}>
                <h1 className="mt-6 text-[clamp(2.8rem,6vw,5rem)] font-bold text-[#1d1d1f] tracking-[-0.045em] leading-[0.96]">
                  The Inner
                  <br />
                  <span className="text-[#0071e3]">Circle</span>
                </h1>
              </AnimateOnScroll>
              <AnimateOnScroll animation="fade-up" delay={220}>
                <p className="mt-6 text-[15px] sm:text-[18px] text-[#1d1d1f]/60 leading-relaxed max-w-lg">
                  The Federation&apos;s curated community for GCC heads, CXOs and
                  decision-makers — direct access, business collaboration and
                  boardroom conversation that continues long after the conclave.
                </p>
              </AnimateOnScroll>
              <AnimateOnScroll animation="fade-up" delay={300}>
                <div className="mt-8 flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <a
                    href={INNER_CIRCLE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2.5 px-8 sm:px-9 py-[15px] sm:py-[16px] rounded-full font-bold text-[14px] sm:text-[15px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_18px_44px_-12px_rgba(0,113,227,0.8)]"
                  >
                    Enter the Inner Circle
                    <ArrowUpRight size={17} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                  <Link
                    href="#inside"
                    className="lf-glass inline-flex items-center gap-1.5 px-6 sm:px-7 py-[13px] sm:py-[14px] rounded-full font-bold text-[14px] sm:text-[15px] text-[#1d1d1f] transition-all duration-200"
                  >
                    What&apos;s inside <ChevronDown size={14} />
                  </Link>
                </div>
              </AnimateOnScroll>
              <AnimateOnScroll animation="fade-up" delay={380}>
                <div className="mt-10 inline-grid grid-cols-3 gap-px rounded-2xl overflow-hidden lf-glass">
                  {[
                    ["500+", "Members"],
                    ["30+", "Countries"],
                    ["CXO", "Level Access"],
                  ].map(([v, l]) => (
                    <div key={l} className="px-5 sm:px-7 py-4 text-center">
                      <p className="text-[20px] sm:text-[26px] font-bold text-[#1d1d1f] leading-none tracking-[-0.02em]">
                        {v}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[#1d1d1f]/50 font-semibold mt-1.5">
                        {l}
                      </p>
                    </div>
                  ))}
                </div>
              </AnimateOnScroll>
            </div>

            {/* Liquid-glass membership card */}
            <AnimateOnScroll animation="fade-up" delay={240}>
              <div className="relative mx-auto w-full max-w-[420px] aspect-[1.62/1]">
                <div className="absolute inset-0 lf-glass rounded-[26px] rotate-[7deg] translate-y-3" />
                <div className="lf-glass-strong absolute inset-0 rounded-[26px] -rotate-[5deg] p-7 sm:p-8 overflow-hidden shadow-[0_44px_90px_-36px_rgba(10,10,20,0.5)]">
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(120deg, transparent 40%, rgba(0,113,227,0.12) 50%, transparent 62%)",
                    }}
                  />
                  <div className="relative h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="w-11 h-11 rounded-xl bg-[#0071e3] flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(0,113,227,0.7)]">
                        <Crown size={20} className="text-white" />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#1d1d1f]/45">
                        Member
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0071e3]">
                        The Leadership Federation
                      </p>
                      <p className="mt-1 text-[clamp(1.5rem,3vw,2rem)] font-bold text-[#1d1d1f] tracking-[-0.03em] leading-none">
                        The Inner Circle
                      </p>
                      <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-[#1d1d1f]/50">
                        <span className="tabular-nums tracking-[0.1em]">№ 001</span>
                        <span className="uppercase tracking-[0.14em]">Est. 2016</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ══════════════ INSIDE THE INNER CIRCLE ══════════════ */}
      <section id="inside" className="relative bg-[#f5f5f7] py-16 sm:py-20 lg:py-28 overflow-hidden scroll-mt-20">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 46% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
              "radial-gradient(50% 56% at 88% 96%, rgba(0,113,227,0.09) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up" className="max-w-2xl mb-10 sm:mb-14">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              Inside the Circle
            </span>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              What membership opens
            </h2>
            <p className="mt-4 text-[#1d1d1f]/55 text-[16px] leading-relaxed">
              Six ways the Inner Circle keeps you connected to the people who
              move global enterprise.
            </p>
          </AnimateOnScroll>

          <StaggerChildren
            animation="fade-up"
            stagger={70}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={i}
                  className="lf-glass rounded-[24px] p-7 transition-all duration-300 hover:-translate-y-1.5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#0071e3] flex items-center justify-center mb-5 shadow-[0_10px_24px_-8px_rgba(0,113,227,0.6)]">
                    <Icon size={22} strokeWidth={1.8} className="text-white" />
                  </div>
                  <h3 className="text-[17px] font-bold text-[#1d1d1f] mb-2.5 tracking-[-0.015em] leading-[1.25]">
                    {f.title}
                  </h3>
                  <p className="text-[13.5px] text-[#1d1d1f]/60 leading-[1.7]">
                    {f.desc}
                  </p>
                </div>
              )
            })}
          </StaggerChildren>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section className="relative bg-white py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(56% 48% at 50% 0%, rgba(0,113,227,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up" className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              How It Works
            </span>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              Joining takes minutes
            </h2>
          </AnimateOnScroll>

          <StaggerChildren
            animation="fade-up"
            stagger={110}
            className="grid sm:grid-cols-3 gap-5"
          >
            {howItWorks.map((step) => (
              <div key={step.title} className="lf-glass rounded-[24px] p-7 sm:p-8">
                <div className="text-[clamp(2.4rem,4vw,3rem)] font-bold text-[#0071e3]/25 leading-none tracking-[-0.04em]">
                  {step.n}
                </div>
                <h3 className="mt-4 text-[17px] font-bold text-[#1d1d1f] tracking-[-0.015em]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13.5px] text-[#1d1d1f]/60 leading-[1.7]">
                  {step.desc}
                </p>
              </div>
            ))}
          </StaggerChildren>

          <AnimateOnScroll animation="fade-up" delay={160}>
            <div className="mt-12 text-center">
              <a
                href={INNER_CIRCLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 px-9 py-[16px] rounded-full font-bold text-[15px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_14px_34px_-10px_rgba(0,113,227,0.6)]"
              >
                Join the Inner Circle
                <ArrowUpRight size={17} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ══════════════ MEMBER VOICES ══════════════ */}
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
              Member Voices
            </span>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              From inside the room
            </h2>
          </AnimateOnScroll>

          <StaggerChildren
            animation="fade-up"
            stagger={90}
            className="grid md:grid-cols-3 gap-5"
          >
            {testimonials.map((t, i) => (
              <figure key={i} className="lf-glass rounded-[26px] p-7 sm:p-8 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} size={14} className="text-[#0071e3] fill-[#0071e3]" />
                  ))}
                </div>
                <blockquote className="text-[15px] text-[#1d1d1f]/85 leading-[1.65] font-medium flex-1">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-6 pt-5 border-t border-black/[0.07]">
                  <p className="text-[14px] font-bold text-[#1d1d1f]">{t.title}</p>
                  {t.subtitle && (
                    <p className="text-[12.5px] text-[#1d1d1f]/55 mt-0.5">{t.subtitle}</p>
                  )}
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
              Questions
            </span>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              Before you join
            </h2>
          </AnimateOnScroll>

          <StaggerChildren className="space-y-3" animation="fade-up" stagger={60}>
            {faqList.map((f) => (
              <details key={f.question} className="group lf-glass rounded-[18px] overflow-hidden">
                <summary className="flex items-start justify-between gap-4 px-5 sm:px-6 py-5 cursor-pointer list-none select-none">
                  <span className="text-[14.5px] sm:text-[15.5px] font-semibold text-[#1d1d1f] leading-snug">
                    {f.question}
                  </span>
                  <ChevronDown
                    size={18}
                    className="text-[#0071e3] shrink-0 transition-transform duration-300 group-open:rotate-180"
                  />
                </summary>
                <p className="px-5 sm:px-6 pb-6 text-[13.5px] sm:text-[14px] leading-[1.75] text-[#1d1d1f]/65">
                  {f.answer}
                </p>
              </details>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ══════════════ FINAL CTA ══════════════ */}
      <section className="relative bg-[#f5f5f7] py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 56% at 50% 100%, rgba(0,113,227,0.12) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up">
            <div className="lf-glass-strong rounded-[32px] p-10 sm:p-14 text-center">
              <span className="inline-flex w-14 h-14 rounded-2xl bg-[#0071e3] items-center justify-center mx-auto mb-6 shadow-[0_14px_32px_-10px_rgba(0,113,227,0.7)]">
                <Crown size={24} className="text-white" />
              </span>
              <h2 className="text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold text-[#1d1d1f] tracking-[-0.03em] leading-[1.1]">
                Everything else lives inside
              </h2>
              <p className="mt-4 text-[#1d1d1f]/60 text-[16px] leading-relaxed max-w-md mx-auto">
                The member directory, the forums, membership tiers and the full
                picture — step into the Inner Circle to see it all.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={INNER_CIRCLE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-9 py-[16px] rounded-full font-bold text-[15px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_14px_34px_-10px_rgba(0,113,227,0.6)]"
                >
                  Enter the Inner Circle
                  <ArrowUpRight size={17} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
                <Link
                  href="/contact"
                  className="lf-glass inline-flex items-center px-7 py-[15px] rounded-full font-bold text-[15px] text-[#1d1d1f] transition-all duration-200"
                >
                  Speak with the team
                </Link>
              </div>
              <p className="mt-6 text-[12px] text-[#1d1d1f]/40">
                Opens innercircle.theleadershipfederation.com
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  )
}
