import type { CollectionConfig } from 'payload'
import { refreshOnChange } from '../hooks'
import { canEditContent, isOwner, publishedOrStaff, staffOnlyField } from '../access'
import { rupeesField, seoFields, slugField, validateVariants } from '../fields'

/** Things for sale: originals, prints and digital downloads. */
export const Products: CollectionConfig = {
  slug: 'products',
  hooks: refreshOnChange('products'),
  admin: {
    useAsTitle: 'title',
    group: 'Shop',
    defaultColumns: ['title', 'type', 'category', '_status', 'updatedAt'],
    description: 'Add a painting, drawing, print or download for sale.',
  },
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: canEditContent, update: canEditContent, delete: isOwner },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    slugField(),
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'original',
      options: [
        { label: 'Original (one of one)', value: 'original' },
        { label: 'Print', value: 'print' },
        { label: 'Digital download', value: 'digital' },
      ],
    },
    { name: 'category', type: 'relationship', relationTo: 'categories', required: true, filterOptions: { scope: { equals: 'shop' } } },
    { name: 'medium', type: 'relationship', relationTo: 'mediums' },
    { name: 'festival', type: 'relationship', relationTo: 'festivals' },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      admin: { description: 'First photo is the main one. Add a close-up and a photo on a wall if you can.' },
    },
    { name: 'story', type: 'textarea', localized: true, admin: { description: 'The story behind this piece, in your own words.' } },
    { name: 'description', type: 'richText', localized: true },
    {
      type: 'row',
      fields: [
        { name: 'widthCm', label: 'Width (cm)', type: 'number', min: 0 },
        { name: 'heightCm', label: 'Height (cm)', type: 'number', min: 0 },
        { name: 'year', type: 'number', min: 1950, max: 2100 },
      ],
    },
    {
      name: 'variants',
      label: 'Sizes and prices',
      type: 'array',
      required: true,
      minRows: 1,
      admin: { description: 'One row per size you sell. An original has one row with stock 1.' },
      validate: (rows: unknown, { data }: { data: Partial<{ type: string }> }) => validateVariants(data?.type, rows),
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, localized: true, admin: { description: 'e.g. "Original", "A4 print"' } },
            { name: 'sku', type: 'text', admin: { description: 'Optional stock code' } },
          ],
        },
        {
          type: 'row',
          fields: [
            rupeesField('price'),
            rupeesField('compareAtPrice', false),
            { name: 'stock', type: 'number', required: true, defaultValue: 1, min: 0, access: { read: staffOnlyField }, admin: { step: 1 } },
            // Held for 15 minutes while someone pays; only checkout changes it.
            { name: 'reserved', type: 'number', defaultValue: 0, min: 0, access: { read: staffOnlyField, update: () => false }, admin: { readOnly: true } },
          ],
        },
        { name: 'weightGrams', label: 'Packed weight (grams)', type: 'number', min: 0 },
      ],
    },
    {
      name: 'framing',
      label: 'Frame options',
      type: 'array',
      admin: { description: 'Optional. Leave empty if the piece is sold unframed only.' },
      fields: [{ name: 'label', type: 'text', required: true, localized: true }, rupeesField('extraPrice')],
    },
    { name: 'featured', type: 'checkbox', admin: { position: 'sidebar', description: 'Show on the home page' } },
    seoFields,
  ],
}
