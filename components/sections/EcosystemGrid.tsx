"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { CalendarDays, Crown, Mic2 } from "lucide-react"

const pillars = [
  {
    icon: CalendarDays,
    title: "Global Conclaves & Summits",
    description: "India's largest gatherings of GCC leaders, CXOs, and transformation architects. Multi-day immersive experiences with keynotes, round-tables, and fireside conversations across 30+ countries.",
    cta: { label: "View Events", href: "/events" },
    accent: true,
  },
  {
    icon: Crown,
    title: "The Inner Circle",
    description: "An exclusive, invite-only membership for senior leaders seeking curated access, private roundtables, strategic peer connections, and privileged dialogue with global decision-makers.",
    cta: { label: "Apply Now", href: "/platforms" },
    accent: false,
  },
  {
    icon: Mic2,
    title: "Media & Thought Leadership",
    description: "The Sunny Shah Show, podcasts, publications, and media spotlights amplifying the voices shaping global business. C-suite conversations that move industries forward.",
    cta: { label: "Watch Now", href: "/media" },
    accent: false,
  },
]

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

export function EcosystemGrid() {
  return (
    <section className="py-24 lg:py-32 bg-[#F4F8FF]">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <span className="text-[11px] tracking-[0.2em] uppercase text-[#1a1a2e]/30 font-semibold">
            Our Ecosystem
          </span>
          <h2 className="mt-4 font-serif text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.1] text-[#1a1a2e]">
            A Platform Built for{" "}
            <span className="text-[#1a1a2e]/40">Impact</span>
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-[#1a1a2e]/45 text-[16px] leading-relaxed">
            Three interconnected pillars driving leadership excellence across industries and borders.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon
            return (
              <motion.div
                key={pillar.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                variants={fadeInUp}
              >
                <div
                  className={`rounded-2xl p-8 h-full flex flex-col transition-all duration-300 hover:scale-[1.02] ${
                    pillar.accent
                      ? "bg-[#1a1a2e] text-white"
                      : "bg-white/70 border border-[#1a1a2e]/[0.05]"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                    pillar.accent ? "bg-white/10" : "bg-[#1a1a2e]/[0.04]"
                  }`}>
                    <Icon size={22} strokeWidth={1.5} className={pillar.accent ? "text-white/70" : "text-[#1a1a2e]/40"} />
                  </div>
                  <h3 className={`text-[20px] font-bold mb-3 ${pillar.accent ? "text-white" : "text-[#1a1a2e]"}`}>
                    {pillar.title}
                  </h3>
                  <p className={`text-[14.5px] leading-[1.7] flex-1 ${
                    pillar.accent ? "text-white/60" : "text-[#1a1a2e]/45"
                  }`}>
                    {pillar.description}
                  </p>
                  <Link
                    href={pillar.cta.href}
                    className={`mt-6 inline-flex items-center gap-2 text-[13px] font-semibold ${
                      pillar.accent ? "text-white/70 hover:text-white" : "text-[#1a1a2e]/50 hover:text-[#1a1a2e]"
                    } transition-colors duration-200`}
                  >
                    {pillar.cta.label}
                    <span className="text-[16px]">&rarr;</span>
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
