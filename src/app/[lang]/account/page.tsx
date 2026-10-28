import { Check } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import config from '@payload-config'
import { getPayload } from 'payload'
import { AccountProfile } from '@/components/AccountProfile'
import { EmptyState } from '@/components/EmptyState'
import { MediaImage } from '@/components/MediaImage'
import { ProgressBar } from '@/components/ProgressBar'
import { PageHero } from '@/components/PageHero'
import { alternates, localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { learnPath } from '@/lib/courses'
import { formatPrice } from '@/lib/site'
import type { Media } from '@/payload-types'
import { getCustomer } from '@/server/customer'
import { progressFor } from '@/server/learn'
import { showCertId } from '@/lib/learn'
import { MIN_PROGRESS, productBought } from '@/lib/reviews'
import { reviewedBy } from '@/server/reviews'

// Private and per person: always rendered on the server for the signed-in customer.
export const instant = false

const TABS = ['courses', 'certificates', 'orders', 'saved', 'profile'] as const
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
  const reviewed = await reviewedBy(me.id)
  // A parent with a kids or teen course seat: no trackers, cookie box or newsletter box on any account page.
  const under18 = (await payload.count({ collection: 'enrolments', where: { and: [{ customer: { equals: me.id } }, { 'course.audience': { in: ['kids', 'teens'] } }] } })).totalDocs > 0
  const reviewLink = 'ink-link inline-flex min-h-12 items-center font-semibold text-peacock'
  const link = 'press inline-flex h-13 items-center justify-center rounded-ui bg-kumkum px-6 font-semibold text-white'

  let body
  if (tab === 'courses') {
    // Only this customer's own seats: the query is pinned to the signed-in id.
    const { docs } = await payload.find({ collection: 'enrolments', where: { customer: { equals: me.id } }, sort: '-createdAt', limit: 100, depth: 2, locale })
    const seats = docs.flatMap((e) => (typeof e.course === 'object' ? [{ ...e, course: e.course }] : []))
    const progress = await progressFor(payload, seats.map((e) => ({ id: e.id, course: e.course.id })))
    body = seats.length ? (
      <>
        <ul className="grid gap-6 md:grid-cols-2">
          {seats.map((e) => (
            <li key={e.id} className="grid grid-cols-[6rem_1fr] gap-4 rounded-ui bg-surface p-4 shadow-frame">
              <MediaImage media={typeof e.course.thumbnail === 'object' ? (e.course.thumbnail as Media) : null} alt={e.course.title} ratio="4/5" seed={e.course.slug} floor="charcoal" sizes="96px" />
              <div className="grid content-start gap-2">
                <p className="font-heading text-h3-sm">{e.course.title}</p>
                {e.childFirstName && <p className="text-muted">{a.forChild.replace('{name}', e.childFirstName)}</p>}
                <p className="text-muted">{a.since.replace('{date}', date(e.createdAt))}</p>
                {progress.get(e.id) && <ProgressBar done={progress.get(e.id)!.done} total={progress.get(e.id)!.total} label={a.progress.replace('{done}', String(progress.get(e.id)!.done)).replace('{total}', String(progress.get(e.id)!.total))} />}
                {/* Opens the lesson you were last on, or the first. */}
                <Link href={p(learnPath(e.course.slug))} className="press mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-ui bg-kumkum px-5 font-semibold text-white">
                  <Check aria-hidden="true" className="size-5" />
                  {progress.get(e.id)?.done ? t.courses.goToCourse : a.start}
                </Link>
                {/* Reviews open at 30% of the lessons (checked again on the server). */}
                {(progress.get(e.id)?.percent ?? 0) >= MIN_PROGRESS &&
                  (reviewed.courses.has(e.course.id) ? (
                    <p className="font-semibold text-leaf">{t.reviews.reviewed}</p>
                  ) : (
                    <Link href={p(`/review/course/${e.course.id}`)} className={reviewLink}>
                      {t.reviews.write}
                    </Link>
                  ))}
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
  } else if (tab === 'certificates') {
    const { docs } = await payload.find({ collection: 'certificates', where: { customer: { equals: me.id } }, sort: '-issuedAt', limit: 100, depth: 1, locale })
    body = docs.length ? (
      <ul className="grid gap-4 md:grid-cols-2">
        {docs.map((c) => (
          <li key={c.id} className="grid gap-2 rounded-ui bg-surface p-5 shadow-frame">
            <p className="font-heading text-h3-sm">{typeof c.course === 'object' ? c.course.title : ''}</p>
            <p className="text-muted">
              {showCertId(c.publicId)} · {c.status === 'valid' ? a.certIssued.replace('{date}', date(c.issuedAt)) : a.certWithdrawn}
            </p>
            {c.status === 'valid' && (
              <div className="flex flex-wrap gap-x-6">
                <Link href={p(`/certificate/${c.publicId}`)} className="ink-link inline-flex min-h-12 items-center font-semibold text-peacock">
                  {a.certView}
                </Link>
                <Link href={p(`/verify/${c.publicId}`)} className="ink-link inline-flex min-h-12 items-center font-semibold text-peacock">
                  {a.certCheck}
                </Link>
              </div>
            )}
          </li>
        ))}
      </ul>
    ) : (
      <EmptyState title={a.certsEmpty} />
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
              {/* One link per piece once the order is delivered (or a digital one is paid). */}
              {(o.items ?? []).flatMap((i) => (typeof i.product === 'number' && productBought([{ status: o.status, items: [{ product: i.product, type: i.type }] }], i.product) ? [{ id: i.product, title: i.title }] : [])).map((i) =>
                reviewed.products.has(i.id) ? (
                  <p key={i.id} className="font-semibold text-leaf">
                    {i.title}: {t.reviews.reviewed}
                  </p>
                ) : (
                  <Link key={i.id} href={p(`/review/product/${i.id}`)} className={reviewLink}>
                    {t.reviews.write}: {i.title}
                  </Link>
                ),
              )}
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
    body = <AccountProfile locale={locale} t={a} n={t.newsletter} p={t.accountPrivacy} name={me.name} phone={me.phone} />
  }

  return (
    <>
      {under18 && <span hidden data-under18 />}
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
