"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { Globe, Award, Users, ArrowRight } from "lucide-react"

const sfDisplay = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}
const sfText = {
  fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

const benefits = [
  {
    icon: Globe,
    title: "Global Audience",
    description: "Present to CXOs and decision-makers from 30+ countries at premier leadership events.",
  },
  {
    icon: Award,
    title: "Thought Leadership",
    description: "Establish your authority and amplify your personal brand on an international stage.",
  },
  {
    icon: Users,
    title: "Premium Networking",
    description: "Connect with industry leaders, policymakers, and ecosystem builders in curated settings.",
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

  return (
    <section
      ref={ref}
      className="relative py-16 lg:py-20 bg-[#1a1a2e] overflow-hidden"
    >
      {/* Background decorative elements */}
      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: "500px",
          height: "500px",
          background: "radial-gradient(ellipse at top right, rgba(231,171,28,0.06) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 pointer-events-none"
        style={{
          width: "400px",
          height: "400px",
          background: "radial-gradient(ellipse at bottom left, rgba(231,171,28,0.04) 0%, transparent 60%)",
        }}
      />

      {/* Gold accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#e7ab1c]/30 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side — content */}
          <div>
            <div
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <span
                className="inline-block text-[11px] tracking-[0.25em] uppercase text-[#e7ab1c] font-semibold mb-4"
                style={sfText}
              >
                Become a Speaker
              </span>
              <h2
                className="text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.08] text-white font-bold tracking-[-0.02em] mb-5"
                style={sfDisplay}
              >
                Share Your Expertise
                <br />
                on a{" "}
                <span className="text-[#e7ab1c]">Global Stage</span>
              </h2>
              <p
                className="text-white/70 text-[15px] leading-[1.7] max-w-md mb-8"
                style={sfText}
              >
                Join a distinguished roster of speakers at The Leadership Federation&apos;s
                flagship conclaves and summits. Share your insights with leaders shaping
                the future across industries and continents.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-5">
              {benefits.map((benefit, i) => {
                const Icon = benefit.icon
                return (
                  <div
                    key={benefit.title}
                    className="flex items-start gap-4"
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateX(0)" : "translateX(-24px)",
                      transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${0.15 + i * 0.1}s`,
                    }}
                  >
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-[#e7ab1c]/10 border border-[#e7ab1c]/20 flex items-center justify-center">
                      <Icon size={18} className="text-[#e7ab1c]" strokeWidth={1.8} />
                    </div>
                    <div>
                      <h3
                        className="text-[15px] font-semibold text-white mb-1"
                        style={sfText}
                      >
                        {benefit.title}
                      </h3>
                      <p
                        className="text-[13px] text-white/60 leading-[1.6]"
                        style={sfText}
                      >
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right side — CTA card */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.97)",
              transition: "all 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s",
            }}
          >
            <div className="relative rounded-3xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm p-8 lg:p-10">
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-tr-3xl">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[#e7ab1c]/15 to-transparent" />
              </div>

              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-[#e7ab1c] flex items-center justify-center mb-6 shadow-[0_4px_20px_rgba(231,171,28,0.3)]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </div>

                <h3
                  className="text-[22px] font-bold text-white mb-3 tracking-[-0.01em]"
                  style={sfDisplay}
                >
                  Ready to take the stage?
                </h3>
                <p
                  className="text-[14px] text-white/65 leading-[1.7] mb-8"
                  style={sfText}
                >
                  Apply to be a speaker at our upcoming events. We are looking for
                  visionary leaders with compelling stories, actionable insights, and
                  a passion for shaping the future of business.
                </p>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { value: "30+", label: "Countries" },
                    { value: `${(speakerCount ?? 0) >= 500 ? speakerCount : 500}+`, label: "Speakers" },
                    { value: `${(eventCount ?? 0) >= 50 ? eventCount : 50}+`, label: "Events" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div
                        className="text-[20px] font-bold text-[#e7ab1c]"
                        style={sfDisplay}
                      >
                        {stat.value}
                      </div>
                      <div
                        className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5"
                        style={sfText}
                      >
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/register?type=speaker"
                  className="group w-full inline-flex items-center justify-center gap-2.5 px-8 py-[15px] rounded-full font-semibold text-[14px] text-[#1a1a2e] bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] shadow-[0_4px_24px_rgba(231,171,28,0.3)]"
                  style={sfText}
                >
                  Apply as a Speaker
                  <ArrowRight
                    size={15}
                    className="group-hover:translate-x-1 transition-transform duration-200"
                  />
                </Link>

                <p
                  className="text-center text-[11px] text-white/40 mt-4"
                  style={sfText}
                >
                  Applications reviewed within 5 business days
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
