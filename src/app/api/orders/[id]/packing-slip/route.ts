import { htmlPage, orderStaff, slipsPage } from '@/server/packing-slip'

/** Printable packing slip for an order: what goes in the parcel and where it goes. Admin sign-in (owner or helper) only; no prices. */
export async function GET(request: Request, { params }: RouteContext<'/api/orders/[id]/packing-slip'>) {
  const { id } = await params
  const payload = await orderStaff(request)
  if (!payload) return htmlPage(401, '<p>Please sign in to the admin first.</p>')
  if (!/^\d{1,9}$/.test(id)) return htmlPage(404, '<p>Not found</p>')
  const order = await payload.findByID({ collection: 'orders', id: Number(id), depth: 0, disableErrors: true })
  if (!order) return htmlPage(404, '<p>Not found</p>')
  return htmlPage(200, slipsPage([order]))
}
