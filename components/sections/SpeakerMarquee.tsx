"use client"

import Image from "next/image"

const sfDisplay = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}
const sfText = {
  fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

interface SpeakerData {
  name: string
  role: string
  initials: string
  imageUrl?: string | null
}

const fallbackSpeakers: SpeakerData[] = [
  { name: "Dr. Priya Kapoor", role: "CEO, TechVista", initials: "PK" },
  { name: "Ahmad Al-Rashid", role: "CEO, Gulf Ventures", initials: "AR" },
  { name: "Vikram Rao", role: "CTO, Reliance Jio", initials: "VR" },
  { name: "Mei Lin Tan", role: "COO, TechBridge SG", initials: "MT" },
  { name: "David Chen", role: "MD, Barclays Asia", initials: "DC" },
  { name: "Sunita Patel", role: "CHRO, Axis Bank", initials: "SP" },
  { name: "Rajesh Menon", role: "Founder, InnovateCo", initials: "RM" },
  { name: "Fatima Hassan", role: "VP Digital, Emirates", initials: "FH" },
  { name: "James Whitfield", role: "CIO, Standard Chartered", initials: "JW" },
  { name: "Ananya Desai", role: "CFO, Cadila Pharma", initials: "AD" },
  { name: "Wei Zhang", role: "Partner, EY Asia", initials: "WZ" },
  { name: "Kavitha Raman", role: "CTO, HCLTech", initials: "KR" },
  { name: "Omar Siddiqui", role: "CEO, Mashreq Digital", initials: "OS" },
  { name: "Nisha Gupta", role: "MD, Apollo Hospitals", initials: "NG" },
  { name: "Tom Richards", role: "VP Innovation, Atos", initials: "TR" },
  { name: "Lakshmi Iyer", role: "Head Strategy, SBI", initials: "LI" },
]

function SpeakerCard({ name, role, initials, imageUrl }: SpeakerData) {
  return (
    <div className="mx-3 shrink-0 flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-[#e7ab1c]/20 hover:bg-[#e7ab1c]/[0.03] transition-all duration-500 group">
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#e7ab1c]/20 to-[#e7ab1c]/5 flex items-center justify-center shrink-0 group-hover:from-[#e7ab1c]/30 group-hover:to-[#e7ab1c]/10 transition-all duration-500 overflow-hidden relative">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" sizes="44px" />
        ) : (
          <span className="text-[13px] font-bold text-[#e7ab1c]/70" style={sfDisplay}>{initials}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-white/70 truncate" style={sfText}>{name}</p>
        <p className="text-[11px] text-white/25 truncate" style={sfText}>{role}</p>
      </div>
    </div>
  )
}

interface Props {
  speakers?: SpeakerData[]
}

export function SpeakerMarquee({ speakers }: Props) {
  // Use DB speakers if provided and non-empty, otherwise use fallback
  const allSpeakers = speakers && speakers.length > 0 ? speakers : fallbackSpeakers

  // Split into two rows
  const mid = Math.ceil(allSpeakers.length / 2)
  const row1 = allSpeakers.slice(0, mid)
  const row2 = allSpeakers.slice(mid)

  // Double for infinite scroll
  const doubled1 = [...row1, ...row1]
  const doubled2 = [...row2, ...row2]

  return (
    <section className="relative py-20 lg:py-28 bg-[#050505] overflow-hidden">
      {/* Top edge gold line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#e7ab1c]/20 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="text-center mb-14">
          <span className="text-[11px] tracking-[0.25em] uppercase text-[#e7ab1c]/50 font-semibold">
            The Network
          </span>
          <h2
            className="mt-3 text-[clamp(1.6rem,3.5vw,2.4rem)] font-bold text-white/90 tracking-[-0.02em]"
            style={sfDisplay}
          >
            Leaders Who Shape Industries
          </h2>
          <p className="mt-3 text-white/25 text-[14px] max-w-md mx-auto" style={sfText}>
            CXOs, policymakers, and innovators from 30+ countries across Asia, the Middle East, and beyond
          </p>
        </div>
      </div>

      {/* Row 1 — scrolls left */}
      <div className="relative mb-4">
        <div className="absolute left-0 top-0 bottom-0 w-20 lg:w-40 z-10 bg-gradient-to-r from-[#050505] to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-20 lg:w-40 z-10 bg-gradient-to-l from-[#050505] to-transparent" />
        <div className="flex animate-speaker-scroll-left items-center whitespace-nowrap">
          {doubled1.map((s, i) => (
            <SpeakerCard key={`r1-${s.initials}-${i}`} {...s} />
          ))}
        </div>
      </div>

      {/* Row 2 — scrolls right */}
      {doubled2.length > 0 && (
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 lg:w-40 z-10 bg-gradient-to-r from-[#050505] to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 w-20 lg:w-40 z-10 bg-gradient-to-l from-[#050505] to-transparent" />
          <div className="flex animate-speaker-scroll-right items-center whitespace-nowrap">
            {doubled2.map((s, i) => (
              <SpeakerCard key={`r2-${s.initials}-${i}`} {...s} />
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scrollLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes scrollRight {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .animate-speaker-scroll-left {
          animation: scrollLeft 40s linear infinite;
        }
        .animate-speaker-scroll-left:hover {
          animation-play-state: paused;
        }
        .animate-speaker-scroll-right {
          animation: scrollRight 45s linear infinite;
        }
        .animate-speaker-scroll-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}
