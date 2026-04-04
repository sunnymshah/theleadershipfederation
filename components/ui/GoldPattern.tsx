"use client"

import { motion } from "framer-motion"

/**
 * Subtle gold geometric background pattern — TOTY/FIFA-inspired chevrons,
 * arrows, and angular shapes. Renders as absolute-positioned SVG elements.
 * Wrap your section in `relative overflow-hidden` and drop this inside.
 */
export function GoldChevrons({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
      {/* Large chevron — top right */}
      <motion.svg
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute -top-20 -right-16 w-[500px] h-[500px]"
        viewBox="0 0 500 500"
        fill="none"
      >
        <path
          d="M250 60L450 250L250 440"
          stroke="url(#chevGrad1)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.12"
        />
        <path
          d="M200 100L380 250L200 400"
          stroke="url(#chevGrad1)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.07"
        />
        <defs>
          <linearGradient id="chevGrad1" x1="200" y1="60" x2="450" y2="440">
            <stop offset="0%" stopColor="#e7ab1c" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* Small arrow cluster — bottom left */}
      <motion.svg
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.6 }}
        className="absolute -bottom-10 -left-10 w-[300px] h-[300px]"
        viewBox="0 0 300 300"
        fill="none"
      >
        <path d="M60 200L150 110L240 200" stroke="#e7ab1c" strokeWidth="1.2" opacity="0.08" strokeLinecap="round" />
        <path d="M80 230L150 160L220 230" stroke="#e7ab1c" strokeWidth="0.8" opacity="0.05" strokeLinecap="round" />
        <path d="M100 260L150 210L200 260" stroke="#e7ab1c" strokeWidth="0.6" opacity="0.04" strokeLinecap="round" />
      </motion.svg>

      {/* Diagonal line accent — center */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1.8, delay: 0.5 }}
        className="absolute top-1/3 left-0 right-0 h-px origin-left"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(231,171,28,0.06) 30%, rgba(231,171,28,0.06) 70%, transparent)",
        }}
      />
    </div>
  )
}

/** Floating gold diamond shapes — for dark sections */
export function GoldDiamonds({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        className="absolute -top-32 -right-32 w-64 h-64 border border-[#e7ab1c]/[0.06] rounded-sm"
        style={{ transform: "rotate(45deg)" }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-20 -left-20 w-40 h-40 border border-[#e7ab1c]/[0.08] rounded-sm"
        style={{ transform: "rotate(45deg)" }}
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 right-1/4 w-24 h-24 border border-[#e7ab1c]/[0.05] rounded-sm"
        style={{ transform: "rotate(45deg)" }}
      />
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
        backgroundImage: "radial-gradient(circle, rgba(231,171,28,0.06) 1px, transparent 1px)",
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
        className="absolute top-[10%] right-[15%] w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(231,171,28,0.04) 0%, transparent 70%)",
        }}
      />
      <motion.div
        animate={{ y: [0, 15, 0], x: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[5%] left-[10%] w-[350px] h-[350px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(231,171,28,0.03) 0%, transparent 70%)",
        }}
      />
    </div>
  )
}
