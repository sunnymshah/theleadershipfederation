import {
  Mic2,
  Play,
  Clock,
  ArrowRight,
  Newspaper,
  Video,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Media & Thought Leadership | The Leadership Federation",
  description:
    "Watch The Sunny Shah Show, explore press coverage, and dive into video highlights from The Leadership Federation's global events.",
}

const PRESS_OUTLETS = [
  "Economic Times",
  "Forbes India",
  "Business Standard",
  "CNBC-TV18",
  "YourStory",
  "Gulf News",
]

const VIDEO_HIGHLIGHTS = [
  { title: "5th GCC Leadership Conclave Highlights", label: "Bengaluru 2025" },
  { title: "Asia Leadership Awards Ceremony", label: "Dubai 2025" },
  { title: "Panel: Talent Wars in a Borderless World", label: "Dubai Summit" },
  { title: "Inner Circle Retreat Recap", label: "Goa 2025" },
]

const sfFont = { fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }

export default function MediaPage() {
  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      {/* Hero */}
      <section className="pt-36 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
            Insights & Conversations
          </span>
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight text-black mb-6"
            style={sfFont}
          >
            Media & Thought Leadership
          </h1>
          <p className="text-lg text-black/40 max-w-2xl mx-auto leading-relaxed">
            Original conversations with global CXOs, exclusive event coverage, and the
            ideas shaping the future of leadership — all in one place.
          </p>
        </div>
      </section>

      {/* Featured: The Sunny Shah Show */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-white/70 border border-black/[0.04] rounded-2xl overflow-hidden md:flex shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
          <div className="md:w-1/2 bg-black flex items-center justify-center min-h-[320px] relative">
            <div className="flex flex-col items-center gap-4 text-white/40">
              <div className="w-20 h-20 rounded-full border-2 border-[#e7ab1c]/30 flex items-center justify-center">
                <Play size={32} className="text-[#e7ab1c] ml-1" />
              </div>
              <span className="text-sm font-medium">Watch Latest Episode</span>
            </div>
          </div>

          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <Mic2 size={18} className="text-[#e7ab1c]" />
              <span className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.2em]">
                Featured Show
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4" style={sfFont}>
              The Sunny Shah Show
            </h2>
            <p className="text-black/40 leading-relaxed mb-6">
              Raw, unscripted conversations with the world&apos;s most influential business
              leaders, policymakers, and innovators. Each episode dives deep into the
              decisions, pivots, and philosophies that define modern leadership.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#e7ab1c]/10 text-xs font-medium text-[#e7ab1c]">
                <Mic2 size={12} /> 60+ Episodes
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#e7ab1c]/10 text-xs font-medium text-[#e7ab1c]">
                <Clock size={12} /> Weekly Release
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Episodes — Coming Soon placeholder instead of fake names */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-black mb-10" style={sfFont}>
          Recent Episodes
        </h2>

        <div className="bg-white/70 border border-black/[0.04] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#e7ab1c]/10 flex items-center justify-center mx-auto mb-6">
            <Mic2 size={28} className="text-[#e7ab1c]" />
          </div>
          <h3 className="text-xl font-bold text-black mb-3" style={sfFont}>
            Episodes Coming Soon
          </h3>
          <p className="text-black/35 text-[15px] max-w-md mx-auto">
            Full episode listings will be available here shortly. Subscribe to get notified
            when new episodes drop.
          </p>
        </div>
      </section>

      {/* In The Press */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex items-center gap-3 mb-10">
          <Newspaper size={18} className="text-[#e7ab1c]" />
          <h2 className="text-2xl font-bold text-black" style={sfFont}>
            In The Press
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {PRESS_OUTLETS.map((outlet) => (
            <div
              key={outlet}
              className="bg-white/70 border border-black/[0.04] rounded-xl h-24 flex items-center justify-center px-4 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] cursor-pointer group"
            >
              <span className="text-sm font-semibold text-black/25 group-hover:text-black/50 transition-colors duration-200 text-center select-none">
                {outlet}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Videos & Highlights */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex items-center gap-3 mb-10">
          <Video size={18} className="text-[#e7ab1c]" />
          <h2 className="text-2xl font-bold text-black" style={sfFont}>
            Videos & Highlights
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {VIDEO_HIGHLIGHTS.map((vid) => (
            <div
              key={vid.title}
              className="bg-white/70 border border-black/[0.04] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] group cursor-pointer"
            >
              <div className="w-full aspect-video bg-black/[0.03] flex items-center justify-center relative">
                <div className="w-14 h-14 rounded-full bg-[#e7ab1c]/10 flex items-center justify-center group-hover:bg-[#e7ab1c]/20 transition-colors duration-300">
                  <Play size={24} className="text-[#e7ab1c] ml-0.5" />
                </div>
                <span className="absolute bottom-3 left-4 text-[10px] font-bold text-black/25 uppercase tracking-[0.15em]">
                  {vid.label}
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-base font-bold text-black group-hover:text-black/70 transition-colors">
                  {vid.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-28">
        <div className="rounded-2xl p-10 md:p-14 text-center bg-white/70 border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
          <div className="w-14 h-14 rounded-full bg-[#e7ab1c]/10 flex items-center justify-center mx-auto mb-6">
            <Mic2 size={24} className="text-[#e7ab1c]" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" style={sfFont}>
            Subscribe to The Sunny Shah Show
          </h2>
          <p className="text-black/35 max-w-xl mx-auto mb-8 leading-relaxed">
            New episodes every week featuring candid conversations with the world&apos;s
            most impactful leaders. Available on YouTube, Spotify, Apple Podcasts, and
            all major platforms.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#e7ab1c] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#d49c10] shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
            >
              Subscribe Now <ArrowRight size={15} />
            </Link>
            <Link
              href="#"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-black/10 text-black/50 text-sm font-semibold transition-all duration-200 hover:border-black/20"
            >
              Watch on YouTube <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
