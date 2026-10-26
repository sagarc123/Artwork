import config from '@payload-config'
import { getPayload } from 'payload'
import { hasRole } from '@/payload/access'
import { adjustStock, liveStock } from '@/server/order-service'

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })

/** Signed-in owner or editor (the people who edit products), or null. Cookie sign-in also checks the request's origin. */
async function editor(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  return hasRole(user, 'owner', 'editor') ? user : null
}

/** The live stock of a product's sizes: GET /api/stock?product=12 */
export async function GET(request: Request) {
  if (!(await editor(request))) return json({ error: 'sign in' }, 401)
  const id = new URL(request.url).searchParams.get('product') ?? ''
  if (!/^\d{1,9}$/.test(id)) return json({ error: 'product' }, 400)
  return json(await liveStock(Number(id)))
}

/** Adds or removes stock of one size: POST { variantId, delta }. Never below what checkout is holding. */
export async function POST(request: Request) {
  if (!(await editor(request))) return json({ error: 'sign in' }, 401)
  const body = (await request.json().catch(() => null)) as { variantId?: unknown; delta?: unknown } | null
  const { variantId, delta } = body ?? {}
  if (typeof variantId !== 'string' || variantId.length > 60 || !Number.isInteger(delta) || delta === 0 || Math.abs(delta as number) > 10_000) return json({ error: 'input' }, 400)
  const row = await adjustStock(variantId, delta as number)
  return row ? json(row) : json({ error: 'not found' }, 404)
}
