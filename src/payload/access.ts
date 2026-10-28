import type { Access, FieldAccess } from 'payload'

/** Staff roles. Customers are a separate collection with no login of their own (see Students.ts), so they never reach the admin. */
export const ROLES = ['owner', 'staff', 'editor'] as const
export type Role = (typeof ROLES)[number]

export const hasRole = (user: unknown, ...wanted: Role[]) =>
  ((user as { roles?: Role[] } | null)?.roles ?? []).some((r) => wanted.includes(r))

export const anyone: Access = () => true
export const isOwner: Access = ({ req }) => hasRole(req.user, 'owner')
/** Anyone signed in to the admin panel. */
export const isStaff: Access = ({ req }) => hasRole(req.user, 'owner', 'staff', 'editor')
/** Customer data (orders, enquiries): owner and order staff, not content editors. */
export const isOrderStaff: Access = ({ req }) => hasRole(req.user, 'owner', 'staff')
/** Content changes: owner and editors (staff handle orders only). */
export const canEditContent: Access = ({ req }) => hasRole(req.user, 'owner', 'editor')
/** Visitors see only published documents; staff also see drafts. */
export const publishedOrStaff: Access = ({ req }) =>
  hasRole(req.user, 'owner', 'staff', 'editor') || { _status: { equals: 'published' } }

export const ownerOnlyField: FieldAccess = ({ req }) => hasRole(req.user, 'owner')
/** Hidden from the public REST/GraphQL API. The site's own Local API reads skip access checks, so pages still see it. */
export const staffOnlyField: FieldAccess = ({ req }) => hasRole(req.user, 'owner', 'staff', 'editor')

/** admin.hidden: helpers (orders only) don't see shop, gallery and settings screens they can't change. */
export const hideFromHelpers = ({ user }: { user: unknown }) => !hasRole(user, 'owner', 'editor')
/** admin.hidden: owner-only screens. */
export const hideFromNonOwners = ({ user }: { user: unknown }) => !hasRole(user, 'owner')
