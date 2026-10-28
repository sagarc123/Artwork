import type { CollectionConfig } from 'payload'
import { hasRole, isOrderStaff, isOwner } from '../access'
import { normalisePhone } from '../../lib/enquiry'

const hideUnlessOrderStaff = ({ user }: { user: unknown }) => !hasRole(user, 'owner', 'staff')

/**
 * Website customers ("Students"): people who signed in with their phone. Not staff: this collection has no login of
 * its own, so a customer can never reach /admin or the CMS API (the site keeps its own signed session cookie).
 * Add someone here by hand (just their phone number) to give them a course they paid for on WhatsApp.
 */
export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Student', plural: 'Students' },
  admin: {
    useAsTitle: 'phone',
    group: 'Courses',
    defaultColumns: ['phone', 'name', 'createdAt'],
    listSearchableFields: ['phone', 'name'],
    description: 'People who signed in on the website. To give someone a course by hand, add them here (phone number only) and then add them under "Course students".',
    hidden: hideUnlessOrderStaff,
  },
  // Never hard-deleted (invoices and course seats point at it): the owner uses "Remove this student's personal data" instead.
  access: { read: isOrderStaff, create: isOrderStaff, update: isOrderStaff, delete: () => false },
  hooks: {
    beforeValidate: [({ data }) => (data?.phone ? { ...data, phone: normalisePhone(String(data.phone)) ?? data.phone } : data)],
  },
  fields: [
    {
      name: 'phone',
      label: 'Mobile number',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: (v: string | null | undefined) => (typeof v === 'string' && (/^[6-9]\d{9}$/.test(v) || v.startsWith('deleted-')) ? true : 'Please enter a 10-digit mobile number.'),
    },
    { name: 'name', type: 'text' },
    { name: 'erase', type: 'ui', admin: { components: { Field: '/payload/admin/EraseStudent#EraseStudent' }, condition: (d) => !!d?.id && !d?.deletedAt } },
    // The saved ("wishlist") pieces, merged from the device when the customer signs in.
    { name: 'savedSlugs', type: 'json', admin: { hidden: true } },
    { name: 'deletedAt', label: 'Deleted their account on', type: 'date', admin: { readOnly: true, condition: (d) => !!d?.deletedAt } },
  ],
}

/** One-time sign-in codes. Only a keyed hash of each code is kept. Nobody reads these through the CMS. */
export const OtpCodes: CollectionConfig = {
  slug: 'otp-codes',
  admin: { hidden: true },
  access: { read: () => false, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'phone', type: 'text', required: true, unique: true, index: true },
    { name: 'codeHash', type: 'text', required: true },
    { name: 'expiresAt', type: 'date', required: true },
    { name: 'sentAt', type: 'date', required: true },
    { name: 'attempts', type: 'number', required: true, defaultValue: 0 },
  ],
}

/** Who may watch which course. Created by a verified payment, a free enrolment, or by the owner by hand. */
export const Enrolments: CollectionConfig = {
  slug: 'enrolments',
  labels: { singular: 'Course student', plural: 'Course students' },
  admin: {
    useAsTitle: 'id',
    group: 'Courses',
    defaultColumns: ['customer', 'course', 'source', 'createdAt'],
    description: 'Who can watch which course (for life). Paid orders add people here by themselves. For someone who paid you on WhatsApp, add them yourself: pick the student (add them under "Students" first if they are new) and the course.',
    hidden: hideUnlessOrderStaff,
  },
  // Only the owner adds or removes seats by hand; the website's payment code writes them directly.
  access: { read: isOrderStaff, create: isOwner, update: isOwner, delete: isOwner },
  // One seat per student and course, whoever or whatever creates it.
  indexes: [{ fields: ['customer', 'course'], unique: true }],
  fields: [
    { type: 'row', fields: [{ name: 'customer', label: 'Student', type: 'relationship', relationTo: 'customers', required: true, index: true }, { name: 'course', type: 'relationship', relationTo: 'courses', required: true, index: true }] },
    {
      name: 'source',
      label: 'How they got it',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: [
        { label: 'Paid on the website', value: 'paid' },
        { label: 'Free course', value: 'free' },
        { label: 'Added by me (e.g. paid on WhatsApp)', value: 'manual' },
      ],
    },
    { name: 'order', label: 'Website order', type: 'relationship', relationTo: 'orders', admin: { readOnly: true, condition: (d) => !!d?.order } },
    // Under-18 courses: a parent buys, and gives the child's first name only for the certificate.
    { name: 'childFirstName', label: "Child's first name (for the certificate)", type: 'text' },
    { name: 'guardianConsentAt', label: 'Parent agreed on', type: 'date', admin: { readOnly: true, condition: (d) => !!d?.guardianConsentAt } },
    // Set by the lesson player (part 2b) the first time a lesson is opened. After that the course cannot be refunded.
    { name: 'firstAccessedAt', label: 'First opened a lesson', type: 'date', admin: { readOnly: true, condition: (d) => !!d?.firstAccessedAt } },
  ],
}
