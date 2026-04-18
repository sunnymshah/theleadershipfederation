"use client"

import { useState } from "react"

interface Props {
  tracks: string[]
}

export function TrackFilter({ tracks }: Props) {
  const [activeTrack, setActiveTrack] = useState<string | null>(null)

  function handleFilter(track: string | null) {
    setActiveTrack(track)

    // Show/hide session cards based on track
    const cards = document.querySelectorAll<HTMLElement>(".schedule-session")
    cards.forEach((card) => {
      if (!track) {
        card.style.display = ""
        card.style.opacity = "1"
      } else {
        const cardTrack = card.getAttribute("data-track")
        if (cardTrack === track) {
          card.style.display = ""
          card.style.opacity = "1"
        } else if (!cardTrack) {
          // Sessions without a track (e.g., breaks) stay visible but faded
          card.style.display = ""
          card.style.opacity = "0.4"
        } else {
          card.style.display = ""
          card.style.opacity = "0.2"
        }
      }
    })
  }

  return (
    <div className="flex items-center gap-2 mb-8 flex-wrap">
      <span className="text-xs font-medium text-[#1a1a2e]/45 uppercase tracking-wider mr-1">
        Filter by track:
      </span>
      <button
        onClick={() => handleFilter(null)}
        className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
          activeTrack === null
            ? "bg-[#e7ab1c] text-white border-[#e7ab1c] shadow-sm"
            : "bg-white text-[#1a1a2e]/65 border-[#1a1a2e]/[0.08] hover:border-[#e7ab1c]/40"
        }`}
      >
        All Tracks
      </button>
      {tracks.map((track) => (
        <button
          key={track}
          onClick={() => handleFilter(track)}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
            activeTrack === track
              ? "bg-[#e7ab1c] text-white border-[#e7ab1c] shadow-sm"
              : "bg-white text-[#1a1a2e]/65 border-[#1a1a2e]/[0.08] hover:border-[#e7ab1c]/40"
          }`}
        >
          {track}
        </button>
      ))}
    </div>
  )
}
