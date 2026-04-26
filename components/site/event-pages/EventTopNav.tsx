/**
 * ── EventTopNav (Zoho-style standard-page nav, server component) ─────
 *
 * Renders the canonical horizontal nav at the top of every public event
 * page. Reads from `event_standard_pages` (visible=true) so admins can
 * hide/reorder via the Pages panel without touching code.
 *
 * Layout matches Zoho Backstage:
 *   - Uppercase tab labels, primary-color underline on active page
 *   - REGISTER NOW + SIGN IN pinned to the right with a separator
 *   - Mobile: hamburger collapses everything but Register
 *
 * Replaces the older `EventPageNav.tsx` (which only listed builder_pages
 * sub-pages). That component is preserved for back-compat with /p/<slug>.
 */

import Link from "next/link"
import { listVisibleStandardPagesPublic } from "@/app/actions/standardPageActions"
import { publicPageHref, RAIL_PAGE_KINDS, type StandardPageKind } from "@/lib/standard-pages"
import { EventTopNavMobile } from "./EventTopNavMobile"

export async function EventTopNav({
  eventId,
  eventSlug,
  currentKind = "home",
}: {
  eventId: string
  eventSlug: string
  currentKind?: StandardPageKind
}) {
  const pages = await listVisibleStandardPagesPublic(eventId)
  if (pages.length === 0) return null

  const main = pages.filter((p) => !RAIL_PAGE_KINDS.has(p.kind as StandardPageKind))
  const rail = pages.filter((p) => RAIL_PAGE_KINDS.has(p.kind as StandardPageKind))

  const items = main.map((p) => ({
    kind: p.kind as StandardPageKind,
    label: p.label,
    href: publicPageHref(eventSlug, { kind: p.kind as StandardPageKind, slug: p.slug }),
    active: p.kind === currentKind,
  }))
  const railItems = rail.map((p) => ({
    kind: p.kind as StandardPageKind,
    label: p.label,
    href: publicPageHref(eventSlug, { kind: p.kind as StandardPageKind, slug: p.slug }),
    active: p.kind === currentKind,
  }))

  return (
    <nav
      aria-label="Event pages"
      className="sticky top-0 z-30 bg-white border-b border-[#1a1a2e]/[0.08] shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
        {/* Desktop main tabs */}
        <ul className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
          {items.map((it) => (
            <li key={it.kind} className="shrink-0">
              <Link
                href={it.href}
                aria-current={it.active ? "page" : undefined}
                className={`inline-flex items-center px-3.5 h-14 -mb-px text-[12px] font-bold uppercase tracking-[0.05em] border-b-2 transition-colors whitespace-nowrap ${
                  it.active
                    ? "border-[var(--lf-primary,#e7ab1c)] text-[#1a1a2e]"
                    : "border-transparent text-[#1a1a2e]/65 hover:text-[#1a1a2e] hover:border-[#1a1a2e]/15"
                }`}
              >
                {it.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop pinned-right slot (Register + Sign In) */}
        {railItems.length > 0 && (
          <div className="hidden md:flex items-center gap-3 shrink-0 pl-4 border-l border-[#1a1a2e]/[0.08]">
            {railItems.map((it) =>
              it.kind === "register" ? (
                <Link
                  key={it.kind}
                  href={it.href}
                  className="inline-flex items-center px-4 h-9 rounded-md text-[12px] font-bold uppercase tracking-[0.05em] bg-[var(--lf-primary,#e7ab1c)] text-white hover:bg-[#d49c10] transition-colors"
                >
                  {it.label}
                </Link>
              ) : (
                <Link
                  key={it.kind}
                  href={it.href}
                  className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#1a1a2e]/70 hover:text-[#1a1a2e] transition-colors"
                >
                  {it.label}
                </Link>
              )
            )}
          </div>
        )}

        {/* Mobile menu */}
        <div className="md:hidden flex-1">
          <EventTopNavMobile items={[...items, ...railItems]} />
        </div>
      </div>
    </nav>
  )
}
