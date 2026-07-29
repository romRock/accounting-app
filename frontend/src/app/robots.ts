import type { MetadataRoute } from 'next';

/**
 * App Router metadata route → /robots.txt
 * Absolute site URL for Search Console / AdSense.
 */
const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || 'https://client-credit-tracker.in'
).replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
