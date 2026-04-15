import {
  Mic2,
  Clock,
  ArrowRight,
  Newspaper,
  Video,
  ExternalLink,
  PlayCircle,
} from "lucide-react"
import Image from "next/image"
import { Linkedin, Instagram, Facebook } from "@/components/icons/SocialIcons"
import Link from "next/link"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"
import { getMediaData } from "@/app/actions/cmsActions"

export const revalidate = 86400

export const metadata = {
  title: "Media & Thought Leadership | The Leadership Federation",
  description:
    "Watch The Sunny Shah Show, explore press coverage, and dive into video highlights from The Leadership Federation's global events.",
}

/* ── Types ────────────────────────────────────────────────────────────── */

type Outlet = {
  id: string
  name: string
  logo_url: string | null
  article_url: string | null
  sort_order: number
}

type MediaVideo = {
  id: string
  title: string
  description: string | null
  youtube_id: string | null
  thumbnail_url: string | null
  label: string | null
  sort_order: number
}

// Real social URLs from the official Leadership Federation website
const SOCIAL = {
  linkedin: "https://www.linkedin.com/company/leadership-federation/",
  instagram: "https://www.instagram.com/leadershipfederation/",
  facebook: "https://facebook.com/theleadershipfederation",
  whatsapp: "https://wa.me/919327471565",
}

const sfFont = { fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }

export default async function MediaPage() {
  let outlets: Outlet[] = []
  let videos: MediaVideo[] = []

  try {
    const res = await getMediaData(true)
    if (res.success) {
      outlets = (res.outlets ?? []) as Outlet[]
      videos  = (res.videos  ?? []) as MediaVideo[]
    }
  } catch {
    /* empty state */
  }

  const realVideos = videos.filter((v) => v.youtube_id)

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
              Insights & Conversations
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={120}>
            <h1
              className="text-4xl md:text-6xl font-bold tracking-tight text-[#1a1a2e] mb-6"
              style={sfFont}
            >
              Media & Thought Leadership
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={240}>
            <p className="text-lg text-[#1a1a2e]/70 max-w-2xl mx-auto leading-relaxed">
              Original conversations with global CXOs, exclusive event coverage, and the
              ideas shaping the future of leadership — all in one place.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Featured: The Sunny Shah Show */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-white border border-[#1a1a2e]/[0.06] rounded-2xl overflow-hidden md:flex shadow-sm">
          <div
            className="md:w-1/2 relative min-h-[320px] flex items-center justify-center overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #1a1a2e 0%, #2a2440 50%, #1a1a2e 100%)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: "500px",
                  height: "500px",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(231,171,28,0.18) 0%, transparent 60%)",
                }}
              />
            </div>
            <div className="relative z-10 flex flex-col items-center gap-4 text-center px-8">
              <div className="w-24 h-24 rounded-full border-2 border-[#e7ab1c]/60 flex items-center justify-center backdrop-blur-sm bg-[#e7ab1c]/10">
                <PlayCircle size={44} className="text-[#e7ab1c]" />
              </div>
              <p className="text-white text-xl font-bold tracking-tight" style={sfFont}>
                The Sunny Shah Show
              </p>
              <p className="text-white/70 text-sm">
                Episodes drop on our social channels
              </p>
            </div>
          </div>

          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <Mic2 size={18} className="text-[#e7ab1c]" />
              <span className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.2em]">
                Featured Show
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4" style={sfFont}>
              The Sunny Shah Show
            </h2>
            <p className="text-[#1a1a2e]/70 leading-relaxed mb-6">
              Raw, unscripted conversations with the world&apos;s most influential business
              leaders, policymakers, and innovators. Each episode dives deep into the
              decisions, pivots, and philosophies that define modern leadership.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#e7ab1c]/10 text-xs font-semibold text-[#a37410] border border-[#e7ab1c]/30">
                <Mic2 size={12} /> CXO Conversations
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#e7ab1c]/10 text-xs font-semibold text-[#a37410] border border-[#e7ab1c]/30">
                <Clock size={12} /> New episodes regularly
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={SOCIAL.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0A66C2] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
              >
                <Linkedin size={16} /> Watch on LinkedIn
              </Link>
              <Link
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-tr from-[#E1306C] via-[#F77737] to-[#FCAF45] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
              >
                <Instagram size={16} /> Instagram
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* In The Press */}
      {outlets.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <AnimateOnScroll animation="fade-up">
            <div className="flex items-center gap-3 mb-10">
              <Newspaper size={18} className="text-[#e7ab1c]" />
              <h2 className="text-2xl font-bold text-[#1a1a2e]" style={sfFont}>
                In The Press
              </h2>
            </div>
          </AnimateOnScroll>

          <StaggerChildren className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" animation="fade-up" stagger={80}>
            {outlets.map((outlet) => {
              const cardInner = outlet.logo_url ? (
                <Image
                  src={outlet.logo_url}
                  alt={outlet.name}
                  width={120}
                  height={48}
                  className="max-h-10 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <span className="text-sm font-semibold text-[#1a1a2e]/65 group-hover:text-[#1a1a2e] transition-colors duration-200 text-center select-none">
                  {outlet.name}
                </span>
              )
              const commonCls =
                "bg-white border border-[#1a1a2e]/[0.06] rounded-xl h-24 flex items-center justify-center px-4 transition-all duration-300 hover:shadow-md hover:border-[#e7ab1c]/30 group shadow-sm"
              return outlet.article_url ? (
                <Link
                  key={outlet.id}
                  href={outlet.article_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${commonCls} cursor-pointer`}
                >
                  {cardInner}
                </Link>
              ) : (
                <div key={outlet.id} className={commonCls}>
                  {cardInner}
                </div>
              )
            })}
          </StaggerChildren>
        </section>
      )}

      {/* Videos & Highlights */}
      {realVideos.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <Video size={18} className="text-[#e7ab1c]" />
              <h2 className="text-2xl font-bold text-[#1a1a2e]" style={sfFont}>
                Videos & Highlights
              </h2>
            </div>
            <Link
              href={SOCIAL.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e7ab1c] hover:underline"
            >
              View all on LinkedIn <ExternalLink size={13} />
            </Link>
          </div>

          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 gap-6" animation="scale" stagger={100}>
            {realVideos.map((vid) => (
              <div
                key={vid.id}
                className="bg-white border border-[#1a1a2e]/[0.06] rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <div className="w-full aspect-video bg-[#1a1a2e] relative">
                  <iframe
                    src={`https://www.youtube.com/embed/${vid.youtube_id}`}
                    title={vid.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>

                <div className="p-5">
                  <h3 className="text-base font-bold text-[#1a1a2e]">{vid.title}</h3>
                  {vid.label && (
                    <span className="text-[11px] text-[#1a1a2e]/55 uppercase tracking-wider font-medium">
                      {vid.label}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </StaggerChildren>
        </section>
      )}

      {/* Follow CTA */}
      <AnimateOnScroll as="section" className="max-w-4xl mx-auto px-6 pb-16" animation="fade-up">
        <div className="rounded-2xl p-10 md:p-14 text-center bg-white border border-[#1a1a2e]/[0.06] shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#e7ab1c]/15 flex items-center justify-center mx-auto mb-6 border border-[#e7ab1c]/30">
            <Mic2 size={24} className="text-[#e7ab1c]" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-4" style={sfFont}>
            Follow The Sunny Shah Show
          </h2>
          <p className="text-[#1a1a2e]/70 max-w-xl mx-auto mb-8 leading-relaxed">
            Get new episodes featuring candid conversations with the world&apos;s
            most impactful leaders. Follow us on LinkedIn, Instagram, and Facebook.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={SOCIAL.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0A66C2] text-white text-sm font-semibold transition-opacity duration-200 hover:opacity-90 shadow-sm"
            >
              <Linkedin size={16} /> LinkedIn
            </Link>
            <Link
              href={SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-tr from-[#E1306C] via-[#F77737] to-[#FCAF45] text-white text-sm font-semibold transition-opacity duration-200 hover:opacity-90 shadow-sm"
            >
              <Instagram size={16} /> Instagram
            </Link>
            <Link
              href={SOCIAL.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1877F2] text-white text-sm font-semibold transition-opacity duration-200 hover:opacity-90 shadow-sm"
            >
              <Facebook size={16} /> Facebook
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#1a1a2e]/[0.12] text-[#1a1a2e] text-sm font-semibold transition-all duration-200 hover:border-[#e7ab1c]/60 hover:bg-[#e7ab1c]/[0.06]"
            >
              Contact Us <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </AnimateOnScroll>
    </main>
  )
}
