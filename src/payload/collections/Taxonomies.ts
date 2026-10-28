import type { CollectionConfig } from 'payload'
import { refreshOnChange } from '../hooks'
import { anyone, canEditContent, hideFromHelpers, isOwner } from '../access'
import { sitePath } from '../../lib/admin'
import { slugField } from '../fields'

const access = { read: anyone, create: canEditContent, update: canEditContent, delete: isOwner }

export const Categories: CollectionConfig = {
  slug: 'categories',
  hooks: refreshOnChange('categories'),
  admin: { useAsTitle: 'name', group: 'Lists', defaultColumns: ['name', 'scope', 'order'], description: 'The groups pieces are sorted into: the tabs in the shop and gallery.', hidden: hideFromHelpers },
  access,
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    slugField('name'),
    {
      name: 'scope',
      type: 'select',
      required: true,
      defaultValue: 'both',
      admin: { description: 'Where this category is used. "Shop and gallery" keeps one list for both.' },
      options: [
        { label: 'Shop and gallery', value: 'both' },
        { label: 'Shop only', value: 'shop' },
        { label: 'Gallery only', value: 'artwork' },
        { label: 'Courses', value: 'course' },
      ],
    },
    { name: 'order', label: 'Position', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Smaller numbers come first.' } },
  ],
}

export const Mediums: CollectionConfig = {
  slug: 'mediums',
  labels: { singular: 'Art material', plural: 'Art materials' },
  hooks: refreshOnChange('mediums'),
  admin: { useAsTitle: 'name', group: 'Lists', description: 'What a piece is made with (pencil, charcoal, acrylic, rangoli colours…). Shown under its name.', hidden: hideFromHelpers },
  access,
  fields: [{ name: 'name', type: 'text', required: true, localized: true }, slugField('name')],
}

export const Festivals: CollectionConfig = {
  slug: 'festivals',
  hooks: refreshOnChange('festivals'),
  admin: {
    useAsTitle: 'name',
    group: 'Gallery & Festivals',
    defaultColumns: ['name', 'nextDate', 'order'],
    description: 'Festival pages (Diwali, Ganesh Chaturthi…). Update the next date every year; Today reminds you.',
    hidden: hideFromHelpers,
    preview: (doc, { locale }) => (doc.slug ? sitePath(locale, `/festivals/${doc.slug}`) : null),
  },
  access,
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    slugField('name'),
    { name: 'intro', type: 'textarea', localized: true, admin: { description: 'A few lines at the top of the festival page.' } },
    { name: 'heroImage', label: 'Main photo', type: 'upload', relationTo: 'media' },
    { name: 'nextDate', label: 'Next date', type: 'date', admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' }, description: 'Shown as a booking deadline. Update it every year (Today reminds you). Leave empty for things without a date, like weddings.' } },
    { name: 'order', label: 'Position', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Smaller numbers come first.' } },
  ],
}
