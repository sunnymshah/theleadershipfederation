"use client"

import { useRef, useState, useEffect } from "react"

const stats = [
  { value: 30, suffix: "+", label: "Countries", sublabel: "Across Asia, Middle East & Beyond" },
  { value: 50, suffix: "+", label: "Flagship Events", sublabel: "Conclaves, Awards & Summits" },
  { value: 2000, suffix: "+", label: "Leaders Connected", sublabel: "CXOs, Policymakers & Founders" },
  { value: 700, suffix: "+", label: "CXOs at Mumbai 2026", sublabel: "Our Largest Edition Yet" },
]

function Counter({ target, suffix, active }: { target: number; suffix: string; active: boolean }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    const duration = 2200
    const start = performance.now()
    function step(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [active, target])

  return <>{count.toLocaleString()}{suffix}</>
}

export function NumbersReveal() {
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
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      className="relative py-16 lg:py-20 bg-[#F4F8FF] overflow-hidden"
    >
      {/* Ambient gold glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: "900px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(231,171,28,0.10) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="text-center mb-16">
          <span className="text-[11px] tracking-[0.25em] uppercase text-[#e7ab1c] font-semibold">
            The Impact
          </span>
          <h2 className="mt-3 text-[clamp(1.6rem,3.5vw,2.4rem)] font-bold text-[#1a1a2e] tracking-[-0.02em]">
            Numbers That Speak
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="text-center group bg-white rounded-2xl shadow-sm border border-[#1a1a2e]/[0.06] hover:shadow-md hover:border-[#e7ab1c]/30 transition-all duration-500 px-4 py-8"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.9)",
                transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 150}ms`,
              }}
            >
              <div className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold text-[#1a1a2e] leading-none tracking-tight">
                <Counter target={stat.value} suffix={stat.suffix} active={visible} />
              </div>
              <div className="mt-3 text-[14px] font-semibold text-[#e7ab1c] tracking-wide">
                {stat.label}
              </div>
              <div className="mt-1.5 text-[12px] text-[#1a1a2e]/55 font-medium">
                {stat.sublabel}
              </div>

              {/* Gold underline accent */}
              <div
                className="mx-auto mt-5 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#e7ab1c]/60 to-transparent"
                style={{
                  width: visible ? "60px" : "0px",
                  transition: `width 1s ease ${i * 150 + 600}ms`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
