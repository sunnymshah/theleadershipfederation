"use client"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { GoldChevrons, GoldOrbs } from "@/components/ui/GoldPattern"
import { AnimatedCounter } from "@/components/ui/AnimatedCounter"

const sfDisplay = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}
const sfText = {
  fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

const stats = [
  { value: 30, suffix: "+", label: "Countries" },
  { value: 50, suffix: "+", label: "Events" },
  { value: 2000, suffix: "+", label: "Leaders" },
]

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [imageOffset, setImageOffset] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    let ticking = false
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const rect = section!.getBoundingClientRect()
        const sectionH = section!.offsetHeight
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          const progress = Math.min(1, Math.max(0, -rect.top / sectionH))
          setImageOffset(progress)
        }
        ticking = false
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const imageY = imageOffset * 80
  const imageScale = 1 + imageOffset * 0.06

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#F4F8FF]"
    >
      <GoldChevrons />
      <GoldOrbs />

      <style jsx>{`
        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFadeInTitle {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroGoldSlide {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes heroScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes heroBadgeIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes heroEditionIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .hero-anim {
          opacity: 0;
          animation: heroFadeIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .hero-anim-title {
          opacity: 0;
          animation: heroFadeInTitle 0.7s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .hero-anim-gold {
          opacity: 0;
          animation: heroGoldSlide 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s forwards;
        }
        .hero-anim-scale {
          opacity: 0;
          animation: heroScaleIn 1s cubic-bezier(0.16,1,0.3,1) 0.15s forwards;
        }
        .hero-anim-badge {
          opacity: 0;
          animation: heroBadgeIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.9s forwards;
        }
        .hero-anim-edition {
          opacity: 0;
          animation: heroEditionIn 0.6s ease 1.2s forwards;
        }
      `}</style>

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-16 pt-28 pb-20 lg:pt-0 lg:pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[80vh]">

          {/* LEFT — Copy */}
          <div className="order-2 lg:order-1">
            <div
              className="hero-anim inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e7ab1c]/[0.08] border border-[#e7ab1c]/[0.15] mb-6"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#e7ab1c] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#e7ab1c] tracking-[0.05em] uppercase" style={sfText}>
                7th GCC Leadership Conclave — May 21-22, Mumbai
              </span>
            </div>

            <h1
              className="hero-anim-title leading-[0.95] tracking-[-0.03em] text-black"
              style={{
                fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
                fontWeight: 700,
                ...sfDisplay,
              }}
            >
              Direct Access to{" "}
              <span className="hero-anim-gold text-[#e7ab1c] inline-block">
                Global Leaders
              </span>
            </h1>

            <p
              className="hero-anim mt-6 max-w-[440px] text-black/40 leading-[1.7] text-[16px]"
              style={{ animationDelay: "0.2s", ...sfText }}
            >
              Connecting GCC leaders, CXOs, and decision-makers through
              high-value conversations, strategic partnerships, and curated access.
            </p>

            <div
              className="hero-anim mt-8 flex flex-wrap items-center gap-4"
              style={{ animationDelay: "0.35s" }}
            >
              <Link
                href="/events"
                className="group inline-flex items-center gap-2.5 px-8 py-[14px] rounded-full font-semibold text-[15px] text-white bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
              >
                Explore Events
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href="/platforms"
                className="inline-flex items-center gap-2 px-7 py-[13px] rounded-full text-[15px] font-medium text-black/50 border border-black/10 hover:border-black/20 hover:text-black/75 transition-all duration-200"
              >
                Join Inner Circle
              </Link>
            </div>

            {/* Animated stats */}
            <div
              className="hero-anim mt-10 sm:mt-14 flex items-center gap-6 sm:gap-10"
              style={{ animationDelay: "0.5s" }}
            >
              {stats.map(({ value, suffix, label }, i) => (
                <div key={label}>
                  <div className="text-[20px] sm:text-[26px] font-bold text-black tracking-tight leading-none">
                    <AnimatedCounter value={value} suffix={suffix} duration={2000 + i * 300} />
                  </div>
                  <div className="text-[9px] sm:text-[11px] text-black/30 tracking-[0.1em] uppercase font-medium mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Real TLF event image */}
          <div className="hero-anim-scale order-1 lg:order-2 flex items-center justify-center">
            <div className="relative w-full max-w-[480px]">
              <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.10)]">
                <div
                  className="w-full h-full"
                  style={{
                    transform: `translateY(${imageY}px) scale(${imageScale})`,
                    willChange: "transform",
                  }}
                >
                  <Image
                    src="/hero-speaker.jpg"
                    alt="Speaker on stage at a Leadership Federation event"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>

              {/* Next event badge */}
              <div className="hero-anim-badge absolute -bottom-4 left-0 sm:-left-4 lg:-left-8 bg-white/90 backdrop-blur-xl rounded-2xl px-4 sm:px-5 py-3 sm:py-4 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-black/[0.04]">
                <div className="text-[10px] text-[#e7ab1c] uppercase tracking-[0.12em] font-bold mb-1">Next Event</div>
                <div className="text-[14px] font-bold text-black">7th GCC Leadership Conclave</div>
                <div className="text-[12px] text-black/40">May 21-22 &middot; Mumbai</div>
              </div>

              {/* Edition badge */}
              <div className="hero-anim-edition absolute -top-3 -right-3 w-16 h-16 bg-[#e7ab1c] rounded-2xl flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(231,171,28,0.3)] rotate-6">
                <span className="text-[18px] font-bold text-white leading-none">7th</span>
                <span className="text-[8px] text-white/70 uppercase tracking-wider font-semibold">Edition</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
