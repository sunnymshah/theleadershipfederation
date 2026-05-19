"use client"

import Image from "next/image"
import { Quote } from "lucide-react"

interface SpeakerData {
  name: string
  role: string
  initials: string
  imageUrl?: string | null
}

function SpeakerCard({ name, role, initials, imageUrl }: SpeakerData) {
  return (
    <div className="mx-2.5 shrink-0 w-[212px] lf-glass rounded-[24px] p-3.5 group">
      <div className="relative aspect-[4/5] rounded-[18px] overflow-hidden bg-gradient-to-br from-[#0071e3]/20 via-[#0071e3]/8 to-transparent">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="212px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[34px] font-bold text-[#0071e3]/70">
              {initials}
            </span>
          </div>
        )}
      </div>
      <div className="px-1.5 pt-3.5 pb-1">
        <p className="text-[14px] font-semibold text-[#1d1d1f] truncate tracking-[-0.01em]">
          {name}
        </p>
        <p className="text-[12px] text-[#1d1d1f]/55 truncate mt-0.5">{role}</p>
      </div>
    </div>
  )
}

interface Props {
  speakers?: SpeakerData[]
}

export function SpeakerMarquee({ speakers }: Props) {
  const allSpeakers = speakers ?? []
  if (allSpeakers.length === 0) return null

  // One continuous row — doubled for a seamless loop.
  const doubled = [...allSpeakers, ...allSpeakers]

  return (
    <section className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden">
      {/* Tonal backdrop. */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 72%), " +
            "radial-gradient(50% 56% at 12% 100%, rgba(0,113,227,0.09) 0%, transparent 72%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-12">
          <div className="max-w-xl">
            <span className="text-[12px] tracking-[0.2em] uppercase text-[#0071e3] font-semibold">
              The Network
            </span>
            <h2 className="mt-4 text-[clamp(2.2rem,4.6vw,3.4rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.03]">
              The minds on our stage
            </h2>
          </div>
          <p className="text-[#1d1d1f]/55 text-[15px] leading-relaxed sm:max-w-xs sm:text-right">
            CXOs, policymakers and founders from 30+ countries — a standing
            faculty of global leadership.
          </p>
        </div>
      </div>

      {/* Photo-card marquee — one continuous row. */}
      <div className="relative z-10">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 lg:w-44 z-10 bg-gradient-to-r from-[#f5f5f7] to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 lg:w-44 z-10 bg-gradient-to-l from-[#f5f5f7] to-transparent pointer-events-none" />
        <div className="flex animate-speaker-row items-stretch whitespace-nowrap">
          {doubled.map((s, i) => (
            <SpeakerCard key={`${s.initials}-${i}`} {...s} />
          ))}
        </div>
      </div>

      {/* Closing line. */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 mt-12">
        <div className="lf-glass rounded-[24px] px-6 sm:px-9 py-6 flex items-center gap-4">
          <span className="shrink-0 w-11 h-11 rounded-xl bg-[#0071e3] flex items-center justify-center">
            <Quote size={18} className="text-white" fill="white" />
          </span>
          <p className="text-[14px] sm:text-[15px] text-[#1d1d1f]/70 leading-relaxed">
            <span className="font-semibold text-[#1d1d1f]">
              Every speaker is hand-selected.
            </span>{" "}
            We curate for substance — leaders with something real to say.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes speakerRow {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-speaker-row {
          animation: speakerRow 48s linear infinite;
          width: max-content;
        }
        .animate-speaker-row:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}
