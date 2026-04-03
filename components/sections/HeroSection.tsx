"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, CalendarDays, Users } from "lucide-react"

/* ─── Animation variants ─────────────────────────────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0  },
}

const easeOutExpo = [0.16, 1, 0.3, 1] as const

/* ─── Stats data ─────────────────────────────────────────────────────────── */
const stats = [
  { value: "50+",    label: "Global Events"      },
  { value: "2,000+", label: "Leaders Engaged"     },
  { value: "30+",    label: "Countries"           },
  { value: "12+",    label: "Industry Verticals"  },
]

/* ─── Component ──────────────────────────────────────────────────────────── */
export function HeroSection() {
  return (
    <section
      aria-label="Hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#050505]"
    >

      {/* ── Background layers ─────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>

        {/* Primary golden ambient — top center */}
        <div
          className="absolute top-[-18%] left-1/2 -translate-x-1/2"
          style={{
            width: "1000px",
            height: "720px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(201,168,76,0.085) 0%, rgba(201,168,76,0.02) 45%, transparent 70%)",
          }}
        />

        {/* Secondary warm glow — right */}
        <div
          className="absolute top-[25%] right-[-8%]"
          style={{
            width: "560px",
            height: "560px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(201,168,76,0.04) 0%, transparent 65%)",
          }}
        />

        {/* Bottom-left accent */}
        <div
          className="absolute bottom-[5%] left-[-5%]"
          style={{
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(150,100,30,0.035) 0%, transparent 65%)",
          }}
        />

        {/* Fine grid — very subtle */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: [
              "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
            ].join(", "),
            backgroundSize: "80px 80px",
          }}
        />

        {/* Vignette — bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent" />
      </div>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 text-center pt-28 pb-24">

        {/* Live event badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.55, delay: 0.1, ease: easeOutExpo }}
          className="mb-10 inline-flex"
        >
          <span
            className="inline-flex items-center gap-2.5 px-4 py-[9px] rounded-full text-[#c9a84c] text-[12.5px] font-medium tracking-[0.04em]"
            style={{
              border: "1px solid rgba(201,168,76,0.28)",
              background: "rgba(201,168,76,0.06)",
            }}
          >
            <span
              className="inline-block w-[7px] h-[7px] rounded-full bg-[#c9a84c] animate-pulse-gold shrink-0"
              style={{ boxShadow: "0 0 6px rgba(201,168,76,0.7)" }}
            />
            Now registering: Asia Leadership Summit 2025
            <ArrowRight size={11} className="opacity-60" />
          </span>
        </motion.div>

        {/* ── Headline ───────────────────────────────────────────────── */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.75, delay: 0.22, ease: easeOutExpo }}
          className="font-bold leading-[1.05] tracking-[-0.02em] text-white mb-7"
          style={{ fontSize: "clamp(2.75rem, 7.5vw, 6.25rem)" }}
        >
          Direct Access to
          <br className="hidden sm:block" />
          {" "}
          <span
            style={{
              background: "linear-gradient(135deg, #c9a84c 0%, #e8c86a 45%, #c9a84c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Global Leaders,
          </span>
          <br className="hidden sm:block" />
          {" "}CXOs & Decision Makers
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.75, delay: 0.36, ease: easeOutExpo }}
          className="max-w-[640px] mx-auto leading-[1.7] text-white/42 mb-12"
          style={{ fontSize: "clamp(1rem, 1.9vw, 1.2rem)" }}
        >
          A global platform connecting GCC leaders, CXOs, innovators, and policymakers
          through high-value conversations, strategic partnerships, and curated access.
        </motion.p>

        {/* ── CTA row ────────────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.75, delay: 0.5, ease: easeOutExpo }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-20"
        >
          {/* Primary */}
          <Link
            href="/events"
            className="group inline-flex items-center gap-2.5 px-7 py-[14px] rounded-full font-semibold text-[#0a0a0a] text-[14.5px] tracking-[0.04em] transition-all duration-200 hover:scale-[1.025] active:scale-[0.975]"
            style={{
              background: "linear-gradient(135deg, #c9a84c 0%, #d9b85c 100%)",
              boxShadow: "0 0 28px rgba(201,168,76,0.28), 0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            <CalendarDays size={15} />
            View Upcoming Events
          </Link>

          {/* Secondary */}
          <Link
            href="/platforms"
            className="inline-flex items-center gap-2.5 px-7 py-[13px] rounded-full font-medium text-white/80 text-[14.5px] tracking-[0.02em] transition-all duration-200 hover:text-white hover:border-white/30 hover:bg-white/[0.04]"
            style={{ border: "1px solid rgba(255,255,255,0.13)" }}
          >
            <Users size={15} />
            Join Inner Circle
          </Link>

          {/* Tertiary */}
          <Link
            href="/partners"
            className="group inline-flex items-center gap-1.5 px-4 py-[13px] text-white/38 text-[14.5px] font-medium hover:text-white/65 transition-colors duration-200"
          >
            Become a Partner
            <ArrowRight
              size={13}
              className="group-hover:translate-x-[3px] transition-transform duration-200 ease-out"
            />
          </Link>
        </motion.div>

        {/* ── Stats strip ────────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.75, delay: 0.65, ease: easeOutExpo }}
          className="inline-flex flex-wrap items-center justify-center"
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.018)",
            backdropFilter: "blur(12px)",
          }}
        >
          {stats.map(({ value, label }, i) => (
            <div key={label} className="flex items-center">
              <div className="px-8 py-4 text-center">
                <div className="text-[22px] font-bold text-white/92 tracking-tight leading-none mb-1">
                  {value}
                </div>
                <div className="text-[11.5px] text-white/35 tracking-[0.08em] uppercase">
                  {label}
                </div>
              </div>
              {i < stats.length - 1 && (
                <div className="w-px h-9 bg-white/[0.08] shrink-0" />
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Scroll indicator ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.9, ease: "easeOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/22 select-none"
        aria-hidden
      >
        <span className="text-[10px] tracking-[0.25em] uppercase font-medium">Scroll</span>
        <div className="w-px h-11 bg-gradient-to-b from-white/20 to-transparent" />
      </motion.div>
    </section>
  )
}
