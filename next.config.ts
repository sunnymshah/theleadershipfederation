import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 *
 * - Strict-Transport-Security: forces HTTPS for 2 years (Vercel handles TLS).
 * - X-Frame-Options: blocks clickjacking (admin must never render in an iframe).
 * - X-Content-Type-Options: stops MIME sniffing attacks.
 * - Referrer-Policy: trims referrer on cross-origin navigations so admin URLs don't leak.
 * - Permissions-Policy: disables powerful browser APIs we don't use.
 * - Cross-Origin-Opener-Policy: isolates admin tabs from attacker-controlled windows.
 * - Content-Security-Policy: whitelists allowed sources for scripts, styles, images,
 *   fonts, frames, and connections. This is the big hammer against XSS — even if
 *   an attacker gets HTML injected somewhere, inline <script> without a nonce and
 *   cross-origin connections to unlisted domains will be blocked by the browser.
 *
 * If you add a new 3rd-party service (analytics, Razorpay widget, etc.) you'll
 * need to add its origin to the relevant directive here.
 */
const CSP_DIRECTIVES = [
  "default-src 'self'",
  // 'unsafe-inline' + 'unsafe-eval' are unfortunately still needed for Next.js's
  // inline bootstrap scripts and RSC JSON payloads. Can tighten later with nonces.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.vercel-insights.com",
  "style-src 'self' 'unsafe-inline'",
  // user-uploaded images / external news outlet logos are at arbitrary https URLs
  "img-src 'self' https: data: blob:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://lumberjack-cx.razorpay.com",
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.youtube.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
  "base-uri 'self'",
].join("; ")

const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security",          value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options",                    value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",             value: "nosniff" },
  { key: "Referrer-Policy",                    value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",                 value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy",         value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy",       value: "same-site" },
  { key: "Origin-Agent-Cluster",               value: "?1" },
  { key: "X-Permitted-Cross-Domain-Policies",  value: "none" },
  { key: "X-DNS-Prefetch-Control",             value: "on" },
  { key: "Content-Security-Policy",            value: CSP_DIRECTIVES },
  // Strip server identification — an attacker who knows we're on
  // Next.js 16 can look up matching CVEs. We can't remove the
  // `server` header (Vercel sets that edge-side) but we can stop
  // advertising our framework version.
  { key: "X-Powered-By",                       value: "" },
];

const nextConfig: NextConfig = {
  // Strip Next.js's default x-powered-by header so we don't advertise
  // our framework version to casual scanners.
  poweredByHeader: false,
  // Cap server-action payloads at 2 MB. Defeats jumbo-body DoS.
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "img.einpresswire.com", pathname: "/**" },
      { protocol: "https", hostname: "thb.tildacdn.one", pathname: "/**" },
      { protocol: "https", hostname: "static.tildacdn.one", pathname: "/**" },
      { protocol: "https", hostname: "staticprintenglish.theprint.in", pathname: "/**" },
      { protocol: "https", hostname: "pnn.digital", pathname: "/**" },
      { protocol: "https", hostname: "st1.latestly.com", pathname: "/**" },
      { protocol: "https", hostname: "media.telanganatoday.com", pathname: "/**" },
      { protocol: "https", hostname: "lfaoenulcskvhgckylsh.supabase.co", pathname: "/**" },
    ],
    minimumCacheTTL: 3600,
    formats: ['image/webp', 'image/avif'],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // Admin pages must NEVER be indexed or cached by shared proxies.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
    ]
  },
};

export default nextConfig;
