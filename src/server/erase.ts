import 'server-only'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import { logRequest } from './privacy'

/**
 * Removes a customer's personal data in one transaction (the privacy plan's erasure): sign-in codes and saved pieces go, the
 * name, phone and any child's name are wiped, the orders' name, phone, email, street lines and notes are redacted, enquiries
 * from their phone are deleted, review photos are deleted (row and file), and consent records lose their email and visitor id.
 * Invoices stay as they are: they keep the buyer's name and address for the period tax law requires. Orders and enrolments
 * stay too (certificate checks). The customer row is never deleted.
 * Emails are taken only from orders linked to this account, never from guest orders that merely share the phone number.
 */
export async function eraseCustomer(id: number, phone: string, source: 'account' | 'admin' = 'account') {
  const d = (await getPayload({ config })).db.drizzle
  const photoFiles = await d.transaction(async (tx) => {
    const mine = sql`SELECT lower(customer_email) FROM payload.orders WHERE account_id = ${id} AND customer_email IS NOT NULL`
    // Newsletter rows for the addresses used on their orders go with them (read before the orders are redacted).
    await tx.execute(sql`DELETE FROM payload.subscribers WHERE lower(email) IN (${mine})`)
    // Reviews stay (the shop's record) but lose the name and photo; the photo's row and file are deleted, not just unlinked.
    const own = sql`SELECT id FROM payload.review_photos WHERE id IN (SELECT photo_id FROM payload.reviews WHERE customer_id = ${id}) OR review_id IN (SELECT id FROM payload.reviews WHERE customer_id = ${id})`
    const photos = (await tx.execute(sql`SELECT filename, sizes_thumb_filename FROM payload.review_photos WHERE id IN (${own})`)).rows as { filename: string | null; sizes_thumb_filename: string | null }[]
    await tx.execute(sql`DELETE FROM payload.review_photos WHERE id IN (${own})`)
    await tx.execute(sql`UPDATE payload.reviews SET name = 'Former customer', photo_id = NULL WHERE customer_id = ${id}`)
    // Cookie and newsletter choices are withdrawn, unlinked, and lose the email and visitor id.
    await tx.execute(sql`
      UPDATE payload.consents SET withdrawn_at = coalesce(withdrawn_at, now()), customer_id = NULL, subject = NULL, email = NULL
      WHERE customer_id = ${id} OR lower(email) IN (${mine})`)
    await tx.execute(sql`DELETE FROM payload.otp_codes WHERE phone = ${phone}`)
    // Enquiries from their phone (compared by the last 10 digits, whatever the spacing or +91).
    await tx.execute(sql`DELETE FROM payload.enquiries WHERE length(regexp_replace(phone, '\\D', '', 'g')) >= 10 AND right(regexp_replace(phone, '\\D', '', 'g'), 10) = right(${phone}, 10)`)
    await tx.execute(sql`UPDATE payload.enrolments SET child_first_name = NULL WHERE customer_id = ${id}`)
    await tx.execute(sql`
      UPDATE payload.orders SET customer_name = '[deleted]', customer_phone = NULL, customer_email = NULL, address_line1 = NULL, address_line2 = NULL, note = NULL, gift_note = NULL
      WHERE account_id = ${id} OR customer_phone = ${phone}`)
    // A certificate stays (others may verify it); the name on it shrinks to initials.
    await tx.execute(sql`UPDATE payload.certificates SET name_on_cert = regexp_replace(name_on_cert, '(\\S)\\S*', '\\1.', 'g') WHERE customer_id = ${id}`)
    await tx.execute(sql`UPDATE payload.orders_items SET child_first_name = NULL WHERE _parent_id IN (SELECT id FROM payload.orders WHERE account_id = ${id})`)
    await tx.execute(sql`UPDATE payload.customers SET name = NULL, phone = ${`deleted-${id}`}, saved_slugs = NULL, deleted_at = now() WHERE id = ${id}`)
    return photos
  })
  // Files go after the rows are gone for good (a rolled-back erase must not lose its files).
  const dir = path.resolve(process.cwd(), 'review-photos')
  for (const f of photoFiles) for (const name of [f.filename, f.sizes_thumb_filename]) if (name) await rm(path.join(dir, path.basename(name)), { force: true }).catch(() => {})
  await logRequest('erase', id, source)
}
