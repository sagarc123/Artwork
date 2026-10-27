import type { AdminViewServerProps } from 'payload'
import Link from 'next/link'
import { hasRole } from '../access'
import { customerChat } from '../../lib/admin'
import { formatPrice } from '../../lib/site'
import { customerHistory, customers } from '../../server/admin-data'
import { ENQUIRY_STATUSES, ENQUIRY_TYPES } from '../collections/Enquiries'
import { ORDER_STATUSES } from '../collections/Orders'
import { AdminPage, day, param } from './AdminPage'
import { TONE } from './Cells'

const PER_PAGE = 20
const label = (options: { label: string; value: string }[], v: string | null) => options.find((o) => o.value === v)?.label ?? v ?? ''
const chip = (status: string, text: string) => <span className={`status-chip is-${TONE[status] ?? 'off'}`}>{text}</span>
/** Customers list address with the search and page kept. */
const href = (q: string, page: number, phone?: string) => {
  const p = new URLSearchParams()
  if (q) p.set('q', q)
  if (page > 1) p.set('page', String(page))
  if (phone) p.set('phone', phone)
  const s = p.toString()
  return `/admin/customers${s ? `?${s}` : ''}`
}

function Contact({ phone, name }: { phone: string; name?: string | null }) {
  return (
    <span className="customer-contact">
      <a className="one-tap__btn is-small is-whatsapp" href={customerChat(phone, '')} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${name || phone}`}>
        WhatsApp
      </a>
      <a className="one-tap__btn is-small" href={`tel:+91${phone}`} aria-label={`Call ${name || phone}`}>
        Call
      </a>
    </span>
  )
}

/** One customer: their orders and enquiries, newest first, each linking to its page. */
async function Detail({ view, phone, back }: { view: AdminViewServerProps; phone: string; back: string }) {
  const { orders, enquiries } = await customerHistory(view.initPageResult.req.payload, phone)
  const name = orders[0]?.name || enquiries[0]?.name || phone
  return (
    <section className="customer-detail" aria-labelledby="customer-name">
      <Link href={back} className="customer-detail__back">
        ‹ All customers
      </Link>
      <h2 id="customer-name">{name}</h2>
      <p className="customer-detail__phone">
        {phone} <Contact phone={phone} name={name} />
      </p>
      {!orders.length && !enquiries.length && <p className="empty-note">Nothing found for this number.</p>}
      {orders.length > 0 && (
        <>
          <h3>Orders ({orders.length})</h3>
          <ul className="tool-list">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/collections/orders/${o.id}`}>
                  <strong>{o.orderNumber ?? `#${o.id}`}</strong>
                  <span>{formatPrice(o.total ?? 0)}</span>
                  {chip(o.status, label(ORDER_STATUSES, o.status))}
                  <small>{day(o.createdAt)}</small>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      {enquiries.length > 0 && (
        <>
          <h3>Enquiries ({enquiries.length})</h3>
          <ul className="tool-list">
            {enquiries.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/collections/enquiries/${e.id}`}>
                  <strong>{e.topic === 'reminder' ? 'Festival reminder' : label(ENQUIRY_TYPES, e.type)}</strong>
                  {e.status && chip(e.status, label(ENQUIRY_STATUSES, e.status))}
                  <small>{day(e.createdAt)}</small>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

/** Customers: everyone who ordered or enquired, one row per phone number, built from orders and enquiries. */
export async function CustomersView(view: AdminViewServerProps) {
  const q = param(view, 'q').slice(0, 60)
  const page = Math.max(1, Math.min(500, Number(param(view, 'page')) || 1))
  const phone = param(view, 'phone').replace(/\D/g, '').slice(-10)
  const payload = view.initPageResult.req.payload
  // Helpers and the owner only (the page itself says so to anyone else).
  const { rows, totalDocs } = hasRole(view.initPageResult.req.user, 'owner', 'staff') ? await customers(payload, q, page, PER_PAGE) : { rows: [], totalDocs: 0 }
  const pages = Math.ceil(totalDocs / PER_PAGE)

  return (
    <AdminPage view={view} path="/customers" title="Customers" roles={['owner', 'staff']} intro="Everyone who has ordered or sent an enquiry, newest first. Tap a name to see all their orders and messages.">
      {phone.length === 10 && <Detail view={view} phone={phone} back={href(q, page)} />}
      <form className="tool-search" role="search" action="/admin/customers">
        <label htmlFor="customer-q">Find a customer</label>
        <div>
          <input id="customer-q" name="q" type="search" defaultValue={q} placeholder="Name or phone number" autoComplete="off" />
          <button type="submit" className="one-tap__btn is-primary">
            Search
          </button>
          {q && (
            <Link href="/admin/customers" className="one-tap__btn">
              Clear
            </Link>
          )}
        </div>
      </form>
      {rows.length === 0 ? (
        <p className="empty-note">
          {q ? `No customer matches “${q}”. Check the spelling, or search by the last few digits of their phone.` : 'No customers yet. People appear here after their first order or enquiry.'}
        </p>
      ) : (
        <>
          <p className="tool-page__count">
            {totalDocs} {totalDocs === 1 ? 'customer' : 'customers'}
            {q && ` matching “${q}”`}
          </p>
          <ul className="customer-list">
            {rows.map((c) => (
              <li key={c.phone} className={c.phone === phone ? 'is-open' : undefined}>
                <Link href={href(q, page, c.phone)} className="customer-list__who" aria-current={c.phone === phone ? 'true' : undefined}>
                  <strong>{c.name || 'No name'}</strong>
                  <small>{c.phone}</small>
                </Link>
                <dl className="customer-list__facts">
                  <div>
                    <dt>Orders</dt>
                    <dd>{c.orders}</dd>
                  </div>
                  <div>
                    <dt>Spent</dt>
                    <dd>{formatPrice(c.spent)}</dd>
                  </div>
                  <div>
                    <dt>Last order</dt>
                    <dd>{day(c.lastOrder)}</dd>
                  </div>
                  <div>
                    <dt>Last enquiry</dt>
                    <dd>{day(c.lastEnquiry)}</dd>
                  </div>
                </dl>
                <Contact phone={c.phone} name={c.name} />
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <nav className="tool-pages" aria-label="Pages">
              {page > 1 && (
                <Link className="one-tap__btn" href={href(q, page - 1)}>
                  ‹ Newer
                </Link>
              )}
              <span>
                Page {page} of {pages}
              </span>
              {page < pages && (
                <Link className="one-tap__btn" href={href(q, page + 1)}>
                  Older ›
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </AdminPage>
  )
}
