import type { Field } from 'payload'

/** ASCII URL slug: "Monsoon Evening!" -> "monsoon-evening". Devanagari is dropped, so slugs come from the English title. */
export const slugify = (text: string) =>
  text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')

export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: { position: 'sidebar', description: 'Web address. Filled from the English title if left empty.' },
  hooks: {
    beforeValidate: [
      ({ value, data }) => (value ? slugify(String(value)) : typeof data?.[from] === 'string' ? slugify(data[from]) : value),
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
