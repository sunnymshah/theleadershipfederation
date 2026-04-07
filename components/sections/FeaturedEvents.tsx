import Link from "next/link"
import { Calendar, MapPin, ArrowRight } from "lucide-react"
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll"

interface EventCard {
  id: string
  title: string
  start_date: string
  end_date: string
  venue: string
  description: string
  badge?: string
  slug: string
}

interface FeaturedEventsProps {
  events: EventCard[]
}

export function FeaturedEvents({ events }: FeaturedEventsProps) {
  if (!events?.length) return null

  return (
    <section className="py-24 lg:py-32 bg-[#F4F8FF]">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <AnimateOnScroll className="text-center mb-16">
          <span className="text-[11px] tracking-[0.2em] uppercase text-[#1a1a2e]/30 font-semibold">
            Upcoming Events
          </span>
          <h2 className="mt-4 font-serif text-[clamp(2rem,4.5vw,3rem)] leading-[1.1] text-[#1a1a2e]">
            What&apos;s Next
          </h2>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.slice(0, 3).map((event, i) => {
            const date = new Date(event.start_date)
            return (
              <AnimateOnScroll key={event.id} delay={i * 100}>
                <Link
                  href={`/events/${event.slug}`}
                  className="group block bg-white/70 border border-[#1a1a2e]/[0.04] rounded-2xl p-7 hover:bg-white hover:shadow-[0_12px_40px_rgba(26,26,46,0.06)] transition-all duration-300 h-full"
                >
                  <div className="flex items-start gap-4 mb-5">
                    <div className="bg-[#1a1a2e]/[0.03] rounded-xl px-3 py-2 text-center shrink-0">
                      <div className="text-[22px] font-bold text-[#1a1a2e] leading-none">
                        {date.getDate()}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[#1a1a2e]/40 font-semibold mt-0.5">
                        {date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </div>
                    </div>
                    {event.badge && (
                      <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#1a1a2e]/40 px-2.5 py-1 bg-[#1a1a2e]/[0.04] rounded-full">
                        {event.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-[18px] font-bold text-[#1a1a2e] mb-3 group-hover:text-[#1a1a2e] transition-colors leading-snug">
                    {event.title}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-[13px] text-[#1a1a2e]/35">
                      <Calendar size={13} strokeWidth={1.5} />
                      <span>
                        {new Date(event.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        {event.end_date && ` — ${new Date(event.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-[#1a1a2e]/35">
                      <MapPin size={13} strokeWidth={1.5} />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>

                  <p className="text-[14px] text-[#1a1a2e]/35 leading-[1.7] line-clamp-2 mb-5">
                    {event.description}
                  </p>

                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1a1a2e]/35 group-hover:text-[#1a1a2e] transition-colors duration-200">
                    View details
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                </Link>
              </AnimateOnScroll>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-8 py-[14px] rounded-full text-[14px] font-semibold text-[#1a1a2e] border border-[#1a1a2e]/10 hover:border-[#1a1a2e]/25 hover:bg-white/60 transition-all duration-200"
          >
            View All Events
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}
