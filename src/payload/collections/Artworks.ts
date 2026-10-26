import type { CollectionConfig } from 'payload'
import { refreshOnChange } from '../hooks'
import { fillAlt } from '../gallery-sync'
import { canEditContent, hideFromHelpers, isOwner, publishedOrStaff } from '../access'
import { adminTitleField, englishRequired, seoFields, slugField } from '../fields'
import { sitePath } from '../../lib/admin'

const refresh = refreshOnChange('artworks')!

/** Portfolio pieces, including ones that are not for sale. */
export const Artworks: CollectionConfig = {
  slug: 'artworks',
  labels: { singular: 'Gallery piece', plural: 'Gallery' },
  hooks: {
    afterDelete: refresh.afterDelete,
    afterChange: [
      ...(refresh.afterChange ?? []),
      async ({ doc, req, context }) => (context.gallerySync ? doc : (await fillAlt(req, doc.images, doc.title), doc)),
    ],
  },
  admin: {
    useAsTitle: 'adminTitle',
    group: 'Gallery & Festivals',
    defaultColumns: ['images', 'category', 'forSale', '_status'],
    description: 'Pieces shown on the Artwork page. Paintings added under Shop appear here by themselves; add only pieces that are not for sale.',
    hidden: hideFromHelpers,
    preview: (_doc, { locale }) => sitePath(locale, '/artwork'),
  },
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: canEditContent, update: canEditContent, delete: isOwner },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Basics',
          fields: [
            {
              name: 'title',
              label: 'Name of the piece',
              type: 'text',
              required: true,
              localized: true,
              validate: englishRequired,
              admin: { description: 'Needed in English. Marathi and Hindi are optional: when empty, the English name shows.' },
            },
            { name: 'images', label: 'Photos', type: 'upload', relationTo: 'media', hasMany: true, required: true, admin: { description: 'First photo is the main one.', components: { Cell: '/payload/admin/Cells#ThumbCell' } } },
            { name: 'category', type: 'relationship', relationTo: 'categories', required: true, filterOptions: { scope: { in: ['artwork', 'both'] } } },
          ],
        },
        {
          label: 'Story & details',
          fields: [
            { name: 'story', type: 'textarea', localized: true, admin: { rows: 5, description: 'A few lines about this piece.' } },
            {
              type: 'row',
              fields: [
                { name: 'medium', label: 'Medium (pencil, acrylic…)', type: 'relationship', relationTo: 'mediums' },
                { name: 'festival', type: 'relationship', relationTo: 'festivals' },
                { name: 'year', label: 'Year made', type: 'number', min: 1950, max: 2100 },
              ],
            },
          ],
        },
        {
          label: 'Advanced',
          description: 'Optional. You can leave all of this as it is.',
          fields: [slugField('title', 'Web address. Made from the English title; change it only if you need to.', undefined), seoFields],
        },
      ],
    },
    { name: 'forSale', label: 'For sale in the shop', type: 'checkbox', admin: { position: 'sidebar', components: { Cell: '/payload/admin/Cells#YesNoCell' } } },
    {
      name: 'product',
      label: 'Shop listing',
      type: 'relationship',
      relationTo: 'products',
      admin: { position: 'sidebar', condition: (_, sibling) => Boolean(sibling?.forSale), description: 'The shop listing visitors can buy.' },
      validate: (value: unknown, { siblingData }: { siblingData: Partial<{ forSale: boolean }> }) =>
        siblingData?.forSale && !value ? 'Choose the shop listing for this piece, or untick "For sale".' : true,
    },
    { name: 'order', label: 'Position', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Smaller numbers come first.' } },
    adminTitleField('title'),
  ],
}
