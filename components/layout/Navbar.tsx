"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, ArrowRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const sfText = {
  fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

/* ── Primary nav: visible in main bar ─────────────────────────────── */
const primaryLinks = [
  { label: "Events", href: "/events" },
  { label: "Memberships", href: "/memberships" },
  { label: "Winners", href: "/winners" },
  { label: "About", href: "/about" },
]

/* ── "More" dropdown items ────────────────────────────────────────── */
const moreLinks = [
  { label: "Platforms", href: "/platforms" },
  { label: "Partners", href: "/partners" },
  { label: "Advisory Board", href: "/advisory-board" },
  { label: "Inner Circle", href: "/inner-circle" },
  { label: "Media", href: "/media" },
  { label: "Archive", href: "/archive" },
  { label: "Contact", href: "/contact" },
]

/* ── All links for mobile menu ────────────────────────────────────── */
const allLinks = [
  { label: "Events", href: "/events" },
  { label: "Memberships", href: "/memberships" },
  { label: "Register", href: "/register" },
  { label: "Winners", href: "/winners" },
  { label: "About", href: "/about" },
  { label: "Platforms", href: "/platforms" },
  { label: "Partners", href: "/partners" },
  { label: "Advisory Board", href: "/advisory-board" },
  { label: "Inner Circle", href: "/inner-circle" },
  { label: "Media", href: "/media" },
  { label: "Archive", href: "/archive" },
  { label: "Contact", href: "/contact" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  /* Scroll detection */
  useEffect(() => {
    const sentinel = document.createElement("div")
    sentinel.style.cssText =
      "position:absolute;top:16px;left:0;width:1px;height:1px;pointer-events:none"
    document.body.prepend(sentinel)
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(sentinel)
    return () => {
      observer.disconnect()
      sentinel.remove()
    }
  }, [])

  /* Close menus on route change */
  useEffect(() => {
    setMobileOpen(false)
    setMoreOpen(false)
  }, [pathname])

  /* Close "More" dropdown on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  const isMoreActive = moreLinks.some((l) => isActive(l.href))

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        mobileOpen
          ? "bg-[#F4F8FF]"
          : scrolled
            ? "bg-white/80 backdrop-blur-2xl backdrop-saturate-[1.8] border-b border-[#1a1a2e]/[0.06] shadow-[0_1px_3px_rgba(26,26,46,0.04)]"
            : "bg-transparent"
      )}
    >
      <nav className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <div className="flex items-center h-[56px] lg:h-[60px]">
          {/* Logo — left */}
          <Link href="/" className="shrink-0 mr-auto lg:mr-0">
            <Image
              src="/logo-tlf.png"
              alt="The Leadership Federation"
              width={160}
              height={44}
              className="h-[32px] lg:h-[36px] w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav — centered */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {primaryLinks.map(({ label, href }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[13px] tracking-[-0.01em] transition-all duration-200",
                    active
                      ? "text-[#e7ab1c] font-semibold"
                      : "text-[#1a1a2e]/70 font-medium hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.04]"
                  )}
                  style={sfText}
                >
                  {label}
                </Link>
              )
            })}

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1 px-4 py-2 rounded-lg text-[13px] tracking-[-0.01em] transition-all duration-200",
                  isMoreActive
                    ? "text-[#e7ab1c] font-semibold"
                    : "text-[#1a1a2e]/70 font-medium hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.04]"
                )}
                style={sfText}
              >
                More
                <ChevronDown
                  size={13}
                  strokeWidth={2}
                  className={cn(
                    "transition-transform duration-200",
                    moreOpen && "rotate-180"
                  )}
                />
              </button>

              {moreOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white rounded-xl shadow-[0_8px_32px_rgba(26,26,46,0.12)] border border-[#1a1a2e]/[0.06] py-2 z-50">
                  {moreLinks.map(({ label, href }) => {
                    const active = isActive(href)
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "block px-4 py-2.5 text-[13px] transition-colors duration-150",
                          active
                            ? "text-[#e7ab1c] font-semibold bg-[#e7ab1c]/[0.06]"
                            : "text-[#1a1a2e]/75 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.03]"
                        )}
                        style={sfText}
                      >
                        {label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CTA + Mobile toggle — right */}
          <div className="flex items-center gap-2.5 ml-auto lg:ml-0">
            <Link
              href="/register"
              className={cn(
                "hidden lg:inline-flex items-center gap-1.5 px-5 py-[8px]",
                "text-[13px] font-semibold tracking-[-0.01em] rounded-full",
                "bg-[#e7ab1c] text-white",
                "hover:bg-[#d49c10] transition-all duration-200",
                "active:scale-[0.97]",
                "shadow-[0_2px_12px_rgba(231,171,28,0.25)]"
              )}
              style={sfText}
            >
              Register Now
              <ArrowRight size={13} strokeWidth={2.2} />
            </Link>

            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[#1a1a2e]/80 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.05] transition-all duration-200"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X size={18} strokeWidth={1.8} />
              ) : (
                <Menu size={18} strokeWidth={1.8} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300 ease-in-out bg-[#F4F8FF] border-t border-[#1a1a2e]/[0.06]",
            mobileOpen
              ? "max-h-[600px] opacity-100"
              : "max-h-0 opacity-0 border-t-transparent"
          )}
        >
          <div className="pb-5 pt-3 space-y-0.5">
            {allLinks.map(({ label, href }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "block py-2.5 px-4 rounded-xl text-[14px] transition-all duration-200",
                    active
                      ? "text-[#e7ab1c] font-semibold bg-[#e7ab1c]/[0.08]"
                      : "text-[#1a1a2e]/80 font-medium hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.04]"
                  )}
                  style={sfText}
                >
                  {label}
                </Link>
              )
            })}
            <div className="pt-3 px-1">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-semibold rounded-full bg-[#e7ab1c] text-white shadow-[0_2px_12px_rgba(231,171,28,0.25)]"
                style={sfText}
              >
                Register Now
                <ArrowRight size={13} strokeWidth={2.2} />
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
