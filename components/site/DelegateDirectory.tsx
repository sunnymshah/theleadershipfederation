"use client"

/**
 * ─── DELEGATE DIRECTORY (Client Component) ──────────────────────────────
 *
 * Search + grid of delegate cards for networking.
 * Filters by name or company, client-side.
 * Gold-themed, matching LF brand.
 */

import { useState } from "react"
import { Search, ExternalLink, Building2, User } from "lucide-react"

interface Delegate {
  id: string
  name: string
  company: string | null
  designation: string | null
  linkedin_url: string | null
}

export function DelegateDirectory({ delegates }: { delegates: Delegate[] }) {
  const [query, setQuery] = useState("")

  const filtered = query.trim()
    ? delegates.filter((d) => {
        const q = query.toLowerCase()
        return (
          d.name.toLowerCase().includes(q) ||
          (d.company?.toLowerCase().includes(q) ?? false)
        )
      })
    : delegates

  return (
    <div>
      {/* ── Search Bar ──────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto mb-12">
        <div
          className="relative"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
          }}
        >
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or company..."
            className="w-full pl-11 pr-4 py-3.5 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/30 rounded-2xl transition-all"
          />
        </div>
        {query.trim() && (
          <p className="text-center text-xs text-white/20 mt-2">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* ── Delegate Grid ───────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((delegate) => (
            <div
              key={delegate.id}
              className="group rounded-xl p-5 transition-all duration-300 hover:bg-white/[0.03]"
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Avatar + Name */}
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center group-hover:ring-[#c9a84c]/30 ring-2 ring-white/[0.06] transition-all duration-300"
                  style={{
                    background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%)",
                  }}
                >
                  <span className="text-sm font-bold text-[#c9a84c]/70">
                    {delegate.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {delegate.name}
                  </h3>

                  {(delegate.designation || delegate.company) && (
                    <p className="text-xs text-white/35 mt-0.5 truncate">
                      {delegate.designation}
                      {delegate.designation && delegate.company ? " at " : ""}
                      {delegate.company}
                    </p>
                  )}
                </div>
              </div>

              {/* Company badge + LinkedIn */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                {delegate.company ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-white/20 uppercase tracking-wider">
                    <Building2 size={10} className="text-white/15" />
                    {delegate.company}
                  </span>
                ) : (
                  <span />
                )}

                {delegate.linkedin_url && (
                  <a
                    href={delegate.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-[#c9a84c]/50 hover:text-[#c9a84c] transition-colors uppercase tracking-wider font-medium"
                  >
                    <ExternalLink size={12} />
                    Connect
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <User size={32} className="mx-auto mb-3 text-white/10" />
          <p className="text-sm text-white/25">
            {query.trim() ? "No delegates match your search" : "No delegates to display"}
          </p>
        </div>
      )}
    </div>
  )
}
