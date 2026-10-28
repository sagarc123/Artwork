import 'server-only'
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import { logRequest } from './privacy'

/**
 * Removes a customer's personal data in one transaction (the privacy plan's erasure): sign-in codes and saved pieces go, the
 * name, phone and any child's name are wiped, and the orders' name, phone, email and street lines are redacted.
 * Orders, invoices and enrolments stay (tax records, certificate checks). The customer row is never deleted.
 */
export async function eraseCustomer(id: number, phone: string, source: 'account' | 'admin' = 'account') {
  const d = (await getPayload({ config })).db.drizzle
  await d.transaction(async (tx) => {
    // Newsletter rows for the addresses used on their orders go with them (read before the orders are redacted).
    await tx.execute(sql`
      DELETE FROM payload.subscribers WHERE lower(email) IN (
        SELECT lower(customer_email) FROM payload.orders WHERE (account_id = ${id} OR customer_phone = ${phone}) AND customer_email IS NOT NULL)`)
    // Reviews stay (the shop's record) but lose the name and photo; cookie choices are withdrawn and unlinked.
    await tx.execute(sql`UPDATE payload.reviews SET name = 'Former customer', photo_id = NULL WHERE customer_id = ${id}`)
    await tx.execute(sql`UPDATE payload.consents SET withdrawn_at = coalesce(withdrawn_at, now()), customer_id = NULL WHERE customer_id = ${id}`)
    await tx.execute(sql`DELETE FROM payload.otp_codes WHERE phone = ${phone}`)
    await tx.execute(sql`UPDATE payload.enrolments SET child_first_name = NULL WHERE customer_id = ${id}`)
    await tx.execute(sql`
      UPDATE payload.orders SET customer_name = '[deleted]', customer_phone = NULL, customer_email = NULL, address_line1 = NULL, address_line2 = NULL
      WHERE account_id = ${id} OR customer_phone = ${phone}`)
    // A certificate stays (others may verify it); the name on it shrinks to initials.
    await tx.execute(sql`UPDATE payload.certificates SET name_on_cert = regexp_replace(name_on_cert, '(\\S)\\S*', '\\1.', 'g') WHERE customer_id = ${id}`)
    await tx.execute(sql`UPDATE payload.orders_items SET child_first_name = NULL WHERE _parent_id IN (SELECT id FROM payload.orders WHERE account_id = ${id})`)
    await tx.execute(sql`UPDATE payload.customers SET name = NULL, phone = ${`deleted-${id}`}, saved_slugs = NULL, deleted_at = now() WHERE id = ${id}`)
  })
  await logRequest('erase', id, source)
}
