import type { Field, TextFieldSingleValidation, Where } from 'payload'

/** ASCII URL slug: "Monsoon Evening!" -> "monsoon-evening". Devanagari is dropped, so slugs come from the English title. */
export const slugify = (text: string) =>
  text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')

export const slugField = (from = 'title', description = 'Filled from the English title if left empty.', position: 'sidebar' | undefined = 'sidebar'): Field => ({
  name: 'slug',
  label: 'Web address',
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
  admin: { step: 1, description, components: { Cell: '/payload/admin/Cells#MoneyCell' } },
  validate: (value: unknown) =>
    value == null ? (required ? 'Please enter a price.' : true) : Number.isInteger(value) ? true : 'Use whole rupees, e.g. 4500.',
})

export const seoFields: Field = {
  name: 'seo',
  label: 'Google search (optional)',
  type: 'group',
  admin: { description: 'Optional. Shown in Google results; filled from the title if empty.' },
  fields: [
    { name: 'title', label: 'Title in Google', type: 'text', localized: true, maxLength: 60 },
    { name: 'description', label: 'Short description in Google', type: 'textarea', localized: true, maxLength: 155 },
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

/** A localized name that is needed in English only: an empty Marathi or Hindi one shows the English name on the site. */
export const englishRequired = ((value, { req }) =>
  (req.locale && req.locale !== 'en') || (typeof value === 'string' && value.trim()) ? true : 'Please enter a name.') as TextFieldSingleValidation

/**
 * The English name, kept unlocalized for the admin's headings, breadcrumbs and pickers (use it as `useAsTitle`).
 * The admin reads without language fallback, so a piece with no Marathi name yet would otherwise show as "26".
 */
export const adminTitleField = (from: string): Field => ({
  name: 'adminTitle',
  label: 'Name',
  type: 'text',
  admin: { hidden: true, disableListColumn: true },
  hooks: {
    beforeChange: [
      async ({ value, data, originalDoc, req, collection }) => {
        if (!req.locale || req.locale === 'en') return data?.[from] ?? value
        if (value || originalDoc?.adminTitle) return value || originalDoc.adminTitle
        if (!originalDoc?.id || !collection) return data?.[from] ?? value
        const en = await req.payload.findByID({ collection: collection.slug as 'products', id: originalDoc.id, locale: 'en', depth: 0, draft: true, req, disableErrors: true })
        return (en as Record<string, unknown> | null)?.[from] ?? data?.[from] ?? value
      },
    ],
  },
})
