import type { CollectionConfig } from 'payload'
import { refreshOnChange } from '../hooks'
import { canEditContent, hideFromHelpers, isOwner, publishedOrStaff, staffOnlyField } from '../access'
import { rupeesField, seoFields, slugField, validateVariants } from '../fields'
import { originalFromSimpleFields, syncGallery, unlinkGallery } from '../gallery-sync'
import { sitePath } from '../../lib/admin'

const refresh = refreshOnChange('products')!
const isOriginal = (data: Partial<{ type: string }> | undefined) => data?.type === 'original'

/** Things for sale: originals, prints and digital downloads. */
export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Painting or print', plural: 'Paintings & prints' },
  hooks: {
    beforeValidate: [originalFromSimpleFields],
    afterChange: [...(refresh.afterChange ?? []), syncGallery],
    afterDelete: [...(refresh.afterDelete ?? []), unlinkGallery],
  },
  admin: {
    useAsTitle: 'title',
    group: 'Shop',
    defaultColumns: ['images', 'type', 'sold', '_status', 'updatedAt'],
    description: 'Add a painting, drawing, print or download. It also appears in the gallery (untick "Show in gallery" to keep it shop-only).',
    hidden: hideFromHelpers,
    // "View on site" button: the live shop page in the language being edited.
    preview: (doc, { locale }) => (doc.slug ? sitePath(locale, `/shop/p/${doc.slug}`) : null),
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
            { name: 'title', label: 'Name of the piece', type: 'text', required: true, localized: true },
            {
              name: 'type',
              label: 'What are you selling?',
              type: 'select',
              required: true,
              defaultValue: 'original',
              options: [
                { label: 'Original (one of one)', value: 'original' },
                { label: 'Print', value: 'print' },
                { label: 'Digital download', value: 'digital' },
              ],
              admin: { components: { Field: '/payload/admin/ChoiceButtons#ChoiceButtons' } },
            },
            {
              name: 'images',
              label: 'Photos',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              required: true,
              admin: {
                description: 'First photo is the main one. Add a close-up and a photo on a wall if you can.',
                components: { Cell: '/payload/admin/Cells#ThumbCell' },
              },
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
                  labels: { singular: 'Size', plural: 'Sizes' },
                  admin: { description: 'One row per size you sell, e.g. "A4 print".' },
                  validate: (rows: unknown, { data }: { data: Partial<{ type: string }> }) => validateVariants(data?.type, rows),
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'label', label: 'Size', type: 'text', required: true, admin: { description: 'e.g. "A4 print"' } },
                        rupeesField('price'),
                        { name: 'stock', label: 'In stock', type: 'number', required: true, defaultValue: 1, min: 0, access: { read: staffOnlyField }, admin: { step: 1, description: 'How many you have' } },
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
          ],
        },
        {
          label: 'Story & details',
          fields: [
            { name: 'story', type: 'textarea', localized: true, admin: { rows: 5, description: 'The story behind this piece, in your own words. Shown on the shop page and in the gallery.' } },
            // Older long descriptions still show on the site; new pieces use the story only.
            { name: 'description', type: 'richText', localized: true, admin: { hidden: true } },
            {
              type: 'row',
              fields: [
                { name: 'category', type: 'relationship', relationTo: 'categories', required: true, filterOptions: { scope: { in: ['shop', 'both'] } } },
                { name: 'medium', label: 'Medium (pencil, acrylic…)', type: 'relationship', relationTo: 'mediums' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'widthCm', label: 'Width (cm)', type: 'number', min: 0 },
                { name: 'heightCm', label: 'Height (cm)', type: 'number', min: 0 },
                { name: 'year', label: 'Year made', type: 'number', min: 1950, max: 2100 },
              ],
            },
            { name: 'festival', type: 'relationship', relationTo: 'festivals', admin: { description: "Optional. Also shows it on that festival's page." } },
            {
              name: 'framing',
              label: 'Frame options',
              type: 'array',
              labels: { singular: 'Frame option', plural: 'Frame options' },
              admin: { description: 'Optional. Leave empty if the piece is sold unframed only.', initCollapsed: true },
              fields: [{ type: 'row', fields: [{ name: 'label', label: 'Frame', type: 'text', required: true }, rupeesField('extraPrice', true, 'Extra ₹ on top of the price.')] }],
            },
          ],
        },
        {
          label: 'Advanced',
          description: 'Optional. You can leave all of this as it is.',
          fields: [
            slugField('title', 'Web address. Made from the English title; change it only if you need to.', undefined),
            {
              name: 'taxClass',
              label: 'GST class',
              type: 'relationship',
              relationTo: 'tax-classes',
              admin: { description: 'Leave empty: GST is set from the product type (Shop settings → Tax).' },
            },
            seoFields,
          ],
        },
      ],
    },
    { name: 'showInGallery', label: 'Show in gallery', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar', description: 'Also shows this piece on the Artwork gallery page.' } },
    { name: 'featured', label: 'Show on home page', type: 'checkbox', admin: { position: 'sidebar' } },
  ],
}
