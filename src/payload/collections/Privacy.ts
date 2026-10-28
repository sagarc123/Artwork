import type { CollectionConfig } from 'payload'
import { hideFromNonOwners, isOwner } from '../access'

const locked = { update: () => false }

/**
 * Someone asked for a copy of their data, or for it to be erased (from their account, or by you in the admin).
 * The website does both at once and writes a line here, with the 30-day date the law allows.
 */
export const DataRequests: CollectionConfig = {
  slug: 'data-requests',
  labels: { singular: 'Privacy request', plural: 'Privacy requests' },
  admin: {
    useAsTitle: 'type',
    group: 'Courses',
    defaultColumns: ['type', 'customer', 'status', 'dueAt', 'createdAt'],
    description: 'Each time someone downloads their data or deletes their account, a line is added here. The website does the work straight away, so these show as "Done". The "Answer by" date is the 30 days the law allows.',
    hidden: hideFromNonOwners,
    components: { beforeListTable: [{ path: '/payload/admin/Cells#EmptyNote', clientProps: { text: 'No privacy requests yet.' } }] },
  },
  access: { read: isOwner, create: () => false, update: isOwner, delete: isOwner },
  disableDuplicate: true,
  defaultSort: '-createdAt',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'type', label: 'Asked for', type: 'select', required: true, access: locked, options: [{ label: 'A copy of their data', value: 'export' }, { label: 'Delete their data', value: 'erase' }] },
        { name: 'status', type: 'select', required: true, defaultValue: 'open', admin: { components: { Cell: '/payload/admin/Cells#StatusCell' } }, options: [{ label: 'Waiting', value: 'open' }, { label: 'Done', value: 'done' }] },
      ],
    },
    { name: 'customer', label: 'Student', type: 'relationship', relationTo: 'customers', index: true, access: locked },
    { name: 'source', label: 'Done from', type: 'select', access: locked, options: [{ label: 'Their account', value: 'account' }, { label: 'The admin', value: 'admin' }] },
    { type: 'row', fields: [{ name: 'dueAt', label: 'Answer by', type: 'date', required: true, access: locked }, { name: 'doneAt', label: 'Done on', type: 'date' }] },
  ],
}
