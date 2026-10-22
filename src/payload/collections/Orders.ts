import type { CollectionConfig, Field } from 'payload'
import { APIError } from 'payload'
import { hasRole, isOrderStaff, isOwner } from '../access'

const locked = { update: () => false }

/** Every field except status and note is written only by the checkout code. */
const lock = (fields: Field[]): Field[] =>
  fields.map((f) => ('fields' in f && f.type === 'row' ? { ...f, fields: lock(f.fields) } : 'name' in f ? ({ ...f, access: locked } as Field) : f))

/** An error whose message staff see in the admin. The production build blanks class names, and Payload hides nameless errors. */
const refuse = (message: string, status = 400) => Object.assign(new APIError(message, status, null, true), { name: 'APIError' })

const OWNER_ONLY_STATUSES = ['paid', 'needs_refund', 'refunded']

/** Shop orders. Created only by the website's checkout; staff move them through packing and shipping. */
export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    group: 'Shop',
    defaultColumns: ['orderNumber', 'status', 'total', 'createdAt'],
    description: 'Orders from the website. Change the status as you pack and ship. Cash-on-delivery orders: confirm on WhatsApp first.',
    // Opens the invoice PDF once one is issued, otherwise the customer's order page.
    preview: async (doc, { req }) => {
      if (!doc.publicId) return null
      const { totalDocs } = await req.payload.count({ collection: 'invoices', where: { order: { equals: doc.id } } })
      return totalDocs ? `/api/invoices/${doc.publicId}` : `/order/${doc.publicId}`
    },
  },
  // Orders contain customers' names, phones and addresses.
  access: { read: isOrderStaff, create: () => false, update: isOrderStaff, delete: isOwner },
  defaultSort: '-createdAt',
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req, operation }) => {
        if (operation !== 'update' || !req.user || !originalDoc || data.status === undefined || data.status === originalDoc.status) return data
        const from: string = originalDoc.status
        const to: string = data.status
        // Money-related statuses are the owner's call; payments themselves are recorded by the checkout code (no user).
        if (OWNER_ONLY_STATUSES.includes(to) && !hasRole(req.user, 'owner')) throw refuse('Only the owner can set this status.', 403)
        if (to === 'pending_payment' || to === 'cod_pending_confirmation') throw refuse('An order cannot go back to waiting.')
        if (to === 'cod_confirmed' && from !== 'cod_pending_confirmation') throw refuse('Only a cash-on-delivery order waiting for confirmation can be confirmed.')
        const svc = await import('@/server/order-service')
        const items = originalDoc.items ?? []
        if (from === 'pending_payment' || from === 'cod_pending_confirmation') {
          if (to !== 'cancelled' && to !== 'cod_confirmed') throw refuse('Confirm or cancel this order first.')
          // Stock changes with the status, atomically; false means someone else changed it first.
          const ok = to === 'cancelled' ? await svc.cancelPending(originalDoc.id, items) : await svc.confirmCod(originalDoc.id, items)
          if (!ok) throw refuse('This order was just changed by someone else. Please reload.', 409)
        } else if (to === 'cancelled' && originalDoc.paymentMode === 'cod' && ['cod_confirmed', 'packed', 'shipped'].includes(from)) {
          await svc.cancelConfirmedCod(originalDoc.id, items)
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        // Prepaid orders get their invoice when paid; COD orders on delivery (this also retries a missed one).
        if (doc.status === 'delivered' && previousDoc?.status !== 'delivered') {
          const { issueInvoice } = await import('@/server/invoices')
          await issueInvoice(doc.id, req)
        }
        return doc
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
            { label: 'COD — waiting for customer to confirm', value: 'cod_pending_confirmation' },
            { label: 'COD confirmed — to pack', value: 'cod_confirmed' },
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
          { name: 'codFee', label: 'COD fee', type: 'number', admin: { readOnly: true } },
          { name: 'total', label: 'Total (₹)', type: 'number', admin: { readOnly: true } },
        ],
      },
      {
        name: 'paymentMode',
        type: 'select',
        defaultValue: 'prepaid',
        admin: { readOnly: true },
        options: [
          { label: 'Paid online', value: 'prepaid' },
          { label: 'Cash on delivery', value: 'cod' },
        ],
      },
      {
        name: 'customer',
        type: 'group',
        admin: { readOnly: true },
        fields: [
          { type: 'row', fields: [{ name: 'name', type: 'text' }, { name: 'phone', type: 'text' }, { name: 'email', type: 'email' }] },
          { type: 'row', fields: [{ name: 'businessName', type: 'text' }, { name: 'gstin', label: 'GSTIN', type: 'text' }] },
        ],
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
