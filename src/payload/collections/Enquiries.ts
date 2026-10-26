import type { CollectionConfig } from 'payload'
import { isOrderStaff, isOwner, isStaff } from '../access'

/** Show a field only for these kinds of enquiry. */
const only = (...types: string[]) => ({ condition: (data: Partial<{ type: string }>) => types.includes(data?.type ?? '') })

/** Messages from the Book an Event, Custom Portraits and Contact forms. The website saves them on the server. */
export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  admin: {
    useAsTitle: 'name',
    group: 'Customers',
    defaultColumns: ['name', 'status', 'phone', 'type', 'eventDate', 'createdAt'],
    listSearchableFields: ['name', 'phone', 'city'],
    description: 'Requests from the website forms. Tap the green WhatsApp button to reply; it marks the enquiry as replied.',
    components: {
      beforeListTable: [
        {
          path: '/payload/admin/QuickFilters#QuickFilters',
          clientProps: {
            collection: 'enquiries',
            field: 'status',
            tabs: [
              { label: 'New', values: ['new'] },
              { label: 'Talking', values: ['replied', 'quoted', 'advance_paid'] },
              { label: 'Done', values: ['done'] },
              { label: 'All' },
            ],
          },
        },
        { path: '/payload/admin/Cells#EmptyNote', clientProps: { text: 'No enquiries yet. Messages from the website forms appear here and on Today.' } },
      ],
    },
  },
  access: { read: isOrderStaff, create: isStaff, update: isOrderStaff, delete: isOwner },
  disableDuplicate: true,
  defaultSort: '-createdAt',
  fields: [
    { name: 'reply', type: 'ui', admin: { components: { Field: '/payload/admin/EnquiryActions#EnquiryActions' } } },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      // Saves on tap (with Undo), like the order buttons.
      admin: { components: { Field: { path: '/payload/admin/ChoiceButtons#ChoiceButtons', clientProps: { saveOnTap: true } }, Cell: '/payload/admin/Cells#StatusCell' } },
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
          label: 'Asking about',
          type: 'select',
          required: true,
          admin: { isClearable: false },
          options: [
            { label: 'Event rangoli', value: 'event' },
            { label: 'Custom portrait', value: 'portrait' },
            { label: 'Workshop', value: 'workshop' },
            { label: 'General', value: 'general' },
          ],
        },
        { name: 'city', type: 'text' },
        { name: 'eventDate', label: 'Date (event or needed by)', type: 'date', admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' }, ...only('event', 'portrait', 'workshop') } },
      ],
    },
    { type: 'row', fields: [{ name: 'venue', type: 'text', admin: only('event') }, { name: 'size', label: 'Rangoli size', type: 'text', admin: only('event') }, { name: 'styles', label: 'Styles they like', type: 'text', hasMany: true, admin: only('event') }] },
    {
      type: 'row',
      fields: [
        { name: 'medium', type: 'text', admin: only('portrait') },
        { name: 'paperSize', label: 'Paper size', type: 'text', admin: only('portrait') },
        { name: 'faces', label: 'People in it', type: 'number', min: 1, admin: only('portrait') },
        { name: 'framing', label: 'Wants a frame', type: 'checkbox', admin: only('portrait') },
      ],
    },
    { name: 'occasion', type: 'text', admin: only('event', 'portrait') },
    { name: 'message', label: 'Their message', type: 'textarea' },
    { name: 'notes', label: 'Your notes (private)', type: 'textarea', admin: { description: 'Price quoted, advance received, anything to remember.' } },
    { type: 'row', fields: [{ name: 'wantsOffers', label: 'Agreed to WhatsApp offers', type: 'checkbox' }, {
          name: 'locale',
          label: 'Website language',
          type: 'select',
          options: [
            { label: 'English', value: 'en' },
            { label: 'मराठी', value: 'mr' },
            { label: 'हिंदी', value: 'hi' },
          ],
          admin: { readOnly: true, description: 'The WhatsApp reply is written in this language.' },
        }] },
  ],
}
