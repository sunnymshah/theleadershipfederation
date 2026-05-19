import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import {
  Calendar, MapPin, ArrowRight, Globe, Users, Handshake, Sparkles,
} from "lucide-react"
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll"
import { ArchiveFilteredGrid } from "@/components/site/ArchiveYearFilter"

export const revalidate = 3600

export const metadata = {
  title: "Archive — Past Events | The Leadership Federation",
  description:
    "Browse the legacy of The Leadership Federation's past events — GCC Leadership Conclaves, Asia Leadership Awards, and Bharat Leadership Summits across 30+ countries. Every past edition links to its own event page.",
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  })
}

function extractEdition(title: string): string {
  const match = title.match(/(\d+(?:st|nd|rd|th))/i)
  return match ? match[1] : ""
}

/* Cover images for the seeded legacy events — GCC conclaves use their
 * own event thumbnails; awards & summits use the real series photo.
 * A cover_image_url set in the DB always takes precedence. */
const LEGACY_COVERS: Record<string, string> = {
  "legacy-gcc-5": "/events/legacy/gcc-5.png",
  "legacy-gcc-ai": "/events/legacy/gcc-ai.png",
  "legacy-gcc-4": "/events/legacy/gcc-4.png",
  "legacy-gcc-3": "/events/legacy/gcc-3.png",
  "legacy-gcc-2": "/events/legacy/gcc-2.png",
  "legacy-gcc-1": "/events/legacy/gcc-1.png",
  "legacy-ala-7": "/events/legacy/ala-banner.jpg",
  "legacy-ala-6": "/events/legacy/ala-photo.jpg",
  "legacy-ala-5": "/events/legacy/ala-banner.jpg",
  "legacy-ala-4": "/events/legacy/ala-photo.jpg",
  "legacy-ala-3": "/events/legacy/ala-banner.jpg",
  "legacy-ala-2": "/events/legacy/ala-2.jpg",
  "legacy-meala-3": "/events/legacy/meala-3.jpg",
  "legacy-meala-2": "/events/legacy/meala-2.jpg",
  "legacy-blea-2": "/events/legacy/blea-banner.jpg",
  "legacy-blea-1": "/events/legacy/blea-banner.jpg",
  "legacy-issa-2": "/events/legacy/issa-2.jpg",
  "legacy-issa-1": "/events/legacy/issa-1.jpg",
}

export default async function ArchivePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  /* Next upcoming/most-recent published event for the banner */
  const { data: nextEvent } = await supabase
    .from("events")
    .select("id, title, slug, start_date, end_date, venue")
    .eq("status", "published")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  /* Completed events — native + the 20 seeded legacy editions */
  const { data: dbEvents } = await supabase
    .from("events")
    .select("id, title, slug, start_date, end_date, venue, description, cover_image_url, status, series, external_url")
    .eq("status", "completed")
    .order("start_date", { ascending: false })

  const [{ count: partnerCount }, { count: attendeeCount }] = await Promise.all([
    supabase.from("partners").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("attendees").select("*", { count: "exact", head: true }),
  ])

  const allCards = (dbEvents ?? [])
    .map((e) => ({
      id: e.id,
      title: e.title,
      date: fmtDate(e.start_date),
      sortDate: e.start_date,
      year: new Date(e.start_date).getFullYear(),
      venue: e.venue || "",
      city: e.venue || "",
      series: (e.series as string | null) ?? "The Leadership Federation",
      edition: extractEdition(e.title),
      description: e.description || "",
      coverImage: e.cover_image_url || LEGACY_COVERS[e.slug as string] || undefined,
      slug: e.slug,
      externalUrl: (e.external_url as string | null) ?? undefined,
    }))
    .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())

  const uniqueCities = new Set(allCards.map((e) => e.city).filter(Boolean))

  const stats = [
    { icon: Calendar, count: allCards.length, label: "Past Events" },
    { icon: Globe, count: uniqueCities.size, label: "Cities" },
    { icon: Users, count: attendeeCount ?? 0, label: "CXOs" },
    { icon: Handshake, count: partnerCount ?? 0, label: "Global Partners" },
  ].filter((s) => s.count > 0)

  return (
    <main className="bg-white">
      {/* ══════════════ Hero ══════════════ */}
      <section className="relative bg-white pt-32 lg:pt-40 pb-14 lg:pb-16 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(58% 56% at 50% 0%, rgba(0,113,227,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              Legacy Events
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={110}>
            <h1 className="mt-4 sm:mt-5 text-[clamp(2.6rem,6vw,4.6rem)] font-bold text-[#1d1d1f] tracking-[-0.04em] leading-[1.0]">
              The Event <span className="text-[#0071e3]">Archive</span>
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={220}>
            <p className="mt-5 sm:mt-6 text-[15px] sm:text-[18px] text-[#1d1d1f]/60 leading-relaxed max-w-2xl mx-auto">
              Every conclave, summit and awards ceremony The Leadership Federation
              has staged across 30+ countries — each edition links straight to
              its own event page.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ══════════════ Archive ══════════════ */}
      <section className="relative bg-[#f5f5f7] py-16 sm:py-20 lg:py-24 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 46% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
              "radial-gradient(50% 56% at 88% 96%, rgba(0,113,227,0.09) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          {/* Next-event banner */}
          {nextEvent && (
            <AnimateOnScroll animation="fade-up">
              <Link
                href={`/events/${nextEvent.slug}`}
                className="lf-glass-strong group block rounded-[24px] p-6 sm:p-8 mb-10 sm:mb-12 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div>
                    <span className="inline-flex items-center gap-2 text-[11px] font-bold text-[#0071e3] uppercase tracking-[0.18em] mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Next Event
                    </span>
                    <h2 className="text-[clamp(1.4rem,3vw,2.1rem)] font-bold text-[#1d1d1f] tracking-[-0.025em] leading-[1.12]">
                      {nextEvent.title}
                    </h2>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#1d1d1f]/60">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-[#0071e3]" />
                        {fmtDate(nextEvent.start_date)}
                        {nextEvent.end_date && ` — ${fmtDate(nextEvent.end_date)}`}
                      </span>
                      {nextEvent.venue && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-[#0071e3]" />
                          {nextEvent.venue}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[14px] font-bold text-white bg-[#0071e3] group-hover:bg-[#0077ed] transition-all duration-200 shadow-[0_12px_30px_-10px_rgba(0,113,227,0.6)] shrink-0">
                    View Event <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </AnimateOnScroll>
          )}

          {allCards.length > 0 ? (
            <AnimateOnScroll animation="fade-up">
              <ArchiveFilteredGrid cards={allCards} />
            </AnimateOnScroll>
          ) : (
            <div className="lf-glass-strong rounded-[28px] p-12 sm:p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#0071e3] flex items-center justify-center mx-auto mb-6 shadow-[0_14px_32px_-10px_rgba(0,113,227,0.7)]">
                <Sparkles size={28} className="text-white" />
              </div>
              <h3 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-[#1d1d1f] tracking-[-0.02em] mb-3">
                The archive is being assembled
              </h3>
              <p className="text-[15px] text-[#1d1d1f]/60 max-w-md mx-auto leading-relaxed">
                Past editions will appear here as the record is completed.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════ Stats ══════════════ */}
      {stats.length > 0 && (
        <section className="relative bg-white py-16 sm:py-20 lg:py-28 overflow-hidden">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(56% 52% at 50% 50%, rgba(0,113,227,0.07) 0%, transparent 72%)",
            }}
          />
          <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
            <AnimateOnScroll animation="fade-up" className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
              <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
                A Decade of Convening
              </span>
              <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
                The legacy, in numbers
              </h2>
            </AnimateOnScroll>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
              {stats.map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="lf-glass rounded-[24px] px-5 py-9 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#0071e3] flex items-center justify-center mx-auto mb-4 shadow-[0_10px_24px_-8px_rgba(0,113,227,0.6)]">
                      <Icon size={21} className="text-white" strokeWidth={1.8} />
                    </div>
                    <p className="text-[clamp(2rem,4vw,3rem)] font-bold text-[#1d1d1f] leading-none tracking-[-0.04em]">
                      {s.count}+
                    </p>
                    <p className="mt-2.5 text-[11px] font-semibold text-[#0071e3] uppercase tracking-[0.12em]">
                      {s.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
