"use client"

/**
 * ─── ADMIN GLASS LAUNCHER ────────────────────────────────────────────
 *
 * The post-login landing — a liquid-glass command center. Every
 * function the user can access is a glass tile, grouped by workspace
 * (Backstage / CRM / Studio / Finance) plus a Foundation row. A live
 * filter narrows tiles across all groups at once.
 *
 * Permissions come from AdminPermissionsProvider: super admins see
 * everything, everyone else sees only what their profile grants.
 *
 * Liquid-glass surfaces (`lf-glass`) are the public-site material —
 * translucent white, heavy blur + saturation, bright top rim, soft
 * floating shadow — reused here so admin + marketing share one look.
 */

import Link from "next/link"
import { useMemo, useState } from "react"
import { useAdminPermissions } from "./AdminPermissionsContext"
import {
  ADMIN_WORKSPACES,
  canAccessWorkspace,
  canAccessSection,
  accessibleFoundation,
} from "@/lib/admin-domains"
import { Search, ArrowUpRight } from "lucide-react"

interface Tile {
  label: string
  href: string
  group: string
}

export function AdminHomeTiles({ userName }: { userName?: string | null }) {
  const { role, permissions } = useAdminPermissions()
  const [query, setQuery] = useState("")

  const firstName = userName?.split(" ")[0] ?? null
  const q = query.trim().toLowerCase()

  // Build the accessible-workspace → tiles map once per render.
  const workspaces = useMemo(() => {
    return ADMIN_WORKSPACES
      .filter((w) => canAccessWorkspace(w, role, permissions))
      .map((w) => {
        const tiles: Tile[] = w.groups.flatMap((g) =>
          g.items
            .filter((it) => canAccessSection(it, w, role, permissions))
            .map((it) => ({ label: it.label, href: it.href, group: g.title })),
        )
        return { workspace: w, tiles }
      })
      .filter((x) => x.tiles.length > 0)
  }, [role, permissions])

  // Foundation tiles (Analytics / Team / Settings / …).
  const foundationTiles: Tile[] = useMemo(
    () =>
      accessibleFoundation(role, permissions).map((f) => ({
        label: f.label,
        href: f.href,
        group: "Foundation",
      })),
    [role, permissions],
  )

  const matches = (t: Tile) => !q || t.label.toLowerCase().includes(q)

  const hasAnything =
    workspaces.some((w) => w.tiles.some(matches)) || foundationTiles.some(matches)

  return (
    <section className="relative">
      {/* ── Greeting ──────────────────────────────────────────────── */}
      <div className="mb-7">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#6b7280] mb-2">
          Command center
        </div>
        <h1 className="text-[26px] sm:text-[32px] font-semibold text-[#1d1d1f] tracking-tight">
          {firstName ? `Hey ${firstName} — what are we doing today?` : "What are we doing today?"}
        </h1>
        <p className="mt-1.5 text-[13px] text-[#6b7280]">
          Every tool you can reach, one tap away. Filter to jump straight to it.
        </p>
      </div>

      {/* ── Glass filter ──────────────────────────────────────────── */}
      <div className="lf-glass sticky top-0 z-10 mb-8 flex items-center gap-2.5 rounded-2xl px-4 h-12">
        <Search size={16} className="shrink-0 text-[#6b7280]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter functions — events, attendees, invoices…"
          className="flex-1 bg-transparent text-[14px] text-[#1d1d1f] placeholder:text-[#9ca3af] focus:outline-none"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-[12px] font-medium text-[#6b7280] hover:text-[#1d1d1f]"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Workspace groups ──────────────────────────────────────── */}
      <div className="space-y-9">
        {workspaces.map(({ workspace, tiles }) => {
          const shown = tiles.filter(matches)
          if (shown.length === 0) return null
          return (
            <LauncherGroup
              key={workspace.slug}
              accent={workspace.accent}
              name={workspace.name}
              tagline={workspace.tagline}
              tiles={shown}
            />
          )
        })}

        {foundationTiles.filter(matches).length > 0 && (
          <LauncherGroup
            accent="#0071e3"
            name="Foundation"
            tagline="Analytics, team & settings"
            tiles={foundationTiles.filter(matches)}
          />
        )}
      </div>

      {!hasAnything && (
        <div className="lf-glass rounded-2xl px-6 py-12 text-center">
          <p className="text-[14px] font-medium text-[#1d1d1f]">No functions match “{query}”.</p>
          <p className="mt-1 text-[13px] text-[#6b7280]">Try a different word, or clear the filter.</p>
        </div>
      )}
    </section>
  )
}

/* ── One workspace block — header + glass tile grid ─────────────────── */

function LauncherGroup({
  accent, name, tagline, tiles,
}: {
  accent: string
  name: string
  tagline: string
  tiles: Tile[]
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3.5 px-0.5">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: accent }}
        />
        <h2 className="text-[15px] font-semibold text-[#1d1d1f]">{name}</h2>
        <span className="text-[12px] text-[#9ca3af] truncate">{tagline}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <LauncherTile key={t.href} tile={t} accent={accent} />
        ))}
      </div>
    </div>
  )
}

function LauncherTile({ tile, accent }: { tile: Tile; accent: string }) {
  return (
    <Link
      href={tile.href}
      className="lf-glass group relative rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
    >
      {/* Accent letter-chip */}
      <span
        className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-[14px] font-bold"
        style={{ backgroundColor: `${accent}1f`, color: accent }}
      >
        {tile.label[0]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold text-[#1d1d1f] truncate">
          {tile.label}
        </span>
        <span className="block text-[11px] text-[#9ca3af] truncate">{tile.group}</span>
      </span>
      <ArrowUpRight
        size={15}
        className="shrink-0 text-[#c4c4cc] group-hover:text-[#1d1d1f] transition-colors"
      />
    </Link>
  )
}
