"use client"

/**
 * FIFA TOTY-style radiating starburst lines in LF gold (#e7ab1c).
 * Bold, opaque, many rays fanning out from a focal point — like the
 * Team of the Year card art background.
 */

/* ── Helper: generate ray paths from a center point ── */
function rays(
  cx: number,
  cy: number,
  count: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  sweep: number
) {
  const paths: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = 0; i < count; i++) {
    const angle =
      ((startAngle + (sweep * i) / (count - 1)) * Math.PI) / 180
    paths.push({
      x1: cx + Math.cos(angle) * innerR,
      y1: cy + Math.sin(angle) * innerR,
      x2: cx + Math.cos(angle) * outerR,
      y2: cy + Math.sin(angle) * outerR,
    })
  }
  return paths
}

/** ──────────────────────────────────────────────────────
 *  TOTY Starburst — radiating lines from right side
 *  Used on Hero, Ecosystem, ExclusivityCTA
 * ────────────────────────────────────────────────────── */
export function GoldChevrons({ className = "" }: { className?: string }) {
  // Right-side burst: center at right edge, rays fan left
  const rightRays = rays(750, 350, 36, 30, 700, 140, 80)
  // Left-side burst: center at left edge, rays fan right
  const leftRays = rays(-50, 400, 20, 20, 500, -40, 80)

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden
    >
      {/* RIGHT starburst */}
      <svg
        className="absolute right-0 top-0 w-full h-full"
        viewBox="0 0 800 700"
        fill="none"
        preserveAspectRatio="xMaxYMid slice"
      >
        <defs>
          <linearGradient id="totyRayR" x1="100%" y1="50%" x2="0%" y2="50%">
            <stop offset="0%" stopColor="#e7ab1c" stopOpacity="0.6" />
            <stop offset="40%" stopColor="#e7ab1c" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {rightRays.map((r, i) => (
          <line
            key={`rr-${i}`}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke="url(#totyRayR)"
            strokeWidth={i % 3 === 0 ? 2.5 : 1.5}
            opacity={i % 4 === 0 ? 0.7 : i % 2 === 0 ? 0.5 : 0.35}
          />
        ))}
        {/* Thick accent rays */}
        <line x1={750} y1={350} x2={50} y2={120} stroke="#e7ab1c" strokeWidth={3} opacity={0.18} />
        <line x1={750} y1={350} x2={80} y2={350} stroke="#e7ab1c" strokeWidth={3} opacity={0.15} />
        <line x1={750} y1={350} x2={50} y2={580} stroke="#e7ab1c" strokeWidth={3} opacity={0.18} />
      </svg>

      {/* LEFT starburst (smaller, subtler) */}
      <svg
        className="absolute left-0 top-0 w-3/5 h-full"
        viewBox="0 0 500 700"
        fill="none"
        preserveAspectRatio="xMinYMid slice"
      >
        <defs>
          <linearGradient id="totyRayL" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#e7ab1c" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#e7ab1c" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {leftRays.map((r, i) => (
          <line
            key={`lr-${i}`}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke="url(#totyRayL)"
            strokeWidth={i % 3 === 0 ? 2 : 1.2}
            opacity={i % 3 === 0 ? 0.5 : 0.3}
          />
        ))}
      </svg>

      {/* Center glow */}
      <div
        className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(231,171,28,0.15) 0%, rgba(231,171,28,0.05) 40%, transparent 70%)",
        }}
      />
    </div>
  )
}

/** ──────────────────────────────────────────────────────
 *  Dark section starburst — for FeaturedEventCallout
 *  Similar TOTY rays but lighter for dark backgrounds
 * ────────────────────────────────────────────────────── */
export function GoldDiamonds({ className = "" }: { className?: string }) {
  const centerRays = rays(500, 300, 40, 20, 600, 0, 360)

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 600"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="totyRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e7ab1c" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#e7ab1c" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Full 360° burst from center */}
        {centerRays.map((r, i) => (
          <line
            key={`cr-${i}`}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke="#e7ab1c"
            strokeWidth={i % 4 === 0 ? 1.8 : 0.8}
            opacity={i % 4 === 0 ? 0.12 : 0.06}
          />
        ))}
        {/* Center glow circle */}
        <circle cx={500} cy={300} r={200} fill="url(#totyRadial)" />
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
        backgroundImage:
          "radial-gradient(circle, rgba(231,171,28,0.08) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />
  )
}

/** Ambient gold gradient orbs */
export function GoldOrbs({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden
    >
      <div
        className="absolute top-[10%] right-[10%] w-[500px] h-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(231,171,28,0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[5%] left-[10%] w-[400px] h-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(231,171,28,0.08) 0%, transparent 70%)",
        }}
      />
    </div>
  )
}

/** ──────────────────────────────────────────────────────
 *  TOTY starburst for any section — radiating rays
 *  Used on EcosystemGrid, Archive, etc.
 * ────────────────────────────────────────────────────── */
export function GoldStarburst({ className = "" }: { className?: string }) {
  const rightBurst = rays(550, 350, 24, 10, 500, 150, 60)
  const leftBurst = rays(-50, 350, 16, 10, 400, -30, 60)

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden
    >
      <svg
        className="absolute right-0 top-0 w-full h-full"
        viewBox="0 0 600 700"
        fill="none"
        preserveAspectRatio="xMaxYMid slice"
      >
        <defs>
          <linearGradient id="sbRayR" x1="100%" y1="50%" x2="0%" y2="50%">
            <stop offset="0%" stopColor="#e7ab1c" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#e7ab1c" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {rightBurst.map((r, i) => (
          <line
            key={`sb-r-${i}`}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke="url(#sbRayR)"
            strokeWidth={i % 3 === 0 ? 2 : 1}
            opacity={i % 3 === 0 ? 0.6 : 0.35}
          />
        ))}
      </svg>
      <svg
        className="absolute left-0 top-0 w-3/5 h-full"
        viewBox="0 0 400 700"
        fill="none"
        preserveAspectRatio="xMinYMid slice"
      >
        <defs>
          <linearGradient id="sbRayL" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#e7ab1c" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#e7ab1c" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#e7ab1c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {leftBurst.map((r, i) => (
          <line
            key={`sb-l-${i}`}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke="url(#sbRayL)"
            strokeWidth={i % 3 === 0 ? 1.5 : 0.8}
            opacity={i % 3 === 0 ? 0.4 : 0.25}
          />
        ))}
      </svg>
    </div>
  )
}
