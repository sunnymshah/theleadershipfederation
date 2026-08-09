import type { MetadataRoute } from 'next';

import { SITE, SITEMAP_ROUTES } from '@/config/site';

/**
 * Generated from config/site.ts — adding a nav entry adds it here automatically.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return SITEMAP_ROUTES.map((route) => ({
    url: `${SITE.url}${route === '/' ? '' : route}`,
    lastModified,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.8,
  }));
}
