/**
 * Reads from `events.builder_settings` JSONB and exposes typed accessors
 * for every public-facing surface (SEO metadata, head/body code, cookie
 * banner, analytics scripts, privacy notice, hreflang, JSON-LD, etc).
 *
 * Saved by `saveBuilderSettingsGroup` from the Microsite Settings panel.
 * Read on every public event-page render — see app/(event-page)/.
 */

import type { Metadata } from "next"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export type GeneralSettings = {
  name?: string
  tagline?: string
  timezone?: string
}
export type SeoSettings = {
  title?: string
  description?: string
  ogImage?: string
  canonical?: string
  allowIndex?: boolean
}
export type DomainSettings = {
  domain?: string
  status?: "pending" | "verified" | "error"
  verified_at?: string
  forceHttps?: boolean
}
export type PrivacySettings = {
  notice?: string
  retentionDays?: string
  honourDNT?: boolean
  /** Public-page visibility gate.
   *   public      — anyone can view (default)
   *   coming_soon — show a holding page with countdown
   *   password    — require a shared password (cookie-persisted) */
  visibility?: "public" | "coming_soon" | "password"
  /** Plain-text password for "password" mode. NOT a security boundary —
   *  this is "soft" gating for pre-launch teasers. The cookie just
   *  records that the visitor entered SOMETHING matching this value. */
  password?: string
  /** Optional copy shown above the password input or on the holding page. */
  visibilityMessage?: string
}
export type CookieSettings = {
  show?: boolean
  copy?: string
  policyUrl?: string
  acceptLabel?: string
}
export type CodeSettings = {
  headCode?: string
  bodyCode?: string
}
export type AnalyticsSettings = {
  ga4?: string
  gtm?: string
  plausible?: string
  metaPixel?: string
  linkedin?: string
  hotjar?: string
}
export type WebhookEndpoint = {
  url: string
  event: string
  auth?: string
  secret?: string
}
export type WebhookSettings = {
  endpoints?: WebhookEndpoint[]
}
export type LanguageSettings = {
  enabled?: boolean
  default?: string
  locales?: string[]
}

/* ── ITEM 10 add-ons ────────────────────────────────────────────── */
export type GeneralSocialHandles = {
  twitter?: string; linkedin?: string; instagram?: string;
  facebook?: string; youtube?: string; website?: string;
}
export type NotificationSettings = {
  enabled?: boolean
  message?: string
  link?: string
  linkLabel?: string
  dismissable?: boolean
  displayUntil?: string
}
export type TimeFormatSettings = {
  dateFormat?: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD"
  timeFormat?: "12h" | "24h"
  showTimezone?: boolean
}
export type MapDisplaySettings = {
  provider?: "google" | "openstreetmap"
  defaultZoom?: number | string
  showDirectionsButton?: boolean
}
export type SearchVisSettings = {
  indexable?: boolean
  customRobotsRules?: string
  sitemapEnabled?: boolean
}

export type MicrositeSettings = {
  general?: GeneralSettings & { socialHandles?: GeneralSocialHandles }
  seo?: SeoSettings
  domain?: DomainSettings
  privacy?: PrivacySettings
  cookies?: CookieSettings
  code?: CodeSettings
  analytics?: AnalyticsSettings
  webhooks?: WebhookSettings
  languages?: LanguageSettings
  // ITEM 10
  notification?: NotificationSettings
  timeFormat?: TimeFormatSettings
  map?: MapDisplaySettings
  searchVis?: SearchVisSettings
}

const EMPTY: MicrositeSettings = {}

/** Read settings from public-side (RLS-bound, anon). */
export async function getMicrositeSettings(eventId: string): Promise<MicrositeSettings> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data } = await supabase
      .from("events")
      .select("builder_settings")
      .eq("id", eventId)
      .maybeSingle()
    return ((data?.builder_settings ?? {}) as MicrositeSettings) || EMPTY
  } catch {
    return EMPTY
  }
}

/** Build SEO metadata respecting per-microsite overrides. */
export function buildSeoMetadata({
  fallback,
  settings,
}: {
  fallback: { title: string; description: string; ogImage?: string | null }
  settings: MicrositeSettings
}): Metadata {
  const seo = settings.seo ?? {}
  const title = (seo.title?.trim() || settings.general?.name?.trim() || fallback.title).slice(0, 70)
  const description = (seo.description?.trim() || fallback.description).slice(0, 160)
  const ogImage = seo.ogImage || fallback.ogImage || undefined
  const canonical = seo.canonical || undefined
  const allowIndex = seo.allowIndex !== false

  const meta: Metadata = {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: allowIndex
      ? { index: true, follow: true }
      : { index: false, follow: false, googleBot: { index: false, follow: false } },
  }
  return meta
}
