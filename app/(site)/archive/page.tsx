import Link from "next/link"
import { Calendar, MapPin, ArrowRight, ExternalLink } from "lucide-react"
import { GoldStarburst } from "@/components/ui/GoldPattern"

export const metadata = {
  title: "Archive — Past Events | The Leadership Federation",
  description:
    "Browse the legacy of The Leadership Federation's past events — GCC Leadership Conclaves, Asia Leadership Awards, and Bharat Leadership Summits across 30+ countries.",
}

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

const legacyEvents = [
  {
    edition: "6th",
    title: "6th GCC Leadership Conclave",
    date: "September 8-9, 2025",
    venue: "Bengaluru, India",
    slug: "6th-gcc-leadership-conclave",
    highlights: [
      "500+ CXOs and GCC Leaders",
      "AI & Digital Transformation",
      "Cross-border leadership panels",
    ],
    coverImage:
      "https://img.einpresswire.com/large/757972/3rd-edition-middle-east-asia-le.png",
  },
  {
    edition: "5th",
    title: "5th GCC Leadership Conclave",
    date: "January 21-22, 2026",
    venue: "Pune, India",
    slug: "5th-gcc-leadership-conclave",
    highlights: [
      "400+ Senior Leaders",
      "Innovation & Talent Strategy",
      "GCC Excellence Awards",
    ],
    coverImage:
      "https://img.einpresswire.com/large/713803/4th-asia-leadership-awards.png",
  },
  {
    edition: "4th",
    title: "4th Asia Leadership Awards",
    date: "2024",
    venue: "Bangkok, Thailand",
    slug: "4th-asia-leadership-awards",
    highlights: [
      "Asia-wide leadership recognition",
      "C-suite roundtables",
      "Award ceremony gala",
    ],
    coverImage:
      "https://img.einpresswire.com/large/713803/4th-asia-leadership-awards.png",
  },
  {
    edition: "3rd",
    title: "3rd Middle East Asia Leadership Summit",
    date: "2024",
    venue: "Dubai, UAE",
    slug: "3rd-middle-east-asia-leadership-summit",
    highlights: [
      "GCC-Asia corridor leadership",
      "Cross-border investment panels",
      "Regional policy dialogue",
    ],
    coverImage:
      "https://img.einpresswire.com/large/757972/3rd-edition-middle-east-asia-le.png",
  },
  {
    edition: "",
    title: "Bharat Leadership Excellence Awards 2024",
    date: "2024",
    venue: "New Delhi, India",
    slug: "bharat-leadership-excellence-awards-2024",
    highlights: [
      "National leadership honours",
      "Industry visionary awards",
      "Policy & governance leaders",
    ],
    coverImage:
      "https://img.einpresswire.com/large/733208/bharat-leadership-excellence-aw.png",
  },
  {
    edition: "",
    title: "Bharat Leadership Awards",
    date: "2024",
    venue: "India",
    slug: "bharat-leadership-awards",
    highlights: [
      "Pan-India recognition",
      "Emerging leader spotlights",
      "Industry transformation awards",
    ],
    coverImage:
      "https://img.einpresswire.com/large/733210/bharat-leadership-awards.png",
  },
]

export default function ArchivePage() {
  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      {/* Hero */}
      <section className="relative pt-36 pb-20 px-6 overflow-hidden">
        <GoldStarburst />
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
            Legacy Events
          </span>
          <h1
            className="text-5xl md:text-7xl font-bold text-black mb-6 tracking-tight"
            style={sfFont}
          >
            Event <span className="text-[#e7ab1c]">Archive</span>
          </h1>
          <p className="text-lg text-black/40 max-w-2xl mx-auto leading-relaxed">
            Explore the journey of The Leadership Federation — every conclave,
            summit, and awards ceremony that has shaped global leadership
            discourse.
          </p>
        </div>
      </section>

      {/* Current Event Banner */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <Link
          href="/mumbai-2026"
          className="group block relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1a1a2e] to-[#16213e] p-8 md:p-12 border border-[#e7ab1c]/20 hover:border-[#e7ab1c]/40 transition-all duration-300 shadow-lg"
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.2em] mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Next Event
              </span>
              <h2
                className="text-3xl md:text-4xl font-bold text-white mb-2"
                style={sfFont}
              >
                7th GCC Leadership Conclave
              </h2>
              <p className="text-white/40 flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#e7ab1c]/60" /> May
                  21-22, 2026
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#e7ab1c]/60" /> Mumbai,
                  India
                </span>
              </p>
            </div>
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#e7ab1c] text-white group-hover:bg-[#d49c10] transition-colors shadow-[0_2px_12px_rgba(231,171,28,0.3)]">
              View Event <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      </section>

      {/* Archive Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-xs font-bold text-black/25 uppercase tracking-[0.2em] mb-10">
          Past Editions
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {legacyEvents.map((event) => (
            <div
              key={event.slug}
              className="group relative rounded-2xl overflow-hidden bg-white border border-black/[0.06] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300"
            >
              {/* Cover image */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#e7ab1c]/10 to-[#e7ab1c]/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.coverImage}
                  alt={event.title}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                {event.edition && (
                  <div className="absolute top-4 right-4 bg-[#e7ab1c] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    {event.edition} Edition
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3
                  className="text-xl font-bold text-black mb-3"
                  style={sfFont}
                >
                  {event.title}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-black/35 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} /> {event.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} /> {event.venue}
                  </span>
                </div>

                {/* Highlights */}
                <ul className="space-y-1.5 mb-5">
                  {event.highlights.map((h) => (
                    <li
                      key={h}
                      className="text-sm text-black/40 flex items-start gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-[#e7ab1c] mt-2 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>

                {/* SEO-preserving link to old event slug */}
                <Link
                  href={`/events/${event.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e7ab1c] hover:text-[#d49c10] transition-colors"
                >
                  View Event Details{" "}
                  <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
