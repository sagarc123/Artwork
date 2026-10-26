import type { GlobalConfig } from 'payload'
import { anyone, hideFromHelpers, isOwner, staffOnlyField } from '../access'
import { refreshGlobalOnChange } from '../hooks'

/** Cash-on-delivery rules and the tax defaults the checkout and invoices use. */
export const CommerceSettings: GlobalConfig = {
  slug: 'commerce-settings',
  label: 'Shop settings',
  hooks: refreshGlobalOnChange('commerce-settings'),
  admin: { group: 'Settings', hidden: hideFromHelpers, description: 'Cash on delivery, gift wrap, GST and the festival sale.' },
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
