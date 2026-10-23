import type { CollectionConfig } from 'payload'
import { isOrderStaff, isOwner, isStaff } from '../access'
import { notifyOwner } from '../hooks'

/** Show a field only for these kinds of enquiry. */
const only = (...types: string[]) => ({ condition: (data: Partial<{ type: string }>) => types.includes(data?.type ?? '') })

/** Messages from the Book an Event, Custom Portraits and Contact forms. The website saves them on the server. */
export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  admin: {
    useAsTitle: 'name',
    group: 'Enquiries',
    defaultColumns: ['name', 'phone', 'type', 'eventDate', 'status', 'createdAt'],
    description: 'New requests from the website. Tap "Reply on WhatsApp"; it marks the enquiry as replied.',
  },
  access: { read: isOrderStaff, create: isStaff, update: isOrderStaff, delete: isOwner },
  disableDuplicate: true,
  defaultSort: '-createdAt',
  hooks: { afterChange: [notifyOwner('enquiry')] },
  fields: [
    { name: 'reply', type: 'ui', admin: { components: { Field: '/payload/admin/EnquiryActions#EnquiryActions' } } },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      admin: { components: { Field: '/payload/admin/ChoiceButtons#ChoiceButtons' } },
      options: [
        { label: 'New', value: 'new' },
        { label: 'Replied', value: 'replied' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Advance paid', value: 'advance_paid' },
        { label: 'Done', value: 'done' },
        { label: 'Lost', value: 'lost' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'phone', type: 'text', required: true, index: true, admin: { components: { Cell: '/payload/admin/EnquiryActions#ReplyCell' } } },
        { name: 'email', type: 'email' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Event rangoli', value: 'event' },
            { label: 'Custom portrait', value: 'portrait' },
            { label: 'Workshop', value: 'workshop' },
            { label: 'General', value: 'general' },
          ],
        },
        { name: 'city', type: 'text' },
        { name: 'eventDate', label: 'Date (event or needed by)', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' }, ...only('event', 'portrait', 'workshop') } },
      ],
    },
    { type: 'row', fields: [{ name: 'venue', type: 'text', admin: only('event') }, { name: 'size', type: 'text', admin: only('event') }, { name: 'styles', type: 'text', hasMany: true, admin: only('event') }] },
    {
      type: 'row',
      fields: [
        { name: 'medium', type: 'text', admin: only('portrait') },
        { name: 'paperSize', type: 'text', admin: only('portrait') },
        { name: 'faces', type: 'number', min: 1, admin: only('portrait') },
        { name: 'framing', type: 'checkbox', admin: only('portrait') },
      ],
    },
    { name: 'occasion', type: 'text', admin: only('event', 'portrait') },
    { name: 'message', type: 'textarea' },
    { name: 'notes', label: 'Your notes (private)', type: 'textarea' },
    { type: 'row', fields: [{ name: 'wantsOffers', label: 'Agreed to WhatsApp offers', type: 'checkbox' }, { name: 'locale', label: 'Language', type: 'text', admin: { readOnly: true } }] },
  ],
}
