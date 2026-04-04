import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { Calendar, MapPin, ArrowRight } from "lucide-react"

export const metadata = { title: "Events | The Leadership Federation" }

export default async function EventsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: events } = await supabase
    .from("events")
    .select("id, title, slug, start_date, end_date, venue, description, cover_image_url, status")
    .eq("status", "published")
    .order("start_date", { ascending: true })

  const upcoming = (events ?? []).filter(e => new Date(e.start_date) >= new Date())
  const past = (events ?? []).filter(e => new Date(e.start_date) < new Date())

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
          Our <span className="text-[#c9a84c]">Events</span>
        </h1>
        <p className="text-lg text-white/50 max-w-2xl">
          World-class leadership summits, conclaves, and forums bringing together CXOs, policymakers, and thought leaders.
        </p>
      </div>

      {/* Upcoming Events */}
      {upcoming.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 mb-20">
          <h2 className="text-xs font-bold text-[#c9a84c] uppercase tracking-[0.2em] mb-8">Upcoming Events</h2>
          <div className="grid gap-6">
            {upcoming.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group block rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#c9a84c]/20 transition-all duration-300 overflow-hidden"
              >
                <div className="p-8 flex flex-col md:flex-row md:items-center gap-6">
                  {/* Date badge */}
                  <div className="shrink-0 w-20 h-20 rounded-xl bg-[#c9a84c]/10 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-[#c9a84c]">
                      {new Date(event.start_date).getDate()}
                    </span>
                    <span className="text-[10px] font-bold text-[#c9a84c]/70 uppercase tracking-wider">
                      {new Date(event.start_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white group-hover:text-[#c9a84c] transition-colors mb-2">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-white/40">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-white/25" />
                        {fmtDate(event.start_date)} — {fmtDate(event.end_date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-white/25" />
                        {event.venue}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-white/35 mt-3 line-clamp-2">{event.description}</p>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="shrink-0">
                    <ArrowRight size={20} className="text-white/20 group-hover:text-[#c9a84c] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Past Events */}
      {past.length > 0 && (
        <section className="max-w-6xl mx-auto px-6">
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-8">Past Events</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {past.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group block rounded-xl border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03] transition-all p-6"
              >
                <h3 className="text-lg font-semibold text-white/70 group-hover:text-white/90 mb-2">{event.title}</h3>
                <div className="flex flex-wrap gap-3 text-xs text-white/30">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {fmtDate(event.start_date)}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {event.venue}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* No events */}
      {(events ?? []).length === 0 && (
        <div className="max-w-6xl mx-auto px-6 text-center py-20">
          <Calendar size={48} className="mx-auto mb-4 text-white/10" />
          <p className="text-white/30 text-lg">No events published yet. Check back soon.</p>
        </div>
      )}
    </div>
  )
}
