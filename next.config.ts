import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 * - HSTS forces HTTPS for 2 years (Vercel handles TLS).
 * - X-Frame-Options blocks clickjacking (the admin console must never render in an iframe).
 * - X-Content-Type-Options stops MIME sniffing attacks.
 * - Referrer-Policy trims the referrer on cross-origin navigations so admin URLs don't leak.
 * - Permissions-Policy disables powerful browser APIs we don't use.
 * - Cross-Origin-Opener-Policy isolates admin tabs from attacker-controlled windows.
 */
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
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
