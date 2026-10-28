import { getCustomer } from '@/server/customer'
import { exportData, logRequest } from '@/server/privacy'
import { allow } from '@/server/rate-limit'
import { readVisitorId } from '@/server/visitor'

// POST only: a cross-site form cannot make the browser send the sign-in cookie with a POST (SameSite=Lax), so only the
// signed-in customer's own button gets a file. Never cached.
const headers = { 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8' }

export async function POST() {
  const me = await getCustomer()
  if (!me) return new Response(JSON.stringify({ error: 'Please sign in.' }), { status: 401, headers })
  if (!(await allow('export', 3, 60 * 60_000))) return new Response(JSON.stringify({ error: 'Too many downloads. Please try again later.' }), { status: 429, headers })
  const data = await exportData(me, await readVisitorId())
  await logRequest('export', me.id, 'account')
  return new Response(JSON.stringify(data, null, 2), { headers: { ...headers, 'content-disposition': 'attachment; filename="my-data.json"' } })
}
