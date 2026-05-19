"use client"

import { useRef, useState, useEffect } from "react"
import { Star } from "lucide-react"

/**
 * LogoMarquee — the trust strip directly under the hero.
 *
 * Rather than raw logos, it names the institutions whose executives and
 * strategic partners convene at the Federation's conclaves. Strategic
 * partners carry a star accent; everyone else is a confirmed participant.
 */
type Company = { name: string; strategic?: boolean }

const COMPANIES: Company[] = [
  { name: "Government of Kerala", strategic: true },
  { name: "Intellect Design", strategic: true },
  { name: "Planview", strategic: true },
  { name: "Google" },
  { name: "KPMG" },
  { name: "EY" },
  { name: "Schneider Electric" },
  { name: "Novartis" },
  { name: "Autodesk" },
  { name: "Bank of New York" },
  { name: "Uber" },
  { name: "CBRE" },
  { name: "Best Buy" },
  { name: "Applied Materials" },
  { name: "Western Union" },
]

function CompanyChip({ name, strategic }: Company) {
  return (
    <div
      className={
        "mx-2 shrink-0 inline-flex items-center gap-2.5 rounded-full px-6 py-3 " +
        "transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] " +
        (strategic
          ? "lf-glass ring-1 ring-[#0071e3]/25"
          : "lf-glass")
      }
    >
      {strategic && (
        <Star size={13} className="text-[#0071e3] shrink-0" fill="currentColor" />
      )}
      <span className="text-[15px] font-semibold text-[#1d1d1f] tracking-[-0.01em] whitespace-nowrap">
        {name}
      </span>
      {strategic && (
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0071e3] whitespace-nowrap">
          Strategic Partner
        </span>
      )}
    </div>
  )
}

export function LogoMarquee() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const doubled = [...COMPANIES, ...COMPANIES]

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
      className="relative bg-white py-14 sm:py-20 overflow-hidden border-y border-black/[0.06]"
    >
      {/* Soft tonal backdrop the glass chips refract. */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(58% 64% at 50% 50%, rgba(0,113,227,0.05) 0%, transparent 72%)",
        }}
      />

      {/* Fancy intro line. */}
      <div
        className="relative z-10 text-center px-6 mb-9 sm:mb-11"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(18px)",
          transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <span className="text-[11px] sm:text-[12px] tracking-[0.24em] uppercase text-[#0071e3] font-semibold">
          In Distinguished Company
        </span>
        <p className="mt-3 mx-auto max-w-2xl text-[clamp(1.15rem,2.4vw,1.6rem)] font-semibold text-[#1d1d1f] tracking-[-0.02em] leading-[1.35]">
          Executives and strategic partners from the institutions
          shaping the global economy
        </p>
      </div>

      {/* Glass-chip marquee. */}
      <div
        className="relative z-10"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.9s ease 0.2s",
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 lg:w-44 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 lg:w-44 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        <div className="flex animate-company-row items-center whitespace-nowrap py-2">
          {doubled.map((c, i) => (
            <CompanyChip key={`${c.name}-${i}`} {...c} />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes companyRow {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-company-row {
          animation: companyRow 46s linear infinite;
          width: max-content;
        }
        .animate-company-row:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}
