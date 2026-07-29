import type { MetadataRoute } from 'next';

/**
 * App Router metadata route → /sitemap.xml
 * Public marketing / auth / legal URLs only.
 */
const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || 'https://client-credit-tracker.in'
).replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
