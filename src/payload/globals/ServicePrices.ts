import type { CheckboxFieldValidation, Field, GlobalConfig } from 'payload'
import { anyone, hideFromHelpers, isOwner } from '../access'
import { refreshGlobalOnChange } from '../hooks'

const SAMPLE = 'Sample prices from setup. Please check them before the website goes live.'
const rupees = (name: string, label: string): Field => ({ name, label, type: 'number', min: 0, admin: { description: 'Starting price in ₹. Leave empty to hide it.' } })

/** One row of the portrait price table: A4 / A3 / A2 and how long it takes. */
const medium = (name: string, label: string): Field => ({
  name,
  label,
  type: 'group',
  fields: [
    { type: 'row', fields: [rupees('a4', 'A4 from (₹)'), rupees('a3', 'A3 from (₹)'), rupees('a2', 'A2 from (₹)')] },
    { name: 'days', label: 'Ready in (days)', type: 'text', admin: { description: 'e.g. 7–10' } },
  ],
})

/** "From ₹X" prices for event rangoli and custom portraits. The website only ever says "from": the final price is agreed on WhatsApp. */
export const ServicePrices: GlobalConfig = {
  slug: 'service-prices',
  label: 'Event & portrait prices',
  hooks: refreshGlobalOnChange('service-prices'),
  admin: { group: 'Settings', hidden: hideFromHelpers, description: 'Starting prices shown on Book an Event, Custom Portraits and the home page, and the photo-and-drawing examples on Custom Portraits.' },
  access: { read: anyone, update: isOwner },
  fields: [
    {
      name: 'events',
      label: 'Event rangoli',
      type: 'group',
      admin: { description: SAMPLE },
      fields: [
        { type: 'row', fields: [rupees('small', 'Small, up to 4×4 ft'), rupees('medium', 'Medium, about 6×6 ft'), rupees('large', 'Large, 10×10 ft or more')] },
        { name: 'travelNote', label: 'Travel note', type: 'text', localized: true, admin: { description: 'e.g. "Travel outside Pune is added to the quote."' } },
      ],
    },
    {
      name: 'portraits',
      label: 'Custom portraits',
      type: 'group',
      admin: { description: SAMPLE },
      fields: [
        medium('pencil', 'Pencil'),
        medium('charcoal', 'Charcoal'),
        medium('colour', 'Colour'),
        {
          type: 'row',
          fields: [
            { name: 'extraPersonPercent', label: 'Each extra person (+%)', type: 'number', min: 0 },
            { name: 'advancePercent', label: 'Advance (%)', type: 'number', min: 0, max: 100 },
          ],
        },
      ],
    },
    {
      name: 'portraitExamples',
      label: 'Portrait examples',
      labels: { singular: 'Example', plural: 'Examples' },
      type: 'array',
      maxRows: 3,
      admin: { description: "Up to 3 of a customer's photo next to your finished drawing. Visitors drag a line across to compare. Only add one when the customer has said yes." },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'photo', label: "Customer's photo", type: 'upload', relationTo: 'media', required: true, filterOptions: { mimeType: { contains: 'image' } } },
            { name: 'drawing', label: 'Your drawing', type: 'upload', relationTo: 'media', required: true, filterOptions: { mimeType: { contains: 'image' } } },
          ],
        },
        { name: 'caption', label: 'Caption (optional)', type: 'text', localized: true, maxLength: 90, admin: { description: 'e.g. "Aaji and Ajoba, charcoal, A3".' } },
        {
          name: 'permission',
          label: 'The customer said yes to showing this on the website',
          type: 'checkbox',
          required: true,
          validate: ((value) => value === true || 'Tick this once the customer has said yes, or remove the example.') as CheckboxFieldValidation,
        },
      ],
    },
  ],
}
