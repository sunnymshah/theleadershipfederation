"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { Globe, Award, Users, ArrowRight, Mic2 } from "lucide-react"

const benefits = [
  {
    icon: Globe,
    title: "Global Audience",
    description: "Present to CXOs and decision-makers from 30+ countries.",
  },
  {
    icon: Award,
    title: "Thought Leadership",
    description: "Amplify your authority on a recognised international stage.",
  },
  {
    icon: Users,
    title: "Premium Networking",
    description: "Connect with leaders and policymakers in curated settings.",
  },
]

interface BeASpeakerProps {
  eventCount?: number
  speakerCount?: number
}

export function BeASpeaker({ eventCount, speakerCount }: BeASpeakerProps) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const stats = [
    { value: "30+", label: "Countries" },
    { value: `${(speakerCount ?? 0) >= 500 ? speakerCount : 500}+`, label: "Speakers" },
    { value: `${(eventCount ?? 0) >= 50 ? eventCount : 50}+`, label: "Events" },
  ]

  return (
    <section
      ref={ref}
      className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden"
    >
      {/* Tonal backdrop. */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(56% 54% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 72%), " +
            "radial-gradient(54% 56% at 90% 96%, rgba(0,113,227,0.10) 0%, transparent 70%), " +
            "radial-gradient(46% 50% at 8% 92%, rgba(0,113,227,0.06) 0%, transparent 72%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* One dramatic liquid-glass feature panel. */}
        <div
          className="lf-glass-strong relative rounded-[36px] overflow-hidden p-8 sm:p-12 lg:p-16"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.97)",
            transition: "all 1s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* corner glows */}
          <div
            className="absolute -top-24 -left-20 w-72 h-72 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(0,113,227,0.16) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(0,113,227,0.12) 0%, transparent 70%)",
            }}
          />

          {/* Header */}
          <div className="relative text-center max-w-xl mx-auto">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0071e3] mb-6 shadow-[0_16px_36px_-10px_rgba(0,113,227,0.7)]">
              <Mic2 size={28} className="text-white" strokeWidth={1.8} />
            </span>
            <div className="text-[12px] tracking-[0.2em] uppercase text-[#0071e3] font-semibold">
              Become a Speaker
            </div>
            <h2 className="mt-3 text-[clamp(2rem,4.4vw,3.2rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.04]">
              Your insight belongs
              <br />
              on a <span className="text-[#0071e3]">global stage</span>
            </h2>
            <p className="mt-4 text-[#1d1d1f]/60 text-[16px] leading-[1.7]">
              Join the faculty of leaders shaping The Leadership Federation&apos;s
              flagship conclaves and summits.
            </p>
          </div>

          {/* Benefit tiles — glass on glass. */}
          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            {benefits.map((b, i) => {
              const Icon = b.icon
              return (
                <div
                  key={b.title}
                  className="rounded-2xl bg-white/55 border border-black/[0.05] p-5 text-center"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(20px)",
                    transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${0.25 + i * 0.1}s`,
                  }}
                >
                  <div className="inline-flex w-11 h-11 rounded-xl bg-[#0071e3]/[0.1] border border-[#0071e3]/15 items-center justify-center mb-3">
                    <Icon size={19} className="text-[#0071e3]" strokeWidth={1.9} />
                  </div>
                  <h3 className="text-[14px] font-semibold text-[#1d1d1f]">
                    {b.title}
                  </h3>
                  <p className="mt-1 text-[12.5px] text-[#1d1d1f]/55 leading-[1.55]">
                    {b.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Footer — stats + CTA. */}
          <div className="relative mt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 sm:gap-8">
              {stats.map((s, i) => (
                <div key={s.label} className="flex items-center gap-6 sm:gap-8">
                  {i > 0 && <span className="w-px h-9 bg-black/[0.08]" />}
                  <div className="text-center">
                    <div className="text-[22px] font-bold text-[#1d1d1f] tracking-[-0.02em]">
                      {s.value}
                    </div>
                    <div className="text-[10.5px] text-[#1d1d1f]/50 uppercase tracking-[0.1em] font-semibold mt-0.5">
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/register?type=speaker"
              className="group inline-flex items-center justify-center gap-2.5 px-9 py-[16px] rounded-full font-bold text-[15px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 active:scale-[0.98] shadow-[0_14px_34px_-10px_rgba(0,113,227,0.65)]"
            >
              Apply as a Speaker
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform duration-200"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
