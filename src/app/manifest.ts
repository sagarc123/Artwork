import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

// Makes the site installable ("Add to Home Screen") so it opens full screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.brandName,
    short_name: site.artistName.split(' ')[0],
    description: 'Rangoli, drawings, paintings, custom portraits and art courses.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FAF6EF',
    theme_color: '#FAF6EF',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
