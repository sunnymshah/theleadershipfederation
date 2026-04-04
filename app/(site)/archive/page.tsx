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

/* ── Map Supabase slugs → real external event pages on TLF domains ── */
const externalUrls: Record<string, string> = {
  // GCC Leadership Conclave series
  "gcc-leadership-conclave-bengaluru-may-2025":
    "https://gcc1.theleadershipfederation.com",
  "3rd-gcc-leadership-conclave-bengaluru-sep-2025":
    "https://gcc3.theleadershipfederation.com",
  "4th-gcc-leadership-conclave-hyderabad":
    "https://gcc4.theleadershipfederation.com",
  "5th-gcc-leadership-conclave-pune":
    "https://gcc.theleadershipfederation.com/pune",
  "6th-gcc-leadership-conclave-bengaluru":
    "https://gcc.theleadershipfederation.com/bengaluru",

  // Asia Leadership Awards series
  "3rd-asia-leadership-awards-mumbai":
    "https://theleadershipfederation.com/pastwinners-asia-leadership-3rd-edition-mumbai",
  "4th-asia-leadership-awards-bangkok":
    "https://theleadershipfederation.com/asialeadershipawardsbangkok2024",
  "5th-asia-leadership-awards-mumbai":
    "https://www.theleadershipfederation.com/5th-asia-leadership-awards-mumbai",
  "7th-asia-leadership-awards-kuala-lumpur":
    "https://www.theleadershipfederation.com/7th-asia-leadership-awards-kuala-lumpur-malaysia",

  // Middle East Asia Leadership Awards
  "middle-east-asia-leadership-awards-dubai-2024":
    "https://theleadershipfederation.com/middleeastasiadubai",

  // Bharat Leadership series
  "2nd-bharat-leadership-excellence-awards-delhi":
    "https://theleadershipfederation.com/2ndbharatleadershipawards",
  "bharat-leadership-excellence-awards":
    "https://theleadershipfederation.com/bharatleadershipexcellenceawards",
}

/* ── Fallback cover images for events without cover_image_url ── */
const fallbackImages: Record<string, string> = {
  "4th-gcc-leadership-conclave-hyderabad":
    "https://img.einpresswire.com/large/757972/3rd-edition-middle-east-asia-le.png",
  "3rd-gcc-leadership-conclave-bengaluru-sep-2025":
    "https://img.einpresswire.com/large/713803/4th-asia-leadership-awards.png",
  "7th-asia-leadership-awards-kuala-lumpur":
    "https://img.einpresswire.com/large/713803/4th-asia-leadership-awards.png",
  "gcc-leadership-conclave-bengaluru-may-2025":
    "https://img.einpresswire.com/large/733210/bharat-leadership-awards.png",
  "2nd-bharat-leadership-excellence-awards-delhi":
    "https://img.einpresswire.com/large/733208/bharat-leadership-excellence-aw.png",
  "5th-asia-leadership-awards-mumbai":
    "https://img.einpresswire.com/large/757972/3rd-edition-middle-east-asia-le.png",
  "4th-asia-leadership-awards-bangkok":
    "https://img.einpresswire.com/large/713803/4th-asia-leadership-awards.png",
  "3rd-asia-leadership-awards-mumbai":
    "https://img.einpresswire.com/large/733210/bharat-leadership-awards.png",
  "middle-east-asia-leadership-awards-dubai-2024":
    "https://img.einpresswire.com/large/757972/3rd-edition-middle-east-asia-le.png",
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
      <section className="relative pt-28 sm:pt-36 pb-14 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        <GoldStarburst />
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
            Legacy Events
          </span>
          <h1
            className="text-4xl sm:text-5xl md:text-7xl font-bold text-black mb-4 sm:mb-6 tracking-tight"
            style={sfFont}
          >
            Event <span className="text-[#e7ab1c]">Archive</span>
          </h1>
          <p className="text-base sm:text-lg text-black/40 max-w-2xl mx-auto leading-relaxed px-2">
            Explore the journey of The Leadership Federation — every conclave,
            summit, and awards ceremony that has shaped global leadership
            discourse.
          </p>
        </div>
      </section>

      {/* Current Event Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-10 sm:mb-16">
        <Link
          href="/mumbai-2026"
          className="group block relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1a1a2e] to-[#16213e] p-6 sm:p-8 md:p-12 border border-[#e7ab1c]/20 hover:border-[#e7ab1c]/40 transition-all duration-300 shadow-lg"
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.2em] mb-2 sm:mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Next Event
              </span>
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2"
                style={sfFont}
              >
                7th GCC Leadership Conclave
              </h2>
              <p className="text-white/40 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
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
            <span className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm font-semibold bg-[#e7ab1c] text-white group-hover:bg-[#d49c10] transition-colors shadow-[0_2px_12px_rgba(231,171,28,0.3)] w-full sm:w-auto">
              View Event <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      </section>

      {/* Archive Grid — real data from Supabase */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <h2 className="text-xs font-bold text-black/25 uppercase tracking-[0.2em] mb-6 sm:mb-10">
          Past Editions ({pastEvents.length} events)
        </h2>

        {pastEvents.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {pastEvents.map((event) => {
              const extUrl = externalUrls[event.slug]
              const coverImg =
                event.cover_image_url || fallbackImages[event.slug]

              const card = (
                <div className="group relative block rounded-2xl overflow-hidden bg-white border border-black/[0.06] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
                  {/* Cover image */}
                  <div className="relative h-36 sm:h-48 overflow-hidden bg-gradient-to-br from-[#e7ab1c]/10 to-[#e7ab1c]/5">
                    {coverImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverImg}
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
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Completed
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6">
                    <h3
                      className="text-base sm:text-xl font-bold text-black mb-2 sm:mb-3 group-hover:text-[#e7ab1c] transition-colors line-clamp-2"
                      style={sfFont}
                    >
                      {event.title}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4 text-xs sm:text-sm text-black/35 mb-3 sm:mb-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} /> {fmtDate(event.start_date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} /> {event.venue}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-xs sm:text-sm text-black/35 line-clamp-2 mb-3 sm:mb-4">
                        {event.description}
                      </p>
                    )}

                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#e7ab1c] group-hover:text-[#d49c10] transition-colors">
                      View Event Details <ExternalLink size={13} />
                    </span>
                  </div>
                </div>
              )

              /* If we have a real external URL, link to it; otherwise link to internal event page */
              if (extUrl) {
                return (
                  <a
                    key={event.id}
                    href={extUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {card}
                  </a>
                )
              }

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="block"
                >
                  {card}
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-black/30 text-lg">No archived events yet.</p>
          </div>
        )}
      </section>
    </main>
  )
}
