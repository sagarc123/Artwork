import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/account', '/cart', '/checkout'] },
    host: site.url,
    // ponytail: sitemap.xml arrives with real content pages (milestone 15).
  }
}
