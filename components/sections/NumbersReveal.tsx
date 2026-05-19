"use client"

import { useRef, useState, useEffect } from "react"
import { Globe2, CalendarCheck, Users, Sparkles } from "lucide-react"

function Counter({ target, suffix, active }: { target: number; suffix: string; active: boolean }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    const duration = 2000
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
      { threshold: 0.25 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const rise = (delay: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0) scale(1)" : "translateY(36px) scale(0.97)",
    transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
  })

  return (
    <section
      ref={ref}
      className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden"
    >
      {/* Tonal backdrop the glass tiles refract. */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(58% 52% at 50% -4%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
            "radial-gradient(50% 56% at 88% 100%, rgba(0,113,227,0.10) 0%, transparent 70%), " +
            "radial-gradient(46% 50% at 6% 84%, rgba(0,113,227,0.06) 0%, transparent 72%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="max-w-2xl mb-12 lg:mb-14" style={rise(0)}>
          <span className="inline-flex items-center gap-2 text-[12px] tracking-[0.2em] uppercase text-[#0071e3] font-semibold">
            <Sparkles size={13} /> By the Numbers
          </span>
          <h2 className="mt-4 text-[clamp(2.2rem,4.6vw,3.4rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.03]">
            A decade of <span className="text-[#0071e3]">measurable impact</span>
          </h2>
          <p className="mt-4 text-[#1d1d1f]/55 text-[17px] leading-relaxed">
            Every figure below is a room we filled with the people who move
            industries forward.
          </p>
        </div>

        {/* Bento grid of liquid-glass tiles. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 lg:auto-rows-[210px]">
          {/* Featured tile — flagship stat. */}
          <div
            className="lf-glass relative col-span-2 lg:row-span-2 rounded-[28px] overflow-hidden p-7 sm:p-9 flex flex-col justify-between min-h-[280px]"
            style={rise(0.1)}
          >
            <div
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(0,113,227,0.22) 0%, transparent 70%)",
              }}
            />
            <div className="relative flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[#0071e3] flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(0,113,227,0.6)]">
                <Users size={18} className="text-white" strokeWidth={2} />
              </span>
              <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#0071e3]">
                Mumbai 2026
              </span>
            </div>
            <div className="relative">
              <div className="text-[clamp(3.8rem,9vw,6.4rem)] font-bold text-[#1d1d1f] leading-[0.85] tracking-[-0.05em]">
                <Counter target={700} suffix="+" active={visible} />
              </div>
              <div className="mt-3 text-[18px] font-semibold text-[#1d1d1f] tracking-[-0.01em]">
                CXOs at our largest edition yet
              </div>
              <p className="mt-1.5 text-[14px] text-[#1d1d1f]/55 leading-relaxed max-w-sm">
                The single biggest gathering of senior leadership in the
                Federation&apos;s history.
              </p>
            </div>
          </div>

          {/* Countries */}
          <div
            className="lf-glass rounded-[28px] p-6 flex flex-col justify-between"
            style={rise(0.2)}
          >
            <Globe2 size={22} className="text-[#0071e3]" strokeWidth={1.9} />
            <div>
              <div className="text-[clamp(2.4rem,5vw,3.2rem)] font-bold text-[#1d1d1f] leading-[0.9] tracking-[-0.04em]">
                <Counter target={30} suffix="+" active={visible} />
              </div>
              <div className="mt-2 text-[13px] font-semibold text-[#1d1d1f]">
                Countries
              </div>
              <div className="text-[11.5px] text-[#1d1d1f]/50 leading-snug">
                Asia, the Middle East &amp; beyond
              </div>
            </div>
          </div>

          {/* Events */}
          <div
            className="lf-glass rounded-[28px] p-6 flex flex-col justify-between"
            style={rise(0.28)}
          >
            <CalendarCheck size={22} className="text-[#0071e3]" strokeWidth={1.9} />
            <div>
              <div className="text-[clamp(2.4rem,5vw,3.2rem)] font-bold text-[#1d1d1f] leading-[0.9] tracking-[-0.04em]">
                <Counter target={50} suffix="+" active={visible} />
              </div>
              <div className="mt-2 text-[13px] font-semibold text-[#1d1d1f]">
                Flagship Events
              </div>
              <div className="text-[11.5px] text-[#1d1d1f]/50 leading-snug">
                Conclaves, awards &amp; summits
              </div>
            </div>
          </div>

          {/* Leaders — wide */}
          <div
            className="lf-glass col-span-2 rounded-[28px] p-6 sm:p-7 flex items-center justify-between gap-5"
            style={rise(0.36)}
          >
            <div>
              <div className="text-[clamp(2.6rem,6vw,4rem)] font-bold text-[#1d1d1f] leading-[0.88] tracking-[-0.045em]">
                <Counter target={2000} suffix="+" active={visible} />
              </div>
              <div className="mt-2 text-[14px] font-semibold text-[#1d1d1f]">
                Leaders connected
              </div>
              <div className="text-[12px] text-[#1d1d1f]/50">
                CXOs, policymakers &amp; founders
              </div>
            </div>
            <div className="hidden sm:flex shrink-0">
              <div className="flex -space-x-3">
                {[0, 1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, rgba(0,113,227,${0.85 - n * 0.16}), rgba(0,113,227,${0.55 - n * 0.12}))`,
                    }}
                  />
                ))}
                <span className="w-12 h-12 rounded-full border-2 border-white bg-white flex items-center justify-center text-[12px] font-bold text-[#0071e3] shadow-sm">
                  +2k
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
