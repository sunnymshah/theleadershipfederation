import Link from "next/link"
import Image from "next/image"
import {
  Calendar,
  MapPin,
  Users,
  Mic2,
  Award,
  Globe,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { GoldChevrons, GoldDiamonds, GoldOrbs } from "@/components/ui/GoldPattern"

export const metadata = {
  title:
    "7th GCC Leadership Conclave — Mumbai 2026 | The Leadership Federation",
  description:
    "Join 700+ CXOs, GCC leaders, and policymakers at the 7th GCC Leadership Conclave in Mumbai. May 21-22, 2026. AI integration, talent strategy, and cross-border leadership.",
}

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}
const sfText = {
  fontFamily:
    "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

const themes = [
  {
    icon: Globe,
    title: "AI-First GCC Operations",
    description:
      "How leading GCCs are integrating agentic AI into core operations, from automation to decision intelligence.",
  },
  {
    icon: Users,
    title: "Talent-First Leadership",
    description:
      "Building future-ready talent pipelines. Retention, upskilling, and culture strategies for GCC leaders.",
  },
  {
    icon: Mic2,
    title: "Cross-Border Strategy",
    description:
      "Navigating geopolitical complexity. GCC expansion, multi-country operations, and regulatory agility.",
  },
  {
    icon: Award,
    title: "GCC Excellence Awards",
    description:
      "Recognising transformational GCC leaders driving innovation, impact, and global best practices.",
  },
]

const agenda = [
  {
    day: "Day 1 — May 21",
    sessions: [
      { time: "09:00 - 09:30", title: "Registration & Networking Breakfast", type: "networking" },
      { time: "09:30 - 10:00", title: "Opening Keynote: The Future of GCCs in India", type: "keynote" },
      { time: "10:00 - 11:00", title: "Panel: AI-First GCC Operations — From Hype to Reality", type: "panel" },
      { time: "11:00 - 11:30", title: "Networking Break", type: "break" },
      { time: "11:30 - 12:30", title: "Fireside Chat: Building a Culture of Innovation", type: "keynote" },
      { time: "12:30 - 13:30", title: "Lunch & Executive Roundtables", type: "networking" },
      { time: "13:30 - 14:30", title: "Workshop: Talent Strategy for 2027 and Beyond", type: "workshop" },
      { time: "14:30 - 15:30", title: "Panel: Cross-Border GCC Expansion Playbook", type: "panel" },
      { time: "15:30 - 16:00", title: "Closing Keynote: Leadership in the Agentic Era", type: "keynote" },
      { time: "16:00 - 18:00", title: "Networking Reception & Cocktails", type: "networking" },
    ],
  },
  {
    day: "Day 2 — May 22",
    sessions: [
      { time: "09:00 - 09:30", title: "Morning Networking & Coffee", type: "networking" },
      { time: "09:30 - 10:30", title: "Keynote: India as the Global GCC Capital", type: "keynote" },
      { time: "10:30 - 11:30", title: "Panel: Data-Driven Decision Making at Scale", type: "panel" },
      { time: "11:30 - 12:00", title: "Break", type: "break" },
      { time: "12:00 - 13:00", title: "Workshop: Building Resilient GCC Teams", type: "workshop" },
      { time: "13:00 - 14:00", title: "Lunch", type: "break" },
      { time: "14:00 - 15:30", title: "GCC Excellence Awards Ceremony", type: "keynote" },
      { time: "15:30 - 16:00", title: "Closing Remarks & Next Steps", type: "keynote" },
    ],
  },
]

const typeColors: Record<string, string> = {
  keynote: "bg-[#e7ab1c]/10 text-[#e7ab1c]",
  panel: "bg-purple-500/10 text-purple-600",
  workshop: "bg-emerald-500/10 text-emerald-600",
  networking: "bg-blue-500/10 text-blue-600",
  break: "bg-gray-200/60 text-gray-500",
}

const stats = [
  { value: "700+", label: "CXOs & Leaders" },
  { value: "50+", label: "Speakers" },
  { value: "30+", label: "Countries" },
  { value: "2", label: "Days" },
]

export default function Mumbai2026Page() {
  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      {/* ── HERO ── */}
      <section className="relative pt-28 pb-24 overflow-hidden">
        <GoldChevrons />
        <GoldOrbs />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-12">
            {/* Left */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.15em] bg-[#e7ab1c]/10 border border-[#e7ab1c]/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Registrations Open
                </span>
                <span className="px-3 py-1.5 rounded-full text-[11px] font-bold text-white bg-[#e7ab1c] uppercase">
                  7th Edition
                </span>
              </div>

              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-black tracking-tight leading-[1.05] mb-6"
                style={sfFont}
              >
                GCC Leadership
                <br />
                <span className="text-[#e7ab1c]">Conclave</span>
              </h1>

              <div className="flex flex-wrap gap-5 text-sm text-black/40 mb-8" style={sfText}>
                <span className="flex items-center gap-2">
                  <Calendar size={15} className="text-[#e7ab1c]" />
                  May 21-22, 2026
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={15} className="text-[#e7ab1c]" />
                  Mumbai, India
                </span>
              </div>

              <p
                className="text-lg text-black/45 max-w-lg leading-relaxed mb-10"
                style={sfText}
              >
                The flagship gathering of 700+ GCC leaders, CXOs, and
                policymakers. Two days of high-impact keynotes, strategic panels,
                and curated networking.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-[#e7ab1c] text-white hover:bg-[#d49c10] transition-all shadow-[0_4px_20px_rgba(231,171,28,0.3)] active:scale-[0.97]"
                  style={sfText}
                >
                  Register Now <ArrowRight size={15} />
                </Link>
                <Link
                  href="#agenda"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-black/50 border border-black/10 hover:border-black/20 hover:text-black/70 transition-all"
                  style={sfText}
                >
                  <Clock size={15} /> View Agenda
                </Link>
              </div>
            </div>

            {/* Right — Hero image */}
            <div className="lg:w-[480px] shrink-0">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-black/[0.06]">
                <Image
                  src="/hero-speaker.jpg"
                  alt="Speaker on stage at a Leadership Federation event"
                  width={960}
                  height={1280}
                  className="w-full h-auto object-cover"
                  priority
                />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-sm font-semibold">
                    Live at a Leadership Federation Event
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-10 border-t border-black/[0.06]">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div
                  className="text-3xl md:text-4xl font-bold text-black mb-1"
                  style={sfFont}
                >
                  {s.value}
                </div>
                <div
                  className="text-xs font-bold text-black/25 uppercase tracking-[0.15em]"
                  style={sfText}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THEMES ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-4 block">
              What to Expect
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold text-black tracking-tight"
              style={sfFont}
            >
              Key Themes
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {themes.map((theme) => {
              const Icon = theme.icon
              return (
                <div
                  key={theme.title}
                  className="p-8 rounded-2xl bg-white border border-black/[0.05] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#e7ab1c]/10 flex items-center justify-center mb-5">
                    <Icon size={22} className="text-[#e7ab1c]" />
                  </div>
                  <h3
                    className="text-xl font-bold text-black mb-3"
                    style={sfFont}
                  >
                    {theme.title}
                  </h3>
                  <p className="text-sm text-black/40 leading-relaxed">
                    {theme.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── AGENDA ── */}
      <section id="agenda" className="py-24 relative overflow-hidden">
        <GoldDiamonds className="opacity-30" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-4 block">
              The Programme
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold text-black tracking-tight"
              style={sfFont}
            >
              Event Agenda
            </h2>
          </div>

          {agenda.map((day) => (
            <div key={day.day} className="mb-14 last:mb-0">
              <h3
                className="text-lg font-bold text-black mb-6 pb-3 border-b border-black/[0.06]"
                style={sfFont}
              >
                {day.day}
              </h3>
              <div className="space-y-3">
                {day.sessions.map((s, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-white border border-black/[0.04] hover:shadow-sm transition-all"
                  >
                    <span className="shrink-0 text-sm font-mono text-black/30 w-36 tabular-nums">
                      {s.time}
                    </span>
                    <div className="flex-1 flex items-center gap-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${typeColors[s.type] ?? ""}`}
                      >
                        {s.type}
                      </span>
                      <span className="text-sm font-medium text-black/70">
                        {s.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY ATTEND ── */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-4 block">
              Your Invitation
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold text-black tracking-tight"
              style={sfFont}
            >
              Why Attend
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {[
              "Curated access to 700+ CXOs and GCC decision-makers",
              "Strategic panels on AI, talent, and cross-border expansion",
              "Private roundtable sessions with industry leaders",
              "GCC Excellence Awards recognition ceremony",
              "2 days of high-impact networking and deal-making",
              "Insights from 50+ speakers across 30+ countries",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2
                  size={18}
                  className="text-[#e7ab1c] mt-0.5 shrink-0"
                />
                <span className="text-sm text-black/50" style={sfText}>
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold bg-[#e7ab1c] text-white hover:bg-[#d49c10] transition-all shadow-[0_4px_20px_rgba(231,171,28,0.3)] active:scale-[0.97]"
              style={sfText}
            >
              Secure Your Seat <ArrowRight size={16} />
            </Link>
            <p className="text-xs text-black/25 mt-4" style={sfText}>
              Limited to 700 attendees. Early-bird pricing available.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
