import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
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

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function ArchivePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, slug, start_date, end_date, venue, description, cover_image_url, status"
    )
    .eq("status", "completed")
    .order("start_date", { ascending: false })

  const pastEvents = events ?? []

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

      {/* Archive Grid — real data from Supabase */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-xs font-bold text-black/25 uppercase tracking-[0.2em] mb-10">
          Past Editions ({pastEvents.length} events)
        </h2>

        {pastEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {pastEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group relative block rounded-2xl overflow-hidden bg-white border border-black/[0.06] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300"
              >
                {/* Cover image */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#e7ab1c]/10 to-[#e7ab1c]/5">
                  {event.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.cover_image_url}
                      alt={event.title}
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-[#e7ab1c]/20">
                        TLF
                      </span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                    Completed
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3
                    className="text-xl font-bold text-black mb-3 group-hover:text-[#e7ab1c] transition-colors"
                    style={sfFont}
                  >
                    {event.title}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-black/35 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} /> {fmtDate(event.start_date)}
                      {event.end_date &&
                        ` — ${fmtDate(event.end_date)}`}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} /> {event.venue}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-sm text-black/35 line-clamp-2 mb-4">
                      {event.description}
                    </p>
                  )}

                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e7ab1c] group-hover:text-[#d49c10] transition-colors">
                    View Event Details <ExternalLink size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-black/30 text-lg">
              No archived events yet.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
