"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react"
import { GoldDiamonds } from "@/components/ui/GoldPattern"

const sfDisplay = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

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
    <section className="relative py-20 lg:py-28 bg-black overflow-hidden">
      {/* Background elements */}
      <GoldDiamonds />

      {/* Gold gradient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(231,171,28,0.06) 0%, transparent 60%)",
        }}
        aria-hidden
      />

      {/* Chevron lines */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" aria-hidden>
        <motion.line
          x1="0" y1="0" x2="100%" y2="100%"
          stroke="rgba(231,171,28,0.04)" strokeWidth="1"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2 }}
        />
        <motion.line
          x1="100%" y1="0" x2="0" y2="100%"
          stroke="rgba(231,171,28,0.03)" strokeWidth="1"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: 0.3 }}
        />
      </svg>

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e7ab1c]/10 border border-[#e7ab1c]/20 mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#e7ab1c] animate-pulse" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-[#e7ab1c] font-semibold">
              Featured Event
            </span>
          </motion.span>

          <h2
            className="mt-4 text-[clamp(1.6rem,4vw,2.8rem)] leading-[1.1] text-white font-bold tracking-[-0.02em]"
            style={sfDisplay}
          >
            {e.title}
          </h2>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-6 text-white/40 text-[14px]"
          >
            <span className="inline-flex items-center gap-2"><Calendar size={14} strokeWidth={1.5} /> Apr 7-8, 2026</span>
            <span className="inline-flex items-center gap-2"><MapPin size={14} strokeWidth={1.5} /> Bengaluru, India</span>
            <span className="inline-flex items-center gap-2"><Users size={14} strokeWidth={1.5} /> 650+ CXOs</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-6 max-w-xl mx-auto text-white/30 text-[15px] leading-[1.7]"
          >
            {e.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Link
              href="/events"
              className="mt-8 inline-flex items-center gap-2 px-8 py-[14px] rounded-full font-semibold text-[14px] text-black bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 hover:scale-[1.02] shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
            >
              Register Now
              <ArrowRight size={15} />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
