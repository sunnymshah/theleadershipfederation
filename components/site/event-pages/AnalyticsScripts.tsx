/**
 * Renders provider scripts based on builder_settings.analytics.
 * Honours builder_settings.privacy.honourDNT — when set, all scripts
 * skip if navigator.doNotTrack === '1'. Server component injects
 * <Script> tags via next/script for proper hydration ordering.
 */

import Script from "next/script"
import type { AnalyticsSettings, PrivacySettings } from "@/lib/microsite-settings"

export function AnalyticsScripts({
  analytics,
  privacy,
}: {
  analytics?: AnalyticsSettings
  privacy?: PrivacySettings
}) {
  const a = analytics ?? {}
  const honourDNT = privacy?.honourDNT !== false

  // DNT guard helper — every inline init checks this before firing.
  const dntGuard = honourDNT
    ? "if (navigator.doNotTrack==='1' || window.doNotTrack==='1' || navigator.msDoNotTrack==='1') return;"
    : ""

  return (
    <>
      {a.gtm ? (
        <>
          <Script id="gtm-init" strategy="afterInteractive">{`
            (function(){${dntGuard}
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${a.gtm}');
            })();
          `}</Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${a.gtm}`}
              height="0" width="0" style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      ) : null}

      {a.ga4 ? (
        <>
          <Script
            id="ga4-loader"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${a.ga4}`}
          />
          <Script id="ga4-init" strategy="afterInteractive">{`
            (function(){${dntGuard}
              window.dataLayer=window.dataLayer||[];
              function gtag(){dataLayer.push(arguments);}
              gtag('js',new Date());
              gtag('config','${a.ga4}');
            })();
          `}</Script>
        </>
      ) : null}

      {a.plausible ? (
        <Script
          id="plausible-loader"
          strategy="afterInteractive"
          defer
          data-domain={a.plausible}
          src="https://plausible.io/js/script.js"
        />
      ) : null}

      {a.metaPixel ? (
        <Script id="meta-pixel-init" strategy="afterInteractive">{`
          (function(){${dntGuard}
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${a.metaPixel}');fbq('track','PageView');
          })();
        `}</Script>
      ) : null}

      {a.linkedin ? (
        <Script id="li-insight-init" strategy="afterInteractive">{`
          (function(){${dntGuard}
            _linkedin_partner_id = '${a.linkedin}';
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(_linkedin_partner_id);
            (function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]};var s=document.getElementsByTagName('script')[0];var b=document.createElement('script');b.type='text/javascript';b.async=true;b.src='https://snap.licdn.com/li.lms-analytics/insight.min.js';s.parentNode.insertBefore(b,s);})(window.lintrk);
          })();
        `}</Script>
      ) : null}

      {a.hotjar ? (
        <Script id="hotjar-init" strategy="afterInteractive">{`
          (function(){${dntGuard}
            (function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${JSON.stringify(a.hotjar)},hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-',' .js?sv=');
          })();
        `}</Script>
      ) : null}
    </>
  )
}
