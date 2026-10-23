import type { CollectionConfig } from 'payload'
import { refreshOnChange } from '../hooks'
import { canEditContent, isOwner, publishedOrStaff, staffOnlyField } from '../access'
import { rupeesField, seoFields, slugField, validateVariants } from '../fields'
import { originalFromSimpleFields, syncGallery, unlinkGallery } from '../gallery-sync'

const refresh = refreshOnChange('products')!
const isOriginal = (data: Partial<{ type: string }> | undefined) => data?.type === 'original'

/** Things for sale: originals, prints and digital downloads. */
export const Products: CollectionConfig = {
  slug: 'products',
  hooks: {
    beforeValidate: [originalFromSimpleFields],
    afterChange: [...(refresh.afterChange ?? []), syncGallery],
    afterDelete: [...(refresh.afterDelete ?? []), unlinkGallery],
  },
  admin: {
    useAsTitle: 'title',
    group: 'Shop',
    defaultColumns: ['title', 'type', 'sold', '_status', 'updatedAt'],
    description: 'Add a painting, drawing, print or download. It also appears in the gallery (untick "Show in gallery" to keep it shop-only).',
  },
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: canEditContent, update: canEditContent, delete: isOwner },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
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
    {
      name: 'images',
      label: 'Photos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      admin: { description: 'First photo is the main one. Add a close-up and a photo on a wall if you can.' },
    },
    // An original is just a price and a Sold switch; they are stored as its one size row (see originalFromSimpleFields).
    {
      type: 'row',
      admin: { condition: isOriginal },
      fields: [
        {
          name: 'originalPrice',
          label: 'Price (₹)',
          type: 'number',
          min: 0,
          virtual: true,
          admin: { readOnly: false, step: 1, description: 'In ₹ (rupees), including GST.' },
          // Scripts and the API may give the size row directly instead.
          validate: (value: unknown, { data }: { data: Partial<{ type: string; variants: { price?: number | null }[] | null }> }) =>
            !isOriginal(data) || (value == null && data.variants?.[0]?.price != null)
              ? true
              : value == null
                ? 'Please enter a price.'
                : Number.isInteger(value)
                  ? true
                  : 'Use whole rupees, e.g. 4500.',
          hooks: { afterRead: [({ siblingData }) => siblingData?.variants?.[0]?.price] },
        },
        {
          name: 'sold',
          label: 'Sold',
          type: 'checkbox',
          virtual: true,
          access: { read: staffOnlyField },
          admin: { readOnly: false, description: 'Tick when it has found a home. The page stays up with a "Sold" badge.', components: { Cell: '/payload/admin/SoldCell#SoldCell' } },
          hooks: { afterRead: [({ siblingData }) => (siblingData?.variants?.[0]?.stock ?? 1) <= 0] },
        },
      ],
    },
    // Hidden for originals (the row wrapper keeps the field itself required in the generated types).
    {
      type: 'row',
      admin: { condition: (data) => !isOriginal(data) },
      fields: [
        {
          name: 'variants',
          label: 'Sizes and prices',
          type: 'array',
          required: true,
          minRows: 1,
          admin: { description: 'One row per size you sell, e.g. "A4 print".' },
          validate: (rows: unknown, { data }: { data: Partial<{ type: string }> }) => validateVariants(data?.type, rows),
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', required: true, admin: { description: 'e.g. "A4 print"' } },
                rupeesField('price'),
                { name: 'stock', type: 'number', required: true, defaultValue: 1, min: 0, access: { read: staffOnlyField }, admin: { step: 1, description: 'How many you have' } },
              ],
            },
            // Kept for existing data; the festival sale replaces "was" prices.
            { name: 'compareAtPrice', type: 'number', min: 0, admin: { hidden: true } },
            { name: 'sku', type: 'text', admin: { hidden: true } },
            // Held for 15 minutes while someone pays; only checkout changes it.
            {
              name: 'reserved',
              type: 'number',
              defaultValue: 0,
              min: 0,
              access: { read: staffOnlyField, update: () => false },
              admin: { hidden: true },
              hooks: { beforeDuplicate: [() => 0] },
            },
            { name: 'weightGrams', label: 'Packed weight (grams)', type: 'number', min: 0, admin: { hidden: true } },
          ],
        },
      ],
    },
    { name: 'story', type: 'textarea', localized: true, admin: { description: 'The story behind this piece, in your own words. Shown on the shop page and in the gallery.' } },
    // Older long descriptions still show on the site; new pieces use the story only.
    { name: 'description', type: 'richText', localized: true, admin: { hidden: true } },
    { type: 'row', fields: [{ name: 'category', type: 'relationship', relationTo: 'categories', required: true, filterOptions: { scope: { in: ['shop', 'both'] } } }, { name: 'medium', type: 'relationship', relationTo: 'mediums' }] },
    {
      type: 'row',
      fields: [
        { name: 'widthCm', label: 'Width (cm)', type: 'number', min: 0 },
        { name: 'heightCm', label: 'Height (cm)', type: 'number', min: 0 },
        { name: 'year', type: 'number', min: 1950, max: 2100 },
      ],
    },
    { name: 'festival', type: 'relationship', relationTo: 'festivals' },
    {
      name: 'framing',
      label: 'Frame options',
      type: 'array',
      admin: { description: 'Optional. Leave empty if the piece is sold unframed only.', initCollapsed: true },
      fields: [{ type: 'row', fields: [{ name: 'label', type: 'text', required: true }, rupeesField('extraPrice')] }],
    },
    { name: 'showInGallery', label: 'Show in gallery', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar', description: 'Also shows this piece on the Artwork gallery page.' } },
    { name: 'featured', type: 'checkbox', admin: { position: 'sidebar', description: 'Show on the home page' } },
    {
      type: 'collapsible',
      label: 'Advanced (optional)',
      admin: { initCollapsed: true },
      fields: [
        slugField('title', 'Web address. Made from the English title; change it only if you need to.', undefined),
        {
          name: 'taxClass',
          type: 'relationship',
          relationTo: 'tax-classes',
          admin: { description: 'Leave empty: GST is set from the product type (Commerce settings → Tax).' },
        },
        seoFields,
      ],
    },
  ],
}
