import { htmlPage, orderStaff, slipsPage } from '@/server/packing-slip'

/** Several packing slips on one printable page: /api/orders/packing-slips?ids=12,13,14 (the Orders list's bulk button). */
export async function GET(request: Request) {
  const payload = await orderStaff(request)
  if (!payload) return htmlPage(401, '<p>Please sign in to the admin first.</p>')
  const ids = (new URL(request.url).searchParams.get('ids') ?? '').split(',').filter((s) => /^\d{1,9}$/.test(s)).map(Number).slice(0, 100)
  if (!ids.length) return htmlPage(404, '<p>No orders chosen.</p>')
  const { docs } = await payload.find({ collection: 'orders', where: { id: { in: ids } }, depth: 0, limit: ids.length, pagination: false, sort: 'createdAt' })
  if (!docs.length) return htmlPage(404, '<p>Not found</p>')
  return htmlPage(200, slipsPage(docs))
}
