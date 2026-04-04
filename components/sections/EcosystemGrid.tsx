"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { CalendarDays, Crown, Mic2, ArrowRight } from "lucide-react"

const pillars = [
  {
    icon: CalendarDays,
    title: "Global Conclaves & Summits",
    description: "GCC Leadership Conclave, Asia Leadership Awards, and Bharat Leadership Summit — flagship events across 30+ countries.",
    href: "/events",
  },
  {
    icon: Crown,
    title: "The Inner Circle",
    description: "Invite-only membership for senior leaders. Private roundtables, curated access, and strategic dialogue.",
    href: "/platforms",
  },
  {
    icon: Mic2,
    title: "The Sunny Shah Show",
    description: "Podcasts and media spotlights amplifying voices shaping global business. C-suite conversations that move industries.",
    href: "/media",
  },
]

export function EcosystemGrid() {
  return (
    <section className="py-20 lg:py-24 bg-[#F4F8FF]">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2
            className="text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] text-black font-bold tracking-[-0.02em]"
            style={{ fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }}
          >
            The Ecosystem
          </h2>
          <p className="mt-3 text-black/35 text-[15px]">Three pillars. One mission.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pillars.map((p, i) => {
            const Icon = p.icon
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link href={p.href} className="group block bg-white/70 border border-black/[0.04] rounded-2xl p-7 h-full hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
                  <div className="w-11 h-11 rounded-xl bg-[#e7ab1c]/10 flex items-center justify-center mb-5">
                    <Icon size={20} strokeWidth={1.5} className="text-[#e7ab1c]" />
                  </div>
                  <h3 className="text-[17px] font-bold text-black mb-2">{p.title}</h3>
                  <p className="text-[14px] text-black/35 leading-[1.7] mb-5">{p.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e7ab1c] group-hover:gap-2.5 transition-all duration-200">
                    Learn more <ArrowRight size={13} />
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
