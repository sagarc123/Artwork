import { Check } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import config from '@payload-config'
import { getPayload } from 'payload'
import { AccountProfile } from '@/components/AccountProfile'
import { EmptyState } from '@/components/EmptyState'
import { MediaImage } from '@/components/MediaImage'
import { PageHero } from '@/components/PageHero'
import { alternates, localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { learnPath } from '@/lib/courses'
import { formatPrice } from '@/lib/site'
import type { Media } from '@/payload-types'
import { getCustomer } from '@/server/customer'

// Private and per person: always rendered on the server for the signed-in customer.
export const instant = false

const TABS = ['courses', 'orders', 'saved', 'profile'] as const
type Tab = (typeof TABS)[number]

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.account.metaTitle, robots: { index: false, follow: false }, alternates: alternates(await getLocale(), '/account') }
}

/** /account: My courses, My orders, Saved, Profile. Signed-out visitors go to /login and come back here. */
export default async function AccountPage({ searchParams }: PageProps<'/[lang]/account'>) {
  const locale = await getLocale()
  const t = await getDictionary()
  const a = t.account
  const { tab: raw } = await searchParams
  const tab: Tab = TABS.find((x) => x === (Array.isArray(raw) ? raw[0] : raw)) ?? 'courses'
  const me = await getCustomer()
  if (!me) redirect(`${localePath(locale, '/login')}?next=${encodeURIComponent(tab === 'courses' ? '/account' : `/account?tab=${tab}`)}`)
  const p = (path: string) => localePath(locale, path)
  const payload = await getPayload({ config })
  const date = (iso: string) => new Intl.DateTimeFormat(`${locale}-IN`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(iso))
  const link = 'press inline-flex h-13 items-center justify-center rounded-ui bg-kumkum px-6 font-semibold text-white'

  let body
  if (tab === 'courses') {
    // Only this customer's own seats: the query is pinned to the signed-in id.
    const { docs } = await payload.find({ collection: 'enrolments', where: { customer: { equals: me.id } }, sort: '-createdAt', limit: 100, depth: 2, locale })
    const seats = docs.flatMap((e) => (typeof e.course === 'object' ? [{ ...e, course: e.course }] : []))
    body = seats.length ? (
      <>
        <p className="mb-6 text-muted">{a.lessonsSoon}</p>
        <ul className="grid gap-6 md:grid-cols-2">
          {seats.map((e) => (
            <li key={e.id} className="grid grid-cols-[6rem_1fr] gap-4 rounded-ui bg-surface p-4 shadow-frame">
              <MediaImage media={typeof e.course.thumbnail === 'object' ? (e.course.thumbnail as Media) : null} alt={e.course.title} ratio="4/5" seed={e.course.slug} floor="charcoal" sizes="96px" />
              <div className="grid content-start gap-2">
                <p className="font-heading text-h3-sm">{e.course.title}</p>
                {e.childFirstName && <p className="text-muted">{a.forChild.replace('{name}', e.childFirstName)}</p>}
                <p className="text-muted">{a.since.replace('{date}', date(e.createdAt))}</p>
                {/* Part 2b points this at the lesson player. */}
                <Link href={p(learnPath(e.course.slug))} className="press mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-ui bg-kumkum px-5 font-semibold text-white">
                  <Check aria-hidden="true" className="size-5" />
                  {t.courses.goToCourse}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </>
    ) : (
      <EmptyState title={a.coursesEmpty}>
        <Link href={p('/courses')} className={`${link} mt-2`}>
          {a.browse}
        </Link>
      </EmptyState>
    )
  } else if (tab === 'orders') {
    // Orders placed from this account, plus earlier ones placed with the phone number it just proved it owns.
    const { docs } = await payload.find({
      collection: 'orders',
      where: { or: [{ account: { equals: me.id } }, { 'customer.phone': { equals: me.phone } }] },
      sort: '-createdAt',
      limit: 50,
      depth: 0,
    })
    body = docs.length ? (
      <ul className="grid gap-4">
        {docs.map((o) => (
          <li key={o.id} className="grid gap-3 rounded-ui bg-surface p-5 shadow-frame sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="grid gap-1">
              <p className="font-semibold">
                {o.orderNumber} · {formatPrice(o.total ?? 0)}
              </p>
              <p className="text-muted">
                {date(o.createdAt)} · {t.order.status[o.status]}
              </p>
              <p className="text-muted">{(o.items ?? []).map((i) => i.title).join(', ')}</p>
            </div>
            {o.publicId && (
              <Link href={p(`/order/${o.publicId}`)} className="press inline-flex h-12 items-center justify-center rounded-ui border border-border px-5 font-semibold hover:bg-charcoal/5">
                {a.viewOrder}
              </Link>
            )}
          </li>
        ))}
      </ul>
    ) : (
      <EmptyState title={a.ordersEmpty}>
        <Link href={p('/shop')} className={`${link} mt-2`}>
          {a.visitShop}
        </Link>
      </EmptyState>
    )
  } else if (tab === 'saved') {
    body = (
      <div className="grid max-w-xl justify-items-start gap-4">
        <p>{a.savedBody}</p>
        <p className="font-semibold">{a.savedCount.replace('{n}', String(me.savedSlugs.length))}</p>
        <Link href={p('/wishlist')} className={link}>
          {a.seeSaved}
        </Link>
      </div>
    )
  } else {
    body = <AccountProfile locale={locale} t={a} name={me.name} phone={me.phone} />
  }

  return (
    <>
      <PageHero title={me.name ? a.hi.replace('{name}', me.name) : a.hello} />
      <section className="bg-paper pt-4 pb-20 lg:pt-8 lg:pb-28">
        <div className="wrap grid gap-8">
          <nav aria-label={a.tabsLabel}>
            <ul className="flex flex-wrap gap-2">
              {TABS.map((x) => (
                <li key={x}>
                  <Link
                    href={`${p('/account')}${x === 'courses' ? '' : `?tab=${x}`}`}
                    aria-current={x === tab ? 'page' : undefined}
                    className={`inline-flex min-h-12 items-center rounded-ui border px-5 font-semibold ${x === tab ? 'border-transparent bg-kumkum text-white' : 'border-border hover:bg-charcoal/5'}`}
                  >
                    {a.tabs[x]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>{body}</div>
        </div>
      </section>
    </>
  )
}
