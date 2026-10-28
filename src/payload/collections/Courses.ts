import type { CollectionConfig } from 'payload'
import { refreshOnChange } from '../hooks'
import { anyone, canEditContent, isOwner, publishedOrStaff } from '../access'
import { englishRequired, rupeesField, seoFields, slugField } from '../fields'
import { site } from '../../lib/site'
import { sitePath } from '../../lib/admin'

// Out of the menu until the courses section goes live.
const hidden = !site.coursesLive

export const Courses: CollectionConfig = {
  slug: 'courses',
  hooks: refreshOnChange('courses'),
  admin: { useAsTitle: 'title', group: 'Courses', defaultColumns: ['title', 'level', 'price', '_status'], hidden, preview: (doc, { locale }) => (doc.slug ? sitePath(locale, `/courses/${doc.slug}`) : null) },
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: canEditContent, update: canEditContent, delete: isOwner },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Basics',
          fields: [
            { name: 'viewOnSite', type: 'ui', admin: { components: { Field: '/payload/admin/ViewOnSite#ViewOnSite' } } },
            { name: 'language', type: 'ui', admin: { components: { Field: '/payload/admin/LocaleNote#LocaleSwitch' } } },
            // Needed in English only: saving in Marathi or Hindi with an empty title used to fail (and left the form "unsaved").
            { name: 'title', type: 'text', required: true, localized: true, validate: englishRequired },
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
          ],
        },
        {
          label: 'Story',
          description: 'What people read on the course page. All optional.',
          fields: [
            { name: 'introVideoId', label: 'Intro video (from Bunny)', type: 'text', admin: { description: 'The free preview. Paste its video ID from Bunny Stream.' } },
            { name: 'outcomes', label: "What you'll learn", type: 'array', labels: { singular: 'point', plural: 'points' }, fields: [{ name: 'text', type: 'text', required: true, localized: true }] },
            {
              name: 'materials',
              label: 'Materials needed',
              type: 'array',
              labels: { singular: 'material', plural: 'materials' },
              fields: [
                { name: 'text', type: 'text', required: true, localized: true },
                { name: 'product', label: 'Shop item', type: 'relationship', relationTo: 'products', admin: { description: 'Optional: link to buy it in the shop' } },
              ],
            },
            {
              name: 'faq',
              label: 'Common questions',
              type: 'array',
              labels: { singular: 'question', plural: 'questions' },
              fields: [
                { name: 'question', type: 'text', required: true, localized: true },
                { name: 'answer', type: 'textarea', required: true, localized: true },
              ],
            },
          ],
        },
        {
          label: 'Advanced',
          description: 'Optional. You can leave all of this as it is.',
          fields: [
            slugField('title', 'Web address. Made from the English title; change it only if you need to.', undefined),
            {
              name: 'audience',
              label: "Who it's for",
              type: 'select',
              defaultValue: 'all',
              admin: { description: 'Under-18 courses are bought by a parent, with a consent step and no tracking.' },
              options: [
                { label: 'Everyone', value: 'all' },
                { label: 'Teens (14–18)', value: 'teens' },
                { label: 'Kids', value: 'kids' },
              ],
            },
            { name: 'qaEnabled', label: 'Lesson questions on/off', type: 'checkbox', defaultValue: true, admin: { description: 'Students can ask questions under each lesson.' } },
            { name: 'certificateEnabled', label: 'Certificate when finished', type: 'checkbox', defaultValue: true },
            { name: 'featured', label: 'Show on home page', type: 'checkbox' },
            seoFields,
          ],
        },
      ],
    },
  ],
}

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  hooks: refreshOnChange('lessons'),
  admin: { useAsTitle: 'title', group: 'Courses', defaultColumns: ['title', 'course', 'section', 'order', 'isFreePreview'], hidden },
  // Titles are public (course curriculum); the video itself is protected by signed links (milestone 12).
  access: { read: anyone, create: canEditContent, update: canEditContent, delete: isOwner },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, validate: englishRequired },
    { name: 'course', type: 'relationship', relationTo: 'courses', required: true, index: true },
    {
      type: 'row',
      fields: [
        { name: 'section', type: 'text', required: true, localized: true, validate: englishRequired, admin: { description: 'e.g. "Getting started"' } },
        { name: 'order', label: 'Position', type: 'number', required: true, defaultValue: 1, min: 1, admin: { step: 1, description: '1 comes first.' } },
      ],
    },
    { name: 'bunnyVideoId', label: 'Video (from Bunny)', type: 'text', admin: { description: 'Paste the lesson video ID from Bunny Stream.' } },
    { name: 'durationSeconds', label: 'Length (seconds)', type: 'number', min: 0 },
    { name: 'isFreePreview', label: 'Free sample lesson', type: 'checkbox', admin: { description: 'Anyone can watch it without buying the course.' } },
    { name: 'transcript', label: 'Written version of the lesson', type: 'textarea', localized: true },
  ],
}
