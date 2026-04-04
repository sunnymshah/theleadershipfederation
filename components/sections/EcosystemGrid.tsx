"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { CalendarDays, Users, Award, Mic2, Globe, Handshake } from "lucide-react"

/**
 * Bento-box ecosystem grid — showcases the TLF platform pillars
 * in an asymmetric grid layout with thin-stroke Lucide icons.
 */

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
}
const ease = [0.16, 1, 0.3, 1] as const

const pillars = [
  {
    icon: CalendarDays,
    title: "Leadership Conclaves",
    description: "India's largest gatherings of GCC leaders, CXOs, and transformation architects. Multi-day immersive experiences with keynotes, round-tables, and fireside conversations.",
    href: "/events",
    span: "md:col-span-2",
    accent: true,
  },
  {
    icon: Award,
    title: "Asia Leadership Awards",
    description: "Celebrating extraordinary contributions to leadership and innovation across Asia and the Middle East.",
    href: "/events",
    span: "md:col-span-1",
  },
  {
    icon: Users,
    title: "Inner Circle",
    description: "An exclusive, invite-only membership for senior leaders seeking curated access, peer connections, and strategic dialogue.",
    href: "/platforms",
    span: "md:col-span-1",
  },
  {
    icon: Mic2,
    title: "Thought Leadership",
    description: "Podcasts, publications, and media spotlights amplifying the voices shaping global business.",
    href: "/media",
    span: "md:col-span-1",
  },
  {
    icon: Globe,
    title: "Global Network",
    description: "Operating across 30+ countries connecting leaders from Bengaluru to Dubai, Kuala Lumpur to Bangkok.",
    href: "/about",
    span: "md:col-span-1",
  },
  {
    icon: Handshake,
    title: "Strategic Partnerships",
    description: "Building bridges between enterprises, GCCs, government bodies, and industry pioneers for mutual growth.",
    href: "/partners",
    span: "md:col-span-2",
    accent: true,
  },
]

export function EcosystemGrid() {
  return (
    <section className="bg-[#FEFBEA] py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        {/* Section header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
          className="mb-16 max-w-xl"
        >
          <span className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.2em] mb-4 block">
            Our Ecosystem
          </span>
          <h2 className="font-serif text-[#000] leading-[1.1]" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            A Platform Built for{" "}
            <span className="text-[#e7ab1c]">Impact</span>
          </h2>
          <p className="mt-4 text-black/45 leading-[1.7] text-[15px]">
            Six interconnected pillars driving leadership excellence across industries and borders.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {pillars.map(({ icon: Icon, title, description, href, span, accent }, i) => (
            <motion.div
              key={title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease }}
              className={span}
            >
              <Link
                href={href}
                className={`group block h-full rounded-2xl p-7 sm:p-8 transition-all duration-300 border ${
                  accent
                    ? "bg-[#000] text-white border-transparent hover:shadow-[0_8px_40px_rgba(0,0,0,0.15)]"
                    : "bg-white/60 text-[#000] border-black/[0.06] hover:bg-white hover:border-black/[0.1] hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
                }`}
              >
                <Icon
                  size={28}
                  strokeWidth={1.4}
                  className={`mb-5 transition-colors duration-300 ${
                    accent
                      ? "text-[#e7ab1c]"
                      : "text-[#e7ab1c]/70 group-hover:text-[#e7ab1c]"
                  }`}
                />
                <h3 className={`text-[17px] font-bold mb-2 ${accent ? "text-white" : "text-black"}`}>
                  {title}
                </h3>
                <p className={`text-[14px] leading-[1.65] ${accent ? "text-white/50" : "text-black/45"}`}>
                  {description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
