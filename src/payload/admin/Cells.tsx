import type { DefaultServerCellComponentProps } from 'payload'
import Link from 'next/link'
import { ago } from '../../lib/admin'
import { formatPrice } from '../../lib/site'

// List-view cells. Server components: they get the row and the Payload instance.

/** Server render time (lists are rendered per request). */
const clock = () => Date.now()

/** Colour per status: kumkum = needs you now, marigold = in progress, leaf = done, grey = closed. */
export const TONE: Record<string, 'urgent' | 'busy' | 'done' | 'off'> = {
  // orders
  cod_pending_confirmation: 'urgent',
  paid: 'urgent',
  cod_confirmed: 'urgent',
  needs_refund: 'urgent',
  packed: 'busy',
  shipped: 'busy',
  delivered: 'done',
  refunded: 'off',
  cancelled: 'off',
  pending_payment: 'off',
  // enquiries
  new: 'urgent',
  replied: 'busy',
  quoted: 'busy',
  advance_paid: 'busy',
  done: 'done',
  lost: 'off',
  // reviews and newsletter
  pending: 'busy',
  approved: 'done',
  rejected: 'off',
  confirmed: 'done',
  unsubscribed: 'off',
}

const optionLabel = (field: DefaultServerCellComponentProps['field'], value: unknown) => {
  const options = 'options' in field ? field.options : []
  const found = options.find((o) => (typeof o === 'string' ? o : o.value) === value)
  const label = typeof found === 'object' ? found.label : found
  return typeof label === 'string' ? label : String(value ?? '')
}

export function StatusCell({ cellData, field }: DefaultServerCellComponentProps) {
  if (!cellData) return null
  return <span className={`status-chip is-${TONE[String(cellData)] ?? 'off'}`}>{optionLabel(field, cellData)}</span>
}

export function MoneyCell({ cellData }: DefaultServerCellComponentProps) {
  return typeof cellData === 'number' ? <span className="money-cell">{formatPrice(cellData)}</span> : null
}

/** Order number with the customer's name under it. */
export function OrderCell({ cellData, rowData, collectionSlug }: DefaultServerCellComponentProps) {
  return (
    <Link href={`/admin/collections/${collectionSlug}/${rowData.id}`} className="title-cell">
      <strong>{String(cellData ?? `#${rowData.id}`)}</strong>
      <small>{[rowData.customer?.name, rowData.createdAt && ago(clock() - Date.parse(rowData.createdAt))].filter(Boolean).join(' · ')}</small>
    </Link>
  )
}

/** First photo as a small thumbnail with the name (and price for shop pieces), linking to the piece. */
export async function ThumbCell({ cellData, rowData, collectionSlug, payload }: DefaultServerCellComponentProps) {
  const first = Array.isArray(cellData) ? cellData[0] : cellData
  const id = typeof first === 'object' && first ? first.id : first
  // ponytail: one small query per row (lists show 10–25 rows); batch it if lists grow to hundreds per page.
  const media = id ? await payload.findByID({ collection: 'media', id, depth: 0, select: { url: true, sizes: true }, disableErrors: true }) : null
  const src = media?.sizes?.thumb?.url ?? media?.url
  const prices = ((rowData.variants ?? []) as { price?: number | null }[]).map((v) => v.price).filter((p): p is number => typeof p === 'number')
  const price = prices.length ? (prices.length > 1 ? 'from ' : '') + formatPrice(Math.min(...prices)) : null
  return (
    <Link href={`/admin/collections/${collectionSlug}/${rowData.id}`} className="thumb-cell">
      {/* eslint-disable-next-line @next/next/no-img-element -- already-small admin thumbnails */}
      {src ? <img src={src} alt="" width={56} height={56} loading="lazy" /> : <span className="thumb-cell__empty" aria-hidden="true" />}
      <span className="title-cell">
        <strong>{rowData.title ?? rowData.adminTitle ?? rowData.name ?? `#${rowData.id}`}</strong>
        {price && <small>{price}</small>}
      </span>
    </Link>
  )
}

/** Yes/No instead of true/false. */
export function YesNoCell({ cellData }: DefaultServerCellComponentProps) {
  return cellData ? <span className="status-chip is-done">Yes</span> : <span className="muted-cell">No</span>
}

/** Above an empty list: what this list is for and where new ones come from, instead of "Nothing found". */
export function EmptyNote({ data, searchParams, text }: { data?: { totalDocs?: number }; searchParams?: Record<string, unknown>; text: string }) {
  if (data?.totalDocs !== 0) return null
  const filtered = Object.keys(searchParams ?? {}).some((k) => k.startsWith('where') || k === 'search')
  return <p className="empty-note">{filtered ? 'None match this filter. Tap “All” or clear the search to see everything.' : text}</p>
}
