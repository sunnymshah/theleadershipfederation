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
  MessageSquare,
  Globe,
  ShieldCheck,
  Handshake,
  Users,
  TrendingUp,
  Award,
  Sparkles,
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

const sfFont = { fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }

/** Check at build/render time whether the founder photo has been uploaded. */
function hasFounderPhoto(imageUrl?: string | null): boolean {
  if (!imageUrl) return false
  // If it's an external URL (http/https), assume it exists.
  if (/^https?:\/\//.test(imageUrl)) return true
  try {
    const rel = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl
    return existsSync(path.join(process.cwd(), "public", rel))
  } catch {
    return false
  }
}

export default async function AboutPage() {
  let sections: AboutRow[] = []
  try {
    const res = await getAboutSections(true)
    if (res.success && res.sections) {
      sections = res.sections as AboutRow[]
    }
  } catch {
    /* empty state */
  }

  const pillars = sections.filter(s => s.section_type === "pillar")
  const stats   = sections.filter(s => s.section_type === "stat")
  const vision  = sections.find(s => s.section_type === "vision")
  const founder = sections.find(s => s.section_type === "founder")

  const founderPhotoExists = hasFounderPhoto(founder?.image_url)
  const founderParagraphs = (founder?.description ?? "")
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)

  return (
    <main className="">
      {/* Hero */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up" delay={0}>
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-6">
              About Us
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={100}>
            <h1
              className="text-[#1a1a2e] leading-[1.08] font-bold mb-8"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", ...sfFont }}
            >
              The Leadership Federation
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={200}>
            <p className="text-lg md:text-xl text-[#1a1a2e]/70 leading-relaxed max-w-3xl mx-auto">
              A global leadership platform connecting GCC leaders, CXOs,
              decision-makers, innovators, policymakers, and ecosystem builders
              to drive meaningful impact across industries and borders.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Vision */}
      {vision && (
        <section className="pb-16 px-6">
          <div className="max-w-5xl mx-auto">
            <AnimateOnScroll animation="scale">
              <div className="rounded-3xl bg-white border border-[#1a1a2e]/[0.06] shadow-sm p-12 md:p-20 text-center relative overflow-hidden">
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    width: "700px",
                    height: "400px",
                    borderRadius: "50%",
                    background: "radial-gradient(ellipse at center, rgba(231,171,28,0.10) 0%, transparent 60%)",
                  }}
                  aria-hidden
                />
                <div className="relative z-10">
                  <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-6">
                    Our Vision
                  </span>
                  <h2
                    className="text-[#1a1a2e] leading-[1.12] font-bold max-w-3xl mx-auto"
                    style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", ...sfFont }}
                  >
                    {vision.title}
                  </h2>
                  {vision.description && (
                    <p className="mt-6 text-[#1a1a2e]/70 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
                      {vision.description}
                    </p>
                  )}
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>
      )}

      {/* Founder */}
      {founder && (
        <section className="pb-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-5 gap-12 md:gap-16 items-start">
              <AnimateOnScroll animation="fade-right" className="md:col-span-2">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-[#1a1a2e]/[0.06] shadow-sm relative bg-gradient-to-br from-[#1a1a2e] via-[#2a2440] to-[#1a1a2e]">
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
                            "radial-gradient(circle at 50% 35%, rgba(231,171,28,0.22) 0%, transparent 65%)",
                        }}
                        aria-hidden
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className="text-[140px] font-bold text-[#e7ab1c]/80 leading-none tracking-tighter"
                          style={sfFont}
                        >
                          {founder.title
                            .split(/\s+/)
                            .map(w => w[0] ?? "")
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#1a1a2e]/85 via-[#1a1a2e]/40 to-transparent">
                    <p className="text-base font-bold text-white">{founder.title}</p>
                    {founder.subtitle && (
                      <p className="text-xs text-white/85 mt-0.5">{founder.subtitle}</p>
                    )}
                  </div>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-left" delay={200} className="md:col-span-3">
                <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
                  The Founder
                </span>
                <h2
                  className="text-[#1a1a2e] leading-[1.12] font-bold mb-6"
                  style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", ...sfFont }}
                >
                  {founder.title}
                </h2>
                {founderParagraphs.map((p, i) => (
                  <p
                    key={i}
                    className={`text-[15px] text-[#1a1a2e]/75 leading-[1.8] ${
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0A66C2] text-white text-sm font-semibold transition-opacity duration-200 hover:opacity-90 shadow-sm"
                  >
                    <Linkedin size={15} /> Connect on LinkedIn
                  </Link>
                )}
              </AnimateOnScroll>
            </div>
          </div>
        </section>
      )}

      {/* Why TLF Exists (pillars) */}
      {pillars.length > 0 && (
        <section className="pb-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
                Our Pillars
              </span>
              <h2
                className="text-[#1a1a2e] leading-[1.12] font-bold"
                style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", ...sfFont }}
              >
                Why TLF Exists
              </h2>
            </div>

            <StaggerChildren animation="fade-up" stagger={100} className="grid sm:grid-cols-2 gap-5">
              {pillars.map((p) => {
                const Icon = resolveIcon(p.icon)
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-white p-8 md:p-10 border border-[#1a1a2e]/[0.06] shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#e7ab1c]/30"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center mb-5">
                      <Icon size={22} strokeWidth={1.6} className="text-[#e7ab1c]" />
                    </div>
                    <h3 className="text-[17px] font-bold text-[#1a1a2e] mb-3">
                      {p.title}
                    </h3>
                    {p.description && (
                      <p className="text-[14px] text-[#1a1a2e]/70 leading-[1.7]">
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

      {/* Stats */}
      {stats.length > 0 && (
        <section className="pb-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl bg-white border border-[#1a1a2e]/[0.06] shadow-sm p-10 md:p-16">
              <StaggerChildren animation="scale" stagger={80} className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
                {stats.map((s) => (
                  <div key={s.id}>
                    <p
                      className="text-[#e7ab1c] leading-none font-bold mb-2"
                      style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", ...sfFont }}
                    >
                      {s.metric_value ?? ""}
                    </p>
                    <p className="text-[13px] font-semibold text-[#1a1a2e]/65 uppercase tracking-[0.15em]">
                      {s.metric_label ?? s.title}
                    </p>
                  </div>
                ))}
              </StaggerChildren>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="pb-20 px-6">
        <AnimateOnScroll animation="fade-up">
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="text-[#1a1a2e] leading-[1.12] font-bold mb-5"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", ...sfFont }}
            >
              Join the Ecosystem
            </h2>
            <p className="text-[#1a1a2e]/70 text-base leading-relaxed mb-10 max-w-xl mx-auto">
              Whether you are a CXO seeking strategic connections, a GCC leader
              driving transformation, or a policymaker shaping the future, there
              is a place for you in The Leadership Federation.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#e7ab1c] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#d49c10] shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
            >
              Get in Touch
              <ArrowRight size={16} />
            </Link>
          </div>
        </AnimateOnScroll>
      </section>
    </main>
  )
}
