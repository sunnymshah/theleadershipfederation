"use client"

import { useRef, useState, useEffect } from "react"

const cities = [
  { name: "Mumbai", country: "India", x: 62, y: 42, size: "lg" },
  { name: "New Delhi", country: "India", x: 60, y: 35, size: "md" },
  { name: "Bengaluru", country: "India", x: 61, y: 50, size: "md" },
  { name: "Hyderabad", country: "India", x: 60, y: 46, size: "sm" },
  { name: "Pune", country: "India", x: 59, y: 44, size: "sm" },
  { name: "Dubai", country: "UAE", x: 52, y: 38, size: "lg" },
  { name: "Kuala Lumpur", country: "Malaysia", x: 72, y: 55, size: "md" },
  { name: "Bangkok", country: "Thailand", x: 70, y: 48, size: "md" },
  { name: "Singapore", country: "Singapore", x: 72, y: 58, size: "sm" },
  { name: "Riyadh", country: "Saudi Arabia", x: 48, y: 38, size: "sm" },
]

/* Connection lines between key hubs */
const connections = [
  [0, 5],  // Mumbai - Dubai
  [0, 1],  // Mumbai - Delhi
  [0, 2],  // Mumbai - Bengaluru
  [5, 9],  // Dubai - Riyadh
  [6, 7],  // KL - Bangkok
  [6, 8],  // KL - Singapore
  [2, 6],  // Bengaluru - KL
  [5, 7],  // Dubai - Bangkok
]

function PulsingDot({ city, visible, delay }: {
  city: typeof cities[0]
  visible: boolean
  delay: number
}) {
  const sizeMap = { lg: "w-3 h-3", md: "w-2.5 h-2.5", sm: "w-2 h-2" }
  const pulseMap = { lg: "w-8 h-8", md: "w-6 h-6", sm: "w-5 h-5" }

  return (
    <div
      className="absolute group"
      style={{
        left: `${city.x}%`,
        top: `${city.y}%`,
        transform: "translate(-50%, -50%)",
        opacity: visible ? 1 : 0,
        transition: `opacity 0.6s ease ${delay}ms`,
      }}
    >
      {/* Pulse ring */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${pulseMap[city.size as keyof typeof pulseMap]} rounded-full bg-[#e7ab1c]/20 animate-ping`}
        style={{ animationDuration: "2.5s" }}
      />
      {/* Dot */}
      <div className={`relative ${sizeMap[city.size as keyof typeof sizeMap]} rounded-full bg-[#e7ab1c] shadow-[0_0_12px_rgba(231,171,28,0.5)]`} />
      {/* Label */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-7 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-20">
        <span className="text-[10px] font-semibold text-white bg-[#1a1a2e]/90 backdrop-blur px-2 py-0.5 rounded">
          {city.name}, {city.country}
        </span>
      </div>
    </div>
  )
}

export function GlobalPresence() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="relative py-16 lg:py-20 bg-[#1a1a2e] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="text-center mb-14">
          <span className="text-[11px] tracking-[0.25em] uppercase text-[#e7ab1c] font-semibold">
            Global Footprint
          </span>
          <h2 className="mt-3 text-[clamp(1.6rem,3.5vw,2.4rem)] font-bold text-white tracking-[-0.02em]">
            Where Leaders Converge
          </h2>
          <p className="mt-3 text-white/85 text-[14px]">
            Events across 10+ major cities, connecting leaders from 30+ countries
          </p>
        </div>

        {/* Map container */}
        <div className="relative aspect-[2/1] max-w-4xl mx-auto">
          {/* Grid lines for depth */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />

          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {connections.map(([from, to], i) => (
              <line
                key={i}
                x1={cities[from].x}
                y1={cities[from].y}
                x2={cities[to].x}
                y2={cities[to].y}
                stroke="rgba(231,171,28,0.12)"
                strokeWidth="0.3"
                strokeDasharray="1,1"
                style={{
                  opacity: visible ? 1 : 0,
                  transition: `opacity 1s ease ${i * 100 + 400}ms`,
                }}
              />
            ))}
          </svg>

          {/* City dots */}
          {cities.map((city, i) => (
            <PulsingDot
              key={city.name}
              city={city}
              visible={visible}
              delay={i * 120}
            />
          ))}

          {/* Ambient glow behind India cluster */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              left: "58%", top: "42%",
              width: "200px", height: "200px",
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle, rgba(231,171,28,0.08) 0%, transparent 70%)",
            }}
          />
        </div>
      </div>
    </section>
  )
}
