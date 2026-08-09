/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  eslint: {
    // Vercel builds should not fail on lint-only findings.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
