"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Globe, CalendarDays, Users } from "lucide-react"

const ease = [0.16, 1, 0.3, 1] as const

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
}

const stats = [
  { value: "30+", label: "Countries" },
  { value: "50+", label: "Events" },
  { value: "2,000+", label: "Leaders" },
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
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-16 pt-28 pb-20 lg:pt-0 lg:pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[80vh]">

          {/* LEFT — Copy */}
          <div className="order-2 lg:order-1">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              className="leading-[1] tracking-[-0.03em] text-black"
              style={{
                fontSize: "clamp(2.8rem, 6vw, 5.5rem)",
                fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
                fontWeight: 700,
              }}
            >
              Direct Access to{" "}
              <span className="text-[#e7ab1c]">Global Leaders</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.7, delay: 0.2, ease }}
              className="mt-6 max-w-[440px] text-black/40 leading-[1.7] text-[16px]"
              style={{ fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif" }}
            >
              Connecting GCC leaders, CXOs, and decision-makers through
              high-value conversations, strategic partnerships, and curated access.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
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

            {/* Stats row */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.7, delay: 0.5, ease }}
              className="mt-14 flex items-center gap-10"
            >
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <div className="text-[26px] font-bold text-black tracking-tight leading-none">{value}</div>
                  <div className="text-[11px] text-black/30 tracking-[0.1em] uppercase font-medium mt-1">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — Image */}
          <motion.div
            className="order-1 lg:order-2 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.15, ease }}
          >
            <div className="relative w-full max-w-[500px]">
              <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                <motion.img
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1400&auto=format&fit=crop"
                  alt="GCC Leadership Conclave"
                  className="w-full h-full object-cover"
                  style={{ y: imageY, scale: imageScale }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
              </div>

              {/* Next event badge */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.7, ease }}
                className="absolute -bottom-4 -left-4 lg:-left-8 bg-white rounded-2xl px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
              >
                <div className="text-[10px] text-[#e7ab1c] uppercase tracking-[0.12em] font-bold mb-1">Next Event</div>
                <div className="text-[14px] font-bold text-black">6th GCC Leadership Conclave</div>
                <div className="text-[12px] text-black/40">Apr 7-8 &middot; Bengaluru</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
