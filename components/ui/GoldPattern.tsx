"use client"

import { motion } from "framer-motion"

/**
 * Bold gold geometric background — TOTY/FIFA-inspired chevrons with strong
 * visibility. Absolute-positioned SVG. Parent needs `relative overflow-hidden`.
 */
export function GoldChevrons({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
      {/* Large stacked chevrons — right side */}
      <motion.svg
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.2, delay: 0.2 }}
        className="absolute -top-10 -right-8 w-[600px] h-[600px]"
        viewBox="0 0 600 600"
        fill="none"
      >
        {/* Filled chevron shape */}
        <path
          d="M300 40L540 300L300 560L340 300Z"
          fill="url(#chevFill1)"
          opacity="0.04"
        />
        {/* Primary bold chevron */}
        <path
          d="M280 60L520 300L280 540"
          stroke="url(#chevGrad1)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.22"
        />
        {/* Secondary chevron */}
        <path
          d="M220 110L430 300L220 490"
          stroke="url(#chevGrad1)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.15"
        />
        {/* Third chevron */}
        <path
          d="M170 155L350 300L170 445"
          stroke="url(#chevGrad1)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.10"
        />
        {/* Inner accent chevron */}
        <path
          d="M130 195L280 300L130 405"
          stroke="#e7ab1c"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.07"
        />
        <defs>
          <linearGradient id="chevGrad1" x1="150" y1="60" x2="540" y2="540">
            <stop offset="0%" stopColor="#e7ab1c" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="chevFill1" x1="300" y1="40" x2="540" y2="560">
            <stop offset="0%" stopColor="#e7ab1c" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* Upward arrow cluster — bottom left */}
      <motion.svg
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.5 }}
        className="absolute -bottom-6 -left-6 w-[350px] h-[350px]"
        viewBox="0 0 350 350"
        fill="none"
      >
        <path d="M60 240L175 125L290 240" stroke="#e7ab1c" strokeWidth="2.5" opacity="0.18" strokeLinecap="round" />
        <path d="M85 275L175 185L265 275" stroke="#e7ab1c" strokeWidth="2" opacity="0.12" strokeLinecap="round" />
        <path d="M110 305L175 240L240 305" stroke="#e7ab1c" strokeWidth="1.5" opacity="0.08" strokeLinecap="round" />
      </motion.svg>

      {/* Horizontal angular line — mid */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1.6, delay: 0.4 }}
        className="absolute top-[38%] left-0 right-0 h-[2px] origin-left"
        style={{
          background: "linear-gradient(90deg, transparent 5%, rgba(231,171,28,0.10) 25%, rgba(231,171,28,0.10) 75%, transparent 95%)",
        }}
      />

      {/* Secondary thin line */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1.6, delay: 0.6 }}
        className="absolute top-[42%] left-0 right-0 h-px origin-right"
        style={{
          background: "linear-gradient(90deg, transparent 10%, rgba(231,171,28,0.06) 30%, rgba(231,171,28,0.06) 70%, transparent 90%)",
        }}
      />
    </div>
  )
}

/** Floating gold diamonds — for dark sections */
export function GoldDiamonds({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        className="absolute -top-28 -right-28 w-56 h-56 border-2 border-[#e7ab1c]/[0.12] rounded-sm"
        style={{ transform: "rotate(45deg)" }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-16 -left-16 w-36 h-36 border-2 border-[#e7ab1c]/[0.15] rounded-sm"
        style={{ transform: "rotate(45deg)" }}
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/3 right-1/5 w-20 h-20 border border-[#e7ab1c]/[0.10] rounded-sm"
        style={{ transform: "rotate(45deg)" }}
      />
      {/* Angular lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 600" fill="none" preserveAspectRatio="none">
        <path d="M0 300L500 100L1000 300" stroke="rgba(231,171,28,0.06)" strokeWidth="1" />
        <path d="M0 350L500 150L1000 350" stroke="rgba(231,171,28,0.04)" strokeWidth="1" />
      </svg>
    </div>
  )
}

/** Subtle grid dot pattern — for light sections */
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

/** Gradient orbs — ambient gold glow */
export function GoldOrbs({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] right-[15%] w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(231,171,28,0.07) 0%, transparent 70%)",
        }}
      />
      <motion.div
        animate={{ y: [0, 15, 0], x: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[5%] left-[10%] w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(231,171,28,0.05) 0%, transparent 70%)",
        }}
      />
    </div>
  )
}
