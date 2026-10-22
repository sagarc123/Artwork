import type { CollectionConfig } from 'payload'
import { isOrderStaff, isOwner, isStaff } from '../access'

/** Messages from the Book an Event, Custom Portraits and Contact forms. The website saves them on the server. */
export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  admin: {
    useAsTitle: 'name',
    group: 'Enquiries',
    defaultColumns: ['name', 'type', 'eventDate', 'city', 'status', 'createdAt'],
    description: 'New requests from the website. Reply on WhatsApp, then update the status.',
  },
  access: { read: isOrderStaff, create: isStaff, update: isOrderStaff, delete: isOwner },
  defaultSort: '-createdAt',
  fields: [
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
        {
          name: 'status',
          type: 'select',
          defaultValue: 'new',
          options: [
            { label: 'New', value: 'new' },
            { label: 'Replied', value: 'replied' },
            { label: 'Quoted', value: 'quoted' },
            { label: 'Advance paid', value: 'advance_paid' },
            { label: 'Done', value: 'done' },
            { label: 'Lost', value: 'lost' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'phone', type: 'text', required: true, index: true },
        { name: 'email', type: 'email' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'city', type: 'text' },
        { name: 'eventDate', label: 'Date (event or needed by)', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
        { name: 'venue', type: 'text' },
      ],
    },
    { type: 'row', fields: [{ name: 'size', type: 'text' }, { name: 'styles', type: 'text', hasMany: true }] },
    {
      type: 'row',
      fields: [
        { name: 'medium', type: 'text' },
        { name: 'paperSize', type: 'text' },
        { name: 'faces', type: 'number', min: 1 },
        { name: 'framing', type: 'checkbox' },
      ],
    },
    { name: 'occasion', type: 'text' },
    { name: 'message', type: 'textarea' },
    { type: 'row', fields: [{ name: 'wantsOffers', label: 'Agreed to WhatsApp offers', type: 'checkbox' }, { name: 'locale', type: 'text' }] },
    { name: 'notes', label: 'Your notes (private)', type: 'textarea' },
  ],
}
