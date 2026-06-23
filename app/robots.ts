import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.AUTH_URL ?? 'https://threetop.id'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/terms', '/privacy', '/auth/login', '/auth/register'],
        disallow: ['/dashboard', '/admin', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
