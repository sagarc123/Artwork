import type { CollectionConfig } from 'payload'
import { hasRole, isOrderStaff, isOwner, ownerOnlyField } from '../access'
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
      // The phone is the login: a helper must not be able to move an account to a number they hold (they may still add a student).
      access: { update: ownerOnlyField },
      validate: (v: string | null | undefined) => (typeof v === 'string' && (/^[6-9]\d{9}$/.test(v) || v.startsWith('deleted-')) ? true : 'Please enter a 10-digit mobile number.'),
    },
    { name: 'name', type: 'text' },
    { name: 'erase', type: 'ui', admin: { disableListColumn: true, components: { Field: '/payload/admin/EraseStudent#EraseStudent' }, condition: (d) => !!d?.id && !d?.deletedAt } },
    // The saved ("wishlist") pieces, merged from the device when the customer signs in.
    { name: 'savedSlugs', type: 'json', access: { update: ownerOnlyField }, admin: { hidden: true, disableListColumn: true } },
    { name: 'deletedAt', label: 'Deleted their account on', type: 'date', access: { update: ownerOnlyField }, admin: { readOnly: true, condition: (d) => !!d?.deletedAt } },
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
    defaultColumns: ['customer', 'course', 'progress', 'source', 'createdAt'],
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
    // Set by the lesson player the first time a lesson is opened. After that the course cannot be refunded.
    { name: 'firstAccessedAt', label: 'First opened a lesson', type: 'date', admin: { readOnly: true, condition: (d) => !!d?.firstAccessedAt } },
    { name: 'lastLesson', label: 'Last lesson opened', type: 'relationship', relationTo: 'lessons', admin: { readOnly: true, condition: (d) => !!d?.lastLesson } },
    // "3/5 done, certificate issued on 4 Nov 2026": worked out when shown, never stored.
    {
      name: 'progress',
      label: 'Progress',
      type: 'text',
      virtual: true,
      admin: { readOnly: true },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            // Only for staff looking at the admin: the site's own reads of enrolments skip the extra queries.
            if (!data?.id || !req.user) return undefined
            const { progressText } = await import('../../server/learn')
            return progressText(req.payload, data.id, typeof data.course === 'object' ? data.course?.id : data.course)
          },
        ],
      },
    },
  ],
}

/** Lessons a student has marked done. Written only by the player's server code, after it has checked the enrolment. */
export const LessonProgress: CollectionConfig = {
  slug: 'lesson-progress',
  admin: { hidden: true },
  access: { read: isOrderStaff, create: () => false, update: () => false, delete: isOwner },
  indexes: [{ fields: ['enrolment', 'lesson'], unique: true }],
  fields: [
    { name: 'enrolment', type: 'relationship', relationTo: 'enrolments', required: true, index: true },
    { name: 'lesson', type: 'relationship', relationTo: 'lessons', required: true },
    { name: 'completedAt', type: 'date', required: true },
  ],
}

/** One certificate per enrolment. The owner can withdraw or reissue one with the buttons on its page. */
export const Certificates: CollectionConfig = {
  slug: 'certificates',
  labels: { singular: 'Certificate', plural: 'Certificates' },
  admin: {
    useAsTitle: 'publicId',
    group: 'Courses',
    defaultColumns: ['nameOnCert', 'course', 'issuedAt', 'status'],
    listSearchableFields: ['publicId', 'nameOnCert'],
    description: 'Certificates are made by themselves when a student finishes every lesson. Open one to withdraw it or give it a new number.',
    hidden: hideUnlessOrderStaff,
  },
  access: { read: isOrderStaff, create: () => false, update: isOwner, delete: isOwner },
  indexes: [{ fields: ['enrolment'], unique: true }],
  fields: [
    { name: 'actions', type: 'ui', admin: { disableListColumn: true, components: { Field: '/payload/admin/CertificateActions#CertificateActions' } } },
    { name: 'publicId', label: 'Certificate number', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'nameOnCert', label: 'Name on the certificate', type: 'text', required: true },
    { type: 'row', fields: [{ name: 'course', type: 'relationship', relationTo: 'courses', required: true, admin: { readOnly: true } }, { name: 'issuedAt', label: 'Issued on', type: 'date', required: true, admin: { readOnly: true } }] },
    // Empty once a refund removes the seat; the certificate itself stays (withdrawn).
    { name: 'enrolment', type: 'relationship', relationTo: 'enrolments', admin: { readOnly: true } },
    { name: 'customer', label: 'Student', type: 'relationship', relationTo: 'customers', required: true, index: true, admin: { readOnly: true } },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'valid',
      admin: { readOnly: true },
      options: [
        { label: 'Genuine', value: 'valid' },
        { label: 'Withdrawn', value: 'revoked' },
      ],
    },
  ],
}
