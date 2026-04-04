"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react"

/**
 * Dark #000 featured event callout section — highlights the next
 * major event with a full-width black background and editorial layout.
 */

interface EventCalloutProps {
  event: {
    title: string
    slug: string
    start_date: string
    end_date: string
    venue: string
    description: string | null
  } | null
}

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
}
const ease = [0.16, 1, 0.3, 1] as const

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

export function FeaturedEventCallout({ event }: EventCalloutProps) {
  if (!event) return null

  return (
    <section className="bg-[#000] py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: editorial text ─────────────────────────────── */}
          <div>
            <motion.span
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.15em] border border-[#e7ab1c]/20 bg-[#e7ab1c]/[0.06] mb-6"
            >
              <span className="w-[5px] h-[5px] rounded-full bg-[#e7ab1c] animate-pulse-gold" />
              Featured Event
            </motion.span>

            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease }}
              className="font-serif text-white leading-[1.1] mb-6"
              style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}
            >
              {event.title}
            </motion.h2>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2, ease }}
              className="space-y-3 mb-8"
            >
              <div className="flex items-center gap-3 text-white/45 text-[14px]">
                <Calendar size={16} strokeWidth={1.5} className="text-[#e7ab1c]/60 shrink-0" />
                {fmtDate(event.start_date)} — {fmtDate(event.end_date)}
              </div>
              <div className="flex items-start gap-3 text-white/45 text-[14px]">
                <MapPin size={16} strokeWidth={1.5} className="text-[#e7ab1c]/60 shrink-0 mt-0.5" />
                {event.venue}
              </div>
              <div className="flex items-center gap-3 text-white/45 text-[14px]">
                <Users size={16} strokeWidth={1.5} className="text-[#e7ab1c]/60 shrink-0" />
                650+ CXOs & Industry Leaders Expected
              </div>
            </motion.div>

            {event.description && (
              <motion.p
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3, ease }}
                className="text-white/35 text-[15px] leading-[1.7] mb-10 max-w-lg"
              >
                {event.description}
              </motion.p>
            )}

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4, ease }}
            >
              <Link
                href={`/events/${event.slug}`}
                className="group inline-flex items-center gap-2.5 px-8 py-[15px] rounded-full font-semibold text-[15px] text-[#000] bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_28px_rgba(231,171,28,0.35)]"
              >
                Register Now
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* ── Right: stats / key numbers ────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { number: "6th", label: "Edition", sub: "Biggest yet" },
              { number: "650+", label: "CXOs", sub: "Expected attendance" },
              { number: "67", label: "Speakers", sub: "Industry leaders" },
              { number: "2 Days", label: "Of Immersion", sub: "Apr 7-8, 2026" },
            ].map(({ number, label, sub }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center"
              >
                <div className="text-[32px] font-bold text-[#e7ab1c] leading-none mb-1">{number}</div>
                <div className="text-[14px] font-semibold text-white/80 mb-0.5">{label}</div>
                <div className="text-[11px] text-white/30">{sub}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
