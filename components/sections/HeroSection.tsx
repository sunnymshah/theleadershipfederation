"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { GoldChevrons, GoldOrbs } from "@/components/ui/GoldPattern"
import { AnimatedCounter } from "@/components/ui/AnimatedCounter"

const ease = [0.16, 1, 0.3, 1] as const

const sfDisplay = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}
const sfText = {
  fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

const stats = [
  { value: 30, suffix: "+", label: "Countries" },
  { value: 50, suffix: "+", label: "Events" },
  { value: 2000, suffix: "+", label: "Leaders" },
]

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 80])
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.06])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#F4F8FF]"
    >
      {/* TOTY-style bold gold arrows */}
      <GoldChevrons />
      <GoldOrbs />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(231,171,28,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(231,171,28,0.025) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-16 pt-28 pb-20 lg:pt-0 lg:pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[80vh]">

          {/* LEFT — Copy */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e7ab1c]/[0.08] border border-[#e7ab1c]/[0.15] mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#e7ab1c] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#e7ab1c] tracking-[0.05em] uppercase" style={sfText}>
                7th GCC Leadership Conclave — May 21-22, Mumbai
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              className="leading-[0.95] tracking-[-0.03em] text-black"
              style={{
                fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
                fontWeight: 700,
                ...sfDisplay,
              }}
            >
              Direct Access to{" "}
              <motion.span
                className="text-[#e7ab1c] inline-block"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease }}
              >
                Global Leaders
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease }}
              className="mt-6 max-w-[440px] text-black/40 leading-[1.7] text-[16px]"
              style={sfText}
            >
              Connecting GCC leaders, CXOs, and decision-makers through
              high-value conversations, strategic partnerships, and curated access.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Link
                href="/events"
                className="group inline-flex items-center gap-2.5 px-8 py-[14px] rounded-full font-semibold text-[15px] text-white bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
              >
                Explore Events
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href="/platforms"
                className="inline-flex items-center gap-2 px-7 py-[13px] rounded-full text-[15px] font-medium text-black/50 border border-black/10 hover:border-black/20 hover:text-black/75 transition-all duration-200"
              >
                Join Inner Circle
              </Link>
            </motion.div>

            {/* Animated stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease }}
              className="mt-10 sm:mt-14 flex items-center gap-6 sm:gap-10"
            >
              {stats.map(({ value, suffix, label }, i) => (
                <div key={label}>
                  <div className="text-[20px] sm:text-[26px] font-bold text-black tracking-tight leading-none">
                    <AnimatedCounter value={value} suffix={suffix} duration={2000 + i * 300} />
                  </div>
                  <div className="text-[9px] sm:text-[11px] text-black/30 tracking-[0.1em] uppercase font-medium mt-1">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — Real TLF event image */}
          <motion.div
            className="order-1 lg:order-2 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.15, ease }}
          >
            <div className="relative w-full max-w-[480px]">
              {/* Gold dashed ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-5 rounded-[2rem] border-2 border-dashed border-[#e7ab1c]/15"
              />

              <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.10)]">
                <motion.div style={{ y: imageY, scale: imageScale }} className="w-full h-full">
                  <Image
                    src="/hero-speaker.jpg"
                    alt="Speaker on stage at a Leadership Federation event"
                    fill
                    className="object-cover"
                    priority
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>

              {/* Next event badge */}
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.7, ease }}
                className="absolute -bottom-4 left-0 sm:-left-4 lg:-left-8 bg-white/90 backdrop-blur-xl rounded-2xl px-4 sm:px-5 py-3 sm:py-4 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-black/[0.04]"
              >
                <div className="text-[10px] text-[#e7ab1c] uppercase tracking-[0.12em] font-bold mb-1">Next Event</div>
                <div className="text-[14px] font-bold text-black">7th GCC Leadership Conclave</div>
                <div className="text-[12px] text-black/40">May 21-22 &middot; Mumbai</div>
              </motion.div>

              {/* Edition badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="absolute -top-3 -right-3 w-16 h-16 bg-[#e7ab1c] rounded-2xl flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(231,171,28,0.3)] rotate-6"
              >
                <span className="text-[18px] font-bold text-white leading-none">7th</span>
                <span className="text-[8px] text-white/70 uppercase tracking-wider font-semibold">Edition</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
