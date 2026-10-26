import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { hasRole, hideFromNonOwners, isOwner, ownerOnlyField, ROLES } from '../access'

/** An error whose message shows in the admin (see Orders). */
const refuse = (message: string) => Object.assign(new APIError(message, 400, null, true), { name: 'APIError' })

/** Admin panel accounts (the artist and any helpers). */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Account', plural: 'Accounts' },
  admin: {
    useAsTitle: 'name',
    group: 'Settings',
    defaultColumns: ['name', 'email', 'roles'],
    // Only the owner manages accounts; a helper still reaches their own via Account.
    description: 'People who can sign in here: you and your helper.',
    hidden: hideFromNonOwners,
  },
  auth: {
    tokenExpiration: 60 * 60 * 12, // 12 hours
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    // Owner sees everyone; others only their own account.
    read: ({ req }) => (!req.user ? false : hasRole(req.user, 'owner') || { id: { equals: req.user.id } }),
    create: isOwner,
    // Must be signed in: anonymous bulk updates have no id, and undefined === undefined would otherwise pass.
    update: ({ req, id }) => !!req.user && (hasRole(req.user, 'owner') || (id !== undefined && req.user.id === id)),
    delete: isOwner,
    // "Unlock (after too many wrong passwords)" is for the owner to help someone else.
    unlock: isOwner,
  },
  hooks: {
    // There is always an owner: nobody removes their own Owner role, and the last owner stays.
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        if (operation !== 'update' || !Array.isArray(data.roles) || !hasRole(originalDoc, 'owner') || data.roles.includes('owner')) return data
        if (req.user?.id === originalDoc.id) throw refuse('You cannot remove your own Owner role.')
        const { totalDocs } = await req.payload.count({ collection: 'users', where: { and: [{ roles: { in: ['owner'] } }, { id: { not_equals: originalDoc.id } }] }, req })
        if (!totalDocs) throw refuse('Keep at least one owner.')
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const { totalDocs } = await req.payload.count({ collection: 'users', where: { and: [{ roles: { in: ['owner'] } }, { id: { not_equals: id } }] }, req })
        const doc = await req.payload.findByID({ collection: 'users', id, depth: 0, req })
        if (hasRole(doc, 'owner') && !totalDocs) throw refuse('Keep at least one owner.')
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'roles',
      label: 'What they can do',
      type: 'select',
      hasMany: true,
      required: true,
      saveToJWT: true,
      // The first account created becomes the owner.
      defaultValue: ['owner'],
      options: [
        { label: 'Owner — everything, including refunds and staff', value: ROLES[0] },
        { label: 'Helper — orders, shipping and enquiries', value: ROLES[1] },
        { label: 'Editor — products and gallery (old role)', value: ROLES[2] },
      ],
      // Two roles to choose from. "Editor" stays valid for accounts that already have it (it can edit content, like the owner).
      filterOptions: ({ options, data }) =>
        (data?.roles as string[] | undefined)?.includes(ROLES[2]) ? options : options.filter((o) => (typeof o === 'string' ? o : o.value) !== ROLES[2]),
      access: { create: ownerOnlyField, update: ownerOnlyField },
    },
  ],
}
