import type { NextConfig } from "next";

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
};

export default nextConfig;
