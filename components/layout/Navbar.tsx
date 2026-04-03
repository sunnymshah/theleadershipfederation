"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "About",          href: "/about" },
  { label: "Platforms",      href: "/platforms" },
  { label: "Events",         href: "/events" },
  { label: "Partners",       href: "/partners" },
  { label: "Advisory Board", href: "/advisory-board" },
  { label: "Media",          href: "/media" },
  { label: "Contact",        href: "/contact" },
]

export function Navbar() {
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out",
        scrolled
          ? "bg-[#050505]/88 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/[0.06]"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">

        {/* ─── Main bar ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between h-[64px] lg:h-[68px]">

          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3 shrink-0">
            <div
              className={cn(
                "flex items-center justify-center w-[34px] h-[34px] rounded-[5px]",
                "border transition-all duration-300",
                "border-[#c9a84c]/40 group-hover:border-[#c9a84c]/80",
                "bg-[#c9a84c]/5 group-hover:bg-[#c9a84c]/10",
              )}
            >
              <span className="text-[#c9a84c] font-bold text-[11px] tracking-[0.18em]">
                TLF
              </span>
            </div>
            <span className="hidden sm:block text-white/80 group-hover:text-white/95 transition-colors duration-300 font-medium text-[13px] tracking-[0.1em] uppercase leading-tight">
              The Leadership<br />Federation
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-[28px]">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-[13px] tracking-[0.03em] transition-colors duration-200",
                  pathname === href
                    ? "text-white/90"
                    : "text-white/45 hover:text-white/80"
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className={cn(
                "hidden lg:inline-flex items-center px-[18px] py-[9px]",
                "text-[13px] font-semibold tracking-[0.06em] rounded-full",
                "bg-[#c9a84c] text-[#0a0a0a]",
                "hover:bg-[#d4b85c] transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
                "shadow-[0_0_24px_rgba(201,168,76,0.22)]",
              )}
            >
              Get Invited
            </Link>

            {/* Mobile toggle */}
            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center text-white/55 hover:text-white/90 transition-colors duration-200"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* ─── Mobile menu ──────────────────────────────────────────────── */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/[0.06] py-5 space-y-0.5">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center py-3 px-1 text-[14px] transition-colors duration-200",
                  pathname === href
                    ? "text-white/90"
                    : "text-white/50 hover:text-white/80"
                )}
              >
                {label}
              </Link>
            ))}
            <div className="pt-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold tracking-wide rounded-full bg-[#c9a84c] text-[#0a0a0a]"
              >
                Get Invited
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
