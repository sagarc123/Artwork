import type { CollectionConfig } from 'payload'
import { refreshOnChange } from '../hooks'
import { fillAlt } from '../product-hooks'
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
    afterChange: [...(refresh.afterChange ?? []), fillAlt],
  },
  admin: {
    useAsTitle: 'adminTitle',
    group: 'Gallery & Festivals',
    defaultColumns: ['title', 'category', '_status'],
    description: 'Pieces for the gallery page that are not for sale (event rangoli, commissions, older work). Paintings & prints show in the gallery by themselves.',
    hidden: hideFromHelpers,
    components: { beforeListTable: [{ path: '/payload/admin/Cells#EmptyNote', clientProps: { text: 'No gallery pieces yet. Paintings & prints show in the gallery by themselves; add pieces here that are not for sale.' } }] },
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
            { name: 'viewOnSite', type: 'ui', admin: { disableListColumn: true, components: { Field: '/payload/admin/ViewOnSite#ViewOnSite' } } },
            { name: 'language', type: 'ui', admin: { disableListColumn: true, components: { Field: '/payload/admin/LocaleNote#LocaleSwitch' } } },
            {
              name: 'title',
              label: 'Name of the piece',
              type: 'text',
              required: true,
              localized: true,
              validate: englishRequired,
              admin: { description: 'Needed in English. Marathi and Hindi are optional: when empty, the English name shows.', components: { Cell: '/payload/admin/Cells#ThumbCell' } },
            },
            { name: 'images', label: 'Photos', type: 'upload', relationTo: 'media', hasMany: true, required: true, admin: { description: 'First photo is the main one.' } },
            { name: 'photoTaker', type: 'ui', admin: { disableListColumn: true, components: { Field: '/payload/admin/PhotoTaker#PhotoTaker' } } },
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
          fields: [slugField('title', 'Made from the English title; change it only if you need to.', undefined), seoFields],
        },
      ],
    },
    // ponytail: only for a gallery photo of something also sold as a print; shop pieces show in the gallery by themselves.
    {
      name: 'product',
      label: 'Also in the shop (optional)',
      type: 'relationship',
      relationTo: 'products',
      admin: { position: 'sidebar', description: 'Pick the shop listing to add a "See it in the shop" button. Leave empty if it is not for sale.' },
    },
    { name: 'order', label: 'Position', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Smaller numbers come first.' } },
    adminTitleField('title'),
  ],
}
