import type { CollectionConfig } from 'payload'
import { hasRole, isOwner, isStaff } from '../access'

/** HSN/SAC codes and GST rates, set by the CA. Rates are never hard-coded: they change. */
export const TaxClasses: CollectionConfig = {
  slug: 'tax-classes',
  admin: {
    useAsTitle: 'name',
    group: 'Settings',
    defaultColumns: ['name', 'hsn', 'rate'],
    description: 'GST rates per kind of product. Ask your CA before changing these.',
    hidden: ({ user }) => !hasRole(user, 'owner'),
  },
  access: { read: isStaff, create: isOwner, update: isOwner, delete: isOwner },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'hsn', label: 'HSN / SAC code', type: 'text', required: true },
        { name: 'rate', label: 'GST rate (%)', type: 'number', required: true, min: 0, max: 28 },
      ],
    },
  ],
}
