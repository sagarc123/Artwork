import type { CollectionConfig, Field } from 'payload'
import { APIError } from 'payload'
import { hasRole, isOrderStaff, isOwner } from '../access'

const locked = { update: () => false }

/** Every field except status and note is written only by the checkout code. */
const lock = (fields: Field[]): Field[] =>
  fields.map((f) => ('fields' in f && f.type === 'row' ? { ...f, fields: lock(f.fields) } : 'name' in f ? ({ ...f, access: locked } as Field) : f))

const OWNER_ONLY_STATUSES = ['paid', 'needs_refund', 'refunded']

/** Shop orders. Created only by the website's checkout; staff move them through packing and shipping. */
export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    group: 'Shop',
    defaultColumns: ['orderNumber', 'status', 'total', 'createdAt'],
    description: 'Orders from the website. Change the status as you pack and ship.',
  },
  // Orders contain customers' names, phones and addresses.
  access: { read: isOrderStaff, create: () => false, update: isOrderStaff, delete: isOwner },
  defaultSort: '-createdAt',
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req, operation }) => {
        if (operation !== 'update' || !req.user || !originalDoc || data.status === undefined || data.status === originalDoc.status) return data
        // Money-related statuses are the owner's call; payments themselves are recorded by the checkout code (no user).
        if (OWNER_ONLY_STATUSES.includes(data.status) && !hasRole(req.user, 'owner')) throw new APIError('Only the owner can set this status.', 403)
        if (originalDoc.status === 'pending_payment') {
          if (data.status !== 'cancelled') throw new APIError('An unpaid order can only be cancelled.', 400)
          const { cancelPending } = await import('@/server/order-service')
          await cancelPending(originalDoc.id, originalDoc.items ?? [])
        }
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'orderNumber', type: 'text', index: true, access: locked, admin: { readOnly: true } },
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
    ...lock([
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
        admin: { readOnly: true },
        fields: [{ type: 'row', fields: [{ name: 'name', type: 'text' }, { name: 'phone', type: 'text' }, { name: 'email', type: 'email' }] }],
      },
      {
        name: 'address',
        type: 'group',
        admin: { readOnly: true },
        fields: [
          { name: 'line1', type: 'text' },
          { name: 'line2', type: 'text' },
          { type: 'row', fields: [{ name: 'city', type: 'text' }, { name: 'state', type: 'text' }, { name: 'pincode', type: 'text' }] },
        ],
      },
    ]),
    { name: 'note', type: 'textarea' },
    ...lock([
      {
        type: 'row',
        fields: [
          { name: 'razorpayOrderId', type: 'text', index: true, admin: { readOnly: true } },
          { name: 'razorpayPaymentId', type: 'text', admin: { readOnly: true } },
        ],
      },
      { type: 'row', fields: [{ name: 'paidAt', type: 'date', admin: { readOnly: true } }, { name: 'reservedUntil', type: 'date', admin: { readOnly: true } }] },
      { name: 'locale', type: 'text', admin: { hidden: true } },
    ]),
  ],
}
