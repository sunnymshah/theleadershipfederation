import type { MetadataRoute } from 'next';

import { SITE } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      /* The admin area is gated, but keep it out of the index regardless. */
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
