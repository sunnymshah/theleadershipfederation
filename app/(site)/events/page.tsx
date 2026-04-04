import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { Calendar, MapPin, ArrowRight } from "lucide-react"

export const metadata = {
  title: "Events | The Leadership Federation",
  description: "World-class leadership summits, conclaves, and forums bringing together CXOs, policymakers, and thought leaders.",
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

function fmtMonth(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { month: "short" }).toUpperCase()
}

function fmtDay(d: string) {
  return new Date(d).getDate().toString().padStart(2, "0")
}

const sfFont = { fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }

export default async function EventsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: events } = await supabase
    .from("events")
    .select("id, title, slug, start_date, end_date, venue, description, cover_image_url, status")
    .eq("status", "published")
    .order("start_date", { ascending: true })

  const now = new Date()
  const upcoming = (events ?? []).filter(e => new Date(e.start_date) >= now)
  const past = (events ?? []).filter(e => new Date(e.start_date) < now)

  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      {/* Hero */}
      <section className="pt-36 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
            Curated Experiences
          </span>
          <h1
            className="text-5xl md:text-7xl font-bold text-black mb-6 tracking-tight"
            style={sfFont}
          >
            Our <span className="text-[#e7ab1c]">Events</span>
          </h1>
          <p className="text-lg text-black/40 max-w-2xl mx-auto leading-relaxed">
            World-class leadership summits, conclaves, and strategic forums bringing together
            CXOs, policymakers, and visionary thought leaders from 30+ countries.
          </p>
        </div>
      </section>

      {/* Upcoming Events */}
      {upcoming.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 mb-24">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xs font-bold text-black/40 uppercase tracking-[0.2em]">
              Upcoming Events
            </h2>
          </div>

          <div className="grid gap-6">
            {upcoming.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group relative block rounded-2xl overflow-hidden transition-all duration-300 bg-white/70 border border-black/[0.04] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
              >
                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-8">
                  {/* Date block */}
                  <div className="shrink-0 w-24 h-24 rounded-2xl flex flex-col items-center justify-center bg-[#e7ab1c]/10 border border-[#e7ab1c]/20">
                    <span className="text-3xl font-bold text-[#e7ab1c] leading-none tabular-nums">
                      {fmtDay(event.start_date)}
                    </span>
                    <span className="text-[10px] font-bold text-[#e7ab1c]/60 uppercase tracking-[0.15em] mt-1">
                      {fmtMonth(event.start_date)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-2xl md:text-3xl font-bold text-black group-hover:text-[#e7ab1c] transition-colors duration-300 mb-3"
                      style={sfFont}
                    >
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap gap-5 text-sm text-black/30 mb-4">
                      <span className="flex items-center gap-2">
                        <Calendar size={14} className="text-black/20" />
                        {fmtDate(event.start_date)} — {fmtDate(event.end_date)}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin size={14} className="text-black/20" />
                        {event.venue}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-black/25 line-clamp-2 max-w-2xl">{event.description}</p>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="shrink-0 flex items-center">
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-[#e7ab1c] opacity-0 group-hover:opacity-100 transition-all duration-300 border border-[#e7ab1c]/30 bg-[#e7ab1c]/5">
                      View Details <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Past Events */}
      {past.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <h2 className="text-xs font-bold text-black/25 uppercase tracking-[0.2em] mb-10">
            Past Events
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {past.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group block rounded-xl p-6 transition-all duration-300 bg-white/50 border border-black/[0.04] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 bg-[#e7ab1c]/10">
                    <span className="text-sm font-bold text-[#e7ab1c] leading-none tabular-nums">{fmtDay(event.start_date)}</span>
                    <span className="text-[8px] font-bold text-[#e7ab1c]/50 uppercase tracking-wider">{fmtMonth(event.start_date)}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-black/60 group-hover:text-black transition-colors truncate">
                      {event.title}
                    </h3>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-black/25">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(event.start_date)}</span>
                  <span className="flex items-center gap-1"><MapPin size={11} /> {event.venue}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {(events ?? []).length === 0 && (
        <div className="max-w-6xl mx-auto px-6 text-center pb-32">
          <div className="w-20 h-20 rounded-2xl bg-[#e7ab1c]/10 border border-[#e7ab1c]/20 flex items-center justify-center mx-auto mb-6">
            <Calendar size={32} className="text-[#e7ab1c]" />
          </div>
          <p className="text-black/40 text-lg mb-2">No events published yet.</p>
          <p className="text-black/25 text-sm">Check back soon for upcoming leadership gatherings.</p>
        </div>
      )}
    </main>
  )
}
