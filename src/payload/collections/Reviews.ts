import path from 'node:path'
import type { Access, CollectionConfig } from 'payload'
import { canEditContent, hasRole, isOwner, staffOnlyField } from '../access'
import { refreshOnChange } from '../hooks'

/** The public API shows approved reviews only; staff see every one. Customers have no CMS login, so they never see pending ones. */
const approvedOrStaff: Access = ({ req }) => hasRole(req.user, 'owner', 'staff', 'editor') || { status: { equals: 'approved' } }
const only = (kind: string) => ({ condition: (d: Partial<{ kind: string }>) => d?.kind === kind })

/**
 * Reviews from verified buyers and students. Written only by the site's review form, after it has checked the order or the
 * course progress (src/server/reviews.ts). New ones wait here until you approve them with one tap.
 */
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Review', plural: 'Reviews' },
  hooks: refreshOnChange('reviews'),
  admin: {
    useAsTitle: 'name',
    group: 'Gallery & Festivals',
    defaultColumns: ['name', 'rating', 'status', 'kind', 'createdAt'],
    description: 'Reviews written by people who really bought a piece or finished part of a course. Open a waiting one and tap Approve to show it on the website, or Hide to keep it off. Your own quoted testimonials are separate (see "Testimonials").',
    components: {
      beforeListTable: [
        { path: '/payload/admin/QuickFilters#QuickFilters', clientProps: { collection: 'reviews', field: 'status', tabs: [{ label: 'Waiting', values: ['pending'] }, { label: 'On website', values: ['approved'] }, { label: 'Hidden', values: ['rejected'] }, { label: 'All' }] } },
        { path: '/payload/admin/Cells#EmptyNote', clientProps: { text: 'No reviews yet. Buyers and students can write one from their account.' } },
      ],
    },
  },
  access: { read: approvedOrStaff, create: () => false, update: canEditContent, delete: isOwner },
  disableDuplicate: true,
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'status',
      label: 'Show on website?',
      type: 'select',
      defaultValue: 'pending',
      required: true,
      admin: { components: { Field: { path: '/payload/admin/ChoiceButtons#ChoiceButtons', clientProps: { saveOnTap: true } }, Cell: '/payload/admin/Cells#StatusCell' } },
      options: [
        { label: 'Waiting', value: 'pending' },
        { label: 'Approve', value: 'approved' },
        { label: 'Hide', value: 'rejected' },
      ],
    },
    { type: 'row', fields: [{ name: 'name', label: 'Name shown', type: 'text', required: true, admin: { readOnly: true } }, { name: 'rating', label: 'Stars', type: 'number', min: 1, max: 5, required: true, admin: { readOnly: true } }] },
    {
      type: 'row',
      fields: [
        { name: 'kind', label: 'About a', type: 'select', required: true, admin: { readOnly: true }, options: [{ label: 'Painting or print', value: 'product' }, { label: 'Course', value: 'course' }] },
        { name: 'product', type: 'relationship', relationTo: 'products', admin: { readOnly: true, ...only('product') } },
        { name: 'course', type: 'relationship', relationTo: 'courses', admin: { readOnly: true, ...only('course') } },
      ],
    },
    { name: 'text', label: 'Their review', type: 'textarea', required: true, maxLength: 1000, admin: { readOnly: true } },
    { name: 'photo', label: 'Their photo', type: 'upload', relationTo: 'review-photos', admin: { readOnly: true, condition: (d) => !!d?.photo } },
    // Who wrote it: never shown on the website, and hidden from the public API.
    { name: 'customer', label: 'Student account', type: 'relationship', relationTo: 'customers', required: true, index: true, access: { read: staffOnlyField }, admin: { readOnly: true } },
  ],
  // One review per customer per item. (Postgres counts empty values as different, so a course review never clashes with a product one.)
  indexes: [
    { fields: ['customer', 'product'], unique: true },
    { fields: ['customer', 'course'], unique: true },
  ],
}

/** A photo's file is public only while its review is approved (staff always see it). */
const ofApprovedReview: Access = ({ req }) => hasRole(req.user, 'owner', 'staff', 'editor') || { 'review.status': { equals: 'approved' } }

/**
 * Photos sent with reviews, kept apart from the photo library so a waiting or hidden review's picture is never public:
 * the file address answers only once its review is approved. Written only by the review form.
 */
export const ReviewPhotos: CollectionConfig = {
  slug: 'review-photos',
  labels: { singular: 'Review photo', plural: 'Review photos' },
  admin: { hidden: true },
  access: { read: ofApprovedReview, create: () => false, update: () => false, delete: isOwner },
  upload: {
    staticDir: path.resolve(process.cwd(), 'review-photos'),
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    adminThumbnail: 'thumb',
    resizeOptions: { width: 1600, withoutEnlargement: true },
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [{ name: 'thumb', width: 400 }],
  },
  fields: [
    { name: 'alt', type: 'text' },
    // Set by the review form once the review exists; the access rule above follows it.
    { name: 'review', type: 'relationship', relationTo: 'reviews', index: true },
  ],
}
