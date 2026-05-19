import { existsSync } from "fs"
import path from "path"
import Link from "next/link"
import Image from "next/image"
import {
  MessageSquare,
  Globe,
  ShieldCheck,
  Handshake,
  ArrowRight,
  Users,
  TrendingUp,
  Award,
  Sparkles,
  Star,
  CalendarDays,
  Mic2,
  Trophy,
  Compass,
  Quote,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Linkedin } from "@/components/icons/SocialIcons"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"
import { getAboutSections } from "@/app/actions/cmsActions"

export const revalidate = 86400

export const metadata = {
  title: "About | The Leadership Federation",
  description:
    "How The Leadership Federation began — founded in 2016 by Sunny Shah to convene the leaders shaping global enterprise. Our story, mission, milestones and the people behind it.",
}

/* ── Icon resolver ────────────────────────────────────────────────────── */
const ICON_MAP: Record<string, LucideIcon> = {
  MessageSquare, Globe, ShieldCheck, Handshake,
  Users, TrendingUp, Award, Sparkles,
}
function resolveIcon(name?: string | null): LucideIcon {
  if (!name) return Star
  return ICON_MAP[name] ?? Star
}

type AboutRow = {
  id: string
  section_type: "pillar" | "stat" | "founder" | "vision"
  title: string
  subtitle: string | null
  description: string | null
  icon: string | null
  image_url: string | null
  metric_value: string | null
  metric_label: string | null
  link_url: string | null
  sort_order: number
}

function hasFounderPhoto(imageUrl?: string | null): boolean {
  if (!imageUrl) return false
  if (/^https?:\/\//.test(imageUrl)) return true
  try {
    const rel = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl
    return existsSync(path.join(process.cwd(), "public", rel))
  } catch {
    return false
  }
}

/* ── Baked content (renders even when the CMS is empty) ───────────────── */

const GALLERY = [
  { src: "/events/middle-east-asia.jpg", label: "Middle East & Asia" },
  { src: "/events/asia-leadership-awards.jpg", label: "Asia Leadership Awards" },
  { src: "/events/bharat-leadership-awards.jpg", label: "Bharat Leadership Summit" },
]

const TIMELINE = [
  {
    year: "2016",
    title: "The beginning",
    text: "The Leadership Federation is founded on one conviction — that leadership compounds in rooms, not feeds.",
  },
  {
    year: "2018",
    title: "The format finds its feet",
    text: "Early conclaves and the first award editions establish a signature blend of frank dialogue and genuine recognition.",
  },
  {
    year: "2021",
    title: "Across borders",
    text: "The platform scales across Asia and the Middle East, convening leaders from more than 30 countries.",
  },
  {
    year: "2024",
    title: "A standing institution",
    text: "The Asia Leadership Awards, Bharat Leadership Excellence Awards and Middle East Asia Awards become flagship recognitions.",
  },
  {
    year: "2025",
    title: "GCC meets AI",
    text: "The GCC Leadership Conclave in Bengaluru focuses the platform on Global Capability Centres and AI-driven enterprise evolution.",
  },
  {
    year: "2026",
    title: "The largest edition yet",
    text: "The 7th GCC Leadership Conclave arrives in Mumbai — the biggest gathering of GCC leadership in the Federation's history.",
  },
]

const WHAT_WE_DO = [
  {
    icon: CalendarDays,
    title: "Global Conclaves & Summits",
    text: "Multi-day, immersive gatherings of CXOs, policymakers and innovators — the GCC Leadership Conclave foremost among them.",
  },
  {
    icon: Trophy,
    title: "Awards & Recognition",
    text: "Juried programmes — the Asia Leadership Awards and more — that honour the people and institutions raising the bar.",
  },
  {
    icon: Users,
    title: "The Inner Circle",
    text: "An invite-only membership for senior leaders: private roundtables, curated peers and year-round access.",
  },
  {
    icon: Mic2,
    title: "Media & Thought Leadership",
    text: "The Sunny Shah Show and media spotlights carry the conversations defining the future of global business.",
  },
]

const VALUES = [
  { icon: Star, title: "Excellence", text: "We honour work that raises the bar — and hold ourselves to the same standard." },
  { icon: Compass, title: "Curation", text: "Every room is hand-built. Who is in it matters as much as what is said." },
  { icon: Handshake, title: "Access", text: "Real proximity to the people who decide — not a stage, but a table." },
  { icon: Globe, title: "Global Perspective", text: "Leadership is read across borders, never only within them." },
]

const STATS = [
  { value: "2016", label: "Founded" },
  { value: "50+", label: "Flagship Events" },
  { value: "30+", label: "Countries" },
  { value: "2,000+", label: "Leaders Convened" },
]

const FOUNDER_QUOTE =
  "We are at a defining moment where AI and global capability models are converging to reshape how enterprises operate. This platform is about bringing together leaders who are not just adapting to change, but actively building the future of global organisations."

const FOUNDER_BAKED = [
  "Sunny Shah founded The Leadership Federation in 2016 and continues to lead it as Founder & CEO, alongside a senior career in global enterprise.",
  "His conviction was simple. The leadership world had no shortage of conferences — but it lacked a federation: a standing platform where the people shaping enterprise could convene, contend with the hard questions, and recognise one another's work with real rigour.",
  "A decade on, that idea has grown into a global ecosystem of conclaves, awards and private circles spanning more than 30 countries.",
]

export default async function AboutPage() {
  let sections: AboutRow[] = []
  try {
    const res = await getAboutSections(true)
    if (res.success && res.sections) sections = res.sections as AboutRow[]
  } catch {
    /* empty state */
  }

  const cmsPillars = sections.filter((s) => s.section_type === "pillar")
  const cmsStats = sections.filter((s) => s.section_type === "stat")
  const vision = sections.find((s) => s.section_type === "vision")
  const founder = sections.find((s) => s.section_type === "founder")

  const founderName = founder?.title || "Sunny Shah"
  const founderRole = founder?.subtitle || "Founder & CEO, The Leadership Federation"
  const founderPhotoExists = hasFounderPhoto(founder?.image_url)
  const founderParagraphs =
    founder?.description
      ?.split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean) ?? FOUNDER_BAKED
  const founderInitials = founderName
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const visionTitle =
    vision?.title || "A world where leadership is shared, recognised, and ready for what's next."
  const visionDesc =
    vision?.description ||
    "We bring the decision-makers of global enterprise into one room — to learn from each other, raise the standard, and build what comes next, together."

  return (
    <main>
      {/* ═══════════════ Hero ═══════════════ */}
      <section className="relative bg-white pt-32 lg:pt-40 pb-16 lg:pb-20 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(56% 56% at 50% 0%, rgba(0,113,227,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              Our Story
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={110}>
            <h1 className="mt-5 text-[clamp(2.6rem,5.6vw,4.6rem)] font-bold text-[#1d1d1f] tracking-[-0.04em] leading-[1.0]">
              Where leadership
              <br />
              <span className="text-[#0071e3]">finds its room</span>
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={220}>
            <p className="mt-6 text-[17px] lg:text-[19px] text-[#1d1d1f]/60 leading-relaxed max-w-2xl mx-auto">
              Since 2016, The Leadership Federation has convened the CXOs,
              policymakers and innovators shaping global enterprise — through
              conclaves, awards and private circles across 30+ countries.
            </p>
          </AnimateOnScroll>
        </div>

        <AnimateOnScroll animation="fade-up" delay={320}>
          <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 mt-14">
            <div className="grid grid-cols-3 gap-3 sm:gap-5">
              {GALLERY.map((g, i) => (
                <div
                  key={g.src}
                  className={
                    "lf-glass rounded-[22px] p-1.5 sm:p-2 " +
                    (i === 1 ? "sm:-translate-y-6" : "")
                  }
                >
                  <div className="relative aspect-[3/4] rounded-[16px] overflow-hidden">
                    <Image
                      src={g.src}
                      alt={g.label}
                      fill
                      sizes="(max-width: 640px) 33vw, 300px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <span className="absolute bottom-2.5 left-3 right-3 text-[10px] sm:text-[12px] font-semibold text-white tracking-[-0.01em]">
                      {g.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ═══════════════ How it started ═══════════════ */}
      <section className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 50% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
              "radial-gradient(50% 56% at 92% 96%, rgba(0,113,227,0.09) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <AnimateOnScroll animation="fade-right">
              <div className="lf-glass rounded-[28px] p-2.5">
                <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden">
                  <Image
                    src="/hero-speaker.jpg"
                    alt="A Leadership Federation conclave in session"
                    fill
                    sizes="(max-width: 1024px) 100vw, 560px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-5 lf-glass-dark rounded-xl px-3.5 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                      Est. 2016
                    </span>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-left" delay={140}>
              <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
                How It Started
              </span>
              <h2 className="mt-4 text-[clamp(1.9rem,3.6vw,2.8rem)] font-bold text-[#1d1d1f] tracking-[-0.03em] leading-[1.08]">
                It began with a room that did not exist
              </h2>
              <div className="mt-5 space-y-4 text-[15.5px] text-[#1d1d1f]/65 leading-[1.8]">
                <p>
                  In 2016, Sunny Shah saw a gap the leadership world kept
                  overlooking. There were conferences everywhere — and almost
                  nowhere for the people actually steering global enterprise to
                  sit together as peers.
                </p>
                <p>
                  So he built it. Not another event company, but a{" "}
                  <span className="font-semibold text-[#1d1d1f]">federation</span>{" "}
                  — a standing platform where leaders convene, contend with the
                  hard questions, and recognise one another&apos;s work with real
                  rigour.
                </p>
                <p>
                  That first gathering became a series. The series became an
                  ecosystem — conclaves, awards and private circles now spanning
                  30+ countries, all built on the same idea it started with.
                </p>
              </div>
              <p className="mt-7 text-[clamp(1.05rem,1.8vw,1.3rem)] font-semibold text-[#0071e3] tracking-[-0.01em]">
                &ldquo;Celebrating excellence. Igniting leadership.&rdquo;
              </p>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ═══════════════ Timeline ═══════════════ */}
      <section className="relative bg-white py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(56% 50% at 50% 0%, rgba(0,113,227,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up" className="text-center mb-14">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              The Journey
            </span>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              A decade, in milestones
            </h2>
          </AnimateOnScroll>

          <div className="relative">
            {/* vertical rail */}
            <div className="absolute left-[27px] sm:left-[34px] top-3 bottom-3 w-px bg-[#0071e3]/20" />
            <div className="space-y-5">
              {TIMELINE.map((m, i) => (
                <AnimateOnScroll key={m.year} animation="fade-up" delay={i * 70}>
                  <div className="relative flex items-start gap-5 sm:gap-7">
                    <div className="relative z-10 shrink-0 w-[54px] h-[54px] sm:w-[68px] sm:h-[68px] rounded-2xl bg-[#0071e3] flex items-center justify-center shadow-[0_12px_28px_-10px_rgba(0,113,227,0.65)]">
                      <span className="text-[13px] sm:text-[15px] font-bold text-white tracking-[-0.02em]">
                        {m.year}
                      </span>
                    </div>
                    <div className="lf-glass rounded-[20px] p-5 sm:p-6 flex-1">
                      <h3 className="text-[16px] sm:text-[17px] font-bold text-[#1d1d1f] tracking-[-0.015em]">
                        {m.title}
                      </h3>
                      <p className="mt-1.5 text-[13.5px] sm:text-[14px] text-[#1d1d1f]/60 leading-[1.65]">
                        {m.text}
                      </p>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ Mission & Vision ═══════════════ */}
      <section className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 50% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
              "radial-gradient(52% 56% at 14% 96%, rgba(0,113,227,0.1) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-5">
            <AnimateOnScroll animation="fade-up">
              <div className="lf-glass-strong rounded-[28px] p-8 sm:p-10 h-full">
                <span className="inline-flex w-12 h-12 rounded-2xl bg-[#0071e3] items-center justify-center mb-5 shadow-[0_12px_28px_-8px_rgba(0,113,227,0.6)]">
                  <Compass size={22} className="text-white" strokeWidth={1.8} />
                </span>
                <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.2em]">
                  Our Mission
                </span>
                <h3 className="mt-3 text-[clamp(1.4rem,2.4vw,1.9rem)] font-bold text-[#1d1d1f] tracking-[-0.025em] leading-[1.18]">
                  Empowering tomorrow&apos;s leaders, today
                </h3>
                <p className="mt-4 text-[15px] text-[#1d1d1f]/65 leading-[1.75]">
                  To inspire, educate and connect leaders across the globe —
                  fostering innovation, excellence and inclusivity in how
                  leadership is practised and recognised.
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={120}>
              <div className="lf-glass-strong rounded-[28px] p-8 sm:p-10 h-full">
                <span className="inline-flex w-12 h-12 rounded-2xl bg-[#0071e3] items-center justify-center mb-5 shadow-[0_12px_28px_-8px_rgba(0,113,227,0.6)]">
                  <Sparkles size={22} className="text-white" strokeWidth={1.8} />
                </span>
                <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.2em]">
                  Our Vision
                </span>
                <h3 className="mt-3 text-[clamp(1.4rem,2.4vw,1.9rem)] font-bold text-[#1d1d1f] tracking-[-0.025em] leading-[1.18]">
                  {visionTitle}
                </h3>
                <p className="mt-4 text-[15px] text-[#1d1d1f]/65 leading-[1.75]">
                  {visionDesc}
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ═══════════════ What we do ═══════════════ */}
      <section className="relative bg-white py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(56% 50% at 50% 0%, rgba(0,113,227,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up" className="max-w-2xl mb-12 lg:mb-14">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              What We Do
            </span>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              Four ways the Federation convenes
            </h2>
          </AnimateOnScroll>

          {cmsPillars.length > 0 ? (
            <StaggerChildren
              animation="fade-up"
              stagger={90}
              className="grid sm:grid-cols-2 gap-5"
            >
              {cmsPillars.map((p) => {
                const Icon = resolveIcon(p.icon)
                return (
                  <div
                    key={p.id}
                    className="lf-glass rounded-[24px] p-8 transition-all duration-300 hover:-translate-y-1.5"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#0071e3] flex items-center justify-center mb-5 shadow-[0_10px_24px_-8px_rgba(0,113,227,0.6)]">
                      <Icon size={22} strokeWidth={1.8} className="text-white" />
                    </div>
                    <h3 className="text-[18px] font-bold text-[#1d1d1f] mb-2.5 tracking-[-0.015em]">
                      {p.title}
                    </h3>
                    {p.description && (
                      <p className="text-[14px] text-[#1d1d1f]/60 leading-[1.7]">
                        {p.description}
                      </p>
                    )}
                  </div>
                )
              })}
            </StaggerChildren>
          ) : (
            <StaggerChildren
              animation="fade-up"
              stagger={90}
              className="grid sm:grid-cols-2 gap-5"
            >
              {WHAT_WE_DO.map((p) => {
                const Icon = p.icon
                return (
                  <div
                    key={p.title}
                    className="lf-glass rounded-[24px] p-8 transition-all duration-300 hover:-translate-y-1.5"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#0071e3] flex items-center justify-center mb-5 shadow-[0_10px_24px_-8px_rgba(0,113,227,0.6)]">
                      <Icon size={22} strokeWidth={1.8} className="text-white" />
                    </div>
                    <h3 className="text-[18px] font-bold text-[#1d1d1f] mb-2.5 tracking-[-0.015em]">
                      {p.title}
                    </h3>
                    <p className="text-[14px] text-[#1d1d1f]/60 leading-[1.7]">
                      {p.text}
                    </p>
                  </div>
                )
              })}
            </StaggerChildren>
          )}
        </div>
      </section>

      {/* ═══════════════ Values ═══════════════ */}
      <section className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 50% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
              "radial-gradient(50% 56% at 90% 96%, rgba(0,113,227,0.09) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up" className="text-center max-w-2xl mx-auto mb-12 lg:mb-14">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              What We Stand For
            </span>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              Four values, every room
            </h2>
          </AnimateOnScroll>

          <StaggerChildren
            animation="fade-up"
            stagger={80}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {VALUES.map((v) => {
              const Icon = v.icon
              return (
                <div key={v.title} className="lf-glass rounded-[24px] p-7">
                  <div className="w-11 h-11 rounded-xl bg-[#0071e3]/[0.1] border border-[#0071e3]/15 flex items-center justify-center mb-4">
                    <Icon size={20} strokeWidth={1.9} className="text-[#0071e3]" />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#1d1d1f] tracking-[-0.015em]">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-[13px] text-[#1d1d1f]/60 leading-[1.65]">
                    {v.text}
                  </p>
                </div>
              )
            })}
          </StaggerChildren>
        </div>
      </section>

      {/* ═══════════════ Founder ═══════════════ */}
      <section className="relative bg-white py-20 lg:py-28 overflow-hidden">
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid md:grid-cols-5 gap-10 md:gap-14 items-start">
            <AnimateOnScroll animation="fade-right" className="md:col-span-2">
              <div className="lf-glass rounded-[26px] p-2">
                <div className="relative aspect-[3/4] rounded-[20px] overflow-hidden bg-gradient-to-br from-[#1d1d1f] via-[#2a2a2e] to-[#1d1d1f]">
                  {founderPhotoExists && founder?.image_url ? (
                    <Image
                      src={founder.image_url}
                      alt={`${founderName}, ${founderRole}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover"
                    />
                  ) : (
                    <>
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            "radial-gradient(circle at 50% 35%, rgba(0,113,227,0.32) 0%, transparent 65%)",
                        }}
                        aria-hidden
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[130px] font-bold text-[#0071e3]/75 leading-none tracking-tighter">
                          {founderInitials}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 via-black/35 to-transparent">
                    <p className="text-[16px] font-bold text-white">{founderName}</p>
                    <p className="text-[12px] text-white/80 mt-0.5">{founderRole}</p>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-left" delay={160} className="md:col-span-3">
              <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
                The Founder
              </span>
              <h2 className="mt-4 mb-6 text-[clamp(1.8rem,3.2vw,2.5rem)] font-bold text-[#1d1d1f] tracking-[-0.03em] leading-[1.1]">
                {founderName}
              </h2>
              {founderParagraphs.map((p, i) => (
                <p
                  key={i}
                  className={`text-[15px] text-[#1d1d1f]/65 leading-[1.8] ${
                    i === founderParagraphs.length - 1 ? "mb-7" : "mb-5"
                  }`}
                >
                  {p}
                </p>
              ))}

              {/* Pull quote */}
              <div className="lf-glass rounded-[22px] p-6 mb-7">
                <Quote size={20} className="text-[#0071e3] mb-3" fill="currentColor" />
                <p className="text-[15px] text-[#1d1d1f]/80 leading-[1.7] italic">
                  {FOUNDER_QUOTE}
                </p>
                <p className="mt-3 text-[12px] font-bold text-[#0071e3] uppercase tracking-[0.12em]">
                  {founderName} — {founderRole}
                </p>
              </div>

              {founder?.link_url && (
                <Link
                  href={founder.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0071e3] text-white text-[14px] font-bold transition-all duration-200 hover:bg-[#0077ed] shadow-[0_12px_28px_-10px_rgba(0,113,227,0.6)]"
                >
                  <Linkedin size={15} /> Connect on LinkedIn
                </Link>
              )}
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ═══════════════ Stats ═══════════════ */}
      <section className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(56% 52% at 50% 50%, rgba(0,113,227,0.08) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
          <StaggerChildren
            animation="scale"
            stagger={80}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5"
          >
            {(cmsStats.length > 0
              ? cmsStats.map((s) => ({
                  value: s.metric_value ?? "",
                  label: s.metric_label ?? s.title,
                }))
              : STATS
            ).map((s, i) => (
              <div
                key={`${s.label}-${i}`}
                className="lf-glass rounded-[24px] px-5 py-9 text-center"
              >
                <p className="text-[clamp(2.2rem,4.4vw,3.4rem)] font-bold text-[#1d1d1f] leading-none tracking-[-0.04em]">
                  {s.value}
                </p>
                <p className="mt-3 text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.12em]">
                  {s.label}
                </p>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="relative bg-white py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 56% at 50% 100%, rgba(0,113,227,0.1) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up">
            <div className="lf-glass-strong rounded-[32px] p-10 sm:p-14 text-center">
              <h2 className="text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold text-[#1d1d1f] tracking-[-0.03em] leading-[1.1]">
                Be part of the next chapter
              </h2>
              <p className="mt-4 text-[#1d1d1f]/60 text-[16px] leading-relaxed max-w-md mx-auto">
                A decade in, the room keeps growing. Whether you lead, build or
                partner — there is a place for you in The Leadership Federation.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-9 py-[16px] rounded-full font-bold text-[15px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_14px_34px_-10px_rgba(0,113,227,0.6)]"
                >
                  Get in Touch <ArrowRight size={16} />
                </Link>
                <Link
                  href="/platforms"
                  className="lf-glass inline-flex items-center px-7 py-[15px] rounded-full font-bold text-[15px] text-[#1d1d1f] transition-all duration-200"
                >
                  Platforms &amp; Services
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  )
}
