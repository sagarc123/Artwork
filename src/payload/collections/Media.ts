import path from 'node:path'
import { refreshOnChange } from '../hooks'
import type { CollectionConfig } from 'payload'
import { anyone, canEditContent, hideFromHelpers, isOwner } from '../access'

/** Photos for products, artworks, courses and pages, plus the making-of video (Website details). */
export const Media: CollectionConfig = {
  slug: 'media',
  hooks: refreshOnChange('media'),
  labels: { singular: 'Photo', plural: 'Photo library' },
  admin: {
    group: 'Gallery & Festivals',
    description: 'Every photo you have uploaded. Usually you add photos straight from a painting; come here to fix a description.',
    defaultColumns: ['filename', 'alt', 'createdAt'],
    listSearchableFields: ['alt', 'filename'],
    hidden: hideFromHelpers,
  },
  access: { read: anyone, create: canEditContent, update: canEditContent, delete: isOwner },
  upload: {
    // ponytail: local disk for development; production moves to cloud storage (Supabase/S3) before launch.
    staticDir: path.resolve(process.cwd(), 'media'),
    // Videos: only the making-of time-lapse uses them (MP4 from a phone, or WebM). Resizing below applies to photos only.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'],
    focalPoint: true,
    adminThumbnail: 'thumb',
    // The site resizes on the fly (next/image) from the original, so only the admin's thumbnail is made here.
    // Uploads are capped at 2400 px wide: a phone photo of 4000+ px adds weight, not detail.
    resizeOptions: { width: 2400, withoutEnlargement: true },
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [{ name: 'thumb', width: 400 }],
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
