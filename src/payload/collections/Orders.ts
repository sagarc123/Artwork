import type { CollectionConfig } from 'payload'
import { isOwner, isStaff } from '../access'

/** Shop orders. Created only by the website's checkout; staff update the delivery status. */
export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    group: 'Shop',
    defaultColumns: ['orderNumber', 'status', 'total', 'createdAt'],
    description: 'Orders from the website. Change the status as you pack and ship.',
  },
  access: { read: isStaff, create: () => false, update: isStaff, delete: isOwner },
  defaultSort: '-createdAt',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'orderNumber', type: 'text', index: true, admin: { readOnly: true } },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'pending_payment',
          options: [
            { label: 'Waiting for payment', value: 'pending_payment' },
            { label: 'Paid — to pack', value: 'paid' },
            { label: 'Packed', value: 'packed' },
            { label: 'Shipped', value: 'shipped' },
            { label: 'Delivered', value: 'delivered' },
            { label: 'Cancelled', value: 'cancelled' },
            { label: 'Needs refund', value: 'needs_refund' },
            { label: 'Refunded', value: 'refunded' },
          ],
        },
      ],
    },
    { name: 'publicId', type: 'text', unique: true, index: true, admin: { hidden: true } },
    {
      name: 'items',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products' },
        { name: 'title', type: 'text' },
        { name: 'variantId', type: 'text' },
        { name: 'variantLabel', type: 'text' },
        { name: 'frameLabel', type: 'text' },
        { name: 'type', type: 'text' },
        { type: 'row', fields: [{ name: 'unitPrice', type: 'number' }, { name: 'qty', type: 'number' }, { name: 'lineTotal', type: 'number' }] },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'subtotal', type: 'number', admin: { readOnly: true } },
        { name: 'shipping', type: 'number', admin: { readOnly: true } },
        { name: 'total', label: 'Total (₹)', type: 'number', admin: { readOnly: true } },
      ],
    },
    {
      name: 'customer',
      type: 'group',
      fields: [{ type: 'row', fields: [{ name: 'name', type: 'text' }, { name: 'phone', type: 'text' }, { name: 'email', type: 'email' }] }],
    },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'line1', type: 'text' },
        { name: 'line2', type: 'text' },
        { type: 'row', fields: [{ name: 'city', type: 'text' }, { name: 'state', type: 'text' }, { name: 'pincode', type: 'text' }] },
      ],
    },
    { name: 'note', type: 'textarea' },
    {
      type: 'row',
      fields: [
        { name: 'razorpayOrderId', type: 'text', index: true, admin: { readOnly: true } },
        { name: 'razorpayPaymentId', type: 'text', admin: { readOnly: true } },
      ],
    },
    { type: 'row', fields: [{ name: 'paidAt', type: 'date', admin: { readOnly: true } }, { name: 'reservedUntil', type: 'date', admin: { readOnly: true } }] },
    { name: 'locale', type: 'text', admin: { hidden: true } },
  ],
}
