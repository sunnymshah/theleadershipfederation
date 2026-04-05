"use client"

/**
 * FIFA TOTY card-style radiating background lines in LF gold (#e7ab1c).
 * Clean, thick, evenly-spaced rays from a focal point — bold & premium.
 */

/** ── Main TOTY starburst — used on Hero, Ecosystem, CTA ── */
export function GoldChevrons({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
      {/* RIGHT burst — 18 bold rays fanning out */}
      <svg className="absolute -right-[10%] top-1/2 -translate-y-1/2 w-[80%] h-[140%]" viewBox="0 0 800 1000" fill="none">
        <defs>
          <linearGradient id="toty1" x1="800" y1="500" x2="0" y2="500" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e7ab1c" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#e7ab1c" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* 18 evenly-spaced rays, center at (800, 500) */}
        <line x1="800" y1="500" x2="0" y2="-50" stroke="url(#toty1)" strokeWidth="6" />
        <line x1="800" y1="500" x2="0" y2="50" stroke="url(#toty1)" strokeWidth="4" />
        <line x1="800" y1="500" x2="0" y2="140" stroke="url(#toty1)" strokeWidth="6" />
        <line x1="800" y1="500" x2="0" y2="220" stroke="url(#toty1)" strokeWidth="4" />
        <line x1="800" y1="500" x2="0" y2="300" stroke="url(#toty1)" strokeWidth="7" />
        <line x1="800" y1="500" x2="0" y2="370" stroke="url(#toty1)" strokeWidth="4" />
        <line x1="800" y1="500" x2="0" y2="430" stroke="url(#toty1)" strokeWidth="5" />
        <line x1="800" y1="500" x2="0" y2="490" stroke="url(#toty1)" strokeWidth="4" />
        <line x1="800" y1="500" x2="0" y2="540" stroke="url(#toty1)" strokeWidth="6" />
        <line x1="800" y1="500" x2="0" y2="600" stroke="url(#toty1)" strokeWidth="4" />
        <line x1="800" y1="500" x2="0" y2="670" stroke="url(#toty1)" strokeWidth="7" />
        <line x1="800" y1="500" x2="0" y2="740" stroke="url(#toty1)" strokeWidth="4" />
        <line x1="800" y1="500" x2="0" y2="810" stroke="url(#toty1)" strokeWidth="5" />
        <line x1="800" y1="500" x2="0" y2="880" stroke="url(#toty1)" strokeWidth="4" />
        <line x1="800" y1="500" x2="0" y2="950" stroke="url(#toty1)" strokeWidth="6" />
        <line x1="800" y1="500" x2="0" y2="1020" stroke="url(#toty1)" strokeWidth="4" />
        <line x1="800" y1="500" x2="0" y2="1080" stroke="url(#toty1)" strokeWidth="5" />
        <line x1="800" y1="500" x2="100" y2="1100" stroke="url(#toty1)" strokeWidth="4" />
      </svg>

      {/* LEFT burst — 12 rays, subtler */}
      <svg className="absolute -left-[5%] top-1/2 -translate-y-1/2 w-[60%] h-[120%]" viewBox="0 0 600 800" fill="none">
        <defs>
          <linearGradient id="toty2" x1="0" y1="400" x2="600" y2="400" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e7ab1c" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#e7ab1c" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="400" x2="600" y2="50" stroke="url(#toty2)" strokeWidth="5" />
        <line x1="0" y1="400" x2="600" y2="130" stroke="url(#toty2)" strokeWidth="3" />
        <line x1="0" y1="400" x2="600" y2="210" stroke="url(#toty2)" strokeWidth="5" />
        <line x1="0" y1="400" x2="600" y2="280" stroke="url(#toty2)" strokeWidth="3" />
        <line x1="0" y1="400" x2="600" y2="350" stroke="url(#toty2)" strokeWidth="4" />
        <line x1="0" y1="400" x2="600" y2="420" stroke="url(#toty2)" strokeWidth="3" />
        <line x1="0" y1="400" x2="600" y2="490" stroke="url(#toty2)" strokeWidth="5" />
        <line x1="0" y1="400" x2="600" y2="560" stroke="url(#toty2)" strokeWidth="3" />
        <line x1="0" y1="400" x2="600" y2="630" stroke="url(#toty2)" strokeWidth="4" />
        <line x1="0" y1="400" x2="600" y2="700" stroke="url(#toty2)" strokeWidth="3" />
        <line x1="0" y1="400" x2="600" y2="760" stroke="url(#toty2)" strokeWidth="5" />
        <line x1="0" y1="400" x2="500" y2="800" stroke="url(#toty2)" strokeWidth="3" />
      </svg>
    </div>
  )
}

/** ── Dark section burst — for FeaturedEventCallout ── */
export function GoldDiamonds({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 600" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="totyDarkRad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#e7ab1c" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Rays from center */}
        <line x1="600" y1="300" x2="0" y2="0" stroke="#e7ab1c" strokeWidth="2" opacity="0.10" />
        <line x1="600" y1="300" x2="0" y2="120" stroke="#e7ab1c" strokeWidth="3" opacity="0.08" />
        <line x1="600" y1="300" x2="0" y2="250" stroke="#e7ab1c" strokeWidth="2" opacity="0.10" />
        <line x1="600" y1="300" x2="0" y2="380" stroke="#e7ab1c" strokeWidth="3" opacity="0.08" />
        <line x1="600" y1="300" x2="0" y2="500" stroke="#e7ab1c" strokeWidth="2" opacity="0.10" />
        <line x1="600" y1="300" x2="0" y2="600" stroke="#e7ab1c" strokeWidth="3" opacity="0.08" />
        <line x1="600" y1="300" x2="1200" y2="0" stroke="#e7ab1c" strokeWidth="2" opacity="0.10" />
        <line x1="600" y1="300" x2="1200" y2="120" stroke="#e7ab1c" strokeWidth="3" opacity="0.08" />
        <line x1="600" y1="300" x2="1200" y2="250" stroke="#e7ab1c" strokeWidth="2" opacity="0.10" />
        <line x1="600" y1="300" x2="1200" y2="380" stroke="#e7ab1c" strokeWidth="3" opacity="0.08" />
        <line x1="600" y1="300" x2="1200" y2="500" stroke="#e7ab1c" strokeWidth="2" opacity="0.10" />
        <line x1="600" y1="300" x2="1200" y2="600" stroke="#e7ab1c" strokeWidth="3" opacity="0.08" />
        <circle cx="600" cy="300" r="250" fill="url(#totyDarkRad)" />
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
      <div
        className="absolute top-[10%] right-[10%] w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(231,171,28,0.12) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[5%] left-[10%] w-[400px] h-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(231,171,28,0.08) 0%, transparent 70%)" }}
      />
    </div>
  )
}

/** ── Section starburst — for Archive, EcosystemGrid ── */
export function GoldStarburst({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
      <svg className="absolute -right-[5%] top-1/2 -translate-y-1/2 w-[70%] h-[130%]" viewBox="0 0 700 900" fill="none">
        <defs>
          <linearGradient id="sbGrad" x1="700" y1="450" x2="0" y2="450" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e7ab1c" stopOpacity="0.40" />
            <stop offset="50%" stopColor="#e7ab1c" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="700" y1="450" x2="0" y2="50" stroke="url(#sbGrad)" strokeWidth="5" />
        <line x1="700" y1="450" x2="0" y2="150" stroke="url(#sbGrad)" strokeWidth="3" />
        <line x1="700" y1="450" x2="0" y2="250" stroke="url(#sbGrad)" strokeWidth="5" />
        <line x1="700" y1="450" x2="0" y2="340" stroke="url(#sbGrad)" strokeWidth="3" />
        <line x1="700" y1="450" x2="0" y2="420" stroke="url(#sbGrad)" strokeWidth="6" />
        <line x1="700" y1="450" x2="0" y2="500" stroke="url(#sbGrad)" strokeWidth="3" />
        <line x1="700" y1="450" x2="0" y2="580" stroke="url(#sbGrad)" strokeWidth="5" />
        <line x1="700" y1="450" x2="0" y2="660" stroke="url(#sbGrad)" strokeWidth="3" />
        <line x1="700" y1="450" x2="0" y2="740" stroke="url(#sbGrad)" strokeWidth="5" />
        <line x1="700" y1="450" x2="0" y2="830" stroke="url(#sbGrad)" strokeWidth="3" />
      </svg>
      <svg className="absolute -left-[5%] top-1/2 -translate-y-1/2 w-[50%] h-[110%]" viewBox="0 0 500 700" fill="none">
        <defs>
          <linearGradient id="sbGradL" x1="0" y1="350" x2="500" y2="350" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e7ab1c" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#e7ab1c" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="350" x2="500" y2="50" stroke="url(#sbGradL)" strokeWidth="4" />
        <line x1="0" y1="350" x2="500" y2="150" stroke="url(#sbGradL)" strokeWidth="3" />
        <line x1="0" y1="350" x2="500" y2="250" stroke="url(#sbGradL)" strokeWidth="4" />
        <line x1="0" y1="350" x2="500" y2="350" stroke="url(#sbGradL)" strokeWidth="3" />
        <line x1="0" y1="350" x2="500" y2="450" stroke="url(#sbGradL)" strokeWidth="4" />
        <line x1="0" y1="350" x2="500" y2="550" stroke="url(#sbGradL)" strokeWidth="3" />
        <line x1="0" y1="350" x2="500" y2="650" stroke="url(#sbGradL)" strokeWidth="4" />
      </svg>
    </div>
  )
}
