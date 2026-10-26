import type { CollectionConfig } from 'payload'
import { refreshOnChange } from '../hooks'
import { anyone, canEditContent, hideFromHelpers, isOwner } from '../access'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  hooks: refreshOnChange('testimonials'),
  labels: { singular: 'Customer review', plural: 'Customer reviews' },
  admin: {
    useAsTitle: 'name',
    group: 'Gallery & Festivals',
    defaultColumns: ['name', 'topic', 'language', 'featured'],
    description: 'Kind words from customers. Each page shows reviews in its own language (English ones only if it has none yet): the home page shows the ones marked for it, Book an Event and Custom Portraits show their own and general ones.',
    hidden: hideFromHelpers,
  },
  access: { read: anyone, create: canEditContent, update: canEditContent, delete: isOwner },
  fields: [
    { name: 'name', label: 'Who said it', type: 'text', required: true, admin: { description: 'First name and city, e.g. "Priya, Nashik"' } },
    // One language per review: the customer's own words, as they wrote them.
    { name: 'context', label: 'For what', type: 'text', admin: { description: 'e.g. "Wedding rangoli" or "Student"' } },
    { name: 'quote', label: 'What they said', type: 'textarea', required: true, admin: { description: 'In their own words and language.' } },
    {
      type: 'row',
      fields: [
        {
          name: 'language',
          label: 'Written in',
          type: 'select',
          required: true,
          defaultValue: 'en',
          options: [
            { label: 'English', value: 'en' },
            { label: 'मराठी', value: 'mr' },
            { label: 'हिंदी', value: 'hi' },
          ],
        },
        {
          name: 'topic',
          label: 'About',
          type: 'select',
          required: true,
          defaultValue: 'general',
          options: [
            { label: 'Event rangoli', value: 'event' },
            { label: 'Custom portrait', value: 'portrait' },
            { label: 'Shop order', value: 'shop' },
            { label: 'General', value: 'general' },
          ],
        },
      ],
    },
    { name: 'rating', label: 'Stars (1–5)', type: 'number', min: 1, max: 5, defaultValue: 5 },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'featured', label: 'Show on home page', type: 'checkbox', admin: { position: 'sidebar', components: { Cell: '/payload/admin/Cells#YesNoCell' } } },
    {
      name: 'permission',
      label: 'The customer agreed to show this on the website',
      type: 'checkbox',
      required: true,
      validate: (value: unknown) => (value === true ? true : 'Only publish reviews the customer agreed to share.'),
    },
  ],
}
