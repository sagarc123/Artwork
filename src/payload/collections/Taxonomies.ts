import type { CollectionConfig } from 'payload'
import { refreshOnChange } from '../hooks'
import { anyone, canEditContent, isOwner } from '../access'
import { slugField } from '../fields'

const access = { read: anyone, create: canEditContent, update: canEditContent, delete: isOwner }

export const Categories: CollectionConfig = {
  slug: 'categories',
  hooks: refreshOnChange('categories'),
  admin: { useAsTitle: 'name', group: 'Settings', defaultColumns: ['name', 'scope', 'order'] },
  access,
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    slugField('name'),
    {
      name: 'scope',
      type: 'select',
      required: true,
      options: [
        { label: 'Shop', value: 'shop' },
        { label: 'Artwork gallery', value: 'artwork' },
        { label: 'Courses', value: 'course' },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}

export const Mediums: CollectionConfig = {
  slug: 'mediums',
  hooks: refreshOnChange('mediums'),
  admin: { useAsTitle: 'name', group: 'Settings', description: 'Pencil, charcoal, acrylic, watercolour, rangoli colours…' },
  access,
  fields: [{ name: 'name', type: 'text', required: true, localized: true }, slugField('name')],
}

export const Festivals: CollectionConfig = {
  slug: 'festivals',
  hooks: refreshOnChange('festivals'),
  admin: { useAsTitle: 'name', group: 'Content', defaultColumns: ['name', 'nextDate', 'order'] },
  access,
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    slugField('name'),
    { name: 'intro', type: 'textarea', localized: true },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'nextDate', type: 'date', admin: { description: 'Next festival date, shown as a booking deadline.' } },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
