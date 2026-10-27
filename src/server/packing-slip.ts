import config from '@payload-config'
import { getPayload } from 'payload'
import type { Order } from '@/payload-types'
import { hasRole } from '@/payload/access'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

export const htmlPage = (status: number, body: string) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } })

/** Payload for a signed-in owner or helper (packing slips are theirs), or null. */
export async function orderStaff(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  return hasRole(user, 'owner', 'staff') ? payload : null
}

/** One order's slip: what goes in the parcel and where it goes. No prices (only COD's amount to collect). */
function slip(order: Order) {
  const a = order.address
  const rows = (order.items ?? [])
    .filter((it) => it.type !== 'digital')
    .map((it) => `<tr><td>${esc(it.title)}</td><td>${esc([it.variantLabel, it.frameLabel].filter(Boolean).join(', '))}</td><td class="n">${esc(it.qty)}</td><td class="box"></td></tr>`)
    .join('')
  return `<section class="slip">
<h1>Packing slip · ${esc(order.orderNumber)}</h1>
<p>${esc(new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }))} · ${order.paymentMode === 'cod' ? `<strong>Cash on delivery: collect ₹${esc(order.total)}</strong>` : 'Paid online'}${order.giftWrapFee ? ' · <strong>Gift wrap</strong>' : ''}</p>
<div class="to"><strong>Deliver to</strong><br>${esc(order.customer?.name)}<br>${esc(a?.line1)}${a?.line2 ? `<br>${esc(a.line2)}` : ''}<br>${esc(a?.city)}, ${esc(a?.state)} ${esc(a?.pincode)}<br>Phone: ${esc(order.customer?.phone)}</div>
<table><thead><tr><th>Item</th><th>Size / frame</th><th class="n">Qty</th><th class="box">✓</th></tr></thead><tbody>${rows}</tbody></table>
${order.giftNote ? `<div class="gift"><strong>Gift card message</strong> (write on the card)<br>${esc(order.giftNote)}</div>` : ''}
${order.note ? `<p><strong>Note:</strong> ${esc(order.note)}</p>` : ''}
</section>`
}

/** Printable page of slips, one per printed sheet. */
export function slipsPage(orders: Order[]) {
  const title = orders.length === 1 ? `Packing slip ${esc(orders[0].orderNumber)}` : `${orders.length} packing slips`
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
body{font:16px/1.5 system-ui,sans-serif;color:#111;max-width:46rem;margin:1.5rem auto;padding:0 1rem}
h1{font-size:1.6rem;margin:0}table{width:100%;border-collapse:collapse;margin:1rem 0}td,th{border:1px solid #999;padding:.5rem;text-align:left}
.n{text-align:center;width:3rem}.box{width:3rem}.to{border:2px solid #111;padding:1rem;font-size:1.15rem}.gift{border:2px dashed #111;padding:1rem;margin-top:1rem}
.slip+.slip{margin-top:3rem;padding-top:2rem;border-top:2px dashed #999}
button{font-size:1.1rem;padding:.75rem 1.5rem;margin:1rem 0}@media print{button{display:none}body{margin:0}.slip+.slip{break-before:page;margin:0;padding:0;border:0}}
</style></head><body>
<button onclick="print()">Print${orders.length > 1 ? ` all ${orders.length}` : ''}</button>
${orders.map(slip).join('\n')}
</body></html>`
}
