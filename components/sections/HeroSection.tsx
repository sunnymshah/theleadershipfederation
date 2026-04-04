"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import {
  ArrowRight,
  Globe,
  CalendarDays,
  Crown,
  Users,
} from "lucide-react"

const ease = [0.16, 1, 0.3, 1] as const

const wordVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
}
const wordChild = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
}

const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

const stats = [
  { icon: Globe,        value: "30+",    label: "Countries" },
  { icon: CalendarDays, value: "50+",    label: "Events" },
  { icon: Crown,        value: "2,000+", label: "Leaders" },
  { icon: Users,        value: "500+",   label: "Speakers" },
]

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })

  const imageY = useTransform(scrollYProgress, [0, 1], [0, 100])
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])

  const headlineWords = ["Direct", "Access", "to", "Global", "Leaders"]

  return (
    <>
      <section
        ref={sectionRef}
        aria-label="Hero"
        className="relative min-h-screen flex items-center overflow-hidden bg-[#F4F8FF]"
      >
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
          <div
            className="absolute top-[-12%] right-[-6%] w-[700px] h-[700px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(26,26,46,0.03) 0%, transparent 65%)" }}
          />
          <div
            className="absolute bottom-[5%] left-[-10%] w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(26,26,46,0.02) 0%, transparent 60%)" }}
          />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: "radial-gradient(circle, #1a1a2e 0.6px, transparent 0.6px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-16 pt-28 pb-24 lg:pt-0 lg:pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[88vh]">

            <div className="order-2 lg:order-1">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.6, delay: 0.05, ease }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-[9px] rounded-full text-[11.5px] font-semibold tracking-[0.1em] uppercase text-[#1a1a2e]/70 border border-[#1a1a2e]/10 bg-white/60">
                  <CalendarDays size={13} strokeWidth={2} />
                  Now Registering
                </span>
              </motion.div>

              <motion.h1
                variants={wordVariants}
                initial="hidden"
                animate="visible"
                className="mt-8 font-serif leading-[0.95] tracking-[-0.02em] text-[#1a1a2e]"
                style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}
              >
                {headlineWords.map((word) => (
                  <motion.span
                    key={word}
                    variants={wordChild}
                    className={`inline-block mr-[0.28em] ${
                      word === "Global" || word === "Leaders"
                        ? "text-[#1a1a2e]"
                        : "text-[#1a1a2e]/60"
                    }`}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.8, delay: 0.55, ease }}
                className="mt-7 max-w-[480px] text-[#1a1a2e]/50 leading-[1.8] text-[15.5px]"
              >
                A global platform connecting GCC leaders, CXOs, innovators, and
                policymakers through curated conversations, strategic partnerships,
                and unmatched access.
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.8, delay: 0.7, ease }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Link
                  href="/events"
                  className="group inline-flex items-center gap-2.5 px-9 py-[16px] rounded-full font-semibold text-[15px] text-white bg-[#1a1a2e] hover:bg-[#2d2d4e] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                >
                  Explore Events
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
                <Link
                  href="/platforms"
                  className="inline-flex items-center gap-2 px-7 py-[15px] rounded-full text-[15px] font-medium text-[#1a1a2e]/55 border border-[#1a1a2e]/10 hover:border-[#1a1a2e]/20 hover:text-[#1a1a2e]/80 hover:bg-white/50 transition-all duration-200"
                >
                  <Crown size={15} strokeWidth={1.6} />
                  Join Inner Circle
                </Link>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.8, delay: 0.85, ease }}
                className="mt-16 flex items-center gap-6 flex-wrap"
              >
                {stats.map(({ icon: Icon, value, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1a1a2e]/[0.05] flex items-center justify-center">
                      <Icon size={18} strokeWidth={1.5} className="text-[#1a1a2e]/50" />
                    </div>
                    <div>
                      <div className="text-[20px] font-bold text-[#1a1a2e] tracking-tight leading-none">
                        {value}
                      </div>
                      <div className="text-[10px] text-[#1a1a2e]/35 tracking-[0.12em] uppercase font-medium">
                        {label}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              className="order-1 lg:order-2 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.88, rotate: -1 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease }}
            >
              <div className="relative w-full max-w-[560px]">
                <div className="absolute inset-[-10px] rounded-[2rem] border border-[#1a1a2e]/[0.06]" />
                <div className="absolute inset-[-22px] rounded-[2.4rem] border border-[#1a1a2e]/[0.03]" />

                <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(26,26,46,0.1)]">
                  <motion.img
                    src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1400&auto=format&fit=crop"
                    alt="Leadership conference gathering"
                    className="w-full h-full object-cover animate-hero-zoom"
                    style={{ y: imageY, scale: imageScale }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/20 via-transparent to-transparent" />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20, x: -10 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ delay: 1.1, duration: 0.8, ease }}
                  className="absolute -bottom-5 -left-6 lg:-left-10 bg-white rounded-2xl px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-[#1a1a2e]/[0.04] animate-float"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <CalendarDays size={12} strokeWidth={1.8} className="text-[#1a1a2e]/50" />
                    <span className="text-[10px] text-[#1a1a2e]/40 uppercase tracking-[0.12em] font-semibold">Next Event</span>
                  </div>
                  <div className="text-[14px] font-bold text-[#1a1a2e]">6th GCC Conclave</div>
                  <div className="text-[12px] text-[#1a1a2e]/60 font-semibold">Apr 7&ndash;8 &middot; Bengaluru</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.8, ease }}
                  className="absolute -top-4 -right-4 lg:-right-8 bg-white rounded-xl px-4 py-3 shadow-[0_8px_28px_rgba(0,0,0,0.04)] border border-[#1a1a2e]/[0.04]"
                >
                  <div className="text-[20px] font-bold text-[#1a1a2e] leading-none">650+</div>
                  <div className="text-[10px] text-[#1a1a2e]/40 uppercase tracking-wider font-medium mt-0.5">CXOs Expected</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.8, ease }}
          className="flex items-center gap-4 px-3 py-2.5 rounded-full bg-white/80 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-[#1a1a2e]/[0.06]"
        >
          <div className="hidden sm:flex items-center gap-2 pl-3">
            <Crown size={14} strokeWidth={1.8} className="text-[#1a1a2e]/40" />
            <span className="text-[13px] text-[#1a1a2e]/50 font-medium">
              Exclusive access for leaders
            </span>
          </div>
          <Link
            href="/platforms"
            className="inline-flex items-center gap-2 px-6 py-[11px] rounded-full font-semibold text-[13px] text-white bg-[#1a1a2e] hover:bg-[#2d2d4e] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
          >
            Join Inner Circle
            <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </>
  )
}
