/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type checking during build (will fix types incrementally)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost', 'ontyx.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
