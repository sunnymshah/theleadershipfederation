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


function SpeakerCard({ name, role, initials, imageUrl }: SpeakerData) {
  return (
    <div className="mx-3 shrink-0 flex items-center gap-3.5 px-5 py-3 rounded-2xl lf-glass hover:border-[#0071e3]/45 transition-all duration-500 group">
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0071e3]/25 to-[#0071e3]/10 flex items-center justify-center shrink-0 group-hover:from-[#0071e3]/35 group-hover:to-[#0071e3]/15 transition-all duration-500 overflow-hidden relative">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" sizes="44px" />
        ) : (
          <span className="text-[13px] font-bold text-[#0071e3]" style={sfDisplay}>{initials}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[#1d1d1f] truncate" style={sfText}>{name}</p>
        <p className="text-[11px] text-[#1d1d1f]/55 truncate" style={sfText}>{role}</p>
      </div>
    </div>
  )
}

interface Props {
  speakers?: SpeakerData[]
}

export function SpeakerMarquee({ speakers }: Props) {
  const allSpeakers = speakers ?? []

  // Don't render the section if no speakers exist
  if (allSpeakers.length === 0) return null

  // Split into two rows
  const mid = Math.ceil(allSpeakers.length / 2)
  const row1 = allSpeakers.slice(0, mid)
  const row2 = allSpeakers.slice(mid)

  // Double for infinite scroll
  const doubled1 = [...row1, ...row1]
  const doubled2 = [...row2, ...row2]

  return (
    <section className="relative bg-white py-12 lg:py-16 overflow-hidden">
      {/* Top edge gold line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#0071e3]/30 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="text-center mb-8">
          <span className="text-[11px] tracking-[0.25em] uppercase text-[#0071e3] font-semibold">
            The Network
          </span>
          <h2
            className="mt-3 text-[clamp(1.6rem,3.5vw,2.4rem)] font-bold text-[#1d1d1f] tracking-[-0.02em]"
            style={sfDisplay}
          >
            Leaders Who Shape Industries
          </h2>
          <p className="mt-3 text-[#1d1d1f]/65 text-[14px] max-w-md mx-auto" style={sfText}>
            CXOs, policymakers, and innovators from 30+ countries across Asia, the Middle East, and beyond
          </p>
        </div>
      </div>

      {/* Row 1 — scrolls left */}
      <div className="relative mb-4">
        <div className="absolute left-0 top-0 bottom-0 w-20 lg:w-40 z-10 bg-gradient-to-r from-white to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-20 lg:w-40 z-10 bg-gradient-to-l from-white to-transparent" />
        <div className="flex animate-speaker-scroll-left items-center whitespace-nowrap">
          {doubled1.map((s, i) => (
            <SpeakerCard key={`r1-${s.initials}-${i}`} {...s} />
          ))}
        </div>
      </div>

      {/* Row 2 — scrolls right */}
      {doubled2.length > 0 && (
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 lg:w-40 z-10 bg-gradient-to-r from-white to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 w-20 lg:w-40 z-10 bg-gradient-to-l from-white to-transparent" />
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
