/**
 * ── EventSiteScripts ─────────────────────────────────────────────────
 *
 * Injects analytics + admin-provided custom code on the public event
 * page. Wired from app/(event-page)/events/[slug]/page.tsx — reads
 * settings.analytics and settings.code from events.builder_settings
 * (edited in the builder's Site Settings panel).
 *
 * Uses next/script with strategy="afterInteractive" so the scripts
 * don't block render. The CSP is extended in next.config.ts to permit
 * the GA / GTM / Meta Pixel hosts.
 */

import Script from "next/script"
import type { AnalyticsSettings, CodeSettings } from "@/lib/microsite-settings"

/** Strip a leading `<script>` and trailing `</script>` tag if present so
 *  admins can paste full snippets from a vendor's docs and still have
 *  them run as a next/script inline body. */
function stripScriptWrapper(s: string): string {
  return s
    .replace(/^\s*<script[^>]*>/i, "")
    .replace(/<\/script>\s*$/i, "")
    .trim()
}

export function EventSiteScripts({
  analytics,
  code,
}: {
  analytics?: AnalyticsSettings
  code?: CodeSettings
}) {
  const ga4 = analytics?.ga4?.trim() || ""
  const gtm = analytics?.gtm?.trim() || ""
  const pixel = analytics?.metaPixel?.trim() || ""
  const headCode = code?.headCode ? stripScriptWrapper(code.headCode) : ""
  const bodyCode = code?.bodyCode ? stripScriptWrapper(code.bodyCode) : ""

  // Single-quote escapes so admin IDs can't break out of the string literal.
  const safe = (s: string) => s.replace(/'/g, "\\'")

  return (
    <>
      {/* Google Analytics 4 */}
      {ga4 && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4)}`}
            strategy="afterInteractive"
          />
          <Script id="lf-ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${safe(ga4)}');`}
          </Script>
        </>
      )}

      {/* Google Tag Manager */}
      {gtm && (
        <Script id="lf-gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${safe(gtm)}');`}
        </Script>
      )}

      {/* Meta (Facebook) Pixel */}
      {pixel && (
        <Script id="lf-meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod? n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${safe(pixel)}');
fbq('track', 'PageView');`}
        </Script>
      )}

      {/* Admin head code — runs early (afterInteractive). */}
      {headCode && (
        <Script id="lf-head-code" strategy="afterInteractive">
          {headCode}
        </Script>
      )}

      {/* Admin body code — runs lazily (after the main page is idle). */}
      {bodyCode && (
        <Script id="lf-body-code" strategy="lazyOnload">
          {bodyCode}
        </Script>
      )}
    </>
  )
}
