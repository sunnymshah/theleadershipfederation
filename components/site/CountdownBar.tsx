"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, X } from "lucide-react"

const TARGET_DATE = new Date("2026-05-21T09:00:00+05:30")
const EVENT_NAME = "7th GCC Leadership Conclave"

function getTimeLeft() {
  const now = new Date()
  const diff = TARGET_DATE.getTime() - now.getTime()
  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)

  return { days, hours, minutes, seconds }
}

export function CountdownBar() {
  const [time, setTime] = useState<ReturnType<typeof getTimeLeft>>(null)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTime(getTimeLeft())
    const interval = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted || !time || dismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
      <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-[#e7ab1c]/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
            {/* Pulse */}
            <span className="hidden sm:flex w-2 h-2 rounded-full bg-[#e7ab1c] animate-pulse shrink-0" />

            {/* Event name */}
            <span className="text-[12px] sm:text-[13px] font-semibold text-white/80 truncate">
              {EVENT_NAME}
            </span>

            {/* Countdown units */}
            <div className="hidden md:flex items-center gap-3">
              {[
                { value: time.days, label: "d" },
                { value: time.hours, label: "h" },
                { value: time.minutes, label: "m" },
                { value: time.seconds, label: "s" },
              ].map(({ value, label }) => (
                <div key={label} className="flex items-baseline gap-0.5">
                  <span className="text-[18px] font-bold text-[#e7ab1c] tabular-nums leading-none">
                    {String(value).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] text-white/30 font-medium">{label}</span>
                </div>
              ))}
            </div>

            {/* Mobile: compact countdown */}
            <span className="md:hidden text-[13px] font-bold text-[#e7ab1c] tabular-nums shrink-0">
              {time.days}d {time.hours}h {time.minutes}m
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-[12px] font-bold bg-[#e7ab1c] text-black hover:bg-[#d49c10] transition-all duration-200 shadow-[0_2px_12px_rgba(231,171,28,0.3)]"
            >
              Register <ArrowRight size={12} />
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-full text-white/20 hover:text-white/50 hover:bg-white/5 transition-all"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 1.5s both;
        }
      `}</style>
    </div>
  )
}
