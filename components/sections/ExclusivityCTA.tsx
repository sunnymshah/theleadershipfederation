"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { GoldOrbs } from "@/components/ui/GoldPattern"

const sfDisplay = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

export function ExclusivityCTA() {
  return (
    <section className="relative py-20 lg:py-28 bg-[#F4F8FF] overflow-hidden">
      <GoldOrbs />

      {/* Subtle chevron accent */}
      <svg className="absolute right-0 top-0 h-full w-1/3 pointer-events-none" viewBox="0 0 400 600" fill="none" aria-hidden>
        <motion.path
          d="M100 50L350 300L100 550"
          stroke="rgba(231,171,28,0.06)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2 }}
        />
        <motion.path
          d="M50 100L280 300L50 500"
          stroke="rgba(231,171,28,0.04)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: 0.3 }}
        />
      </svg>

      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e7ab1c]/[0.08] border border-[#e7ab1c]/[0.15] mb-5"
          >
            <span className="text-[11px] font-semibold text-[#e7ab1c] tracking-[0.1em] uppercase">Get Involved</span>
          </motion.span>

          <h2
            className="text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] text-black font-bold tracking-[-0.02em]"
            style={sfDisplay}
          >
            Ready to join?
          </h2>
          <p className="mt-4 text-black/35 text-[16px] leading-relaxed max-w-md mx-auto">
            Whether you are a leader, enterprise, or institution — there is a place for you.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/events"
              className="group inline-flex items-center gap-2 px-8 py-[14px] rounded-full font-semibold text-[14px] text-white bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 shadow-[0_4px_20px_rgba(231,171,28,0.3)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore Events <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/platforms"
              className="inline-flex items-center gap-2 px-7 py-[13px] rounded-full text-[14px] font-medium text-black/50 border border-black/10 hover:border-black/20 transition-all duration-200"
            >
              Join Inner Circle
            </Link>
            <Link
              href="/partners"
              className="inline-flex items-center gap-2 px-7 py-[13px] rounded-full text-[14px] font-medium text-black/50 border border-black/10 hover:border-black/20 transition-all duration-200"
            >
              Partner With Us
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
