"use client"

/**
 * ── EventPageNav ─────────────────────────────────────────────────────
 *
 * Minimal top bar shown on /events/[slug]/*. Renders just:
 *
 *   [TLF logo]  [Event title]        [Home] [Page A] [Page B]  [← TLF]
 *
 * Active tab is highlighted by comparing the current pathname to the
 * rendered link. We intentionally DO NOT render the main marketing nav
 * here — that's the whole point of the (event-page) route group.
 *
 * The "← TLF" link goes back to the main marketing site's homepage so
 * visitors aren't stranded on an event microsite.
 */

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, ArrowLeft } from "lucide-react"

export function EventPageNav({
  eventSlug,
  eventTitle,
  pages,
}: {
  eventSlug: string | null
  eventTitle: string | null
  pages: Array<{ slug: string; title: string }>
}) {
  const pathname = usePathname() ?? ""

  // If we couldn't resolve the slug (404 page etc.) fall back to a bare
  // "← Back to TLF" bar so the user still has an exit.
  if (!eventSlug) {
    return (
      <header className="h-14 w-full shrink-0 flex items-center justify-between px-4 sm:px-8 bg-white border-b border-[#1a1a2e]/[0.08]">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
          <Image src="/logo-tlf.png" alt="TLF" width={28} height={28} className="rounded" />
          <span>The Leadership Federation</span>
        </Link>
      </header>
    )
  }

  const homePath = `/events/${eventSlug}`
  const isHome = pathname === homePath || pathname === homePath + "/"

  return (
    <header className="h-14 w-full shrink-0 sticky top-0 z-40 flex items-center justify-between gap-4 px-4 sm:px-8 bg-white/90 backdrop-blur border-b border-[#1a1a2e]/[0.08]">
      {/* Left — brand + event title (clicking brand returns to home) */}
      <Link href={homePath} className="flex items-center gap-2.5 min-w-0 group">
        <Image src="/logo-tlf.png" alt="TLF" width={26} height={26} className="rounded shrink-0" />
        {eventTitle && (
          <span className="hidden sm:inline text-[13px] font-semibold text-[#1a1a2e]/85 truncate max-w-[260px] group-hover:text-[#1a1a2e]">
            {eventTitle}
          </span>
        )}
      </Link>

      {/* Middle — page tabs */}
      <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        <NavTab href={homePath} active={isHome} icon={<Home size={12} />} label="Home" />
        {pages.map((p) => {
          const href = `/events/${eventSlug}/p/${p.slug}`
          return (
            <NavTab
              key={p.slug}
              href={href}
              active={pathname === href || pathname === href + "/"}
              label={p.title}
            />
          )
        })}
      </nav>

      {/* Right — escape hatch back to the main marketing site */}
      <Link
        href="/"
        className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-medium text-[#1a1a2e]/60 hover:text-[#1a1a2e] whitespace-nowrap"
      >
        <ArrowLeft size={12} />
        <span>TLF site</span>
      </Link>
    </header>
  )
}

function NavTab({
  href, active, icon, label,
}: {
  href: string
  active: boolean
  icon?: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-[#1a1a2e] text-white"
          : "text-[#1a1a2e]/70 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/5"
      }`}
    >
      {icon}
      <span className="max-w-[160px] truncate">{label}</span>
    </Link>
  )
}
