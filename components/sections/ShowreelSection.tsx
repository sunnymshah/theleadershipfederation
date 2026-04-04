"use client"

import { motion } from "framer-motion"
import { Play } from "lucide-react"

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export function ShowreelSection() {
  return (
    <section className="py-24 lg:py-32 bg-[#F4F8FF]">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <span className="text-[11px] tracking-[0.2em] uppercase text-[#1a1a2e]/30 font-semibold">
            Showreel
          </span>
          <h2 className="mt-4 font-serif text-[clamp(2rem,4.5vw,3rem)] leading-[1.1] text-[#1a1a2e]">
            See the Impact
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          variants={fadeInUp}
          className="relative aspect-video rounded-3xl overflow-hidden bg-[#1a1a2e] shadow-[0_24px_60px_rgba(26,26,46,0.12)]"
        >
          <img
            src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1400&auto=format&fit=crop"
            alt="Leadership Federation event highlights"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/60 via-transparent to-[#1a1a2e]/20" />

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <button className="w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
              <Play size={28} className="text-[#1a1a2e] ml-1" fill="#1a1a2e" />
            </button>
            <p className="mt-6 text-white/60 text-[14px] font-medium tracking-wide">
              Watch our 2025 highlights
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
