"use client"

import Image from "next/image"

const speakers = [
  { name: "Dr. Priya Kapoor", role: "CEO, TechVista", img: "/speakers/speaker-01.jpg" },
  { name: "Ahmad Al-Rashid", role: "CEO, Gulf Ventures", img: "/speakers/speaker-02.jpg" },
  { name: "Vikram Rao", role: "CTO, Reliance Jio", img: "/speakers/speaker-03.jpg" },
  { name: "Mei Lin Tan", role: "COO, TechBridge SG", img: "/speakers/speaker-04.jpg" },
  { name: "David Chen", role: "MD, Barclays Asia", img: "/speakers/speaker-05.jpg" },
  { name: "Sunita Patel", role: "CHRO, Axis Bank", img: "/speakers/speaker-06.jpg" },
  { name: "Rajesh Menon", role: "Founder, InnovateCo", img: "/speakers/speaker-07.jpg" },
  { name: "Fatima Hassan", role: "VP Digital, Emirates", img: "/speakers/speaker-08.jpg" },
  { name: "James Whitfield", role: "CIO, Standard Chartered", img: "/speakers/speaker-09.jpg" },
  { name: "Ananya Desai", role: "CFO, Cadila Pharma", img: "/speakers/speaker-10.jpg" },
  { name: "Wei Zhang", role: "Partner, EY Asia", img: "/speakers/speaker-11.jpg" },
  { name: "Kavitha Raman", role: "CTO, HCLTech", img: "/speakers/speaker-12.jpg" },
]

function SpeakerBubble({ name, role }: { name: string; role: string; img: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2)

  return (
    <div className="group relative mx-4 shrink-0">
      <div className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-full ring-2 ring-white/[0.06] group-hover:ring-[#e7ab1c]/50 transition-all duration-500 overflow-hidden bg-gradient-to-br from-[#e7ab1c]/15 to-[#e7ab1c]/5 flex items-center justify-center">
        <span className="text-[#e7ab1c]/60 text-lg sm:text-xl font-bold">{initials}</span>
      </div>
      {/* Hover tooltip */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-20">
        <div className="bg-white/95 backdrop-blur-xl rounded-lg px-3 py-1.5 shadow-lg border border-black/[0.04]">
          <p className="text-[11px] font-semibold text-black">{name}</p>
          <p className="text-[10px] text-black/40">{role}</p>
        </div>
      </div>
    </div>
  )
}

export function SpeakerMarquee() {
  const doubled = [...speakers, ...speakers]

  return (
    <section className="py-10 sm:py-14 bg-[#F4F8FF] overflow-hidden">
      <div className="text-center mb-8">
        <span className="text-[11px] tracking-[0.2em] uppercase text-black/25 font-semibold">
          Past Speakers & Leaders
        </span>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 lg:w-40 z-10 bg-gradient-to-r from-[#F4F8FF] to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 lg:w-40 z-10 bg-gradient-to-l from-[#F4F8FF] to-transparent" />

        <div className="flex animate-speaker-scroll items-center">
          {doubled.map((s, i) => (
            <SpeakerBubble key={`${s.name}-${i}`} {...s} />
          ))}
        </div>
      </div>
    </section>
  )
}
