import type { CollectionConfig } from 'payload'
import { refreshOnChange } from '../hooks'
import { anyone, canEditContent, isOwner } from '../access'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  hooks: refreshOnChange('testimonials'),
  admin: { useAsTitle: 'name', group: 'Content', defaultColumns: ['name', 'context', 'rating', 'featured'] },
  access: { read: anyone, create: canEditContent, update: canEditContent, delete: isOwner },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'First name and city, e.g. "Priya, Nashik"' } },
    { name: 'context', type: 'text', localized: true, admin: { description: 'e.g. "Wedding rangoli" or "Student"' } },
    { name: 'quote', type: 'textarea', required: true, localized: true },
    { name: 'rating', type: 'number', min: 1, max: 5, defaultValue: 5 },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'featured', type: 'checkbox', admin: { position: 'sidebar' } },
    {
      name: 'permission',
      label: 'The customer agreed to show this on the website',
      type: 'checkbox',
      required: true,
      validate: (value: unknown) => (value === true ? true : 'Only publish reviews the customer agreed to share.'),
    },
  ],
}
