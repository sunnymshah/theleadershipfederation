"use client"

import { motion } from "framer-motion"
import { Shield, Network, Lightbulb, Target, Globe, Zap } from "lucide-react"

const reasons = [
  {
    icon: Shield,
    title: "Curated Access",
    description: "Invite-only gatherings with pre-vetted leaders. No sales pitches, no cold networking — only high-value conversations.",
  },
  {
    icon: Network,
    title: "Cross-Border Connections",
    description: "Bridging enterprises, GCCs, governments, and emerging ecosystems across 30+ countries.",
  },
  {
    icon: Lightbulb,
    title: "Strategic Intelligence",
    description: "First-hand insights on AI integration, talent strategies, and operational transformation from practitioners, not theorists.",
  },
  {
    icon: Target,
    title: "Deal-Making Environment",
    description: "Partnerships, investments, and collaborations that start in our rooms and scale globally.",
  },
  {
    icon: Globe,
    title: "Global Platform",
    description: "From Bengaluru to Dubai, Kuala Lumpur to Bangkok — a truly international leadership network.",
  },
  {
    icon: Zap,
    title: "Immediate ROI",
    description: "Leaders leave with actionable strategies, new partnerships, and expanded boardroom influence.",
  },
]

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export function WhyLeadersEngage() {
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
            Why Leaders Engage
          </span>
          <h2 className="mt-4 font-serif text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.1] text-[#1a1a2e]">
            Not Another Conference.{" "}
            <span className="text-[#1a1a2e]/40">A Leadership Ecosystem.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason, i) => {
            const Icon = reason.icon
            return (
              <motion.div
                key={reason.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                variants={fadeInUp}
                className="bg-white/60 border border-[#1a1a2e]/[0.04] rounded-2xl p-7 hover:bg-white/80 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-[#1a1a2e]/[0.04] flex items-center justify-center mb-5">
                  <Icon size={20} strokeWidth={1.5} className="text-[#1a1a2e]/35" />
                </div>
                <h3 className="text-[17px] font-bold text-[#1a1a2e] mb-2">{reason.title}</h3>
                <p className="text-[14px] text-[#1a1a2e]/40 leading-[1.7]">{reason.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
