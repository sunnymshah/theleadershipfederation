"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Calendar, MapPin, ArrowRight } from "lucide-react"

interface FeaturedEvent {
  id: string
  title: string
  slug: string
  start_date: string
  end_date: string
  venue: string
  description: string | null
  cover_image_url: string | null
}

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

export function FeaturedEvents({ events }: { events: FeaturedEvent[] }) {
  if (events.length === 0) return null

  return (
    <section className="relative bg-[#050505] py-28 overflow-hidden">
      {/* Subtle background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "900px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(201,168,76,0.04) 0%, transparent 65%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14"
        >
          <span className="text-[11px] font-bold text-[#c9a84c] uppercase tracking-[0.2em] mb-3 block">
            Upcoming Events
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Featured Gatherings
          </h2>
          <p className="text-white/40 max-w-xl">
            Join the next wave of leadership conversations shaping the future of global business.
          </p>
        </motion.div>

        {/* Event cards */}
        <div className="grid gap-5">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={`/events/${event.slug}`}
                className="group block rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#c9a84c]/20 transition-all duration-300"
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
                      <p className="text-sm text-white/30 mt-3 line-clamp-2">{event.description}</p>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="shrink-0">
                    <ArrowRight size={20} className="text-white/20 group-hover:text-[#c9a84c] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View all link */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 text-center"
        >
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-[#c9a84c] text-sm font-medium hover:gap-3 transition-all"
          >
            View All Events <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
