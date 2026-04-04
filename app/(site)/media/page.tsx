import {
  Mic2,
  Play,
  Clock,
  ArrowRight,
  Newspaper,
  Video,
  ExternalLink,
  PlayCircle,
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

const YOUTUBE_CHANNEL = "https://www.youtube.com/@theleadershipfederation"

const VIDEO_HIGHLIGHTS = [
  {
    title: "5th GCC Leadership Conclave Highlights",
    label: "Bengaluru 2025",
    embedId: "dQw4w9WgXcQ",
  },
  {
    title: "Asia Leadership Awards Ceremony",
    label: "Dubai 2025",
    embedId: "dQw4w9WgXcQ",
  },
  {
    title: "Panel: Talent Wars in a Borderless World",
    label: "Dubai Summit",
    embedId: "dQw4w9WgXcQ",
  },
  {
    title: "Inner Circle Retreat Recap",
    label: "Goa 2025",
    embedId: "dQw4w9WgXcQ",
  },
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

      {/* Featured: The Sunny Shah Show — YouTube Embed */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-white/70 border border-black/[0.04] rounded-2xl overflow-hidden md:flex shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
          <div className="md:w-1/2 bg-black flex items-center justify-center min-h-[320px] relative">
            <iframe
              src="https://www.youtube.com/embed/videoseries?list=UU_theleadershipfederation"
              title="The Sunny Shah Show — Latest Episode"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
            {/* Fallback play button if iframe blocked */}
            <noscript>
              <div className="flex flex-col items-center gap-4 text-white/40">
                <div className="w-20 h-20 rounded-full border-2 border-[#e7ab1c]/30 flex items-center justify-center">
                  <Play size={32} className="text-[#e7ab1c] ml-1" />
                </div>
              </div>
            </noscript>
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
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#e7ab1c]/10 text-xs font-medium text-[#e7ab1c]">
                <Mic2 size={12} /> 60+ Episodes
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#e7ab1c]/10 text-xs font-medium text-[#e7ab1c]">
                <Clock size={12} /> Weekly Release
              </span>
            </div>
            <Link
              href={YOUTUBE_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors w-fit shadow-[0_4px_16px_rgba(220,38,38,0.25)]"
            >
              <PlayCircle size={18} /> Watch on YouTube
            </Link>
          </div>
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

      {/* Videos & Highlights — YouTube Embeds */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <Video size={18} className="text-[#e7ab1c]" />
            <h2 className="text-2xl font-bold text-black" style={sfFont}>
              Videos & Highlights
            </h2>
          </div>
          <Link
            href={YOUTUBE_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#e7ab1c] hover:underline"
          >
            View all on YouTube <ExternalLink size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {VIDEO_HIGHLIGHTS.map((vid) => (
            <div
              key={vid.title}
              className="bg-white/70 border border-black/[0.04] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
            >
              <div className="w-full aspect-video bg-black relative">
                <iframe
                  src={`https://www.youtube.com/embed/${vid.embedId}`}
                  title={vid.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>

              <div className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-black">
                    {vid.title}
                  </h3>
                  <span className="text-[11px] text-black/30 uppercase tracking-wider font-medium">
                    {vid.label}
                  </span>
                </div>
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
              href={YOUTUBE_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-red-600 text-white text-sm font-semibold transition-all duration-200 hover:bg-red-700 shadow-[0_4px_20px_rgba(220,38,38,0.25)]"
            >
              <PlayCircle size={18} /> Subscribe on YouTube
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-black/10 text-black/50 text-sm font-semibold transition-all duration-200 hover:border-black/20"
            >
              Contact Us <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
