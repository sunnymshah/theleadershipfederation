"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Calendar, MapPin, Users, Award, Clock, Mic2 } from "lucide-react"

interface FeaturedEventCalloutProps {
  event?: {
    title: string
    start_date: string
    end_date: string
    venue: string
    description: string
    attendee_count?: number
    speaker_count?: number
  }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

export function FeaturedEventCallout({ event }: FeaturedEventCalloutProps) {
  const e = event ?? {
    title: "6th GCC Leadership Conclave",
    start_date: "2026-04-07",
    end_date: "2026-04-08",
    venue: "JW Marriott Hotel Bengaluru, India",
    description: "India's largest and most influential gathering of GCC leaders. The 6th Edition brings together 650+ CXOs, innovators, and policymakers to discuss AI integration, talent-first GCC operations, and cross-border leadership strategies.",
    attendee_count: 650,
    speaker_count: 67,
  }

  const stats = [
    { label: "Edition", value: "6th", icon: Award },
    { label: "CXOs", value: `${e.attendee_count ?? 650}+`, icon: Users },
    { label: "Speakers", value: `${e.speaker_count ?? 67}`, icon: Mic2 },
    { label: "Days", value: "2", icon: Clock },
  ]

  const startDate = new Date(e.start_date)
  const endDate = new Date(e.end_date)
  const dateStr = `${startDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} — ${endDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`

  return (
    <section className="py-24 lg:py-32 bg-[#1a1a2e]">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            variants={fadeInUp}
          >
            <span className="text-[11px] tracking-[0.2em] uppercase text-white/25 font-semibold">
              Featured Event
            </span>
            <h2 className="mt-5 font-serif text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] text-white">
              {e.title}
            </h2>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <Calendar size={16} strokeWidth={1.5} className="text-white/30 mt-0.5 shrink-0" />
                <span className="text-white/50 text-[15px]">{dateStr}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} strokeWidth={1.5} className="text-white/30 mt-0.5 shrink-0" />
                <span className="text-white/50 text-[15px]">{e.venue}</span>
              </div>
            </div>

            <p className="mt-8 text-white/35 text-[15px] leading-[1.8] max-w-lg">
              {e.description}
            </p>

            <Link
              href="/events"
              className="mt-10 inline-flex items-center gap-2.5 px-8 py-[14px] rounded-full font-semibold text-[14px] text-[#1a1a2e] bg-white hover:bg-white/90 transition-all duration-200 hover:scale-[1.02]"
            >
              Register Now
              <ArrowRight size={15} />
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            variants={fadeInUp}
            className="grid grid-cols-2 gap-4"
          >
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.label}
                  className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-6 text-center"
                >
                  <Icon size={20} strokeWidth={1.5} className="text-white/20 mx-auto mb-3" />
                  <div className="text-[28px] font-bold text-white leading-none">{s.value}</div>
                  <div className="text-[11px] text-white/30 uppercase tracking-[0.12em] font-medium mt-2">
                    {s.label}
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
