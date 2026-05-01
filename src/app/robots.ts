import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/og/name', '/api/og/profile'],
      disallow: '/api/',
    },
    sitemap: 'https://grails.app/sitemap.xml',
  }
}
