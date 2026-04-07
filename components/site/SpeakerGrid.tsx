"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Speaker {
  id: string
  name: string
  designation: string | null
  company: string | null
  bio: string | null
  image_url: string | null
  sort_order: number
}

const INITIAL_SHOW = 12

function SpeakerAvatar({ speaker, size }: { speaker: Speaker; size: "lg" | "sm" }) {
  const px = size === "lg" ? 160 : 96
  const cls = size === "lg" ? "w-36 h-36 sm:w-40 sm:h-40" : "w-20 h-20 sm:w-24 sm:h-24"

  if (speaker.image_url) {
    return (
      <Image
        src={speaker.image_url}
        alt={speaker.name}
        width={px}
        height={px}
        className={`${cls} rounded-full object-cover mx-auto ring-[3px] ring-white/[0.06] group-hover:ring-[#c9a84c]/50 transition-all duration-500 group-hover:scale-105`}
      />
    )
  }

  return (
    <div
      className={`${cls} rounded-full mx-auto flex items-center justify-center ring-[3px] ring-white/[0.06] group-hover:ring-[#c9a84c]/50 transition-all duration-500 group-hover:scale-105`}
      style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%)" }}
    >
      <span className={`${size === "lg" ? "text-3xl" : "text-lg"} font-bold text-[#c9a84c]/70`}>
        {speaker.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
      </span>
    </div>
  )
}

export function SpeakerGrid({ speakers }: { speakers: Speaker[] }) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = speakers.length > INITIAL_SHOW
  const featured = speakers.slice(0, INITIAL_SHOW)
  const remaining = speakers.slice(INITIAL_SHOW)

  return (
    <div>
      {/* Featured speakers — large cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {featured.map((speaker) => (
          <div key={speaker.id} className="text-center group">
            <div className="mx-auto mb-5 relative">
              <SpeakerAvatar speaker={speaker} size="lg" />
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ boxShadow: "0 0 30px rgba(201,168,76,0.15)" }}
              />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">{speaker.name}</h3>
            {(speaker.designation || speaker.company) && (
              <p className="text-sm text-white/35">
                {speaker.designation}{speaker.designation && speaker.company ? ", " : ""}{speaker.company}
              </p>
            )}
            {speaker.bio && (
              <p className="text-xs text-white/20 mt-3 max-w-[200px] mx-auto leading-relaxed line-clamp-3">
                {speaker.bio}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Remaining speakers — compact grid */}
      {hasMore && expanded && (
        <div className="mt-14 pt-14 border-t border-white/[0.04]">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-white/20 font-semibold mb-10">
            All Speakers
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-5 gap-y-8">
            {remaining.map((speaker) => (
              <div key={speaker.id} className="text-center group">
                <div className="mx-auto mb-3 relative">
                  <SpeakerAvatar speaker={speaker} size="sm" />
                </div>
                <h3 className="text-[13px] font-semibold text-white/80 mb-0.5 line-clamp-1">{speaker.name}</h3>
                {(speaker.designation || speaker.company) && (
                  <p className="text-[11px] text-white/25 line-clamp-1">
                    {speaker.designation || speaker.company}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toggle button */}
      {hasMore && (
        <div className="mt-12 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-[13px] font-semibold text-white/50 border border-white/[0.08] hover:border-[#c9a84c]/30 hover:text-[#c9a84c] transition-all duration-300"
          >
            {expanded ? (
              <>Show Less <ChevronUp size={14} /></>
            ) : (
              <>View All {speakers.length} Speakers <ChevronDown size={14} /></>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
