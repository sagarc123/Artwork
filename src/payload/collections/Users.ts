import type { CollectionConfig } from 'payload'
import { hasRole, isOwner, ownerOnlyField, ROLES } from '../access'

/** Admin panel accounts (the artist and any helpers). */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email', group: 'Settings', defaultColumns: ['name', 'email', 'roles'] },
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
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      saveToJWT: true,
      // The first account created becomes the owner.
      defaultValue: ['owner'],
      options: [
        { label: 'Owner — everything, including refunds and staff', value: ROLES[0] },
        { label: 'Staff — orders, shipping and enquiries', value: ROLES[1] },
        { label: 'Editor — products, artworks and courses', value: ROLES[2] },
      ],
      access: { create: ownerOnlyField, update: ownerOnlyField },
    },
  ],
}
