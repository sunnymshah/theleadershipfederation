"use client"

import Image from "next/image"
import Link from "next/link"
import { CalendarDays, Crown, Mic2, ArrowRight } from "lucide-react"
import { DotGrid, GoldStarburst } from "@/components/ui/GoldPattern"

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
    image: "https://img.einpresswire.com/large/757972/3rd-edition-middle-east-asia-le.png",
  },
  {
    icon: Crown,
    title: "The Inner Circle",
    description: "Invite-only membership for senior leaders. Private roundtables, curated access, and strategic dialogue.",
    href: "/platforms",
    stat: "500+",
    statLabel: "Members",
    image: "https://img.einpresswire.com/large/713803/4th-asia-leadership-awards.png",
  },
  {
    icon: Mic2,
    title: "The Sunny Shah Show",
    description: "Podcasts and media spotlights amplifying voices shaping global business. C-suite conversations that move industries.",
    href: "/media",
    stat: "60+",
    statLabel: "Episodes",
    image: "https://img.einpresswire.com/large/733210/bharat-leadership-awards.png",
  },
]

export function EcosystemGrid() {
  return (
    <section className="relative py-20 lg:py-28 bg-[#F4F8FF] overflow-hidden">
      <DotGrid className="opacity-40" />
      <GoldStarburst />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="text-center mb-14 animate-fade-in-up">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e7ab1c]/[0.08] border border-[#e7ab1c]/[0.15] mb-5">
            <span className="text-[11px] font-semibold text-[#e7ab1c] tracking-[0.1em] uppercase">Three Pillars</span>
          </span>
          <h2
            className="text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] text-black font-bold tracking-[-0.02em]"
            style={sfDisplay}
          >
            The Ecosystem
          </h2>
          <p className="mt-3 text-black/35 text-[15px]">One mission. Global impact.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pillars.map((p, i) => {
            const Icon = p.icon
            return (
              <div key={p.title} className="animate-fade-in-up" style={{ animationDelay: `${i * 120}ms` }}>
                <Link
                  href={p.href}
                  className="group block bg-white/70 border border-black/[0.04] rounded-2xl overflow-hidden h-full hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:border-[#e7ab1c]/20 transition-all duration-300 relative"
                >
                  {/* Card image */}
                  <div className="relative h-36 overflow-hidden">
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/20 to-transparent" />
                    <div className="absolute top-3 right-3 text-right">
                      <div className="text-[18px] font-bold text-white leading-none drop-shadow-md">{p.stat}</div>
                      <div className="text-[9px] text-white/80 uppercase tracking-wider font-medium drop-shadow-md">{p.statLabel}</div>
                    </div>
                  </div>

                  <div className="p-6 pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-[#e7ab1c]/10 flex items-center justify-center group-hover:bg-[#e7ab1c]/15 transition-colors duration-300">
                        <Icon size={18} strokeWidth={1.5} className="text-[#e7ab1c]" />
                      </div>
                      <h3 className="text-[16px] font-bold text-black">{p.title}</h3>
                    </div>
                    <p className="text-[13px] text-black/35 leading-[1.7] mb-4">{p.description}</p>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e7ab1c] group-hover:gap-2.5 transition-all duration-200">
                      Learn more <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
