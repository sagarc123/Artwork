import type { GlobalConfig, NumberFieldSingleValidation, TextFieldSingleValidation } from 'payload'
import { anyone, hideFromHelpers, isOwner, staffOnlyField } from '../access'
import { refreshGlobalOnChange } from '../hooks'

const atLeastMin = ((value, { siblingData }) =>
  value == null || value >= ((siblingData as { minDays?: number })?.minDays ?? 1) ? true : 'Must be the same as or more than "from".') as NumberFieldSingleValidation

/** Cash-on-delivery rules and the tax defaults the checkout and invoices use. */
export const CommerceSettings: GlobalConfig = {
  slug: 'commerce-settings',
  label: 'Shop settings',
  hooks: refreshGlobalOnChange('commerce-settings'),
  admin: { group: 'Settings', hidden: hideFromHelpers, description: 'Cash on delivery, delivery times, gift wrap, GST and the festival sale.' },
  access: { read: anyone, update: isOwner },
  fields: [
    {
      name: 'cod',
      label: 'Cash on delivery',
      type: 'group',
      fields: [
        { name: 'enabled', label: 'Offer cash on delivery', type: 'checkbox', defaultValue: true },
        {
          type: 'row',
          fields: [
            { name: 'maxTotal', label: 'Largest COD order (₹, fee included)', type: 'number', required: true, defaultValue: 5000, min: 0 },
            { name: 'fee', label: 'COD fee (₹)', type: 'number', required: true, defaultValue: 49, min: 0 },
          ],
        },
        {
          name: 'blockedPincodes',
          label: 'No COD to these PIN codes',
          type: 'textarea',
          access: { read: staffOnlyField },
          admin: { description: 'Pincodes where COD is not offered, separated by commas or new lines.' },
        },
      ],
    },
    {
      name: 'delivery',
      label: 'Delivery times',
      type: 'group',
      admin: { description: 'What "Check delivery" on a product page tells buyers. Days are counted from the order day.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'minDays', label: 'Usually from (days)', type: 'number', required: true, defaultValue: 5, min: 1, max: 60 },
            { name: 'maxDays', label: 'Up to (days)', type: 'number', required: true, defaultValue: 8, min: 1, max: 60, validate: atLeastMin },
          ],
        },
        {
          name: 'zones',
          label: 'Faster or slower areas',
          type: 'array',
          labels: { singular: 'Area', plural: 'Areas' },
          admin: { description: 'Match by the first digits of the PIN code: 411 for Pune city, 41 for most of Pune district, 4 for Maharashtra. The longest match wins; other PIN codes get the days above.' },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'prefix',
                  label: 'PIN code starts with',
                  type: 'text',
                  required: true,
                  validate: ((value) => (/^[1-9]\d{0,2}$/.test(value ?? '') ? true : 'Enter the first 1 to 3 digits of the PIN code, e.g. 411.')) as TextFieldSingleValidation,
                },
                { name: 'minDays', label: 'From (days)', type: 'number', required: true, min: 1, max: 60 },
                { name: 'maxDays', label: 'Up to (days)', type: 'number', required: true, min: 1, max: 60, validate: atLeastMin },
                { name: 'cod', label: 'Cash on delivery here', type: 'checkbox', defaultValue: true },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'giftWrapFee',
      label: 'Gift wrap fee (₹)',
      type: 'number',
      defaultValue: 49,
      min: 0,
      admin: { description: 'Added when a buyer ticks "Gift wrap". Sample price: please confirm.' },
    },
    {
      name: 'tax',
      label: 'Tax (GST)',
      type: 'group',
      admin: { description: 'Ask your CA before changing these.' },
      fields: [
        {
          name: 'sellerState',
          label: 'Your state (place of supply)',
          type: 'text',
          required: true,
          defaultValue: 'Maharashtra',
          admin: { description: 'Buyers in this state pay CGST + SGST; everyone else pays IGST.' },
        },
        {
          type: 'row',
          fields: [
            { name: 'defaultTaxClassOriginal', label: 'GST for originals', type: 'relationship', relationTo: 'tax-classes' },
            { name: 'defaultTaxClassPrint', label: 'GST for prints', type: 'relationship', relationTo: 'tax-classes' },
          ],
        },
        { name: 'defaultTaxClassCourse', label: 'GST for courses (an online service)', type: 'relationship', relationTo: 'tax-classes', admin: { description: 'Online courses are a service, not goods. Ask your CA for the SAC code and rate.' } },
        {
          name: 'defaultTaxClass',
          label: 'GST for everything else',
          type: 'relationship',
          relationTo: 'tax-classes',
          admin: { description: 'Products take their GST from their type. A tax class set on a product (under Advanced) overrides these.' },
        },
      ],
    },
    {
      name: 'festivalSale',
      label: 'Festival sale',
      type: 'group',
      admin: { description: 'Takes a percentage off shop prices for a few days. The old price shows crossed out. Products are not changed.' },
      fields: [
        { name: 'preset', type: 'ui', admin: { components: { Field: '/payload/admin/FestivalPlanner#SalePresetField' } } },
        { name: 'enabled', label: 'Sale is on', type: 'checkbox' },
        {
          type: 'row',
          fields: [
            {
              name: 'percent',
              label: 'Percent off',
              type: 'number',
              admin: { step: 1, condition: (_, s) => Boolean(s?.enabled) },
              validate: (value: unknown, { siblingData }: { siblingData: Partial<{ enabled: boolean }> }) =>
                !siblingData?.enabled && value == null ? true : Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 50 ? true : 'Enter a whole number from 1 to 50.',
            },
            { name: 'startsAt', label: 'First day', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' }, condition: (_, s) => Boolean(s?.enabled), description: 'Empty: from now' } },
            { name: 'endsAt', label: 'Last day', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' }, condition: (_, s) => Boolean(s?.enabled), description: 'Empty: until you switch it off' } },
          ],
        },
        {
          name: 'categories',
          label: 'Only these categories',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          filterOptions: { scope: { in: ['shop', 'both'] } },
          admin: { condition: (_, s) => Boolean(s?.enabled), description: 'Leave empty for the whole shop.' },
        },
      ],
    },
  ],
}
