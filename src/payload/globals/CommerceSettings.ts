import type { GlobalConfig } from 'payload'
import { anyone, isOwner, staffOnlyField } from '../access'
import { refreshGlobalOnChange } from '../hooks'

/** Cash-on-delivery rules and the tax defaults the checkout and invoices use. */
export const CommerceSettings: GlobalConfig = {
  slug: 'commerce-settings',
  label: 'Commerce settings',
  hooks: refreshGlobalOnChange('commerce-settings'),
  admin: { group: 'Settings' },
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
          type: 'textarea',
          access: { read: staffOnlyField },
          admin: { description: 'Pincodes where COD is not offered, separated by commas or new lines.' },
        },
      ],
    },
    {
      name: 'tax',
      type: 'group',
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
          name: 'defaultTaxClass',
          type: 'relationship',
          relationTo: 'tax-classes',
          admin: { description: 'Used for products without a tax class of their own.' },
        },
      ],
    },
  ],
}
