"use client"

/**
 * Mobile hamburger for EventPageNav. Renders the active page label +
 * a hamburger; tapping opens a dropdown panel with all items.
 *
 * Lives next to its server-component parent. Self-contained: receives
 * the resolved nav items as props so it doesn't re-fetch.
 */

import Link from "next/link"
import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"

type Item = { slug: string | null; title: string; href: string }

export function EventPageNavMobile({
  items,
  currentPageSlug,
}: {
  items: Item[]
  currentPageSlug: string | null
}) {
  const [open, setOpen] = useState(false)
  const active = items.find((it) => (it.slug ?? null) === (currentPageSlug ?? null))

  // Close on Escape so users on a phone keyboard / a11y stack can dismiss.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <div className="relative flex items-center justify-between w-full px-3">
      <span className="text-[13px] font-semibold text-[#1a1a2e] truncate">
        {active?.title ?? "Home"}
      </span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="inline-flex items-center justify-center p-2 rounded-md text-[#1a1a2e]/70 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.04]"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-px bg-white border-b border-[#1a1a2e]/[0.08] shadow-md z-50">
          <ul className="px-2 py-1">
            {items.map((it) => {
              const isActive = (it.slug ?? null) === (currentPageSlug ?? null)
              return (
                <li key={it.slug ?? "_home"}>
                  <Link
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className={`block px-3 py-2.5 text-sm font-medium rounded-md ${
                      isActive
                        ? "text-[var(--lf-primary,#e7ab1c)] bg-[#1a1a2e]/[0.03]"
                        : "text-[#1a1a2e]/85 hover:bg-[#1a1a2e]/[0.04]"
                    }`}
                  >
                    {it.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
