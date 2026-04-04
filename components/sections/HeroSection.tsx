"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const easeOutExpo = [0.16, 1, 0.3, 1] as const

const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0  },
}

const stats = [
  { value: "50+",    label: "Global Events"      },
  { value: "2,000+", label: "Leaders Engaged"     },
  { value: "30+",    label: "Countries"           },
  { value: "12+",    label: "Industry Verticals"  },
]

export function HeroSection() {
  return (
    <section
      aria-label="Hero"
      className="relative min-h-screen flex items-center overflow-hidden bg-[#FEFBEA]"
    >
      {/* ── Decorative background elements ─────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
        <div
          className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(231,171,28,0.06) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[10%] left-[-8%] w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(231,171,28,0.04) 0%, transparent 65%)" }}
        />
      </div>

      {/* ── Content grid: 50/50 split ─────────────────────────────── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-28 pb-20 lg:pt-0 lg:pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[85vh]">

          {/* ── LEFT: Text content ──────────────────────────────────── */}
          <div className="order-2 lg:order-1">
            {/* Eyebrow */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, delay: 0.1, ease: easeOutExpo }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold tracking-[0.08em] uppercase text-[#e7ab1c] border border-[#e7ab1c]/25 bg-[#e7ab1c]/[0.06]">
                <span className="w-[6px] h-[6px] rounded-full bg-[#e7ab1c] animate-pulse-gold" />
                Now Registering
              </span>
            </motion.div>

            {/* Headline — Playfair Display serif */}
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, delay: 0.2, ease: easeOutExpo }}
              className="mt-8 font-serif leading-[1.05] tracking-[-0.015em] text-[#000]"
              style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)" }}
            >
              Direct Access{" "}
              <br className="hidden sm:block" />
              to{" "}
              <span className="text-[#e7ab1c]">
                Global Leaders
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, delay: 0.35, ease: easeOutExpo }}
              className="mt-6 max-w-[480px] text-black/50 leading-[1.75]"
              style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)" }}
            >
              A global platform connecting GCC leaders, CXOs, innovators, and
              policymakers through high-value conversations, strategic partnerships,
              and curated access.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, delay: 0.5, ease: easeOutExpo }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              {/* Primary — pill button */}
              <Link
                href="/events"
                className="group inline-flex items-center gap-2.5 px-8 py-[15px] rounded-full font-semibold text-[15px] text-white bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_24px_rgba(231,171,28,0.3)]"
              >
                View Upcoming Events
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Secondary */}
              <Link
                href="/platforms"
                className="inline-flex items-center gap-2 px-6 py-[14px] rounded-full text-[15px] font-medium text-black/60 border border-black/12 hover:border-black/25 hover:text-black/80 transition-all duration-200"
              >
                Join Inner Circle
              </Link>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, delay: 0.65, ease: easeOutExpo }}
              className="mt-14 flex flex-wrap items-center gap-0"
            >
              {stats.map(({ value, label }, i) => (
                <div key={label} className="flex items-center">
                  <div className="pr-6 py-2 text-left">
                    <div className="text-[24px] font-bold text-[#000] tracking-tight leading-none mb-1">
                      {value}
                    </div>
                    <div className="text-[10px] text-black/35 tracking-[0.1em] uppercase font-medium">
                      {label}
                    </div>
                  </div>
                  {i < stats.length - 1 && (
                    <div className="w-px h-10 bg-black/[0.08] shrink-0 mr-6" />
                  )}
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: Circular image frame ─────────────────────────── */}
          <motion.div
            className="order-1 lg:order-2 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: easeOutExpo }}
          >
            <div className="relative w-full max-w-[520px] aspect-square">
              {/* Outer decorative ring */}
              <div className="absolute inset-[-8px] rounded-full border border-[#e7ab1c]/15" />
              <div className="absolute inset-[-20px] rounded-full border border-[#e7ab1c]/[0.06]" />

              {/* Main circular frame */}
              <div className="relative w-full h-full rounded-full overflow-hidden bg-[#f0e8cc] shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
                <img
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop"
                  alt="Leadership conference gathering"
                  className="w-full h-full object-cover animate-hero-zoom"
                />
                {/* Subtle overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
              </div>

              {/* Floating accent badge */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.7, ease: easeOutExpo }}
                className="absolute -bottom-4 -left-4 lg:-left-8 bg-white rounded-2xl px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-black/[0.04]"
              >
                <div className="text-[11px] text-black/40 uppercase tracking-[0.1em] font-medium mb-1">Next Event</div>
                <div className="text-[14px] font-bold text-black">6th GCC Conclave</div>
                <div className="text-[12px] text-[#e7ab1c] font-semibold">Apr 7-8, Bengaluru</div>
              </motion.div>

              {/* Small dot accents */}
              <div className="absolute top-[8%] right-[2%] w-3 h-3 rounded-full bg-[#e7ab1c]/30" />
              <div className="absolute bottom-[15%] right-[-5%] w-2 h-2 rounded-full bg-[#e7ab1c]/20" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
