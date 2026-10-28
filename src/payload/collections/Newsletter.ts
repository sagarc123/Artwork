import type { CollectionConfig } from 'payload'
import { hideFromNonOwners, isOwner } from '../access'

const locked = { update: () => false }

/**
 * Newsletter sign-ups. Written only by the website's sign-up form and the links in its emails (double opt-in:
 * waiting until the person clicks the link we email them).
 */
export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Subscriber', plural: 'Newsletter' },
  admin: {
    useAsTitle: 'email',
    group: 'Newsletter',
    defaultColumns: ['email', 'status', 'confirmedAt', 'createdAt'],
    listSearchableFields: ['email'],
    description: 'Everyone who signed up for the newsletter on the website. Only "Confirmed" people clicked the link in their email and may be written to. There is no sending screen here: download the list and send with Resend or another email tool.',
    hidden: hideFromNonOwners,
    components: {
      beforeListTable: [
        '/payload/admin/CsvLink#CsvLink',
        { path: '/payload/admin/QuickFilters#QuickFilters', clientProps: { collection: 'subscribers', field: 'status', tabs: [{ label: 'Confirmed', values: ['confirmed'] }, { label: 'Waiting for the email link', values: ['pending'] }, { label: 'Unsubscribed', values: ['unsubscribed'] }, { label: 'All' }] } },
        { path: '/payload/admin/Cells#EmptyNote', clientProps: { text: 'No sign-ups yet. The sign-up box is at the bottom of every page.' } },
      ],
    },
  },
  // Email addresses: owner only. Nobody adds or edits a person by hand (that would be consent they never gave).
  access: { read: isOwner, create: () => false, update: () => false, delete: isOwner },
  disableDuplicate: true,
  defaultSort: '-createdAt',
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, index: true, access: locked },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      access: locked,
      admin: { components: { Cell: '/payload/admin/Cells#StatusCell' } },
      options: [
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Waiting for the email link', value: 'pending' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
    },
    { type: 'row', fields: [{ name: 'confirmedAt', label: 'Confirmed on', type: 'date', access: locked }, { name: 'unsubscribedAt', label: 'Unsubscribed on', type: 'date', access: locked }] },
    { name: 'confirmSentAt', label: 'Last confirm email sent', type: 'date', access: locked },
    { name: 'locale', label: 'Website language', type: 'select', access: locked, options: [{ label: 'English', value: 'en' }, { label: 'मराठी', value: 'mr' }, { label: 'हिंदी', value: 'hi' }] },
  ],
}

/** The record of what each person agreed to, under which wording and where. A withdrawal is written on the same row. */
export const Consents: CollectionConfig = {
  slug: 'consents',
  labels: { singular: 'Consent record', plural: 'Consent records' },
  admin: { group: 'Newsletter', useAsTitle: 'email', defaultColumns: ['email', 'purpose', 'source', 'grantedAt', 'withdrawnAt'], description: 'Who agreed to what, and when. For your records; nothing to do here.', hidden: hideFromNonOwners },
  access: { read: isOwner, create: () => false, update: () => false, delete: isOwner },
  disableDuplicate: true,
  defaultSort: '-grantedAt',
  fields: [
    { name: 'email', type: 'email', required: true, index: true, access: locked },
    { name: 'purpose', type: 'select', required: true, access: locked, options: [{ label: 'Newsletter', value: 'newsletter' }] },
    { name: 'noticeVersion', label: 'Wording version', type: 'text', required: true, access: locked },
    { name: 'source', type: 'text', required: true, access: locked },
    { type: 'row', fields: [{ name: 'grantedAt', label: 'Agreed on', type: 'date', required: true, access: locked }, { name: 'withdrawnAt', label: 'Withdrawn on', type: 'date', access: locked }] },
  ],
}
