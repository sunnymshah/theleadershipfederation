"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { CalendarDays, Crown, Mic2, ArrowRight } from "lucide-react"
import { DotGrid } from "@/components/ui/GoldPattern"

const sfDisplay = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

const pillars = [
  {
    icon: CalendarDays,
    title: "Global Conclaves & Summits",
    description: "GCC Leadership Conclave, Asia Leadership Awards, and Bharat Leadership Summit — flagship events across 30+ countries.",
    href: "/events",
    stat: "50+",
    statLabel: "Events",
  },
  {
    icon: Crown,
    title: "The Inner Circle",
    description: "Invite-only membership for senior leaders. Private roundtables, curated access, and strategic dialogue.",
    href: "/platforms",
    stat: "500+",
    statLabel: "Members",
  },
  {
    icon: Mic2,
    title: "The Sunny Shah Show",
    description: "Podcasts and media spotlights amplifying voices shaping global business. C-suite conversations that move industries.",
    href: "/media",
    stat: "60+",
    statLabel: "Episodes",
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
}

export function EcosystemGrid() {
  return (
    <section className="relative py-20 lg:py-28 bg-[#F4F8FF] overflow-hidden">
      <DotGrid className="opacity-50" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e7ab1c]/[0.08] border border-[#e7ab1c]/[0.15] mb-5"
          >
            <span className="text-[11px] font-semibold text-[#e7ab1c] tracking-[0.1em] uppercase">Three Pillars</span>
          </motion.span>
          <h2
            className="text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] text-black font-bold tracking-[-0.02em]"
            style={sfDisplay}
          >
            The Ecosystem
          </h2>
          <p className="mt-3 text-black/35 text-[15px]">One mission. Global impact.</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {pillars.map((p) => {
            const Icon = p.icon
            return (
              <motion.div key={p.title} variants={cardVariants}>
                <Link
                  href={p.href}
                  className="group block bg-white/70 border border-black/[0.04] rounded-2xl p-7 h-full hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:border-[#e7ab1c]/20 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#e7ab1c]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-11 h-11 rounded-xl bg-[#e7ab1c]/10 flex items-center justify-center group-hover:bg-[#e7ab1c]/15 transition-colors duration-300">
                        <Icon size={20} strokeWidth={1.5} className="text-[#e7ab1c]" />
                      </div>
                      <div className="text-right">
                        <div className="text-[20px] font-bold text-[#e7ab1c]/80 leading-none">{p.stat}</div>
                        <div className="text-[10px] text-black/25 uppercase tracking-wider font-medium">{p.statLabel}</div>
                      </div>
                    </div>
                    <h3 className="text-[17px] font-bold text-black mb-2">{p.title}</h3>
                    <p className="text-[14px] text-black/35 leading-[1.7] mb-5">{p.description}</p>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e7ab1c] group-hover:gap-2.5 transition-all duration-200">
                      Learn more <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
