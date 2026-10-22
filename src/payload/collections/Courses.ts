import type { CollectionConfig } from 'payload'
import { anyone, canEditContent, isOwner, publishedOrStaff } from '../access'
import { rupeesField, seoFields, slugField } from '../fields'

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: { useAsTitle: 'title', group: 'Courses', defaultColumns: ['title', 'level', 'price', '_status'] },
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: canEditContent, update: canEditContent, delete: isOwner },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    slugField(),
    { name: 'subtitle', type: 'text', localized: true },
    { name: 'category', type: 'relationship', relationTo: 'categories', required: true, filterOptions: { scope: { equals: 'course' } } },
    {
      type: 'row',
      fields: [
        {
          name: 'level',
          type: 'select',
          required: true,
          defaultValue: 'beginner',
          options: [
            { label: 'Beginner', value: 'beginner' },
            { label: 'Intermediate', value: 'intermediate' },
            { label: 'Advanced', value: 'advanced' },
          ],
        },
        {
          name: 'languages',
          type: 'select',
          hasMany: true,
          required: true,
          defaultValue: ['mr'],
          options: [
            { label: 'English', value: 'en' },
            { label: 'मराठी', value: 'mr' },
            { label: 'हिंदी', value: 'hi' },
          ],
        },
      ],
    },
    { type: 'row', fields: [rupeesField('price', true, 'In ₹, including GST. 0 = free course.'), rupeesField('salePrice', false)] },
    { name: 'thumbnail', type: 'upload', relationTo: 'media', required: true },
    { name: 'introVideoId', type: 'text', admin: { description: 'Bunny Stream video ID of the free preview.' } },
    { name: 'outcomes', label: "What you'll learn", type: 'array', fields: [{ name: 'text', type: 'text', required: true, localized: true }] },
    {
      name: 'materials',
      label: 'Materials needed',
      type: 'array',
      fields: [
        { name: 'text', type: 'text', required: true, localized: true },
        { name: 'product', type: 'relationship', relationTo: 'products', admin: { description: 'Optional: link to buy it in the shop' } },
      ],
    },
    {
      name: 'faq',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true, localized: true },
        { name: 'answer', type: 'textarea', required: true, localized: true },
      ],
    },
    {
      name: 'audience',
      type: 'select',
      defaultValue: 'all',
      admin: { position: 'sidebar', description: 'Under-18 courses are bought by a parent, with a consent step and no tracking.' },
      options: [
        { label: 'Everyone', value: 'all' },
        { label: 'Teens (14–18)', value: 'teens' },
        { label: 'Kids', value: 'kids' },
      ],
    },
    { name: 'qaEnabled', label: 'Lesson questions on', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'certificateEnabled', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'featured', type: 'checkbox', admin: { position: 'sidebar', description: 'Show on the home page' } },
    seoFields,
  ],
}

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  admin: { useAsTitle: 'title', group: 'Courses', defaultColumns: ['title', 'course', 'section', 'order', 'isFreePreview'] },
  // Titles are public (course curriculum); the video itself is protected by signed links (milestone 12).
  access: { read: anyone, create: canEditContent, update: canEditContent, delete: isOwner },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'course', type: 'relationship', relationTo: 'courses', required: true, index: true },
    {
      type: 'row',
      fields: [
        { name: 'section', type: 'text', required: true, localized: true, admin: { description: 'e.g. "Getting started"' } },
        { name: 'order', type: 'number', required: true, defaultValue: 1, min: 1, admin: { step: 1 } },
      ],
    },
    { name: 'bunnyVideoId', type: 'text', admin: { description: 'Filled automatically once video upload is added (milestone 11).' } },
    { name: 'durationSeconds', type: 'number', min: 0 },
    { name: 'isFreePreview', label: 'Free preview', type: 'checkbox' },
    { name: 'transcript', type: 'textarea', localized: true },
  ],
}
