import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/cms-api', ...['', '/mr', '/hi'].flatMap((l) => ['/account', '/cart', '/checkout', '/order'].map((p) => l + p))],
    },
    host: new URL(site.url).host,
    // ponytail: sitemap.xml arrives with real content pages (milestone 15).
  }
}
