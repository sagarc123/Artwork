import type { ServerProps } from 'payload'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { hasRole } from '../access'
import { listUrl, waited } from '../../lib/admin'
import { formatPrice } from '../../lib/site'

/** Statuses that count as a sale (paid online, or a COD order the customer confirmed). */
const SOLD = ['paid', 'cod_confirmed', 'packed', 'shipped', 'delivered']
const LOW_STOCK = 2
/** Server render time (the page is rendered per request). */
const clock = () => Date.now()
const edit = (collection: string, id: number) => `/admin/collections/${collection}/${id}`

type Item = { id: number; label: string; note?: string; alert?: boolean; href: string }

function Card({ title, count, href, items, empty, alert, children }: { title: string; count?: number; href: string; items?: Item[]; empty: string; alert?: boolean; children?: ReactNode }) {
  return (
    <section className={`today-card${alert ? ' is-alert' : ''}`}>
      <Link href={href} className="today-card__head">
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
  const ago = (iso: string) => waited(now - Date.parse(iso))
  const orderItem = (o: { id: number; orderNumber?: string | null; customer?: { name?: string | null } | null; total?: number | null; createdAt: string }): Item => ({
    id: o.id,
    label: `${o.orderNumber ?? `#${o.id}`} · ${o.customer?.name ?? ''} · ${formatPrice(o.total ?? 0)}`,
    note: ago(o.createdAt) + ' ago',
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
    content
      ? payload.find({ collection: 'festivals', where: { or: [{ nextDate: { less_than: new Date(now).toISOString() } }, { nextDate: { exists: false } }] }, limit: 20, depth: 0, select: { name: true, nextDate: true } })
      : null,
  ])
  const replyHours = site.contact?.replyHours ?? 4
  const lowPrints = (prints?.docs ?? []).flatMap((p) => {
    const left = Math.min(...p.variants.map((v) => v.stock - (v.reserved ?? 0)))
    return left <= LOW_STOCK ? [{ id: p.id, label: p.title, note: left <= 0 ? 'Sold out' : `${left} left`, alert: left <= 0, href: edit('products', p.id) }] : []
  })
  const oldestNew = enquiries?.docs[0]
  const lateEnquiry = oldestNew ? now - Date.parse(oldestNew.createdAt) > replyHours * 3_600_000 : false

  return (
    <div className="today">
      <div className="today__top">
        <h1>Today</h1>
        {content && (
          <Link href="/admin/collections/products/create" className="today__add">
            + Add a painting
          </Link>
        )}
      </div>
      <div className="today__grid">
        {enquiries && (
          <Card
            title="New enquiries"
            count={enquiries.totalDocs}
            href={listUrl('enquiries', 'status', ['new'])}
            alert={lateEnquiry}
            empty="No new enquiries."
            items={enquiries.docs.map((e) => {
              const late = now - Date.parse(e.createdAt) > replyHours * 3_600_000
              return { id: e.id, label: `${e.name} · ${e.type}`, note: `waiting ${ago(e.createdAt)}`, alert: late, href: edit('enquiries', e.id) }
            })}
          >
            {lateEnquiry && <p className="today-card__warn">Oldest has waited {ago(oldestNew!.createdAt)}: past your {replyHours} h reply promise.</p>}
          </Card>
        )}
        {cod && <Card title="COD orders to confirm" count={cod.totalDocs} href={listUrl('orders', 'status', ['cod_pending_confirmation'])} empty="Nothing to confirm." items={cod.docs.map(orderItem)} />}
        {toPack && <Card title="Orders to pack" count={toPack.totalDocs} href={listUrl('orders', 'status', ['paid', 'cod_confirmed'])} empty="Nothing to pack." items={toPack.docs.map(orderItem)} />}
        {shipped && <Card title="Shipped, not delivered" count={shipped.totalDocs} href={listUrl('orders', 'status', ['shipped'])} empty="No parcels on the way." items={shipped.docs.map(orderItem)} />}
        {week && (
          <Card title="Last 7 days" href={listUrl('orders', 'status', SOLD)} empty="">
            <p className="today-card__big">
              {week.docs.length} {week.docs.length === 1 ? 'order' : 'orders'} · {formatPrice(week.docs.reduce((sum, o) => sum + (o.total ?? 0), 0))}
            </p>
          </Card>
        )}
        {prints && <Card title="Prints running out" count={lowPrints.length} href="/admin/collections/products?where[type][equals]=print" empty="All prints in stock." items={lowPrints.slice(0, 5)} />}
        {festivals && (
          <Card
            title="Festival dates to update"
            count={festivals.totalDocs}
            href="/admin/collections/festivals"
            empty="All festival dates are ahead."
            items={festivals.docs.map((f) => ({ id: f.id, label: f.name, note: f.nextDate ? 'date has passed' : 'no date', href: edit('festivals', f.id) }))}
          />
        )}
      </div>
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
