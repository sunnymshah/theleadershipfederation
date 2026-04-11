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

export function TestimonialTicker({ testimonials: propTestimonials }: TestimonialTickerProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const testimonials = propTestimonials ?? []
  const hasTestimonials = testimonials.length > 0

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
    if (!visible || !hasTestimonials) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [visible, hasTestimonials, testimonials.length])

  // If no real testimonials in DB, don't render this section at all
  if (!hasTestimonials) return null

  const active = testimonials[activeIndex]

  return (
    <section
      ref={sectionRef}
      className="relative py-16 lg:py-20 bg-[#F4F8FF] overflow-hidden"
    >
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: "800px",
          height: "400px",
          background: "radial-gradient(ellipse at center, rgba(231,171,28,0.10) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Section label */}
        <div
          className="text-center mb-14"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <span className="text-[11px] tracking-[0.25em] uppercase text-[#e7ab1c] font-semibold">
            What Leaders Say
          </span>
        </div>

        {/* Quote card */}
        <div className="relative bg-white rounded-3xl shadow-sm border border-[#1a1a2e]/[0.06] px-6 sm:px-12 lg:px-16 py-12 sm:py-16">
          {/* Large decorative quote mark */}
          <div
            className="absolute top-4 left-6 sm:left-10 text-[100px] sm:text-[140px] leading-none font-serif text-[#e7ab1c]/15 select-none pointer-events-none"
            aria-hidden
          >
            &ldquo;
          </div>

          <div className="relative w-full text-center min-h-[200px] flex flex-col justify-center">
            <blockquote key={activeIndex} className="testimonial-quote-enter">
              <p
                className="text-[20px] sm:text-[26px] lg:text-[30px] text-[#1a1a2e] font-medium leading-[1.45] tracking-[-0.01em]"
                style={sfDisplay}
              >
                {active.quote}
              </p>
              <footer className="mt-8 flex flex-col items-center gap-1">
                <div className="w-8 h-[1px] bg-[#e7ab1c]/50 mb-4" />
                <cite className="not-italic">
                  <span
                    className="text-[15px] font-semibold text-[#1a1a2e]"
                    style={sfText}
                  >
                    {active.author}
                  </span>
                  {(active.role || active.company) && (
                    <span
                      className="block text-[13px] text-[#1a1a2e]/55 mt-0.5"
                      style={sfText}
                    >
                      {[active.role, active.company].filter(Boolean).join(", ")}
                    </span>
                  )}
                </cite>
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Dot indicators */}
        {testimonials.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
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
                        ? "rgba(231,171,28,0.85)"
                        : "rgba(26,26,46,0.18)",
                  }}
                />
              </button>
            ))}
          </div>
        )}
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
