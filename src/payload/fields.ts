import type { Field, TextFieldSingleValidation, Where } from 'payload'

/** ASCII URL slug: "Monsoon Evening!" -> "monsoon-evening". Devanagari is dropped, so slugs come from the English title. */
export const slugify = (text: string) =>
  text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')

export const slugField = (from = 'title', description = 'Web address. Filled from the English title if left empty.', position: 'sidebar' | undefined = 'sidebar'): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: { position, description },
  // Always filled by the hook below (before validation on the server), so an empty box in the form is fine.
  validate: (() => true) as TextFieldSingleValidation,
  hooks: {
    beforeValidate: [
      async ({ value, data, originalDoc, collection, req }) => {
        // A partial update that doesn't send the slug keeps the saved one.
        if (!value && originalDoc?.slug) return originalDoc.slug
        const base = (value ? slugify(String(value)) : typeof data?.[from] === 'string' ? slugify(data[from]) : '') || `item-${Date.now().toString(36)}`
        if (!collection) return base
        // Taken by another document (same title, a duplicate, a shop and gallery category of the same name): add -2, -3…
        for (let n = 1; ; n++) {
          const slug = n === 1 ? base : `${base}-${n}`
          const where: Where = { and: [{ slug: { equals: slug } }, ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : [])] }
          const { totalDocs } = await req.payload.count({ collection: collection.slug as 'products', where, req })
          if (!totalDocs) return slug
        }
      },
    ],
  },
})

/** Prices are entered in whole rupees; code converts to paise for payments. */
export const rupeesField = (name: string, required = true, description = 'In ₹ (rupees), including GST.'): Field => ({
  name,
  type: 'number',
  required,
  min: 0,
  admin: { step: 1, description },
  validate: (value: unknown) =>
    value == null ? (required ? 'Please enter a price.' : true) : Number.isInteger(value) ? true : 'Use whole rupees, e.g. 4500.',
})

export const seoFields: Field = {
  name: 'seo',
  type: 'group',
  admin: { description: 'Optional. Shown in Google results; filled from the title if empty.' },
  fields: [
    { name: 'title', type: 'text', localized: true, maxLength: 60 },
    { name: 'description', type: 'textarea', localized: true, maxLength: 155 },
  ],
}

type VariantRow = { stock?: number | null }

/** Rules for a product's sizes: originals are one of one. */
export function validateVariants(type: unknown, rows: unknown): true | string {
  const list = (Array.isArray(rows) ? rows : []) as VariantRow[]
  if (list.length === 0) return 'Add at least one size and price.'
  if (type === 'original') {
    if (list.length !== 1) return 'An original has exactly one entry (it is one of one).'
    if ((list[0].stock ?? 0) > 1) return 'An original can only have stock 0 (sold) or 1 (available).'
  }
  return true
}
