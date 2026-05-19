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
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Linkedin } from "@/components/icons/SocialIcons"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"
import { getAboutSections } from "@/app/actions/cmsActions"

export const revalidate = 86400

export const metadata = {
  title: "About | The Leadership Federation",
  description:
    "The Leadership Federation is a global platform connecting GCC leaders, CXOs, decision-makers, innovators, policymakers, and ecosystem builders.",
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

/** Check at build/render time whether the founder photo has been uploaded. */
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

const GALLERY = [
  { src: "/events/middle-east-asia.jpg", label: "Middle East & Asia" },
  { src: "/events/asia-leadership-awards.jpg", label: "Asia Leadership Awards" },
  { src: "/events/bharat-leadership-awards.jpg", label: "Bharat Leadership Summit" },
]

export default async function AboutPage() {
  let sections: AboutRow[] = []
  try {
    const res = await getAboutSections(true)
    if (res.success && res.sections) sections = res.sections as AboutRow[]
  } catch {
    /* empty state */
  }

  const pillars = sections.filter((s) => s.section_type === "pillar")
  const stats = sections.filter((s) => s.section_type === "stat")
  const vision = sections.find((s) => s.section_type === "vision")
  const founder = sections.find((s) => s.section_type === "founder")

  const founderPhotoExists = hasFounderPhoto(founder?.image_url)
  const founderParagraphs = (founder?.description ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <main>
      {/* ─────────────── Hero ─────────────── */}
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
              About Us
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
              The Leadership Federation is a global platform connecting GCC
              leaders, CXOs, decision-makers, innovators and policymakers — to
              drive meaningful impact across industries and borders.
            </p>
          </AnimateOnScroll>
        </div>

        {/* Image collage */}
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

      {/* ─────────────── Vision ─────────────── */}
      {vision && (
        <section className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(54% 52% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
                "radial-gradient(52% 56% at 50% 100%, rgba(0,113,227,0.1) 0%, transparent 72%)",
            }}
          />
          <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 lg:px-16">
            <AnimateOnScroll animation="scale">
              <div className="lf-glass-strong rounded-[32px] p-10 sm:p-14 lg:p-16 text-center">
                <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
                  Our Vision
                </span>
                <h2 className="mt-5 text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold text-[#1d1d1f] tracking-[-0.03em] leading-[1.12] max-w-3xl mx-auto">
                  {vision.title}
                </h2>
                {vision.description && (
                  <p className="mt-5 text-[#1d1d1f]/60 text-[16px] lg:text-[17px] leading-relaxed max-w-2xl mx-auto">
                    {vision.description}
                  </p>
                )}
              </div>
            </AnimateOnScroll>
          </div>
        </section>
      )}

      {/* ─────────────── Founder ─────────────── */}
      {founder && (
        <section className="relative bg-white py-20 lg:py-28 overflow-hidden">
          <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
            <div className="grid md:grid-cols-5 gap-10 md:gap-14 items-center">
              <AnimateOnScroll animation="fade-right" className="md:col-span-2">
                <div className="lf-glass rounded-[26px] p-2">
                  <div className="relative aspect-[3/4] rounded-[20px] overflow-hidden bg-gradient-to-br from-[#1d1d1f] via-[#2a2a2e] to-[#1d1d1f]">
                    {founderPhotoExists && founder.image_url ? (
                      <Image
                        src={founder.image_url}
                        alt={`${founder.title}, ${founder.subtitle ?? "Founder"} of The Leadership Federation`}
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
                              "radial-gradient(circle at 50% 35%, rgba(0,113,227,0.3) 0%, transparent 65%)",
                          }}
                          aria-hidden
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[140px] font-bold text-[#0071e3]/75 leading-none tracking-tighter">
                            {founder.title
                              .split(/\s+/)
                              .map((w) => w[0] ?? "")
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 via-black/35 to-transparent">
                      <p className="text-[16px] font-bold text-white">
                        {founder.title}
                      </p>
                      {founder.subtitle && (
                        <p className="text-[12px] text-white/80 mt-0.5">
                          {founder.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-left" delay={160} className="md:col-span-3">
                <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
                  The Founder
                </span>
                <h2 className="mt-4 mb-6 text-[clamp(1.8rem,3.2vw,2.5rem)] font-bold text-[#1d1d1f] tracking-[-0.03em] leading-[1.1]">
                  {founder.title}
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
                {founder.link_url && (
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
      )}

      {/* ─────────────── Pillars ─────────────── */}
      {pillars.length > 0 && (
        <section className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(54% 50% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
                "radial-gradient(50% 56% at 90% 96%, rgba(0,113,227,0.09) 0%, transparent 72%)",
            }}
          />
          <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
            <AnimateOnScroll animation="fade-up" className="text-center max-w-2xl mx-auto mb-12 lg:mb-14">
              <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
                Our Pillars
              </span>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
                Why the Federation exists
              </h2>
            </AnimateOnScroll>

            <StaggerChildren
              animation="fade-up"
              stagger={90}
              className="grid sm:grid-cols-2 gap-5"
            >
              {pillars.map((p) => {
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
          </div>
        </section>
      )}

      {/* ─────────────── Stats ─────────────── */}
      {stats.length > 0 && (
        <section className="relative bg-white py-20 lg:py-28 overflow-hidden">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(56% 50% at 50% 50%, rgba(0,113,227,0.06) 0%, transparent 72%)",
            }}
          />
          <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
            <StaggerChildren
              animation="scale"
              stagger={80}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5"
            >
              {stats.map((s) => (
                <div
                  key={s.id}
                  className="lf-glass rounded-[24px] px-5 py-9 text-center"
                >
                  <p className="text-[clamp(2.2rem,4.4vw,3.4rem)] font-bold text-[#1d1d1f] leading-none tracking-[-0.04em]">
                    {s.metric_value ?? ""}
                  </p>
                  <p className="mt-3 text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.12em]">
                    {s.metric_label ?? s.title}
                  </p>
                </div>
              ))}
            </StaggerChildren>
          </div>
        </section>
      )}

      {/* ─────────────── CTA ─────────────── */}
      <section className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden">
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
                Join the ecosystem
              </h2>
              <p className="mt-4 text-[#1d1d1f]/60 text-[16px] leading-relaxed max-w-md mx-auto">
                Whether you are a CXO seeking strategic connections, a leader
                driving transformation, or a policymaker shaping the future —
                there is a place for you in The Leadership Federation.
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
