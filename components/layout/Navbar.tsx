"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Platforms", href: "/platforms" },
  { label: "Membership", href: "/memberships" },
  { label: "Events", href: "/events" },
  { label: "Past Events", href: "/archive" },
  { label: "Advisory Board & Jury", href: "/advisory-board" },
  { label: "Media", href: "/media" },
  { label: "Inner Circle", href: "/inner-circle" },
  { label: "Register", href: "/register" },
]

/**
 * Navbar — Apple iOS-26 "Liquid Glass" floating navigation.
 *
 * The bar is detached from the viewport edges (a floating glass pill),
 * built on the `.lf-liquid-nav` material in globals.css: a translucent
 * blurred + saturated surface with a bright rim-highlight and a soft
 * drop shadow. It firms up slightly once the page is scrolled
 * (`data-scrolled`). The mobile menu is a matching floating glass card.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const sentinel = document.createElement("div")
    sentinel.style.cssText =
      "position:absolute;top:8px;left:0;width:1px;height:1px;pointer-events:none"
    document.body.prepend(sentinel)
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(sentinel)
    return () => {
      observer.disconnect()
      sentinel.remove()
    }
  }, [])

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-5 lg:px-6 pt-3 sm:pt-4">
      {/* ── Floating liquid-glass bar ───────────────────────────────── */}
      <nav
        data-scrolled={scrolled}
        className="lf-liquid-nav max-w-[1240px] mx-auto rounded-[20px] px-3.5 sm:px-5 lg:px-6"
      >
        <div className="flex items-center h-[56px] lg:h-[60px] gap-3">
          {/* Logo — left */}
          <Link href="/" className="shrink-0 flex items-center">
            <Image
              src="/logo-tlf.png"
              alt="The Leadership Federation"
              width={150}
              height={40}
              className="h-[26px] lg:h-[28px] w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav — centered, text-only with a gold active rule. */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className="flex items-center gap-0.5">
              {navLinks.map(({ label, href }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative px-3 py-1.5 text-[13.5px] tracking-[-0.01em] whitespace-nowrap rounded-full transition-all duration-200",
                      active
                        ? "text-[#1a1a2e] font-semibold"
                        : "text-[#1a1a2e]/65 hover:text-[#1a1a2e] font-medium hover:bg-white/50",
                    )}
                  >
                    {label}
                    {active && (
                      <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-[2.5px] w-5 rounded-full bg-[#e7ab1c]" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Mobile toggle — right. (The repetitive black "Register"
              button was removed; "Register" stays as a nav link.) */}
          <div className="flex items-center shrink-0 ml-auto lg:ml-0">
            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full text-[#1a1a2e]/80 hover:text-[#1a1a2e] hover:bg-white/60 transition-all duration-200"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X size={19} strokeWidth={1.9} />
              ) : (
                <Menu size={19} strokeWidth={1.9} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile menu — floating glass card ───────────────────────── */}
      <div
        className={cn(
          "lg:hidden max-w-[1240px] mx-auto origin-top transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          mobileOpen
            ? "mt-2 opacity-100 scale-100 pointer-events-auto"
            : "mt-0 opacity-0 scale-95 pointer-events-none",
        )}
      >
        <div className="lf-liquid-nav rounded-[20px] p-2">
          {navLinks.map(({ label, href }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center py-2.5 px-3.5 rounded-2xl text-[14px] transition-all duration-200",
                  active
                    ? "text-[#1a1a2e] font-semibold bg-white/65"
                    : "text-[#1a1a2e]/75 font-medium hover:text-[#1a1a2e] hover:bg-white/50",
                )}
              >
                {label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#e7ab1c]" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
