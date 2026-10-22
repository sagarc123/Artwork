import type { CollectionConfig } from 'payload'
import { canEditContent, isOwner, publishedOrStaff } from '../access'
import { seoFields, slugField } from '../fields'

/** Portfolio pieces, including ones that are not for sale. */
export const Artworks: CollectionConfig = {
  slug: 'artworks',
  admin: { useAsTitle: 'title', group: 'Content', defaultColumns: ['title', 'category', 'forSale', '_status'] },
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: canEditContent, update: canEditContent, delete: isOwner },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    slugField(),
    { name: 'images', type: 'upload', relationTo: 'media', hasMany: true, required: true },
    { name: 'category', type: 'relationship', relationTo: 'categories', required: true, filterOptions: { scope: { equals: 'artwork' } } },
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
