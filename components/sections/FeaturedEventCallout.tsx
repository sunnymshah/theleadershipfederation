"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react"

interface FeaturedEventCalloutProps {
  event?: {
    title: string
    start_date: string
    end_date: string
    venue: string
    description: string
  }
}

export function FeaturedEventCallout({ event }: FeaturedEventCalloutProps) {
  const e = event ?? {
    title: "6th GCC Leadership Conclave",
    start_date: "2026-04-07",
    end_date: "2026-04-08",
    venue: "JW Marriott Hotel Bengaluru, India",
    description: "650+ CXOs, innovators, and policymakers. AI integration, talent-first operations, cross-border leadership.",
  }

  return (
    <section className="py-20 lg:py-24 bg-black">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-[11px] tracking-[0.2em] uppercase text-[#e7ab1c] font-semibold">
            Featured Event
          </span>
          <h2
            className="mt-4 text-[clamp(1.6rem,4vw,2.8rem)] leading-[1.1] text-white font-bold tracking-[-0.02em]"
            style={{ fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }}
          >
            {e.title}
          </h2>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-white/40 text-[14px]">
            <span className="inline-flex items-center gap-2"><Calendar size={14} strokeWidth={1.5} /> Apr 7-8, 2026</span>
            <span className="inline-flex items-center gap-2"><MapPin size={14} strokeWidth={1.5} /> Bengaluru, India</span>
            <span className="inline-flex items-center gap-2"><Users size={14} strokeWidth={1.5} /> 650+ CXOs</span>
          </div>

          <p className="mt-6 max-w-xl mx-auto text-white/30 text-[15px] leading-[1.7]">
            {e.description}
          </p>

          <Link
            href="/events"
            className="mt-8 inline-flex items-center gap-2 px-8 py-[14px] rounded-full font-semibold text-[14px] text-black bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 hover:scale-[1.02] shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
          >
            Register Now
            <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
