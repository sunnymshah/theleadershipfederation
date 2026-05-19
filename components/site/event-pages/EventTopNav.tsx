/**
 * ── EventTopNav — liquid-glass event navigation (server component) ───
 *
 * Matches the main site Navbar: a floating, translucent liquid-glass
 * pill with the logo on the left.
 *
 * Link model:
 *   - HARDCODED:  "Home" (event home) + "Back to LF" (main TLF site).
 *   - CONFIGURABLE: every other link comes from events.nav_extra_links,
 *     editable in the page builder. Nothing else auto-appears.
 *   - "Register" stays pinned right as the event's primary CTA.
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

  // Event metadata — logo, title, custom nav links, locales, register style.
  let locales: string[] = []
  let defaultLocale = "en"
  let logoUrl: string | null = null
  let eventTitle = ""
  let textOverrides: TextOverrides = {}
  type NX = { id: string; label: string; url: string; parent_id?: string | null; sort_order: number; visible: boolean }
  let extraLinks: NX[] = []
  type NavStyle = "primary" | "secondary" | "outline" | "text"
  let registerStyle: NavStyle = "primary"
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("events")
      .select("locales, default_locale, logo_url, title, nav_extra_links, text_overrides, builder_settings, locales_hidden")
      .eq("id", eventId)
      .maybeSingle()
    if (data) {
      const hidden = ((data as { locales_hidden?: unknown }).locales_hidden ?? []) as string[]
      const hiddenSet = new Set(Array.isArray(hidden) ? hidden : [])
      locales = ((data.locales as string[] | null) ?? [])
        .filter(Boolean)
        .filter((lc) => !hiddenSet.has(lc))
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
      const bs = (data as { builder_settings?: unknown }).builder_settings
      const nav = bs && typeof bs === "object" && !Array.isArray(bs)
        ? (((bs as Record<string, unknown>).navigation ?? {}) as Record<string, unknown>)
        : {}
      const r = nav.registerStyle as NavStyle | undefined
      if (r === "primary" || r === "secondary" || r === "outline" || r === "text") registerStyle = r
    }
  } catch {}
  const currentLocale = locale ?? defaultLocale
  // Logo: the event's own logo when set, else the TLF wordmark — so a
  // real logo image always shows (never a bare text fallback).
  const logoSrc = logoUrl ? parseFocalPoint(logoUrl).src : "/logo-tlf.png"

  const eventHome = withLocale(`/events/${eventSlug}`, locale)

  // CONFIGURABLE links — top-level custom links from nav_extra_links,
  // edited in the page builder. Nested children render as a dropdown.
  const topExtras = extraLinks.filter((x) => !x.parent_id).sort((a, b) => a.sort_order - b.sort_order)
  const childrenByParent = new Map<string, NX[]>()
  for (const e of extraLinks) {
    if (!e.parent_id) continue
    const arr = childrenByParent.get(e.parent_id) ?? []
    arr.push(e); childrenByParent.set(e.parent_id, arr)
  }

  // Main tabs = hardcoded Home + the configurable custom links.
  type NavItem = {
    kind: string
    label: string
    href: string
    active: boolean
    children?: Array<{ label: string; href: string }>
  }
  const items: NavItem[] = [
    {
      kind: "home",
      label: "Home",
      href: eventHome,
      active: currentKind === "home",
      children: undefined,
    },
  ]
  for (const ex of topExtras) {
    const kids = childrenByParent.get(ex.id) ?? []
    items.push({
      kind: "__extra__" + ex.id,
      label: ex.label,
      href: ex.url,
      active: false,
      children: kids.length > 0 ? kids.map((k) => ({ label: k.label, href: k.url })) : undefined,
    })
  }

  // Register — the event's primary CTA, pinned right.
  const registerRow = pages.find((p) => p.kind === "register" && RAIL_PAGE_KINDS.has(p.kind as StandardPageKind))
  const registerItem = registerRow
    ? {
        kind: "register",
        label: getString("nav.register", currentLocale, textOverrides) || registerRow.label,
        href: withLocale(publicPageHref(eventSlug, { kind: "register", slug: registerRow.slug }), locale),
        active: false,
      }
    : {
        kind: "register",
        label: getString("nav.register", currentLocale, textOverrides) || "Register",
        href: withLocale(`/events/${eventSlug}/tickets`, locale),
        active: false,
      }

  const showLangSwitcher = locales.length > 1

  const registerCls =
    registerStyle === "secondary"
      ? "inline-flex items-center px-4 h-9 rounded-full text-[12.5px] font-semibold bg-[#1a1a2e] text-white hover:bg-[#2a2a4e] transition-colors"
    : registerStyle === "outline"
      ? "inline-flex items-center px-4 h-9 rounded-full text-[12.5px] font-semibold border border-[#1a1a2e]/25 text-[#1a1a2e] hover:bg-white/60 transition-colors"
    : registerStyle === "text"
      ? "inline-flex items-center px-2 h-9 text-[12.5px] font-semibold text-[#1a1a2e]/75 hover:text-[#1a1a2e] transition-colors"
      : "inline-flex items-center px-4 h-9 rounded-full text-[12.5px] font-semibold bg-[#0071e3] text-white hover:bg-[#0077ed] transition-colors"

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-5 lg:px-6 pt-3 sm:pt-4">
      <nav className="lf-liquid-nav max-w-[1240px] mx-auto rounded-[20px] px-3.5 sm:px-5 lg:px-6">
        <div className="flex items-center h-[56px] lg:h-[60px] gap-3">
          {/* Logo — left */}
          <Link href={eventHome} className="shrink-0 flex items-center" aria-label={`${eventTitle || "Event"} home`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt={eventTitle ? `${eventTitle} logo` : "The Leadership Federation"}
              className="h-[26px] lg:h-[30px] w-auto max-w-[190px] object-contain"
            />
          </Link>

          {/* Desktop nav — centered text links */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className="flex items-center gap-0.5">
              {items.map((it) => {
                const base =
                  "relative px-3 py-1.5 text-[13.5px] tracking-[-0.01em] whitespace-nowrap rounded-full transition-all duration-200"
                const tone = it.active
                  ? "text-[#1a1a2e] font-semibold"
                  : "text-[#1a1a2e]/65 hover:text-[#1a1a2e] font-medium hover:bg-white/50"
                if (it.children && it.children.length > 0) {
                  return (
                    <div key={it.kind} className="relative group">
                      <Link href={it.href} className={`${base} ${tone} inline-flex items-center gap-1`}>
                        {it.label}
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden className="opacity-55">
                          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                      <div className="absolute left-0 top-full pt-2 hidden group-hover:block group-focus-within:block">
                        <div className="lf-glass-strong rounded-2xl min-w-[210px] p-1.5">
                          {it.children.map((c) => (
                            <Link
                              key={c.href}
                              href={c.href}
                              className="block px-3 py-2 rounded-xl text-[13px] font-medium text-[#1a1a2e]/75 hover:text-[#1a1a2e] hover:bg-white/60 transition-colors"
                            >
                              {c.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                }
                return (
                  <Link key={it.kind} href={it.href} aria-current={it.active ? "page" : undefined} className={`${base} ${tone}`}>
                    {it.label}
                    {it.active && (
                      <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-[2.5px] w-5 rounded-full bg-[#0071e3]" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right — Register CTA + hardcoded "Back to LF" */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0 ml-auto">
            {showLangSwitcher && (
              <LanguageSwitcher
                eventSlug={eventSlug}
                currentLocale={locale ?? defaultLocale}
                available={locales}
              />
            )}
            <Link href={registerItem.href} data-ab-convert="" className={registerCls}>
              {registerItem.label}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1a1a2e]/55 hover:text-[#1a1a2e] transition-colors pl-3 border-l border-[#1a1a2e]/15"
              aria-label="Back to The Leadership Federation"
              title="Back to the main TLF site"
            >
              ← Back to LF
            </Link>
          </div>

          {/* Mobile */}
          <div className="lg:hidden flex-1">
            <EventTopNavMobile
              items={[
                ...items,
                registerItem,
                { kind: "__back__", label: "← Back to LF", href: "/", active: false },
              ]}
            />
          </div>
        </div>
      </nav>
    </header>
  )
}
