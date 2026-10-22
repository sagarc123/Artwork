import type { Access, FieldAccess } from 'payload'

/** Staff roles. Customers never log in here (their accounts come with milestone 4). */
export const ROLES = ['owner', 'staff', 'editor'] as const
export type Role = (typeof ROLES)[number]

export const hasRole = (user: unknown, ...wanted: Role[]) =>
  ((user as { roles?: Role[] } | null)?.roles ?? []).some((r) => wanted.includes(r))

export const anyone: Access = () => true
export const isOwner: Access = ({ req }) => hasRole(req.user, 'owner')
/** Anyone signed in to the admin panel. */
export const isStaff: Access = ({ req }) => hasRole(req.user, 'owner', 'staff', 'editor')
/** Content changes: owner and editors (staff handle orders only). */
export const canEditContent: Access = ({ req }) => hasRole(req.user, 'owner', 'editor')
/** Visitors see only published documents; staff also see drafts. */
export const publishedOrStaff: Access = ({ req }) =>
  hasRole(req.user, 'owner', 'staff', 'editor') || { _status: { equals: 'published' } }

export const ownerOnlyField: FieldAccess = ({ req }) => hasRole(req.user, 'owner')
