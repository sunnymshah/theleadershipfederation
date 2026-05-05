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
 *   - Optional language switcher when event.locales.length > 1
 */

import Link from "next/link"
import { createAdminClient } from "@/utils/supabase/admin"
import { listVisibleStandardPagesPublic } from "@/app/actions/standardPageActions"
import { publicPageHref, RAIL_PAGE_KINDS, type StandardPageKind } from "@/lib/standard-pages"
import { parseFocalPoint } from "@/components/admin/ImageUploadCrop"
import { getString, type TextOverrides } from "@/lib/i18n"
import { EventTopNavMobile } from "./EventTopNavMobile"
import { LanguageSwitcher } from "./LanguageSwitcher"

function withLocale(href: string, locale?: string): string {
  if (!locale) return href
  if (href.startsWith("/admin")) return href
  if (href === "/") return `/${locale}`
  return `/${locale}${href}`
}

export async function EventTopNav({
  eventId,
  eventSlug,
  currentKind = "home",
  locale,
}: {
  eventId: string
  eventSlug: string
  currentKind?: StandardPageKind
  locale?: string
}) {
  const pages = await listVisibleStandardPagesPublic(eventId)
  if (pages.length === 0) return null

  // Pull event locales + logo + nav_extra_links for the switcher,
  // left-edge logo, and ITEM 8 custom nav merge (best-effort).
  let locales: string[] = []
  let defaultLocale = "en"
  let logoUrl: string | null = null
  let eventTitle = ""
  let textOverrides: TextOverrides = {}
  type NX = { id: string; label: string; url: string; parent_id?: string | null; sort_order: number; visible: boolean }
  let extraLinks: NX[] = []
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("events")
      .select("locales, default_locale, logo_url, title, nav_extra_links, text_overrides")
      .eq("id", eventId)
      .maybeSingle()
    if (data) {
      locales = ((data.locales as string[] | null) ?? []).filter(Boolean)
      defaultLocale = (data.default_locale as string) ?? "en"
      logoUrl = (data.logo_url as string | null) ?? null
      eventTitle = (data.title as string | null) ?? ""
      const raw = (data as { nav_extra_links?: unknown }).nav_extra_links
      if (Array.isArray(raw)) {
        extraLinks = (raw as NX[]).filter((x) => x && x.label && x.url && x.visible !== false)
      }
      const tov = (data as { text_overrides?: unknown }).text_overrides
      if (tov && typeof tov === "object" && !Array.isArray(tov)) {
        textOverrides = tov as TextOverrides
      }
    }
  } catch {}
  const currentLocale = locale ?? defaultLocale
  const logoSrc = logoUrl ? parseFocalPoint(logoUrl).src : null

  // ITEM 8: build a tree out of extraLinks (parent_id → children).
  const topExtras = extraLinks.filter((x) => !x.parent_id).sort((a, b) => a.sort_order - b.sort_order)
  const childrenByParent = new Map<string, NX[]>()
  for (const e of extraLinks) {
    if (!e.parent_id) continue
    const arr = childrenByParent.get(e.parent_id) ?? []
    arr.push(e); childrenByParent.set(e.parent_id, arr)
  }

  const main = pages.filter((p) => !RAIL_PAGE_KINDS.has(p.kind as StandardPageKind))
  const rail = pages.filter((p) => RAIL_PAGE_KINDS.has(p.kind as StandardPageKind))

  // ITEM 1.1: defensively guarantee a Home tab as the FIRST item — if
  // the close-out migration hasn't run yet on this DB, or an admin has
  // hidden the home row, the visible page list might not include
  // kind='home'. Without this, the nav renders "AGENDA SPEAKERS …"
  // with no obvious entry point back to the event home.
  const hasHome = main.some((p) => p.kind === "home")
  const items = main.map((p) => ({
    kind: p.kind as StandardPageKind,
    label: p.label,
    href: withLocale(publicPageHref(eventSlug, { kind: p.kind as StandardPageKind, slug: p.slug }), locale),
    active: p.kind === currentKind,
    children: p.children?.map((c) => ({
      label: c.label,
      href: withLocale(`/events/${eventSlug}/${c.slug}`, locale),
    })) ?? undefined,
  }))
  if (!hasHome) {
    items.unshift({
      kind: "home" as StandardPageKind,
      label: "Home",
      href: withLocale(`/events/${eventSlug}`, locale),
      active: currentKind === "home",
      children: undefined,
    })
  }

  // ITEM 8: append custom links + their nested children.
  type TopItem = (typeof items)[number]
  for (const ex of topExtras) {
    const kids = childrenByParent.get(ex.id) ?? []
    items.push({
      kind: ("__extra__" + ex.id) as StandardPageKind,
      label: ex.label,
      href: ex.url,
      active: false,
      children: kids.length > 0 ? kids.map((k) => ({ label: k.label, href: k.url })) : undefined,
    } as unknown as TopItem)
  }
  // ITEM 4.4 — Override register/signin labels per-locale via the
  // text-overrides table when set; falls back to the row's label
  // (which itself defaults to "Register Now" / "Sign In").
  const railItems = rail.map((p) => {
    let label = p.label
    if (p.kind === "register") label = getString("nav.register", currentLocale, textOverrides) || p.label
    if (p.kind === "signin")   label = getString("nav.signin",   currentLocale, textOverrides) || p.label
    return {
      kind: p.kind as StandardPageKind,
      label,
      href: withLocale(publicPageHref(eventSlug, { kind: p.kind as StandardPageKind, slug: p.slug }), locale),
      active: p.kind === currentKind,
    }
  })

  const showLangSwitcher = locales.length > 1

  return (
    <nav
      aria-label="Event pages"
      className="sticky top-0 z-30 bg-white border-b border-[#1a1a2e]/[0.08] shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4 sm:gap-6">
        {/* A2 + ITEM 1.3: left-edge event logo (when events.logo_url
            is set). 40px tall — matches the Zoho Backstage left-of-nav
            reference. When the logo is unset, render a small wordmark
            of the event title in the LF brand voice so the nav still
            has a clear left anchor. */}
        {logoSrc ? (
          <Link
            href={withLocale(`/events/${eventSlug}`, locale)}
            className="shrink-0 flex items-center"
            aria-label={`${eventTitle || "Event"} home`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt={eventTitle ? `${eventTitle} logo` : "Event logo"}
              className="h-10 w-auto max-w-[180px] object-contain"
            />
          </Link>
        ) : eventTitle ? (
          <Link
            href={withLocale(`/events/${eventSlug}`, locale)}
            className="shrink-0 hidden md:inline-flex items-center text-[12px] font-bold uppercase tracking-[0.18em] text-[#1a1a2e] hover:opacity-80 max-w-[200px] truncate"
            aria-label={`${eventTitle} home`}
            title={eventTitle}
          >
            {eventTitle}
          </Link>
        ) : null}
        {/* Desktop main tabs */}
        <ul className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
          {items.map((it) => {
            const cls = `inline-flex items-center px-3.5 h-14 -mb-px text-[12px] font-bold uppercase tracking-[0.05em] border-b-2 transition-colors whitespace-nowrap ${
              it.active
                ? "border-[var(--lf-primary,#e7ab1c)] text-[#1a1a2e]"
                : "border-transparent text-[#1a1a2e]/65 hover:text-[#1a1a2e] hover:border-[#1a1a2e]/15"
            }`
            if (it.children && it.children.length > 0) {
              return (
                <li key={it.kind} className="shrink-0 relative group">
                  <Link href={it.href} aria-current={it.active ? "page" : undefined} className={`${cls} gap-1`}>
                    {it.label}
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden className="opacity-60">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <ul className="absolute left-0 top-full hidden group-hover:block group-focus-within:block min-w-[220px] bg-white border border-[#1a1a2e]/10 shadow-lg z-50">
                    {it.children.map((c) => (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          className="block px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#1a1a2e]/80 hover:bg-[#1a1a2e]/[0.04] hover:text-[#1a1a2e]"
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            }
            return (
              <li key={it.kind} className="shrink-0">
                <Link href={it.href} aria-current={it.active ? "page" : undefined} className={cls}>
                  {it.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Desktop pinned-right slot (Register + Sign In + lang switcher) */}
        <div className="hidden md:flex items-center gap-3 shrink-0 pl-4 border-l border-[#1a1a2e]/[0.08]">
          {showLangSwitcher && (
            <LanguageSwitcher
              eventSlug={eventSlug}
              currentLocale={locale ?? defaultLocale}
              available={locales}
            />
          )}
          {railItems.map((it) =>
            it.kind === "register" ? (
              <Link
                key={it.kind}
                href={it.href}
                data-ab-convert
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

        {/* Mobile menu */}
        <div className="md:hidden flex-1">
          <EventTopNavMobile items={[...items, ...railItems]} />
        </div>
      </div>
    </nav>
  )
}
