"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function ExclusivityCTA() {
  return (
    <section className="py-20 lg:py-24 bg-[#F4F8FF]">
      <div className="max-w-3xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] text-black font-bold tracking-[-0.02em]"
            style={{ fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }}
          >
            Ready to join?
          </h2>
          <p className="mt-4 text-black/35 text-[16px] leading-relaxed max-w-md mx-auto">
            Whether you are a leader, enterprise, or institution — there is a place for you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-8 py-[14px] rounded-full font-semibold text-[14px] text-white bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
            >
              Explore Events <ArrowRight size={15} />
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
          </div>
        </motion.div>
      </div>
    </section>
  )
}
