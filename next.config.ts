import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Security headers untuk semua response
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection',           value: '1; mode=block' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/icons/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/banners/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ]
  },

  // Redirect /home ke /
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
    ]
  },

  // Domain gambar yang diizinkan
  images: {
    remotePatterns: [
      // Google OAuth avatar
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      // Untuk nanti jika pakai CDN
      { protocol: 'https', hostname: 'threetop.id' },
    ],
  },
}

export default nextConfig
