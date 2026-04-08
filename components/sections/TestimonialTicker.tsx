"use client"

import { useRef, useState, useEffect } from "react"

const sfDisplay = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}
const sfText = {
  fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

interface Testimonial {
  quote: string
  author: string
  role: string
  company: string
}

interface TestimonialTickerProps {
  testimonials?: Testimonial[]
}

const defaultTestimonials: Testimonial[] = [
  { quote: "The most impactful 48 hours of my professional year. Every conversation leads to something real.", author: "Vikram Rao", role: "CTO", company: "Reliance Jio" },
  { quote: "Connections here turned into three major partnerships within a month. The curation is extraordinary.", author: "Priya Nair", role: "VP Strategy", company: "HCLTech" },
  { quote: "Not a conference. A boardroom with 700 of the world's sharpest minds under one roof.", author: "Ahmad Al-Rashid", role: "CEO", company: "Gulf Ventures" },
  { quote: "Every edition raises the bar. I've attended all seven — each one outdoes the last.", author: "Sunita Kapoor", role: "CHRO", company: "Axis Bank" },
  { quote: "This is where real decisions happen, not just discussions. The access is unmatched anywhere.", author: "David Chen", role: "Managing Director", company: "Barclays Asia" },
  { quote: "From Bengaluru to Dubai — TLF's network is genuinely global. The scale is remarkable.", author: "Mei Lin Tan", role: "COO", company: "TechBridge SG" },
]

export function TestimonialTicker({ testimonials: propTestimonials }: TestimonialTickerProps) {
  const testimonials = propTestimonials && propTestimonials.length > 0 ? propTestimonials : defaultTestimonials
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const el = sectionRef.current
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

  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [visible])

  const active = testimonials[activeIndex]
  const nextIndex = (activeIndex + 1) % testimonials.length
  const prevIndex = (activeIndex - 1 + testimonials.length) % testimonials.length

  return (
    <section
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-[#050505] overflow-hidden"
    >
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: "800px",
          height: "400px",
          background: "radial-gradient(ellipse at center, rgba(231,171,28,0.05) 0%, transparent 60%)",
        }}
      />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Section label */}
        <div
          className="text-center mb-16"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <span className="text-[11px] tracking-[0.25em] uppercase text-[#e7ab1c]/50 font-semibold">
            What Leaders Say
          </span>
        </div>

        {/* Main quote area */}
        <div className="relative min-h-[280px] sm:min-h-[240px] flex items-center justify-center">
          {/* Large decorative quote mark */}
          <div
            className="absolute -top-4 left-0 sm:left-8 text-[120px] sm:text-[160px] leading-none font-serif text-[#e7ab1c]/[0.06] select-none pointer-events-none"
            style={{
              opacity: visible ? 1 : 0,
              transition: "opacity 1s ease 0.3s",
            }}
          >
            &ldquo;
          </div>

          {/* Quote text — crossfade on change */}
          <div className="relative w-full text-center px-4 sm:px-12">
            <blockquote
              key={activeIndex}
              className="testimonial-quote-enter"
            >
              <p
                className="text-[20px] sm:text-[26px] lg:text-[32px] text-white/85 font-medium leading-[1.4] tracking-[-0.01em]"
                style={sfDisplay}
              >
                {active.quote}
              </p>
              <footer className="mt-8 flex flex-col items-center gap-1">
                <div className="w-8 h-[1px] bg-[#e7ab1c]/30 mb-4" />
                <cite className="not-italic">
                  <span
                    className="text-[15px] font-semibold text-white/70"
                    style={sfText}
                  >
                    {active.author}
                  </span>
                  <span
                    className="block text-[13px] text-white/25 mt-0.5"
                    style={sfText}
                  >
                    {active.role}, {active.company}
                  </span>
                </cite>
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-12">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="group p-1"
              aria-label={`View testimonial ${i + 1}`}
            >
              <div
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: i === activeIndex ? "32px" : "8px",
                  backgroundColor:
                    i === activeIndex
                      ? "rgba(231,171,28,0.7)"
                      : "rgba(255,255,255,0.12)",
                }}
              />
            </button>
          ))}
        </div>

        {/* Preview names of adjacent testimonials */}
        <div className="hidden sm:flex items-center justify-between mt-10 px-4">
          <button
            onClick={() => setActiveIndex(prevIndex)}
            className="text-left group"
          >
            <span className="text-[11px] text-white/15 group-hover:text-white/30 transition-colors" style={sfText}>
              {testimonials[prevIndex].author}
            </span>
          </button>
          <button
            onClick={() => setActiveIndex(nextIndex)}
            className="text-right group"
          >
            <span className="text-[11px] text-white/15 group-hover:text-white/30 transition-colors" style={sfText}>
              {testimonials[nextIndex].author}
            </span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes quoteEnter {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .testimonial-quote-enter {
          animation: quoteEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </section>
  )
}
