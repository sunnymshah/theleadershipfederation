"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Crown, Handshake, CalendarDays } from "lucide-react"

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const actions = [
  {
    icon: CalendarDays,
    label: "Explore Events",
    description: "View upcoming conclaves and summits",
    href: "/events",
  },
  {
    icon: Crown,
    label: "Join Inner Circle",
    description: "Apply for exclusive membership",
    href: "/platforms",
  },
  {
    icon: Handshake,
    label: "Partner With Us",
    description: "Strategic partnerships and sponsorships",
    href: "/partners",
  },
]

export function ExclusivityCTA() {
  return (
    <section className="py-24 lg:py-32 bg-[#F4F8FF]">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.1] text-[#1a1a2e]">
            Ready to Join the{" "}
            <span className="text-[#1a1a2e]/40">Ecosystem?</span>
          </h2>
          <p className="mt-5 max-w-lg mx-auto text-[#1a1a2e]/40 text-[16px] leading-relaxed">
            Whether you are a leader, enterprise, or institution — there is a place for you
            in The Leadership Federation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {actions.map((action, i) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                variants={fadeInUp}
              >
                <Link
                  href={action.href}
                  className="group block bg-white/70 border border-[#1a1a2e]/[0.04] rounded-2xl p-8 text-center hover:bg-white hover:shadow-[0_12px_40px_rgba(26,26,46,0.06)] transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#1a1a2e]/[0.04] group-hover:bg-[#1a1a2e] flex items-center justify-center mx-auto mb-5 transition-colors duration-300">
                    <Icon size={24} strokeWidth={1.5} className="text-[#1a1a2e]/35 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-[18px] font-bold text-[#1a1a2e] mb-2">{action.label}</h3>
                  <p className="text-[14px] text-[#1a1a2e]/40 mb-5">{action.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1a1a2e]/40 group-hover:text-[#1a1a2e] transition-colors duration-200">
                    Learn more
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
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
