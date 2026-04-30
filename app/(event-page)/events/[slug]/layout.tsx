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
import { getPublicBuilderNav } from "@/app/actions/eventBuilderActions"
import { EventPageNav } from "@/components/site/EventPageNav"
import { AnalyticsScripts } from "@/components/site/event-pages/AnalyticsScripts"
import { CookieBanner } from "@/components/site/event-pages/CookieBanner"
import { CustomBodyCode } from "@/components/site/event-pages/CustomCodeInject"
import { PrivacyFooter } from "@/components/site/event-pages/PrivacyFooter"
import { MicrositeVisibilityGate } from "@/components/site/event-pages/MicrositeVisibilityGate"
import { NotificationBanner } from "@/components/site/event-pages/NotificationBanner"
import { getMicrositeSettings } from "@/lib/microsite-settings"

export default async function EventSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await getEvent(slug)

  const pages = event ? await getPublicBuilderNav(event.id) : []
  const settings = event ? await getMicrositeSettings(event.id) : {}

  const safeSlug = event?.slug?.trim() ?? null
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
      <EventPageNav
        eventSlug={safeSlug}
        eventTitle={event?.title ?? null}
        pages={pages}
      />
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
      {showCookieBanner && event ? (
        <CookieBanner
          eventId={event.id}
          copy={cookies.copy ?? "We use cookies to improve your experience."}
          policyUrl={cookies.policyUrl}
          acceptLabel={cookies.acceptLabel ?? "Accept"}
        />
      ) : null}
    </div>
  )
}
