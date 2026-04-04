"use client"

/* ═══════════════════════════════════════════════════════════════════════════
 *  NAVBAR — Editorial Luxury + Apple-Style Thin-Stroke Icons
 *
 *  Fixed glassmorphism header on #FAECD2 cream background.
 *  Uses Lucide icons (thin stroke = SF Symbols feel) next to each nav link.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu, X,
  Info,
  Layers,
  CalendarDays,
  Handshake,
  Users,
  Radio,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "About",          href: "/about",          icon: Info },
  { label: "Platforms",      href: "/platforms",       icon: Layers },
  { label: "Events",         href: "/events",          icon: CalendarDays },
  { label: "Partners",       href: "/partners",        icon: Handshake },
  { label: "Advisory Board", href: "/advisory-board",  icon: Users },
  { label: "Media",          href: "/media",            icon: Radio },
  { label: "Contact",        href: "/contact",          icon: Mail },
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
          ? "bg-[#FAECD2]/90 backdrop-blur-2xl backdrop-saturate-150 border-b border-black/[0.05] shadow-[0_1px_24px_rgba(0,0,0,0.04)]"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-[64px] lg:h-[72px]">

          {/* ── Logo ─────────────────────────────────────────────── */}
          <Link href="/" className="group flex items-center gap-3 shrink-0">
            <div className="flex items-center justify-center w-[36px] h-[36px] rounded-[8px] bg-[#000] transition-transform duration-300 group-hover:scale-105">
              <span className="text-[#FAECD2] font-bold text-[10px] tracking-[0.2em]">
                TLF
              </span>
            </div>
            <span className="hidden sm:block text-black/80 group-hover:text-black transition-colors duration-300 font-medium text-[13px] tracking-[0.08em] uppercase leading-tight">
              The Leadership<br />Federation
            </span>
          </Link>

          {/* ── Desktop links with icons ──────────────────────────── */}
          <div className="hidden lg:flex items-center gap-[24px]">
            {navLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 text-[13px] tracking-[0.01em] transition-colors duration-200",
                  pathname === href
                    ? "text-black font-medium"
                    : "text-black/40 hover:text-black/75"
                )}
              >
                <Icon size={14} strokeWidth={1.5} />
                {label}
              </Link>
            ))}
          </div>

          {/* ── Right side ────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className={cn(
                "hidden lg:inline-flex items-center gap-2 px-[20px] py-[10px]",
                "text-[13px] font-semibold tracking-[0.04em] rounded-full",
                "bg-[#e7ab1c] text-white",
                "hover:bg-[#d49c10] transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
                "shadow-[0_2px_16px_rgba(231,171,28,0.25)]",
              )}
            >
              Get Invited
            </Link>

            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center text-black/55 hover:text-black/90 transition-colors duration-200"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ────────────────────────────────────────── */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-black/[0.06] py-5 space-y-0.5 bg-[#FAECD2]">
            {navLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 py-3 px-1 text-[14px] transition-colors duration-200",
                  pathname === href
                    ? "text-black font-medium"
                    : "text-black/50 hover:text-black/80"
                )}
              >
                <Icon size={16} strokeWidth={1.5} />
                {label}
              </Link>
            ))}
            <div className="pt-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold tracking-wide rounded-full bg-[#e7ab1c] text-white"
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
