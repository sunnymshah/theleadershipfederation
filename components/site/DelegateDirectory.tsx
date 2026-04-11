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
          className="relative bg-white border border-[#1a1a2e]/[0.08] rounded-2xl shadow-sm"
        >
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1a1a2e]/35 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or company..."
            className="w-full pl-11 pr-4 py-3.5 bg-transparent text-sm text-[#1a1a2e] placeholder-[#1a1a2e]/35 focus:outline-none focus:ring-2 focus:ring-[#e7ab1c]/30 rounded-2xl transition-all"
          />
        </div>
        {query.trim() && (
          <p className="text-center text-xs text-[#1a1a2e]/40 mt-2">
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
              className="group rounded-xl p-5 bg-white shadow-sm border border-[#1a1a2e]/[0.06] hover:border-[#e7ab1c]/30 hover:shadow-md transition-all duration-300"
            >
              {/* Avatar + Name */}
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center group-hover:ring-[#e7ab1c]/40 ring-2 ring-[#e7ab1c]/10 transition-all duration-300"
                  style={{
                    background: "linear-gradient(135deg, rgba(231,171,28,0.18) 0%, rgba(231,171,28,0.06) 100%)",
                  }}
                >
                  <span className="text-sm font-bold text-[#e7ab1c]">
                    {delegate.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[#1a1a2e] truncate">
                    {delegate.name}
                  </h3>

                  {(delegate.designation || delegate.company) && (
                    <p className="text-xs text-[#1a1a2e]/55 mt-0.5 truncate">
                      {delegate.designation}
                      {delegate.designation && delegate.company ? " at " : ""}
                      {delegate.company}
                    </p>
                  )}
                </div>
              </div>

              {/* Company badge + LinkedIn */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1a1a2e]/[0.06]">
                {delegate.company ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#1a1a2e]/40 uppercase tracking-wider">
                    <Building2 size={10} className="text-[#1a1a2e]/30" />
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
                    className="inline-flex items-center gap-1 text-[10px] text-[#e7ab1c] hover:text-[#d49c10] transition-colors uppercase tracking-wider font-medium"
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
          <User size={32} className="mx-auto mb-3 text-[#1a1a2e]/20" />
          <p className="text-sm text-[#1a1a2e]/45">
            {query.trim() ? "No delegates match your search" : "No delegates to display"}
          </p>
        </div>
      )}
    </div>
  )
}
