import path from 'node:path'
import { refreshOnChange } from '../hooks'
import type { CollectionConfig } from 'payload'
import { anyone, canEditContent, isOwner } from '../access'

/** Photos for products, artworks, courses and pages. */
export const Media: CollectionConfig = {
  slug: 'media',
  hooks: refreshOnChange('media'),
  admin: { group: 'Gallery & Festivals', description: 'Photos for paintings, the gallery and festivals.' },
  access: { read: anyone, create: canEditContent, update: canEditContent, delete: isOwner },
  upload: {
    // ponytail: local disk for development; production moves to cloud storage (Supabase/S3) before launch.
    staticDir: path.resolve(process.cwd(), 'media'),
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    focalPoint: true,
    adminThumbnail: 'thumb',
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [
      { name: 'thumb', width: 400 },
      { name: 'card', width: 800 },
      { name: 'large', width: 1600 },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'What the photo shows',
      type: 'text',
      // Optional: left empty, it becomes the painting's title when the photo is used on a product or gallery piece.
      admin: { description: 'Optional. Describe the photo as you would to a friend on the phone, e.g. "Peacock rangoli in blue and orange, dot style".' },
    },
  ],
}
