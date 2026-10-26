import type { Field, GlobalConfig } from 'payload'
import { anyone, hideFromHelpers, isOwner } from '../access'
import { refreshGlobalOnChange } from '../hooks'

const SAMPLE = 'SAMPLE value from setup — owner to confirm before launch.'
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
  admin: { group: 'Settings', hidden: hideFromHelpers, description: 'Starting prices shown on Book an Event, Custom Portraits and the home page.' },
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
  ],
}
