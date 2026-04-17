import type { MetadataRoute } from "next"

/**
 * robots.txt — tells crawlers what NOT to index.
 *
 * Admin paths + API + sponsor portal are already protected by auth,
 * but we also don't want them showing up in Google results or
 * archive.org snapshots.
 *
 * The allow: ["/"] pairs with a narrow list of disallowed prefixes;
 * everything else on the public site is indexable.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://theleadershipfederation.vercel.app")

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/sponsor-portal",
          "/sponsor-portal/",
          "/my-tickets",
          "/feedback/",
          "/register",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
