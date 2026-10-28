import type { ServerProps } from 'payload'
import { CalendarClock, CheckCircle2, ExternalLink, Inbox, IndianRupee, MessageCircle, Package, PackageCheck, Percent, Plus, Star, Truck, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { hasRole } from '../access'
import { ago, listUrl } from '../../lib/admin'
import { changeLabel, festivalPlan, percentChange, sparkBars } from '../../lib/admin-tools'
import { indiaToday } from '../../lib/dates'
import { formatPrice } from '../../lib/site'
import { salePresetData, salesSummary, SOLD } from '../../server/admin-data'
import { SalePreset } from './SalePreset'
const LOW_STOCK = 2
const ASKING: Record<string, string> = { event: 'event rangoli', portrait: 'portrait', workshop: 'workshop', general: 'message' }
/** Server render time (the page is rendered per request). */
const clock = () => Date.now()
const edit = (collection: string, id: number) => `/admin/collections/${collection}/${id}`

type Item = { id: number; label: string; note?: string; alert?: boolean; href: string }
/** urgent = waiting on you (kumkum), calm = nothing to do (leaf), info = just numbers. */
type Tone = 'urgent' | 'calm' | 'info'

type CardProps = { title: string; icon: LucideIcon; count?: number; href: string; items?: Item[]; empty: string; tone: Tone; children?: ReactNode }

function Card({ title, icon: Icon, count, href, items, empty, tone, children }: CardProps) {
  return (
    <section className={`today-card is-${tone}`}>
      <Link href={href} className="today-card__head">
        <span className="today-card__icon" aria-hidden="true">
          <Icon size={22} />
        </span>
        <h2>{title}</h2>
        {count !== undefined && <span className="today-card__count">{count}</span>}
      </Link>
      {children}
      {items && items.length > 0 ? (
        <ul>
          {items.map((it) => (
            <li key={it.id}>
              <Link href={it.href}>
                <span>{it.label}</span>
                {it.note && <small className={it.alert ? 'is-late' : undefined}>{it.note}</small>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        !children && <p className="today-card__empty">{empty}</p>
      )}
      {(count ?? 0) > (items?.length ?? 0) && (
        <Link href={href} className="today-card__more">
          See all {count}
        </Link>
      )}
    </section>
  )
}

/** Admin home: what needs doing today. Helpers see orders and enquiries; the owner also sees the shop and gallery. */
export async function Today({ payload, user }: ServerProps) {
  if (!user) return null
  const owner = hasRole(user, 'owner')
  const content = hasRole(user, 'owner', 'editor')
  const orders = hasRole(user, 'owner', 'staff')
  const now = clock()
  const since = (iso: string) => ago(now - Date.parse(iso))
  const orderItem = (o: { id: number; orderNumber?: string | null; customer?: { name?: string | null } | null; total?: number | null; createdAt: string }): Item => ({
    id: o.id,
    label: `${o.orderNumber ?? `#${o.id}`} · ${o.customer?.name ?? ''} · ${formatPrice(o.total ?? 0)}`,
    note: since(o.createdAt),
    href: edit('orders', o.id),
  })
  const findOrders = (status: string[]) =>
    payload.find({ collection: 'orders', where: { status: { in: status } }, sort: 'createdAt', limit: 5, depth: 0, select: { orderNumber: true, customer: true, total: true, createdAt: true } })

  const [site, enquiries, cod, toPack, shipped, sales, prints, festivals, preset, upcoming, reviews] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
    orders ? payload.find({ collection: 'enquiries', where: { status: { equals: 'new' } }, sort: 'createdAt', limit: 5, depth: 0, select: { name: true, type: true, createdAt: true } }) : null,
    orders ? findOrders(['cod_pending_confirmation']) : null,
    orders ? findOrders(['paid', 'cod_confirmed']) : null,
    orders ? findOrders(['shipped']) : null,
    owner ? salesSummary(payload, indiaToday(new Date(now))) : null,
    content ? payload.find({ collection: 'products', where: { type: { equals: 'print' } }, pagination: false, depth: 0, draft: true, select: { title: true, variants: true } }) : null,
    // Only dates that have passed: festivals without a date (like weddings) are fine as they are.
    content ? payload.find({ collection: 'festivals', where: { nextDate: { less_than: indiaToday(new Date(now)) } }, limit: 20, depth: 0, select: { name: true, nextDate: true } }) : null,
    owner ? salePresetData(payload) : null,
    // The next festival names the sale ("Start Diwali sale").
    owner ? payload.find({ collection: 'festivals', where: { nextDate: { greater_than_equal: indiaToday(new Date(now)) } }, sort: 'nextDate', limit: 1, depth: 0, select: { name: true, nextDate: true } }) : null,
    // New reviews wait for one tap (Approve or Hide) on their page.
    content ? payload.find({ collection: 'reviews', where: { status: { equals: 'pending' } }, sort: 'createdAt', limit: 5, depth: 1, select: { name: true, rating: true, product: true, course: true, createdAt: true } }) : null,
  ])
  const nextFestival = upcoming && preset ? festivalPlan(upcoming.docs, preset.today, new Map())[0] : undefined
  const replyHours = site.contact?.replyHours ?? 4
  const lowPrints = (prints?.docs ?? []).flatMap((p) => {
    const left = Math.min(...p.variants.map((v) => v.stock - (v.reserved ?? 0)))
    return left <= LOW_STOCK ? [{ id: p.id, label: p.title, note: left <= 0 ? 'Sold out' : `${left} left`, alert: left <= 0, href: edit('products', p.id) }] : []
  })
  const oldestNew = enquiries?.docs[0]
  const lateEnquiry = oldestNew ? now - Date.parse(oldestNew.createdAt) > replyHours * 3_600_000 : false
  const firstName = String((user as { name?: string }).name ?? '').split(' ')[0]
  const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' }).format(now)
  const waiting = (enquiries?.totalDocs ?? 0) + (cod?.totalDocs ?? 0) + (toPack?.totalDocs ?? 0)

  // Cards with something in them come first (waiting on you, then just news); empty ones fold into one "All clear" line.
  const cards: (CardProps & { key: string })[] = [
    enquiries && {
      key: 'enquiries',
      title: 'New enquiries',
      icon: Inbox,
      count: enquiries.totalDocs,
      href: listUrl('enquiries', 'status', ['new']),
      tone: 'urgent' as const,
      empty: 'no new enquiries',
      items: enquiries.docs.map((e) => {
        const late = now - Date.parse(e.createdAt) > replyHours * 3_600_000
        return { id: e.id, label: `${e.name} · ${ASKING[e.type] ?? e.type}`, note: since(e.createdAt), alert: late, href: edit('enquiries', e.id) }
      }),
      children: lateEnquiry && <p className="today-card__warn">The oldest came in {since(oldestNew!.createdAt)}: past your {replyHours} h reply promise.</p>,
    },
    cod && { key: 'cod', title: 'COD orders to confirm', icon: MessageCircle, count: cod.totalDocs, href: listUrl('orders', 'status', ['cod_pending_confirmation']), tone: 'urgent' as const, empty: 'no COD orders to confirm', items: cod.docs.map(orderItem) },
    toPack && { key: 'pack', title: 'Orders to pack', icon: Package, count: toPack.totalDocs, href: listUrl('orders', 'status', ['paid', 'cod_confirmed']), tone: 'urgent' as const, empty: 'nothing to pack', items: toPack.docs.map(orderItem) },
    reviews && {
      key: 'reviews',
      title: 'Reviews waiting',
      icon: Star,
      count: reviews.totalDocs,
      href: listUrl('reviews', 'status', ['pending']),
      tone: 'urgent' as const,
      empty: 'no reviews waiting',
      items: reviews.docs.map((r) => {
        const about = typeof r.product === 'object' ? r.product?.title : typeof r.course === 'object' ? r.course?.title : ''
        return { id: r.id, label: `${r.rating}★ ${r.name}${about ? ` · ${about}` : ''}`, note: since(r.createdAt), href: edit('reviews', r.id) }
      }),
    },
    prints && { key: 'prints', title: 'Prints running out', icon: PackageCheck, count: lowPrints.length, href: listUrl('products', 'type', ['print']), tone: 'urgent' as const, empty: 'all prints in stock', items: lowPrints.slice(0, 5) },
    festivals && {
      key: 'festivals',
      title: 'Festival dates to update',
      icon: CalendarClock,
      count: festivals.totalDocs,
      href: '/admin/collections/festivals',
      tone: 'urgent' as const,
      empty: 'festival dates are up to date',
      items: festivals.docs.map((f) => ({ id: f.id, label: f.name, note: 'date has passed', href: edit('festivals', f.id) })),
    },
    shipped && { key: 'shipped', title: 'On the way', icon: Truck, count: shipped.totalDocs, href: listUrl('orders', 'status', ['shipped']), tone: 'info' as const, empty: 'nothing on the way', items: shipped.docs.map(orderItem) },
  ].filter((c) => !!c)
  const urgent = cards.filter((c) => c.count && c.tone === 'urgent')
  const info = cards.filter((c) => c.count && c.tone !== 'urgent')
  const clear = cards.filter((c) => !c.count)
  const card = ({ key, ...c }: CardProps & { key: string }) => <Card key={key} {...c} />

  return (
    <div className="today">
      <header className="today__top">
        <div>
          <p className="today__hello">
            <span lang="mr">नमस्कार</span>
            {firstName && `, ${firstName}`}
          </p>
          <h1>Today</h1>
          <p className="today__date">
            {today}
            {orders && (waiting ? ` · ${waiting} ${waiting === 1 ? 'thing needs' : 'things need'} you` : ' · all caught up')}
          </p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="today__link">
          <ExternalLink size={18} aria-hidden="true" /> View website
        </a>
      </header>
      <nav className="today__add" aria-label="Add something new">
        {content && (
          <>
            <Link href="/admin/collections/products/create" className="today__add-btn">
              <Plus size={22} aria-hidden="true" /> New painting for sale
            </Link>
            <Link href="/admin/collections/products/create?type=print" className="today__add-btn">
              <Plus size={22} aria-hidden="true" /> New print for sale
            </Link>
          </>
        )}
        {orders && (
          <Link href="/admin/add-call" className="today__add-btn">
            <Plus size={22} aria-hidden="true" /> Note down a phone enquiry
          </Link>
        )}
        {content && (
          <Link href="/admin/collections/testimonials/create" className="today__add-btn">
            <Plus size={22} aria-hidden="true" /> Add a customer review
          </Link>
        )}
      </nav>
      {urgent.length > 0 && <div className="today__grid today__grid--urgent">{urgent.map(card)}</div>}
      {clear.length > 0 && (
        <p className="today__clear">
          <CheckCircle2 size={22} aria-hidden="true" />
          <span>
            <strong>All clear:</strong> {clear.map((c) => c.empty).join(', ')}.
          </span>
        </p>
      )}
      {(info.length > 0 || sales || preset) && (
        <div className="today__grid">
          {sales && <SalesCard sales={sales} />}
          {preset && (
            <Card title="Festival sale" icon={Percent} href="/admin/festival-planner#sale" tone="info" empty="">
              <SalePreset name={nextFestival?.name} {...preset} />
            </Card>
          )}
          {info.map(card)}
        </div>
      )}
      <h2 className="today__all">All sections</h2>
    </div>
  )
}

/** Owner only: this month against last month, prepaid vs COD, best sellers and a 30-day bar sparkline. */
function SalesCard({ sales: s }: { sales: Awaited<ReturnType<typeof salesSummary>> }) {
  const change = changeLabel(percentChange(s.revThis, s.revLast))
  const values = s.days.map((d) => d.total)
  const bars = sparkBars(values, 280, 56, 2)
  const total30 = values.reduce((a, b) => a + b, 0)
  const best = s.days.reduce((a, b) => (b.total > a.total ? b : a), s.days[0])
  const orders = (n: number) => `${n} ${n === 1 ? 'order' : 'orders'}`
  const day = (ymd: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${ymd}T00:00:00Z`))
  return (
    <Card title="Sales this month" icon={IndianRupee} href={listUrl('orders', 'status', [...SOLD])} tone="info" empty="">
      <p className="today-card__big">{formatPrice(s.revThis)}</p>
      <p className="today-card__empty">
        {orders(s.nThis)} · last month {formatPrice(s.revLast)}, {orders(s.nLast)}
        {change && <strong className="sales__change"> ({change})</strong>}
      </p>
      <dl className="sales__split">
        <div>
          <dt>Paid online</dt>
          <dd>
            {formatPrice(s.prepaidRev)} <small>({orders(s.prepaidN)})</small>
          </dd>
        </div>
        <div>
          <dt>Cash on delivery</dt>
          <dd>
            {formatPrice(s.codRev)} <small>({orders(s.codN)})</small>
          </dd>
        </div>
      </dl>
      <figure className="sales__spark">
        <svg viewBox="0 0 280 56" width="100%" height="56" preserveAspectRatio="none" role="img" aria-label={`Sales per day, last 30 days: ${formatPrice(total30)} in all${best.total ? `, best day ${day(best.day)} with ${formatPrice(best.total)}` : ''}.`}>
          {bars.map((b, i) => (
            <rect key={s.days[i].day} x={b.x} y={b.y} width={b.w} height={b.h} rx={Math.min(2, b.w / 2)} className={values[i] ? undefined : 'is-zero'}>
              <title>{`${day(s.days[i].day)}: ${formatPrice(values[i])}`}</title>
            </rect>
          ))}
        </svg>
        <figcaption>
          <span>Last 30 days</span>
          <span>{formatPrice(total30)}</span>
        </figcaption>
      </figure>
      <h3 className="sales__top-title">Best sellers this month</h3>
      {s.top.length ? (
        <ol className="sales__top">
          {s.top.map((t) => (
            <li key={`${t.productId ?? t.title}`}>
              {t.productId ? <Link href={`/admin/collections/products/${t.productId}`}>{t.title}</Link> : <span>{t.title}</span>}
              <small>
                {t.qty} sold · {formatPrice(t.amount)}
              </small>
            </li>
          ))}
        </ol>
      ) : (
        <p className="today-card__empty">No sales yet this month.</p>
      )}
    </Card>
  )
}

/** Top of the menu: Today, then Customers (owner and helper) and the Festival planner (owner). */
export function TodayNavLink({ user }: ServerProps) {
  return (
    <>
      <Link href="/admin" className="nav__link today-nav">
        Today
      </Link>
      {hasRole(user, 'owner', 'staff') && (
        <Link href="/admin/customers" className="nav__link today-nav">
          Customers
        </Link>
      )}
      {hasRole(user, 'owner') && (
        <Link href="/admin/festival-planner" className="nav__link today-nav">
          Festival planner
        </Link>
      )}
    </>
  )
}
