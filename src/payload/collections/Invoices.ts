import type { CollectionConfig, Field } from 'payload'
import { isOrderStaff } from '../access'

const money = (name: string): Field => ({ name, type: 'number' })

/**
 * GST invoices (or bills of supply before GST registration). Issued only by the website, numbered in
 * sequence per financial year, and never edited: corrections go through a credit note. Keep for 8 years.
 */
export const Invoices: CollectionConfig = {
  slug: 'invoices',
  labels: { singular: 'Invoice', plural: 'Invoices' },
  admin: {
    useAsTitle: 'number',
    group: 'Customers',
    defaultColumns: ['number', 'issuedAt', 'documentType', 'order'],
    description: 'Made automatically when an order is paid online, or when a cash-on-delivery order is delivered. They cannot be changed. Open one and tap the eye button for the PDF.',
    components: { beforeListTable: [{ path: '/payload/admin/Cells#EmptyNote', clientProps: { text: 'No invoices yet. One is made for each order once it is paid (cash on delivery: once delivered).' } }] },
    preview: (doc) => (doc.orderPublicId ? `/api/invoices/${doc.orderPublicId}` : null),
  },
  access: { read: isOrderStaff, create: () => false, update: () => false, delete: () => false },
  defaultSort: '-issuedAt',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'number', label: 'Invoice no.', type: 'text', required: true, unique: true, index: true },
        {
          name: 'documentType',
          label: 'Kind',
          type: 'select',
          required: true,
          options: [
            { label: 'Tax invoice', value: 'tax_invoice' },
            { label: 'Bill of supply (no GSTIN yet)', value: 'bill_of_supply' },
          ],
        },
        { name: 'issuedAt', label: 'Date', type: 'date', required: true },
        { name: 'financialYear', label: 'Financial year', type: 'text', required: true },
      ],
    },
    { name: 'order', type: 'relationship', relationTo: 'orders', unique: true, index: true },
    { name: 'orderPublicId', type: 'text', index: true, admin: { hidden: true } },
    {
      name: 'seller',
      type: 'group',
      fields: [
        { type: 'row', fields: [{ name: 'legalName', type: 'text' }, { name: 'gstin', type: 'text' }, { name: 'state', type: 'text' }] },
        { name: 'address', type: 'textarea' },
      ],
    },
    {
      name: 'buyer',
      type: 'group',
      fields: [
        { type: 'row', fields: [{ name: 'name', type: 'text' }, { name: 'phone', type: 'text' }] },
        { type: 'row', fields: [{ name: 'businessName', type: 'text' }, { name: 'gstin', type: 'text' }] },
        { name: 'address', type: 'textarea' },
        { name: 'state', label: 'State (place of supply)', type: 'text' },
      ],
    },
    {
      name: 'lines',
      type: 'array',
      fields: [
        { type: 'row', fields: [{ name: 'description', type: 'text' }, { name: 'hsn', type: 'text' }, { name: 'qty', type: 'number' }, { name: 'rate', type: 'number' }] },
        { type: 'row', fields: [money('taxable'), money('cgst'), money('sgst'), money('igst'), money('total')] },
      ],
    },
    {
      name: 'totals',
      label: 'Totals (₹)',
      type: 'group',
      fields: [{ type: 'row', fields: [money('taxable'), money('cgst'), money('sgst'), money('igst'), money('total')] }],
    },
  ],
}
