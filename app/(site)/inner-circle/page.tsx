import Link from "next/link"
import {
  ArrowRight, Users, Shield, BookOpen, CheckCircle2, ChevronDown,
  Globe, Sparkles, Star, Lock, Crown, TrendingUp, KeyRound,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"
import { getInnerCircleContent, getFaqs } from "@/app/actions/cmsActions"

export const revalidate = 86400

export const metadata = {
  title: "The Inner Circle | The Leadership Federation",
  description:
    "The Inner Circle — an invite-only membership for GCC heads, CXOs and founders. Curated peers, closed-door roundtables and year-round access to The Leadership Federation.",
}

/* Applications run through the Federation's own registration flow —
 * the dedicated portal is invite-gated. */
const APPLY_URL = "/register?type=inner-circle"

const ICON_MAP: Record<string, LucideIcon> = {
  Users, Shield, BookOpen, CheckCircle2, Globe, Sparkles, Crown, TrendingUp, Lock,
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

/* ── Baked fallbacks — the page stays premium even with an empty CMS ── */
const VALUE_PROPS = [
  { icon: Users, title: "A curated peer network", desc: "Sit alongside GCC heads, CXOs and founders — every member vetted, every introduction intentional." },
  { icon: Lock, title: "Closed-door roundtables", desc: "Private, off-record sessions where the real conversations happen — capital, strategy and governance." },
  { icon: Crown, title: "Year-round access", desc: "Priority seats at every conclave, members-only briefings, and a standing line to the Federation." },
]
const HOW_IT_WORKS = [
  { n: "01", title: "Apply or be nominated", desc: "Submit an application — or arrive by referral from an existing member or the Advisory Board." },
  { n: "02", title: "Committee review", desc: "Every application is weighed for calibre and contribution. You hear back within four weeks." },
  { n: "03", title: "Induction", desc: "Accepted members are introduced to their cohort and granted full year-round access." },
]
const TESTIMONIALS = [
  { quote: "The Inner Circle is the one room where I can speak candidly with peers who genuinely understand the weight of the decisions.", title: "Group Chief Executive", subtitle: "Listed Conglomerate" },
  { quote: "Two roundtables in, I had a co-investor and a hire. The vetting is what makes it work — everyone in the room belongs there.", title: "Founding Partner", subtitle: "Growth-Stage Fund" },
  { quote: "It is not networking. It is a standing relationship with the people shaping the next decade of enterprise.", title: "GCC Head", subtitle: "Global Technology Firm" },
]
const FAQS = [
  { question: "Who can join the Inner Circle?", answer: "Membership is invite-curated. The room is built for CXOs of large enterprises, GCC heads, fund partners, founders and senior policymakers — leaders who can both contribute and benefit." },
  { question: "Can I be nominated?", answer: "Yes. Most members arrive by referral from an existing member or the Advisory Board. You can also apply directly — applications are reviewed monthly." },
  { question: "How long does review take?", answer: "The membership committee reviews every application for calibre and fit. You will hear back within four weeks." },
  { question: "Is there a membership fee?", answer: "The Inner Circle is offered across tiers. Investment and inclusions are shared during the review conversation — see the Memberships page for an overview." },
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

  const valueProps = cmsValueProps.length > 0
    ? cmsValueProps.map((v) => ({ icon: resolveIcon(v.icon), title: v.title, desc: v.description ?? "" }))
    : VALUE_PROPS
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
            {/* Copy */}
            <div>
              <AnimateOnScroll animation="fade-up">
                <span className="inline-flex items-center gap-2 lf-glass rounded-full px-4 py-1.5 text-[11px] sm:text-[12px] font-bold text-[#0071e3] uppercase tracking-[0.2em]">
                  <Lock size={12} /> By Invitation Only
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
                  A private membership for the leaders who move enterprise — GCC
                  heads, CXOs and founders. Curated peers, closed-door rooms, and
                  a standing relationship with The Leadership Federation.
                </p>
              </AnimateOnScroll>
              <AnimateOnScroll animation="fade-up" delay={300}>
                <div className="mt-8 flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <Link
                    href={APPLY_URL}
                    className="group inline-flex items-center gap-2.5 px-8 sm:px-9 py-[15px] sm:py-[16px] rounded-full font-bold text-[14px] sm:text-[15px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_18px_44px_-12px_rgba(0,113,227,0.8)]"
                  >
                    Request an Invitation
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="#how"
                    className="lf-glass inline-flex items-center gap-1.5 px-6 sm:px-7 py-[13px] sm:py-[14px] rounded-full font-bold text-[14px] sm:text-[15px] text-[#1d1d1f] transition-all duration-200"
                  >
                    How it works <ChevronDown size={14} />
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

            {/* The membership card — a liquid-glass signature object */}
            <AnimateOnScroll animation="fade-up" delay={240}>
              <div className="relative mx-auto w-full max-w-[420px] aspect-[1.62/1]">
                {/* depth card behind */}
                <div className="absolute inset-0 lf-glass rounded-[26px] rotate-[7deg] translate-y-3" />
                {/* main card */}
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

      {/* ══════════════ WHY JOIN ══════════════ */}
      <section className="relative bg-[#f5f5f7] py-16 sm:py-20 lg:py-28 overflow-hidden">
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
              Why Join
            </span>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              Built for leaders who lead
            </h2>
            <p className="mt-4 text-[#1d1d1f]/55 text-[16px] leading-relaxed">
              Three things the Inner Circle gives you that an open conference
              never can.
            </p>
          </AnimateOnScroll>

          <StaggerChildren
            animation="fade-up"
            stagger={90}
            className="grid sm:grid-cols-3 gap-5"
          >
            {valueProps.map((vp, i) => {
              const Icon = vp.icon
              return (
                <div
                  key={i}
                  className="lf-glass relative rounded-[24px] p-7 sm:p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
                >
                  <span className="absolute -top-3 -right-1 text-[110px] font-bold text-[#0071e3]/[0.07] leading-none select-none">
                    0{i + 1}
                  </span>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-[#0071e3] flex items-center justify-center mb-5 shadow-[0_10px_24px_-8px_rgba(0,113,227,0.6)]">
                      <Icon size={22} strokeWidth={1.8} className="text-white" />
                    </div>
                    <h3 className="text-[18px] font-bold text-[#1d1d1f] mb-2.5 tracking-[-0.015em]">
                      {vp.title}
                    </h3>
                    <p className="text-[14px] text-[#1d1d1f]/60 leading-[1.7]">
                      {vp.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </StaggerChildren>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section id="how" className="relative bg-white py-16 sm:py-20 lg:py-28 overflow-hidden scroll-mt-20">
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
              The path to membership
            </h2>
            <p className="mt-4 text-[#1d1d1f]/55 text-[16px] leading-relaxed">
              A deliberate process — it keeps the room worth being in.
            </p>
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
              <Link
                href={APPLY_URL}
                className="group inline-flex items-center gap-2.5 px-9 py-[16px] rounded-full font-bold text-[15px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_14px_34px_-10px_rgba(0,113,227,0.6)]"
              >
                Start your application
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
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
              Before you apply
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
                <KeyRound size={24} className="text-white" strokeWidth={1.9} />
              </span>
              <h2 className="text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold text-[#1d1d1f] tracking-[-0.03em] leading-[1.1]">
                A seat is held for the right leaders
              </h2>
              <p className="mt-4 text-[#1d1d1f]/60 text-[16px] leading-relaxed max-w-md mx-auto">
                The Inner Circle stays small by design. If that sounds like the
                room you belong in, request an invitation.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={APPLY_URL}
                  className="inline-flex items-center gap-2 px-9 py-[16px] rounded-full font-bold text-[15px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_14px_34px_-10px_rgba(0,113,227,0.6)]"
                >
                  Request an Invitation <ArrowRight size={16} />
                </Link>
                <Link
                  href="/contact"
                  className="lf-glass inline-flex items-center px-7 py-[15px] rounded-full font-bold text-[15px] text-[#1d1d1f] transition-all duration-200"
                >
                  Speak with the team
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  )
}
