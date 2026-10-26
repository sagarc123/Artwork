import type { CollectionConfig, Field } from 'payload'
import { APIError } from 'payload'
import { hasRole, isOrderStaff, isOwner } from '../access'
import { notifyOwner } from '../hooks'
import { cancelPlan, stepBack } from '../../lib/orders'

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
    group: 'Customers',
    defaultColumns: ['orderNumber', 'status', 'total', 'paymentMode', 'createdAt'],
    listSearchableFields: ['orderNumber', 'customer.name', 'customer.phone'],
    description: 'Open an order and use the big buttons as you confirm, pack and ship it.',
    components: {
      beforeListTable: [
        {
          path: '/payload/admin/QuickFilters#QuickFilters',
          clientProps: {
            collection: 'orders',
            field: 'status',
            tabs: [
              { label: 'To confirm', values: ['cod_pending_confirmation'] },
              { label: 'To pack', values: ['paid', 'cod_confirmed'] },
              { label: 'Packed', values: ['packed'] },
              { label: 'Shipped', values: ['shipped'] },
              { label: 'Needs refund', values: ['needs_refund'], ownerOnly: true },
              { label: 'All' },
            ],
          },
        },
      ],
    },
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
        const owner = hasRole(req.user, 'owner')
        const svc = await import('@/server/order-service')
        const items = originalDoc.items ?? []
        // "Undo" right after a one-tap button: one step back (packed → paid, shipped → packed), whoever tapped it.
        const undo = to === stepBack(from, originalDoc.paymentMode)
        if (to === 'cancelled') {
          const plan = cancelPlan(from, originalDoc.paymentMode)
          if (!plan) throw refuse('This order can no longer be cancelled.')
          if (plan.ownerOnly && !owner) throw refuse('Only the owner can cancel a paid order (the money has to be refunded).', 403)
          // Stock changes with the status, atomically; false means someone else changed it first.
          if (!(await svc.cancelOrder(originalDoc.id, from, plan, items))) throw refuse('This order was just changed by someone else. Please reload.', 409)
          data.status = plan.status
          return data
        }
        // Money-related statuses are the owner's call; payments themselves are recorded by the checkout code (no user).
        if (OWNER_ONLY_STATUSES.includes(to) && !owner && !undo) throw refuse('Only the owner can set this status.', 403)
        if (to === 'pending_payment' || to === 'cod_pending_confirmation') throw refuse('An order cannot go back to waiting.')
        if (from === 'pending_payment' || from === 'cod_pending_confirmation') {
          if (to !== 'cod_confirmed' || from !== 'cod_pending_confirmation') throw refuse('Confirm or cancel this order first.')
          if (!(await svc.confirmCod(originalDoc.id, items))) throw refuse('This order was just changed by someone else. Please reload.', 409)
          return data
        }
        if (to === 'cod_confirmed' && !undo) throw refuse('Only a cash-on-delivery order waiting for confirmation can be confirmed.')
        if (to === 'shipped' && !((data.courier ?? originalDoc.courier) && (data.trackingNumber ?? originalDoc.trackingNumber)))
          throw refuse('Add the courier and tracking number first.')
        return data
      },
    ],
    afterChange: [
      notifyOwner('order'),
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
    { name: 'actions', type: 'ui', admin: { components: { Field: '/payload/admin/OrderActions#OrderActions' } } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending_payment',
      options: [
        { label: 'Waiting for payment', value: 'pending_payment' },
        { label: 'COD: customer to confirm', value: 'cod_pending_confirmation' },
        { label: 'COD confirmed: to pack', value: 'cod_confirmed' },
        { label: 'Paid: to pack', value: 'paid' },
        { label: 'Packed', value: 'packed' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Needs refund', value: 'needs_refund' },
        { label: 'Refunded', value: 'refunded' },
      ],
      // Lists, Today and the maintenance job all filter by status.
      index: true,
      // Only choices that can work: never back to "waiting", no money statuses for helpers, and Cancel only where it can be done.
      // The hook above still guards them all.
      filterOptions: ({ options, req, data }) =>
        options.filter((o) => {
          const v = typeof o === 'string' ? o : o.value
          const owner = hasRole(req.user, 'owner')
          const back = stepBack(data?.status, data?.paymentMode) === v
          if (v === data?.status) return true
          if (v === 'pending_payment' || v === 'cod_pending_confirmation') return false
          if (v === 'cancelled') {
            const plan = cancelPlan(data?.status, data?.paymentMode)
            return !!plan && (owner || !plan.ownerOnly)
          }
          if (v === 'cod_confirmed') return data?.status === 'cod_pending_confirmation' || back
          return owner || back || !OWNER_ONLY_STATUSES.includes(v)
        }),
      admin: {
        description: 'The big buttons above change this for you. Change it here only to cancel or fix a mistake. Cancelling a paid order puts its stock back and marks it "Needs refund".',
        components: { Cell: '/payload/admin/Cells#StatusCell' },
      },
    },
    // Staff fill these in when the parcel leaves; "Mark shipped" needs both.
    {
      type: 'row',
      admin: { condition: (data) => ['paid', 'cod_confirmed', 'packed', 'shipped', 'delivered'].includes(data?.status) },
      fields: [
        { name: 'courier', type: 'text', admin: { description: 'e.g. India Post, DTDC, Delhivery' } },
        { name: 'trackingNumber', label: 'Tracking number', type: 'text' },
      ],
    },
    { name: 'note', label: 'Your notes (private)', type: 'textarea', admin: { description: 'Only you and your helper see this.' } },
    {
      type: 'collapsible',
      label: 'Full order details (as the customer placed it)',
      admin: { initCollapsed: true, description: 'Saved by the website at checkout. Nothing here can be changed.' },
      fields: lock([
        { name: 'orderNumber', label: 'Order number', type: 'text', index: true, admin: { readOnly: true, components: { Cell: '/payload/admin/Cells#OrderCell' } } },
        { name: 'publicId', type: 'text', unique: true, index: true, admin: { hidden: true } },
        {
          name: 'items',
          type: 'array',
          admin: { readOnly: true },
          fields: [
            { name: 'product', type: 'relationship', relationTo: 'products' },
            { name: 'title', type: 'text' },
            { name: 'variantId', type: 'text', admin: { hidden: true } },
            { type: 'row', fields: [{ name: 'variantLabel', label: 'Size', type: 'text' }, { name: 'frameLabel', label: 'Frame', type: 'text' }] },
            { name: 'type', type: 'text', admin: { hidden: true } },
            { type: 'row', fields: [{ name: 'unitPrice', label: 'Price (₹)', type: 'number' }, { name: 'qty', label: 'Qty', type: 'number' }, { name: 'lineTotal', label: 'Line total (₹)', type: 'number' }] },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'subtotal', label: 'Items (₹)', type: 'number', admin: { readOnly: true } },
            { name: 'shipping', label: 'Shipping (₹)', type: 'number', admin: { readOnly: true } },
            { name: 'codFee', label: 'COD fee (₹)', type: 'number', admin: { readOnly: true } },
            { name: 'giftWrapFee', label: 'Gift wrap (₹)', type: 'number', admin: { readOnly: true } },
            { name: 'total', label: 'Total (₹)', type: 'number', admin: { readOnly: true, components: { Cell: '/payload/admin/Cells#MoneyCell' } } },
          ],
        },
        {
          name: 'paymentMode',
          label: 'Payment',
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
            { type: 'row', fields: [{ name: 'name', type: 'text' }, { name: 'phone', type: 'text', index: true }, { name: 'email', type: 'email' }] },
            { type: 'row', fields: [{ name: 'businessName', label: 'Business name', type: 'text' }, { name: 'gstin', label: 'GSTIN', type: 'text' }] },
          ],
        },
        {
          name: 'address',
          type: 'group',
          admin: { readOnly: true },
          fields: [
            { name: 'line1', label: 'Address line 1', type: 'text' },
            { name: 'line2', label: 'Address line 2', type: 'text' },
            { type: 'row', fields: [{ name: 'city', type: 'text' }, { name: 'state', type: 'text' }, { name: 'pincode', label: 'PIN code', type: 'text' }] },
          ],
        },
        { name: 'giftNote', label: 'Gift card message (print on the card, not the invoice)', type: 'textarea', admin: { readOnly: true } },
        {
          type: 'row',
          fields: [
            { name: 'razorpayOrderId', label: 'Razorpay order ID', type: 'text', index: true, admin: { readOnly: true } },
            { name: 'razorpayPaymentId', label: 'Razorpay payment ID', type: 'text', admin: { readOnly: true, description: 'Search this in Razorpay to refund.' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'paidAt', label: 'Paid at', type: 'date', admin: { readOnly: true } },
            { name: 'reservedUntil', label: 'Stock held until', type: 'date', admin: { readOnly: true } },
          ],
        },
        { name: 'locale', type: 'text', admin: { hidden: true } },
      ]),
    },
  ],
}
