import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.einpresswire.com" },
      { protocol: "https", hostname: "thb.tildacdn.one" },
      { protocol: "https", hostname: "static.tildacdn.one" },
      { protocol: "https", hostname: "staticprintenglish.theprint.in" },
      { protocol: "https", hostname: "pnn.digital" },
      { protocol: "https", hostname: "st1.latestly.com" },
      { protocol: "https", hostname: "media.telanganatoday.com" },
    ],
  },
};

export default nextConfig;
