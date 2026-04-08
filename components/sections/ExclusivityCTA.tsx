"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { MagneticButton } from "@/components/ui/MagneticButton"

const sfDisplay = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}
const sfText = {
  fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

const pressLogos = [
  { name: "Gulf News", src: "/partners/gulf-news.png" },
  { name: "EIN Presswire", src: "/press/ein-presswire.png" },
  { name: "Frost & Sullivan", src: "/partners/frost-sullivan.png" },
  { name: "Business Standard", src: "/press/business-standard.png" },
  { name: "Economic Times", src: "/press/economic-times.png" },
  { name: "YourStory", src: "/press/yourstory.png" },
]

export function ExclusivityCTA() {
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
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      className="relative py-28 lg:py-36 bg-[#F4F8FF] overflow-hidden"
    >
      {/* Subtle radial gradient behind CTA */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "1000px",
          height: "600px",
          background: "radial-gradient(ellipse at center top, rgba(231,171,28,0.06) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Press logos — trust strip */}
        <div
          className="mb-16"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div className="text-center mb-6">
            <span className="text-[10px] tracking-[0.2em] uppercase text-black/20 font-semibold" style={sfText}>
              As Featured In
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {pressLogos.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-1.5 opacity-25 hover:opacity-50 transition-opacity duration-300"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={p.name}
                  loading="lazy"
                  className="h-[18px] w-auto object-contain"
                  style={{ filter: "brightness(0) opacity(0.8)" }}
                />
                <span className="text-[11px] font-semibold text-black/40 whitespace-nowrap" style={sfText}>
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-12 h-[1px] bg-black/[0.06] mx-auto mb-16" />

        {/* CTA content */}
        <div
          className="text-center"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s",
          }}
        >
          <h2
            className="text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.05] text-black font-bold tracking-[-0.03em]"
            style={sfDisplay}
          >
            Your seat at the
            <br />
            <span className="text-[#e7ab1c]">table awaits</span>
          </h2>
          <p
            className="mt-5 text-black/30 text-[16px] leading-relaxed max-w-md mx-auto"
            style={sfText}
          >
            Whether you are a leader, enterprise, or institution — there is a place for you
            in the conversation that shapes tomorrow.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <MagneticButton>
              <Link
                href="/events"
                className="group inline-flex items-center gap-2.5 px-9 py-[15px] rounded-full font-semibold text-[14px] text-white bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] shadow-[0_4px_24px_rgba(231,171,28,0.25)]"
              >
                Explore Events
                <ArrowRight
                  size={15}
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link
                href="/platforms"
                className="inline-flex items-center gap-2 px-7 py-[14px] rounded-full text-[14px] font-medium text-black/40 border border-black/[0.08] hover:border-black/15 hover:text-black/65 transition-all duration-200"
              >
                Join Inner Circle
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link
                href="/partners"
                className="inline-flex items-center gap-2 px-7 py-[14px] rounded-full text-[14px] font-medium text-black/40 border border-black/[0.08] hover:border-black/15 hover:text-black/65 transition-all duration-200"
              >
                Partner With Us
              </Link>
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  )
}
