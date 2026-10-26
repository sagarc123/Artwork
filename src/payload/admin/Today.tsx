import type { ServerProps } from 'payload'
import { CalendarClock, CheckCircle2, ExternalLink, Inbox, IndianRupee, MessageCircle, Package, PackageCheck, Plus, Truck, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { hasRole } from '../access'
import { ago, listUrl } from '../../lib/admin'
import { indiaToday } from '../../lib/dates'
import { formatPrice } from '../../lib/site'

/** Statuses that count as a sale (paid online, or a COD order the customer confirmed). */
const SOLD = ['paid', 'cod_confirmed', 'packed', 'shipped', 'delivered']
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

  const [site, enquiries, cod, toPack, shipped, week, prints, festivals] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
    orders ? payload.find({ collection: 'enquiries', where: { status: { equals: 'new' } }, sort: 'createdAt', limit: 5, depth: 0, select: { name: true, type: true, createdAt: true } }) : null,
    orders ? findOrders(['cod_pending_confirmation']) : null,
    orders ? findOrders(['paid', 'cod_confirmed']) : null,
    orders ? findOrders(['shipped']) : null,
    owner
      ? payload.find({ collection: 'orders', where: { and: [{ status: { in: SOLD } }, { createdAt: { greater_than: new Date(now - 7 * 86_400_000).toISOString() } }] }, pagination: false, depth: 0, select: { total: true } })
      : null,
    content ? payload.find({ collection: 'products', where: { type: { equals: 'print' } }, pagination: false, depth: 0, draft: true, select: { title: true, variants: true } }) : null,
    // Only dates that have passed: festivals without a date (like weddings) are fine as they are.
    content ? payload.find({ collection: 'festivals', where: { nextDate: { less_than: indiaToday(new Date(now)) } }, limit: 20, depth: 0, select: { name: true, nextDate: true } }) : null,
  ])
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
        <nav className="today__quick" aria-label="Quick links">
          {content && (
            <Link href="/admin/collections/products/create" className="today__link">
              <Plus size={20} aria-hidden="true" /> Add a painting
            </Link>
          )}
          <a href="/" target="_blank" rel="noopener noreferrer" className="today__link">
            <ExternalLink size={18} aria-hidden="true" /> View website
          </a>
        </nav>
      </header>
      {urgent.length > 0 && <div className="today__grid today__grid--urgent">{urgent.map(card)}</div>}
      {clear.length > 0 && (
        <p className="today__clear">
          <CheckCircle2 size={22} aria-hidden="true" />
          <span>
            <strong>All clear:</strong> {clear.map((c) => c.empty).join(', ')}.
          </span>
        </p>
      )}
      {(info.length > 0 || week) && (
        <div className="today__grid">
          {info.map(card)}
          {week && (
            <Card title="Sales, last 7 days" icon={IndianRupee} href={listUrl('orders', 'status', SOLD)} tone="info" empty="">
              <p className="today-card__big">{formatPrice(week.docs.reduce((sum, o) => sum + (o.total ?? 0), 0))}</p>
              <p className="today-card__empty">
                {week.docs.length} {week.docs.length === 1 ? 'order' : 'orders'}
              </p>
            </Card>
          )}
        </div>
      )}
      <h2 className="today__all">Everything else</h2>
    </div>
  )
}

/** "Today" at the top of the menu. */
export function TodayNavLink() {
  return (
    <Link href="/admin" className="nav__link today-nav">
      Today
    </Link>
  )
}
