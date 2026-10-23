import type { CollectionConfig } from 'payload'
import { refreshOnChange } from '../hooks'
import { fillAlt } from '../gallery-sync'
import { canEditContent, isOwner, publishedOrStaff } from '../access'
import { seoFields, slugField } from '../fields'

/** Portfolio pieces, including ones that are not for sale. */
export const Artworks: CollectionConfig = {
  slug: 'artworks',
  hooks: {
    ...refreshOnChange('artworks'),
    afterChange: [
      ...(refreshOnChange('artworks')!.afterChange ?? []),
      async ({ doc, req, context }) => (context.gallerySync ? doc : (await fillAlt(req, doc.images, doc.title), doc)),
    ],
  },
  admin: {
    useAsTitle: 'title',
    group: 'Gallery & Festivals',
    defaultColumns: ['title', 'category', 'forSale', '_status'],
    description: 'Pieces shown on the Artwork page. Paintings added under Shop → Products appear here by themselves; add only pieces that are not for sale.',
  },
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: canEditContent, update: canEditContent, delete: isOwner },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    slugField(),
    { name: 'images', type: 'upload', relationTo: 'media', hasMany: true, required: true },
    { name: 'category', type: 'relationship', relationTo: 'categories', required: true, filterOptions: { scope: { in: ['artwork', 'both'] } } },
    { name: 'medium', type: 'relationship', relationTo: 'mediums' },
    { name: 'festival', type: 'relationship', relationTo: 'festivals' },
    { name: 'year', type: 'number', min: 1950, max: 2100 },
    { name: 'story', type: 'textarea', localized: true, admin: { description: 'A few lines about this piece.' } },
    { name: 'forSale', type: 'checkbox', admin: { position: 'sidebar' } },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      admin: { position: 'sidebar', condition: (_, sibling) => Boolean(sibling?.forSale), description: 'The shop listing visitors can buy.' },
      validate: (value: unknown, { siblingData }: { siblingData: Partial<{ forSale: boolean }> }) =>
        siblingData?.forSale && !value ? 'Choose the shop listing for this piece, or untick "For sale".' : true,
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    seoFields,
  ],
}
