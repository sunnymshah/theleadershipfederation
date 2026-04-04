"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
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
          ? "bg-white/80 backdrop-blur-2xl backdrop-saturate-150 border-b border-black/[0.05] shadow-[0_1px_24px_rgba(0,0,0,0.04)]"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-[64px] lg:h-[72px]">

          {/* Logo: icon image + dark text beside it */}
          <Link href="/" className="group flex items-center gap-2.5 shrink-0">
            <Image
              src="/logo-tlf.png"
              alt="The Leadership Federation"
              width={44}
              height={44}
              className="h-[36px] lg:h-[40px] w-auto object-contain"
              priority
            />
            <div className="hidden sm:block leading-tight">
              <div className="text-[14px] font-semibold text-black tracking-[-0.01em]" style={{ fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }}>
                Leadership
              </div>
              <div className="text-[14px] font-semibold text-black tracking-[-0.01em]" style={{ fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }}>
                Federation
              </div>
            </div>
          </Link>

          {/* Desktop nav — Apple system font */}
          <div className="hidden lg:flex items-center gap-[26px]">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-[13px] tracking-[-0.01em] transition-colors duration-200",
                  pathname === href
                    ? "text-black font-medium"
                    : "text-black/40 hover:text-black/70"
                )}
                style={{ fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif" }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className={cn(
                "hidden lg:inline-flex items-center gap-2 px-[22px] py-[10px]",
                "text-[13px] font-semibold tracking-[-0.01em] rounded-full",
                "bg-[#e7ab1c] text-white",
                "hover:bg-[#d49c10] transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
                "shadow-[0_2px_16px_rgba(231,171,28,0.25)]",
              )}
              style={{ fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif" }}
            >
              Register Now
            </Link>

            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center text-black/55 hover:text-black transition-colors duration-200"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-black/[0.06] py-5 space-y-0.5 bg-[#F4F8FF]">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 py-3 px-1 text-[14px] transition-colors duration-200",
                  pathname === href
                    ? "text-black font-medium"
                    : "text-black/45 hover:text-black/80"
                )}
                style={{ fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif" }}
              >
                {label}
              </Link>
            ))}
            <div className="pt-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold tracking-wide rounded-full bg-[#e7ab1c] text-white"
              >
                Register Now
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
