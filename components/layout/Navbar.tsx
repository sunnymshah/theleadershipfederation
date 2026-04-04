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
          ? "bg-white/80 backdrop-blur-2xl backdrop-saturate-150 border-b border-[#1a1a2e]/[0.06] shadow-[0_1px_24px_rgba(0,0,0,0.04)]"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-[64px] lg:h-[72px]">

          <Link href="/" className="group flex items-center gap-3 shrink-0">
            <Image
              src="/logo-tlf.png"
              alt="The Leadership Federation"
              width={140}
              height={48}
              className="h-[36px] lg:h-[42px] w-auto object-contain"
              priority
            />
          </Link>

          <div className="hidden lg:flex items-center gap-[28px]">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-[13px] tracking-[0.02em] transition-colors duration-200",
                  pathname === href
                    ? "text-[#1a1a2e] font-semibold"
                    : "text-[#1a1a2e]/45 hover:text-[#1a1a2e]/80"
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className={cn(
                "hidden lg:inline-flex items-center gap-2 px-[22px] py-[10px]",
                "text-[13px] font-semibold tracking-[0.02em] rounded-full",
                "bg-[#1a1a2e] text-white",
                "hover:bg-[#2d2d4e] transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
              )}
            >
              Get Invited
            </Link>

            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center text-[#1a1a2e]/55 hover:text-[#1a1a2e] transition-colors duration-200"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-[#1a1a2e]/[0.06] py-5 space-y-0.5 bg-[#F4F8FF]">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 py-3 px-1 text-[14px] transition-colors duration-200",
                  pathname === href
                    ? "text-[#1a1a2e] font-semibold"
                    : "text-[#1a1a2e]/45 hover:text-[#1a1a2e]/80"
                )}
              >
                {label}
              </Link>
            ))}
            <div className="pt-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold tracking-wide rounded-full bg-[#1a1a2e] text-white"
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
