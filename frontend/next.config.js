/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Build sırasında TS hataları olsa bile devam etmesini sağlar
    ignoreBuildErrors: true,
  },
  eslint: {
    // Build sırasında ESLint hatalarını görmezden gelir
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  },
}

module.exports = nextConfig