import { cookies } from "next/headers"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { Calendar, MapPin, Mic2, User } from "lucide-react"
import { GoldStarburst } from "@/components/ui/GoldPattern"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"

export const revalidate = 900 // 15 min cache — speakers rarely change mid-day

export const metadata = {
  title: "Speakers | The Leadership Federation",
  description:
    "Meet the CXOs, policymakers, and thought leaders shaping our conclaves, summits, and leadership awards — past and upcoming.",
}

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

type Speaker = {
  id: string
  name: string
  designation: string | null
  company: string | null
  bio: string | null
  image_url: string | null
  sort_order: number
  events: {
    id: string
    slug: string
    title: string
    start_date: string
    venue: string | null
    status: string
  } | null
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default async function SpeakersPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Pull every speaker, joined to their event, so the page is driven
  // entirely by what's in the DB. Nothing hardcoded — add a speaker in
  // /admin/events/<id> and it appears here automatically.
  const { data: speakersData } = await supabase
    .from("speakers")
    .select(
      `id, name, designation, company, bio, image_url, sort_order,
       events ( id, slug, title, start_date, venue, status )`,
    )
    .order("sort_order", { ascending: true })

  const speakers = (speakersData ?? []) as unknown as Speaker[]

  // Group by event for a cleaner narrative: upcoming events first, then
  // past. Speakers not tied to an event fall into a "Guest Speakers" pool.
  const groups = new Map<
    string,
    { eventTitle: string; eventSlug: string; eventDate: string; venue: string | null; status: string; speakers: Speaker[] }
  >()
  const orphans: Speaker[] = []

  for (const sp of speakers) {
    if (sp.events) {
      const key = sp.events.id
      if (!groups.has(key)) {
        groups.set(key, {
          eventTitle: sp.events.title,
          eventSlug: sp.events.slug,
          eventDate: sp.events.start_date,
          venue: sp.events.venue,
          status: sp.events.status,
          speakers: [],
        })
      }
      groups.get(key)!.speakers.push(sp)
    } else {
      orphans.push(sp)
    }
  }

  const orderedGroups = Array.from(groups.values()).sort((a, b) => {
    // Upcoming (published) first, then completed, both sorted by date desc
    const aIsUpcoming = a.status !== "completed"
    const bIsUpcoming = b.status !== "completed"
    if (aIsUpcoming !== bIsUpcoming) return aIsUpcoming ? -1 : 1
    return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  })

  const hasAnySpeakers = speakers.length > 0

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-20 sm:pt-24 pb-10 sm:pb-14 px-4 sm:px-6 overflow-hidden">
        <GoldStarburst />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e7ab1c] to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5 px-4 py-1.5 rounded-full bg-[#e7ab1c]/8 border border-[#e7ab1c]/15">
              Voices That Shape the Stage
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={120}>
            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-bold text-[#1a1a2e] mb-4 sm:mb-6 tracking-tight"
              style={sfFont}
            >
              Our{" "}
              <span className="bg-gradient-to-r from-[#e7ab1c] to-[#d49c10] bg-clip-text text-transparent">
                Speakers
              </span>
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={240}>
            <p className="text-base sm:text-lg text-[#1a1a2e]/75 max-w-2xl mx-auto leading-relaxed px-2">
              The leaders, operators, and visionaries who take our stage —
              from Fortune 500 CXOs to policymakers to breakout founders.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {!hasAnySpeakers ? (
        <section className="max-w-4xl mx-auto px-6 pb-24 text-center">
          <div className="border-2 border-dashed border-[#e0e0e0] rounded-2xl p-12 bg-white/40">
            <Mic2 size={32} className="mx-auto text-[#c9a84c] mb-4" />
            <h3 className="text-lg font-semibold text-[#1a1a2e] mb-1">
              Speakers will be announced soon
            </h3>
            <p className="text-sm text-[#1a1a2e]/65">
              Check back shortly — our programming team is finalising the
              line-up for upcoming events.
            </p>
          </div>
        </section>
      ) : (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 space-y-14">
          {orderedGroups.map((group) => (
            <div key={group.eventSlug}>
              <AnimateOnScroll animation="fade-up">
                <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                  <div>
                    <span className="inline-block text-[10px] font-bold text-[#e7ab1c] uppercase tracking-[0.22em] mb-1">
                      {group.status === "completed" ? "Past Edition" : "Upcoming"}
                    </span>
                    <h2
                      className="text-xl sm:text-2xl font-bold text-[#1a1a2e]"
                      style={sfFont}
                    >
                      {group.eventTitle}
                    </h2>
                    <p className="text-xs text-[#1a1a2e]/60 mt-1 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={12} className="text-[#e7ab1c]" />
                        {fmtDate(group.eventDate)}
                      </span>
                      {group.venue && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={12} className="text-[#e7ab1c]" />
                          {group.venue}
                        </span>
                      )}
                    </p>
                  </div>
                  <Link
                    href={`/events/${group.eventSlug}`}
                    className="text-xs font-semibold text-[#e7ab1c] hover:text-[#d49c10] transition-colors"
                  >
                    View event →
                  </Link>
                </div>
              </AnimateOnScroll>

              <StaggerChildren
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5"
                animation="fade-up"
                stagger={60}
              >
                {group.speakers.map((sp) => (
                  <SpeakerCard key={sp.id} speaker={sp} />
                ))}
              </StaggerChildren>
            </div>
          ))}

          {orphans.length > 0 && (
            <div>
              <AnimateOnScroll animation="fade-up">
                <div className="mb-6">
                  <span className="inline-block text-[10px] font-bold text-[#e7ab1c] uppercase tracking-[0.22em] mb-1">
                    Featured Voices
                  </span>
                  <h2
                    className="text-xl sm:text-2xl font-bold text-[#1a1a2e]"
                    style={sfFont}
                  >
                    Guest Speakers
                  </h2>
                </div>
              </AnimateOnScroll>
              <StaggerChildren
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5"
                animation="fade-up"
                stagger={60}
              >
                {orphans.map((sp) => (
                  <SpeakerCard key={sp.id} speaker={sp} />
                ))}
              </StaggerChildren>
            </div>
          )}
        </section>
      )}
    </main>
  )
}

function SpeakerCard({ speaker }: { speaker: Speaker }) {
  return (
    <div className="group bg-white border border-[#1a1a2e]/[0.06] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#e7ab1c]/25 transition-all duration-300">
      <div className="relative aspect-[4/5] bg-[#F4F8FF]">
        {speaker.image_url ? (
          <Image
            src={speaker.image_url}
            alt={speaker.name}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <User size={48} className="text-[#1a1a2e]/15" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/35 via-transparent to-transparent" />
      </div>
      <div className="p-4">
        <h3
          className="text-sm font-bold text-[#1a1a2e] leading-snug truncate"
          style={sfFont}
        >
          {speaker.name}
        </h3>
        {speaker.designation && (
          <p className="text-xs text-[#1a1a2e]/70 mt-0.5 truncate">
            {speaker.designation}
          </p>
        )}
        {speaker.company && (
          <p className="text-[11px] text-[#e7ab1c] font-semibold mt-0.5 truncate">
            {speaker.company}
          </p>
        )}
      </div>
    </div>
  )
}
