"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

// ITEM 8: nested children render indented inside the hamburger menu.
type Item = {
  kind: string
  label: string
  href: string
  active: boolean
  children?: Array<{ label: string; href: string }>
}

export function EventTopNavMobile({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false)
  const register = items.find((it) => it.kind === "register")
  const others = items.filter((it) => it.kind !== "register")

  return (
    <div className="flex items-center justify-end gap-2">
      {register && (
        <Link
          href={register.href}
          className="inline-flex items-center px-3 h-8 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[var(--lf-primary,#e7ab1c)] text-white"
        >
          {register.label}
        </Link>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="inline-flex items-center justify-center w-9 h-9 rounded-md text-[#1a1a2e]/70 hover:bg-[#1a1a2e]/[0.06]"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open && (
        <div className="absolute top-14 inset-x-0 bg-white border-b border-[#1a1a2e]/10 shadow-md z-40">
          <ul className="py-2">
            {others.map((it) => (
              <li key={it.kind}>
                <Link
                  href={it.href}
                  onClick={() => setOpen(false)}
                  aria-current={it.active ? "page" : undefined}
                  className={`block px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.05em] ${
                    it.active ? "text-[#1a1a2e] bg-[var(--lf-primary,#e7ab1c)]/10" : "text-[#1a1a2e]/70"
                  }`}
                >
                  {it.label}
                </Link>
                {it.children && it.children.length > 0 && (
                  <ul className="pb-2">
                    {it.children.map((c) => (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          onClick={() => setOpen(false)}
                          className="block pl-10 pr-5 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#1a1a2e]/60"
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
