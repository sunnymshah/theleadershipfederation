"use client"

import { motion } from "framer-motion"

/**
 * TOTY-style bold radiating gold arrows — starburst chevron pattern
 * like FIFA Team of the Year card art. Highly visible.
 */
export function GoldChevrons({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
      {/* RIGHT — Primary starburst chevrons radiating outward */}
      <motion.svg
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="absolute -right-20 top-1/2 -translate-y-1/2 w-[700px] h-[700px]"
        viewBox="0 0 700 700"
        fill="none"
      >
        {/* Filled wedge glow */}
        <path d="M350 100L650 350L350 600L400 350Z" fill="url(#totyFill)" opacity="0.12" />
        {/* Bold outer arrow */}
        <path d="M300 50L660 350L300 650" stroke="url(#totyGrad)" strokeWidth="5" strokeLinecap="round" opacity="0.50" />
        {/* Second arrow */}
        <path d="M250 100L600 350L250 600" stroke="url(#totyGrad)" strokeWidth="4.5" strokeLinecap="round" opacity="0.40" />
        {/* Third arrow */}
        <path d="M200 145L540 350L200 555" stroke="url(#totyGrad)" strokeWidth="4" strokeLinecap="round" opacity="0.30" />
        {/* Fourth arrow */}
        <path d="M160 185L480 350L160 515" stroke="url(#totyGrad)" strokeWidth="3.5" strokeLinecap="round" opacity="0.22" />
        {/* Fifth inner arrow */}
        <path d="M130 220L420 350L130 480" stroke="#e7ab1c" strokeWidth="3" strokeLinecap="round" opacity="0.15" />
        {/* Sixth innermost */}
        <path d="M110 255L370 350L110 445" stroke="#e7ab1c" strokeWidth="2.5" strokeLinecap="round" opacity="0.10" />
        <defs>
          <linearGradient id="totyGrad" x1="100" y1="50" x2="660" y2="650">
            <stop offset="0%" stopColor="#e7ab1c" />
            <stop offset="60%" stopColor="#e7ab1c" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="totyFill" x1="350" y1="100" x2="650" y2="600">
            <stop offset="0%" stopColor="#e7ab1c" stopOpacity="1" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* LEFT — Mirrored chevron cluster (pointing left) */}
      <motion.svg
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="absolute -left-16 bottom-[10%] w-[400px] h-[400px]"
        viewBox="0 0 400 400"
        fill="none"
      >
        <path d="M300 40L60 200L300 360" stroke="url(#totyGradL)" strokeWidth="4.5" strokeLinecap="round" opacity="0.40" />
        <path d="M280 80L100 200L280 320" stroke="url(#totyGradL)" strokeWidth="4" strokeLinecap="round" opacity="0.30" />
        <path d="M260 115L140 200L260 285" stroke="#e7ab1c" strokeWidth="3" strokeLinecap="round" opacity="0.20" />
        <defs>
          <linearGradient id="totyGradL" x1="300" y1="40" x2="60" y2="360">
            <stop offset="0%" stopColor="#e7ab1c" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0.15" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* Horizontal accent lines */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, delay: 0.3 }}
        className="absolute top-[36%] left-0 right-0 h-[2.5px] origin-left"
        style={{ background: "linear-gradient(90deg, transparent 5%, rgba(231,171,28,0.22) 30%, rgba(231,171,28,0.22) 70%, transparent 95%)" }}
      />
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, delay: 0.5 }}
        className="absolute top-[40%] left-0 right-0 h-[1.5px] origin-right"
        style={{ background: "linear-gradient(90deg, transparent 10%, rgba(231,171,28,0.14) 30%, rgba(231,171,28,0.14) 70%, transparent 90%)" }}
      />
    </div>
  )
}

/** Bold gold diamonds + angular lines — dark section backgrounds */
export function GoldDiamonds({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
      {/* Rotating diamonds */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        className="absolute -top-24 -right-24 w-52 h-52 border-2 border-[#e7ab1c]/[0.15] rounded-sm"
        style={{ transform: "rotate(45deg)" }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-16 -left-16 w-36 h-36 border-2 border-[#e7ab1c]/[0.18] rounded-sm"
        style={{ transform: "rotate(45deg)" }}
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/3 right-[20%] w-20 h-20 border border-[#e7ab1c]/[0.12] rounded-sm"
        style={{ transform: "rotate(45deg)" }}
      />
      {/* TOTY angular V-lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 600" fill="none" preserveAspectRatio="none">
        <path d="M0 300L500 80L1000 300" stroke="rgba(231,171,28,0.08)" strokeWidth="2" />
        <path d="M0 340L500 130L1000 340" stroke="rgba(231,171,28,0.05)" strokeWidth="1.5" />
        <path d="M0 300L500 520L1000 300" stroke="rgba(231,171,28,0.06)" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

/** Dot grid pattern */
export function DotGrid({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      aria-hidden
      style={{
        backgroundImage: "radial-gradient(circle, rgba(231,171,28,0.08) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />
  )
}

/** Ambient gold gradient orbs */
export function GoldOrbs({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] right-[15%] w-[600px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(231,171,28,0.14) 0%, transparent 70%)" }}
      />
      <motion.div
        animate={{ y: [0, 15, 0], x: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[5%] left-[10%] w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(231,171,28,0.10) 0%, transparent 70%)" }}
      />
    </div>
  )
}

/** TOTY-style starburst for any section — standalone radiating lines */
export function GoldStarburst({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
      <svg className="absolute right-0 top-0 w-2/5 h-full" viewBox="0 0 500 700" fill="none">
        <path d="M100 20L480 350L100 680" stroke="rgba(231,171,28,0.35)" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M60 70L420 350L60 630" stroke="rgba(231,171,28,0.25)" strokeWidth="4" strokeLinecap="round" />
        <path d="M30 120L360 350L30 580" stroke="rgba(231,171,28,0.16)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <svg className="absolute left-0 top-0 w-1/4 h-full" viewBox="0 0 300 700" fill="none">
        <path d="M250 50L40 350L250 650" stroke="rgba(231,171,28,0.22)" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M230 110L80 350L230 590" stroke="rgba(231,171,28,0.14)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}
