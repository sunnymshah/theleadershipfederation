/**
 * ── /events/[slug] layout ──────────────────────────────────────────────
 *
 * Renders the minimal per-event chrome around every route under
 * /events/[slug]/*. Reads `events.builder_settings` so analytics scripts,
 * cookie banner, custom <head>/<body> code and the privacy notice
 * all flow from the Microsite Settings panel onto every public page.
 */

import Script from "next/script"
import { getEvent } from "@/lib/get-event"
// PART E1 — legacy EventPageNav (the outer chrome that produced the
// "double nav row" complaint on /events/mumbai) was mounted here. The
// Zoho-style EventTopNav rendered by StandardPageRender / the slug
// page's legacy fallback is the single, authoritative public nav. The
// "← TLF" escape link the legacy nav supplied is now reachable from
// the EventTopNav's left logo (clicks through to /events/[slug]) and
// from the Footer "Powered by The Leadership Federation" line.
// getPublicBuilderNav was only consumed by the removed mount; dropped
// from this layout. The standard-pages nav fetches its own page list
// inside EventTopNav.
import { AnalyticsScripts } from "@/components/site/event-pages/AnalyticsScripts"
import { CookieBanner } from "@/components/site/event-pages/CookieBanner"
import { CustomBodyCode } from "@/components/site/event-pages/CustomCodeInject"
import { PrivacyFooter } from "@/components/site/event-pages/PrivacyFooter"
import { MicrositeVisibilityGate } from "@/components/site/event-pages/MicrositeVisibilityGate"
import { NotificationBanner } from "@/components/site/event-pages/NotificationBanner"
import { getMicrositeSettings } from "@/lib/microsite-settings"
import { getString, type TextOverrides } from "@/lib/i18n"
// (getPublicBuilderNav import removed alongside the legacy nav mount.)

export default async function EventSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await getEvent(slug)

  const settings = event ? await getMicrositeSettings(event.id) : {}

  const cookies = settings.cookies ?? {}
  const showCookieBanner = !!event && cookies.show !== false
  const headCode = settings.code?.headCode ?? ""

  // ITEM 10.1 — notification banner
  const notif = settings.notification
  const notifEnabled = !!notif?.enabled && !!(notif?.message ?? "").trim()

  // ITEM 10.4 — search visibility / robots
  const searchVis = settings.searchVis ?? {}
  const noindex = searchVis.indexable === false

  // ITEM 10.6 — favicon (anon-readable column on events)
  const faviconUrl = (event as { favicon_url?: string | null } | null)?.favicon_url ?? null

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ITEM 10.6 — per-event favicon override. Next App Router hoists
          link/meta tags from any component into <head>. */}
      {faviconUrl && <link rel="icon" href={faviconUrl} />}
      {/* ITEM 10.4 — robots noindex when search visibility is off. */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {searchVis.customRobotsRules && (
        <Script
          id={`event-robots-${event?.id ?? "x"}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: `/* custom robots rules — embedded for reference only:\n${searchVis.customRobotsRules}\n*/` }}
        />
      )}
      {/* ITEM 10.1 — sticky notification banner above the nav. */}
      {event && notifEnabled && (
        <NotificationBanner
          eventId={event.id}
          message={notif!.message!}
          link={notif!.link}
          linkLabel={notif!.linkLabel}
          dismissable={notif!.dismissable !== false}
          displayUntil={notif!.displayUntil}
        />
      )}
      {/* PART E1 — legacy EventPageNav removed (was the outer chrome
          row with "Home" pill + truncated title + "TLF site" link).
          EventTopNav (the Zoho-style nav) is now the only public nav;
          it's mounted by either StandardPageRender or the slug page's
          legacy fallback. */}
      {/* Admin-controlled <head> code. Rendered as an afterInteractive
          script so it lands in the document but doesn't block paint. */}
      {headCode ? (
        <Script
          id={`event-head-code-${event?.id ?? "x"}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: headCode }}
        />
      ) : null}
      {event ? (
        <AnalyticsScripts analytics={settings.analytics} privacy={settings.privacy} />
      ) : null}
      <main className="flex-1">
        {event && (settings.privacy?.visibility ?? "public") !== "public" ? (
          <MicrositeVisibilityGate
            eventId={event.id}
            eventTitle={event.title}
            eventStartDate={event.start_date ?? null}
            visibility={settings.privacy?.visibility}
            password={settings.privacy?.password}
            message={settings.privacy?.visibilityMessage}
          >
            {children}
          </MicrositeVisibilityGate>
        ) : (
          children
        )}
      </main>
      <PrivacyFooter notice={settings.privacy?.notice} />
      <CustomBodyCode code={settings.code?.bodyCode} />
      {showCookieBanner && event ? (() => {
        // ITEM 4.4 — text-overrides resolve over the cookies group
        // settings: explicit cookies.copy / acceptLabel still win,
        // then per-locale text override, then the English default.
        const tov = ((event as { text_overrides?: unknown }).text_overrides
          ?? {}) as TextOverrides
        const locale = (event as { default_locale?: string | null }).default_locale ?? "en"
        const copy   = cookies.copy        ?? getString("cookie.message", locale, tov)
        const accept = cookies.acceptLabel ?? getString("cookie.accept",  locale, tov)
        const manage = getString("cookie.manage", locale, tov)
        return (
          <CookieBanner
            eventId={event.id}
            copy={copy}
            policyUrl={cookies.policyUrl}
            acceptLabel={accept}
            manageLabel={manage}
          />
        )
      })() : null}
    </div>
  )
}
