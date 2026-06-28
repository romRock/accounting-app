import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').origin;
  } catch {
    return 'http://localhost:3001';
  }
})();

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      `connect-src 'self' ${apiOrigin}`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: frontendRoot,
  webpack: (config) => config,
  reactStrictMode: false,
  async rewrites() {
    return [
      { source: '/favicon.ico', destination: '/images/favicon_io/favicon.ico' },
    ];
  },
  async headers() {
    const routes: { source: string; headers: { key: string; value: string }[] }[] = [
      { source: '/:path*', headers: securityHeaders },
    ];
    if (process.env.NODE_ENV === 'development') {
      routes.push({
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      });
    }
    return routes;
  },
};

export default nextConfig;
