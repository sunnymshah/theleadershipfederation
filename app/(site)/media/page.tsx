/* ═══════════════════════════════════════════════════════════════════════════
 *  MEDIA & THOUGHT LEADERSHIP — Server Component
 *
 *  Showcases The Sunny Shah Show podcast, press mentions, and video
 *  highlights. Placeholder data throughout; swap for CMS/Supabase later.
 * ═══════════════════════════════════════════════════════════════════════════ */

import {
  Mic2,
  Play,
  Clock,
  Calendar,
  ExternalLink,
  ArrowRight,
  Newspaper,
  Video,
} from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Media & Thought Leadership | The Leadership Federation",
  description:
    "Watch The Sunny Shah Show, explore press coverage, and dive into video highlights from The Leadership Federation's global events.",
}

/* ─── Placeholder data ──────────────────────────────────────────────────── */

interface Episode {
  title: string
  guest: string
  role: string
  duration: string
  date: string
}

const EPISODES: Episode[] = [
  {
    title: "The Future of GCCs in India",
    guest: "Rajesh Nair",
    role: "CTO, Infosys",
    duration: "42 min",
    date: "Mar 18, 2026",
  },
  {
    title: "AI-First Leadership",
    guest: "Dr. Lisa Chen",
    role: "VP Research, Google DeepMind",
    duration: "38 min",
    date: "Mar 4, 2026",
  },
  {
    title: "Building Resilient Supply Chains",
    guest: "Henrik Müller",
    role: "COO, Maersk Asia",
    duration: "45 min",
    date: "Feb 20, 2026",
  },
  {
    title: "Women in the Boardroom",
    guest: "Sunita Reddy",
    role: "Chairperson, Apex Health Group",
    duration: "36 min",
    date: "Feb 6, 2026",
  },
  {
    title: "Sovereign AI and National Strategy",
    guest: "Gen. (Ret.) Avi Katz",
    role: "Former Director, Israel Innovation Authority",
    duration: "50 min",
    date: "Jan 22, 2026",
  },
  {
    title: "From Startup to Scale-Up in MENA",
    guest: "Omar Al-Farouk",
    role: "CEO, Gulf Ventures Capital",
    duration: "41 min",
    date: "Jan 8, 2026",
  },
]

const PRESS_OUTLETS = [
  "Economic Times",
  "Forbes",
  "Business Standard",
  "CNBC",
  "Bloomberg",
  "YourStory",
]

const VIDEO_HIGHLIGHTS = [
  { title: "5th GCC Leadership Conclave Highlights", label: "Bengaluru 2025" },
  { title: "Keynote: The AI Imperative for CXOs", label: "Sunny Shah" },
  { title: "Panel: Talent Wars in a Borderless World", label: "Dubai Summit" },
  { title: "Inner Circle Retreat Recap", label: "Goa 2025" },
]

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function MediaPage() {
  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="pt-36 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold text-[#1a1a2e]/50 uppercase tracking-[0.25em] mb-5">
            Insights & Conversations
          </span>
          <h1 className="text-4xl md:text-6xl font-bold font-serif tracking-tight text-[#1a1a2e] mb-6">
            Media &amp; Thought Leadership
          </h1>
          <p className="text-lg text-[#1a1a2e]/55 max-w-2xl mx-auto leading-relaxed">
            Original conversations with global CXOs, exclusive event coverage, and the
            ideas shaping the future of leadership — all in one place.
          </p>
        </div>
      </section>

      {/* ── Featured: The Sunny Shah Show ───────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div
          className="bg-white rounded-2xl overflow-hidden md:flex"
          style={{
            boxShadow:
              "0 2px 8px rgba(26,26,46,0.04), 0 8px 28px rgba(26,26,46,0.04)",
          }}
        >
          {/* Video / Player placeholder */}
          <div className="md:w-1/2 bg-[#1a1a2e] flex items-center justify-center min-h-[320px] relative">
            <div className="flex flex-col items-center gap-4 text-white/40">
              <div className="w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center">
                <Play size={32} className="text-white/50 ml-1" />
              </div>
              <span className="text-sm font-medium">Watch Latest Episode</span>
            </div>
          </div>

          {/* Description */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <Mic2 size={18} className="text-[#1a1a2e]/40" />
              <span className="text-[11px] font-bold text-[#1a1a2e]/40 uppercase tracking-[0.2em]">
                Featured Show
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-[#1a1a2e] mb-4">
              The Sunny Shah Show
            </h2>
            <p className="text-[#1a1a2e]/55 leading-relaxed mb-6">
              Raw, unscripted conversations with the world&apos;s most influential business
              leaders, policymakers, and innovators. Each episode dives deep into the
              decisions, pivots, and philosophies that define modern leadership — from
              boardrooms to nation-building.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1a1a2e]/[0.05] text-xs font-medium text-[#1a1a2e]/60">
                <Mic2 size={12} /> 60+ Episodes
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1a1a2e]/[0.05] text-xs font-medium text-[#1a1a2e]/60">
                <Clock size={12} /> Weekly Release
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Episodes Grid ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold font-serif text-[#1a1a2e]">
            Recent Episodes
          </h2>
          <span className="text-sm font-medium text-[#1a1a2e]/40">
            View all episodes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {EPISODES.map((ep) => (
            <div
              key={ep.title}
              className="bg-white rounded-2xl p-6 flex flex-col transition-shadow duration-300 hover:shadow-lg group cursor-pointer"
              style={{
                boxShadow:
                  "0 1px 3px rgba(26,26,46,0.04), 0 4px 14px rgba(26,26,46,0.03)",
              }}
            >
              {/* Thumbnail placeholder */}
              <div className="w-full aspect-video rounded-xl bg-[#1a1a2e]/[0.05] flex items-center justify-center mb-5 relative overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-[#1a1a2e]/[0.08] flex items-center justify-center group-hover:bg-[#1a1a2e]/[0.14] transition-colors duration-300">
                  <Play size={20} className="text-[#1a1a2e]/40 ml-0.5" />
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-[#1a1a2e]/35 mb-3">
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {ep.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> {ep.date}
                </span>
              </div>

              {/* Title & guest */}
              <h3 className="text-base font-bold text-[#1a1a2e] mb-1.5 leading-snug">
                {ep.title}
              </h3>
              <p className="text-sm text-[#1a1a2e]/50 mt-auto">
                {ep.guest},{" "}
                <span className="text-[#1a1a2e]/35">{ep.role}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── In The Press ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex items-center gap-3 mb-10">
          <Newspaper size={18} className="text-[#1a1a2e]/35" />
          <h2 className="text-2xl font-bold font-serif text-[#1a1a2e]">
            In The Press
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {PRESS_OUTLETS.map((outlet) => (
            <div
              key={outlet}
              className="bg-white rounded-xl h-24 flex items-center justify-center px-4 transition-shadow duration-300 hover:shadow-md cursor-pointer group"
              style={{
                boxShadow:
                  "0 1px 3px rgba(26,26,46,0.04), 0 4px 14px rgba(26,26,46,0.03)",
              }}
            >
              <span className="text-sm font-semibold text-[#1a1a2e]/30 group-hover:text-[#1a1a2e]/55 transition-colors duration-200 text-center select-none">
                {outlet}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Videos & Highlights ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex items-center gap-3 mb-10">
          <Video size={18} className="text-[#1a1a2e]/35" />
          <h2 className="text-2xl font-bold font-serif text-[#1a1a2e]">
            Videos &amp; Highlights
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {VIDEO_HIGHLIGHTS.map((vid) => (
            <div
              key={vid.title}
              className="bg-white rounded-2xl overflow-hidden transition-shadow duration-300 hover:shadow-lg group cursor-pointer"
              style={{
                boxShadow:
                  "0 1px 3px rgba(26,26,46,0.04), 0 4px 14px rgba(26,26,46,0.03)",
              }}
            >
              {/* Thumbnail placeholder */}
              <div className="w-full aspect-video bg-[#1a1a2e]/[0.05] flex items-center justify-center relative">
                <div className="w-14 h-14 rounded-full bg-[#1a1a2e]/[0.08] flex items-center justify-center group-hover:bg-[#1a1a2e]/[0.14] transition-colors duration-300">
                  <Play size={24} className="text-[#1a1a2e]/40 ml-0.5" />
                </div>
                <span className="absolute bottom-3 left-4 text-[10px] font-bold text-[#1a1a2e]/30 uppercase tracking-[0.15em]">
                  {vid.label}
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-base font-bold text-[#1a1a2e] group-hover:text-[#1a1a2e]/80 transition-colors">
                  {vid.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Subscribe CTA ───────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-28">
        <div
          className="rounded-2xl p-10 md:p-14 text-center bg-white"
          style={{
            boxShadow:
              "0 2px 8px rgba(26,26,46,0.04), 0 8px 28px rgba(26,26,46,0.04)",
          }}
        >
          <div className="w-14 h-14 rounded-full bg-[#1a1a2e]/[0.06] flex items-center justify-center mx-auto mb-6">
            <Mic2 size={24} className="text-[#1a1a2e]/50" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-[#1a1a2e] mb-4">
            Subscribe to The Sunny Shah Show
          </h2>
          <p className="text-[#1a1a2e]/50 max-w-xl mx-auto mb-8 leading-relaxed">
            New episodes every week featuring candid conversations with the world&apos;s
            most impactful leaders. Available on YouTube, Spotify, Apple Podcasts, and
            all major platforms.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#1a1a2e] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#1a1a2e]/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              Subscribe Now <ArrowRight size={15} />
            </Link>
            <Link
              href="#"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[#1a1a2e]/15 text-[#1a1a2e]/70 text-sm font-semibold transition-all duration-200 hover:border-[#1a1a2e]/30 hover:text-[#1a1a2e]"
            >
              Watch on YouTube <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
