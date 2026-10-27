import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter, SetStepNav } from '@payloadcms/ui'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { hasRole, type Role } from '../access'

type Props = { view: AdminViewServerProps; path: string; title: string; roles: Role[]; intro?: ReactNode; children: ReactNode }

/**
 * Our own admin pages (Customers, Festival planner, Add a call) in the usual frame: menu, top bar, breadcrumb.
 * Payload lets anyone reach a custom page, so the sign-in and role checks live here.
 */
export function AdminPage({ view, path, title, roles, intro, children }: Props) {
  const { req, permissions, visibleEntities, locale } = view.initPageResult
  const user = req.user
  if (!user) redirect(`/admin/login?redirect=${encodeURIComponent(`/admin${path}`)}`)
  const allowed = hasRole(user, ...roles)
  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={view.params}
      payload={req.payload}
      permissions={permissions}
      searchParams={view.searchParams}
      user={user}
      visibleEntities={visibleEntities}
    >
      <SetStepNav nav={[{ label: title, url: `/admin${path}` }]} />
      <Gutter className="tool-page">
        <h1 className="tool-page__title">{title}</h1>
        {allowed ? (
          <>
            {intro && <p className="tool-page__intro">{intro}</p>}
            {children}
          </>
        ) : (
          <p className="empty-note">
            Your account can’t open this page. Ask the owner if you need it. <Link href="/admin">Back to Today</Link>
          </p>
        )}
      </Gutter>
    </DefaultTemplate>
  )
}

/** One search param as a string ("" when missing). */
export const param = (view: AdminViewServerProps, key: string) => {
  const v = view.searchParams?.[key]
  return String(Array.isArray(v) ? v[0] : (v ?? ''))
}

/** "27 Oct 2026" for a stored date or timestamp (as the database or API returns it), in India's calendar. */
export const day = (v: string | Date | null | undefined) =>
  v ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(v)) : '—'
