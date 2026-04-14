"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Menu,
  X,
  House,
  Info,
  Layers,
  CalendarDays,
  Ticket,
  Handshake,
  Shield,
  Tv,
  Mail,
  ArrowRight,
  Archive,
  Crown,
  Trophy,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

const sfText = {
  fontFamily:
    "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

const navLinks = [
  { label: "Home", href: "/", icon: House },
  { label: "About", href: "/about", icon: Info },
  { label: "Platforms", href: "/platforms", icon: Layers },
  { label: "Memberships", href: "/memberships", icon: Crown },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Tickets", href: "/tickets", icon: Ticket },
  { label: "Partners", href: "/partners", icon: Handshake },
  { label: "Advisory", href: "/advisory-board", icon: Shield },
  { label: "Media", href: "/media", icon: Tv },
  { label: "Archive", href: "/archive", icon: Archive },
  { label: "Winners", href: "/winners", icon: Trophy },
  { label: "Inner Circle", href: "/inner-circle", icon: Users },
  { label: "Contact", href: "/contact", icon: Mail },
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
            ? "bg-white/80 backdrop-blur-2xl backdrop-saturate-[1.8] border-b border-[#1a1a2e]/[0.06] shadow-[0_1px_3px_rgba(26,26,46,0.04)]"
            : "bg-transparent"
      )}
    >
      <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-[56px] lg:h-[60px] gap-3">
          {/* Logo — left */}
          <Link href="/" className="shrink-0">
            <Image
              src="/logo-tlf.png"
              alt="The Leadership Federation"
              width={160}
              height={44}
              className="h-[30px] lg:h-[34px] w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav — centered, flex-1 */}
          <div className="hidden xl:flex items-center justify-center flex-1 gap-0.5">
            {navLinks.map(({ label, href, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap",
                    active
                      ? "text-[#e7ab1c] bg-[#e7ab1c]/[0.08]"
                      : "text-[#1a1a2e]/70 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.04]"
                  )}
                  style={sfText}
                >
                  <Icon
                    size={13}
                    strokeWidth={active ? 2 : 1.6}
                    className={cn(
                      active ? "text-[#e7ab1c]" : "text-[#1a1a2e]/55"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[12px] tracking-[-0.01em]",
                      active ? "font-semibold" : "font-medium"
                    )}
                  >
                    {label}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Tablet nav — icon only, centered */}
          <div className="hidden lg:flex xl:hidden items-center justify-center flex-1 gap-1">
            {navLinks.map(({ label, href, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  aria-label={label}
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                    active
                      ? "text-[#e7ab1c] bg-[#e7ab1c]/[0.08]"
                      : "text-[#1a1a2e]/65 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.04]"
                  )}
                >
                  <Icon size={16} strokeWidth={active ? 2 : 1.7} />
                </Link>
              )
            })}
          </div>

          {/* CTA + Mobile toggle — right */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <Link
              href="/register"
              className={cn(
                "hidden lg:inline-flex items-center gap-1.5 px-4 py-[7px]",
                "text-[12.5px] font-semibold tracking-[-0.01em] rounded-full",
                "bg-[#e7ab1c] text-white",
                "hover:bg-[#d49c10] transition-all duration-200",
                "active:scale-[0.97]",
                "shadow-[0_2px_12px_rgba(231,171,28,0.25)]"
              )}
              style={sfText}
            >
              Register
              <ArrowRight size={12} strokeWidth={2.2} />
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
            {navLinks.map(({ label, href, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 py-2.5 px-3 rounded-xl text-[14px] transition-all duration-200",
                    active
                      ? "text-[#e7ab1c] font-semibold bg-[#e7ab1c]/[0.08]"
                      : "text-[#1a1a2e]/80 font-medium hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.04]"
                  )}
                  style={sfText}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2 : 1.5}
                    className={
                      active ? "text-[#e7ab1c]" : "text-[#1a1a2e]/55"
                    }
                  />
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
