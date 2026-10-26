import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionBeforeValidateHook } from 'payload'

const idOf = (v: unknown) => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number | null | undefined))

type Row = { id?: string | null; label?: string | null; price?: number | null; stock?: number | null }

/**
 * Originals show a single Price and a Sold switch. They become the one size row checkout and stock code use.
 * Stock only changes when the switch itself was flipped (compared with how the form loaded it), so saving an old form
 * never brings back a piece that sold online meanwhile.
 */
export const originalFromSimpleFields: CollectionBeforeValidateHook = ({ data, originalDoc, context }) => {
  if (!data || (data.type ?? originalDoc?.type) !== 'original') return data
  if (data.originalPrice === undefined && data.sold === undefined) return data
  const saved: Row | undefined = originalDoc?.variants?.[0]
  const first: Row = (data.variants as Row[] | undefined)?.[0] ?? saved ?? {}
  // Scripts and the list's "Mark sold" don't send soldSeen: they compare with the saved stock.
  const wasSold = typeof data.soldSeen === 'boolean' ? data.soldSeen : (saved?.stock ?? 1) <= 0
  const sold = data.sold === undefined ? wasSold : Boolean(data.sold)
  if (sold !== wasSold) context.soldSwitched = true
  data.variants = [
    {
      ...first,
      label: first.id && first.label ? first.label : 'Original',
      price: data.originalPrice ?? first.price,
      stock: sold === wasSold && saved ? saved.stock : sold ? 0 : 1,
    },
  ]
  return data
}

/**
 * Stock and holds of saved sizes belong to checkout and the + / − buttons, not to the form: a save writes back what the
 * database has now. The rows are locked until the save commits, so a checkout can't slip in between.
 */
// ponytail: a checkout that waited on the lock finds its row re-inserted and reports "sold out"; the buyer just tries again.
export const keepLiveStock: CollectionBeforeChangeHook = async ({ data, operation, req, context }) => {
  const rows = data.variants as (Row & { reserved?: number | null })[] | undefined
  const ids = (rows ?? []).map((r) => r.id).filter((id): id is string => Boolean(id))
  if (operation !== 'update' || !rows || !ids.length) return data
  const pg = req.payload.db as unknown as PostgresAdapter
  const transactionID = req.transactionID ? await req.transactionID : undefined
  const db = (transactionID ? pg.sessions?.[transactionID]?.db : undefined) ?? pg.drizzle
  const r = await db.execute(sql`SELECT id, stock::int AS stock, reserved::int AS reserved FROM payload.products_variants WHERE id IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)}) FOR UPDATE`)
  const live = new Map((r.rows as { id: string; stock: number; reserved: number | null }[]).map((x) => [x.id, x]))
  data.variants = rows.map((v) => {
    const now = v.id ? live.get(v.id) : undefined
    // New sizes keep the stock typed in; a flipped Sold switch sets the original's.
    return now ? { ...v, stock: context.soldSwitched ? v.stock : now.stock, reserved: now.reserved ?? 0 } : v
  })
  return data
}

/** Photos without a description get the piece's English name, so every image has alt text (products and gallery pieces). */
export const fillAlt: CollectionAfterChangeHook = async ({ doc, req }) => {
  const ids = (Array.isArray(doc.images) ? doc.images : []).map(idOf).filter((id: unknown): id is number => typeof id === 'number')
  if (!ids.length || !doc.adminTitle) return doc
  await req.payload.update({ collection: 'media', where: { and: [{ id: { in: ids } }, { or: [{ alt: { exists: false } }, { alt: { equals: '' } }] }] }, data: { alt: doc.adminTitle }, req })
  return doc
}
