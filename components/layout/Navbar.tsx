"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const sfText = {
  fontFamily:
    "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Platforms", href: "/platforms" },
  { label: "Memberships", href: "/memberships" },
  { label: "Events", href: "/events" },
  { label: "Speakers", href: "/speakers" },
  { label: "Past Events", href: "/archive" },
  { label: "Partners", href: "/partners" },
  { label: "Advisory", href: "/advisory-board" },
  { label: "Media", href: "/media" },
  { label: "Inner Circle", href: "/inner-circle" },
  { label: "Contact", href: "/contact" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

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

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        mobileOpen
          ? "bg-[#F4F8FF]"
          : scrolled
            ? "bg-white/85 backdrop-blur-2xl backdrop-saturate-[1.8] border-b border-[#1a1a2e]/[0.06] shadow-[0_1px_3px_rgba(26,26,46,0.04)]"
            : "bg-transparent"
      )}
    >
      <nav className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-[54px] lg:h-[58px] gap-3">
          {/* Logo — left */}
          <Link href="/" className="shrink-0">
            <Image
              src="/logo-tlf.png"
              alt="The Leadership Federation"
              width={150}
              height={40}
              className="h-[28px] lg:h-[30px] w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav — minimalistic text-only, centered */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className="flex items-center gap-0">
              {navLinks.map(({ label, href }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative px-2.5 py-1 text-[11.5px] tracking-[-0.005em] whitespace-nowrap transition-colors duration-200",
                      active
                        ? "text-[#1a1a2e] font-semibold"
                        : "text-[#1a1a2e]/60 hover:text-[#1a1a2e] font-medium"
                    )}
                    style={sfText}
                  >
                    {label}
                    {active && (
                      <span className="absolute left-2.5 right-2.5 -bottom-[1px] h-[1.5px] rounded-full bg-[#e7ab1c]" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* CTA + Mobile toggle — right */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <Link
              href="/register"
              className={cn(
                "hidden lg:inline-flex items-center gap-1.5 px-3.5 py-[6px]",
                "text-[11.5px] font-semibold tracking-[-0.005em] rounded-full",
                "bg-[#1a1a2e] text-white",
                "hover:bg-[#2a2a4e] transition-all duration-200",
                "active:scale-[0.97]"
              )}
              style={sfText}
            >
              Register
              <ArrowRight size={11} strokeWidth={2.2} />
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
              ? "max-h-[700px] opacity-100"
              : "max-h-0 opacity-0 border-t-transparent"
          )}
        >
          <div className="pb-5 pt-3 space-y-0.5">
            {navLinks.map(({ label, href }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center py-2.5 px-3 rounded-xl text-[14px] transition-all duration-200",
                    active
                      ? "text-[#1a1a2e] font-semibold bg-[#e7ab1c]/[0.08]"
                      : "text-[#1a1a2e]/75 font-medium hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.04]"
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
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-semibold rounded-full bg-[#1a1a2e] text-white"
                style={sfText}
              >
                Register
                <ArrowRight size={13} strokeWidth={2.2} />
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
