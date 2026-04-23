/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use webpack instead of Turbopack for better Tailwind CSS compatibility
  webpack: (config, { isServer }) => {
    return config;
  },
  // Suppress hydration mismatch warnings from browser extensions
  reactStrictMode: false,
};

module.exports = nextConfig;
