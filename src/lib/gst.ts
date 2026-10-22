// GST invoice maths, shared by the server and tests. No server-only imports.
// Prices on the site include GST, so tax is split back out of each line total.

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** GSTIN format plus its check character (the 15th). */
export function isValidGstin(raw: string) {
  const g = raw.trim().toUpperCase()
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return false
  let sum = 0
  for (let i = 0; i < 14; i++) {
    const p = CHARS.indexOf(g[i]) * (i % 2 ? 2 : 1)
    sum += Math.floor(p / 36) + (p % 36)
  }
  return CHARS[(36 - (sum % 36)) % 36] === g[14]
}

/** Indian financial year (April–March, in IST) as "26-27". */
export function financialYear(date: Date) {
  const ist = new Date(date.getTime() + 330 * 60_000)
  const start = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1
  return `${String(start % 100).padStart(2, '0')}-${String((start + 1) % 100).padStart(2, '0')}`
}

/** "INV/26-27/000123": 16 characters, the GST limit. */
export const invoiceNumber = (fy: string, n: number) => `INV/${fy}/${String(n).padStart(6, '0')}`

/** Same state (case and spacing ignored) → CGST + SGST; otherwise IGST. */
export const isIntraState = (buyerState: string, sellerState: string) =>
  buyerState.trim().toLowerCase().replace(/\s+/g, ' ') === sellerState.trim().toLowerCase().replace(/\s+/g, ' ')

/** Splits a GST-inclusive amount (paise) into taxable value and tax, all in paise. */
export function splitGst(totalPaise: number, rate: number, intra: boolean) {
  const taxable = Math.round((totalPaise * 100) / (100 + rate))
  const tax = totalPaise - taxable
  const cgst = intra ? Math.round(tax / 2) : 0
  return { taxable, cgst, sgst: intra ? tax - cgst : 0, igst: intra ? 0 : tax }
}

export type InvoiceItem = { description: string; hsn: string; qty: number; total: number; rate: number }
export type InvoiceLine = InvoiceItem & { taxable: number; cgst: number; sgst: number; igst: number }

const rupees = (paise: number) => paise / 100

/**
 * Invoice lines from GST-inclusive rupee totals. Without a seller GSTIN it is a bill of supply: no tax lines.
 * Charges (delivery, COD fee) follow the main goods: the highest item rate and its HSN.
 */
export function invoiceLines(items: InvoiceItem[], charges: { description: string; total: number }[], intra: boolean, taxed: boolean): InvoiceLine[] {
  // ponytail: charges take the highest item rate; a separate tax class for charges if the CA wants one.
  const top = items.reduce<InvoiceItem | undefined>((a, b) => (!a || b.rate > a.rate ? b : a), undefined)
  const all = [...items, ...charges.filter((c) => c.total > 0).map((c) => ({ ...c, qty: 1, hsn: top?.hsn ?? '', rate: top?.rate ?? 0 }))]
  return all.map((l) => {
    const rate = taxed ? l.rate : 0
    const s = splitGst(Math.round(l.total * 100), rate, intra)
    return { ...l, rate, taxable: rupees(s.taxable), cgst: rupees(s.cgst), sgst: rupees(s.sgst), igst: rupees(s.igst) }
  })
}

type Sums = { taxable: number; cgst: number; sgst: number; igst: number; total: number }
const add = (a: Sums, l: Sums): Sums => ({
  taxable: rupees(Math.round((a.taxable + l.taxable) * 100)),
  cgst: rupees(Math.round((a.cgst + l.cgst) * 100)),
  sgst: rupees(Math.round((a.sgst + l.sgst) * 100)),
  igst: rupees(Math.round((a.igst + l.igst) * 100)),
  total: rupees(Math.round((a.total + l.total) * 100)),
})
const zero: Sums = { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }

export const invoiceTotals = (lines: Sums[]) => lines.reduce(add, zero)

/** HSN-wise summary rows (one per HSN and rate). */
export function hsnSummary(lines: (Sums & { hsn: string; rate: number })[]) {
  const rows = new Map<string, Sums & { hsn: string; rate: number }>()
  for (const l of lines) {
    const key = `${l.hsn}|${l.rate}`
    rows.set(key, { hsn: l.hsn, rate: l.rate, ...add(rows.get(key) ?? zero, l) })
  }
  return [...rows.values()]
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

const below100 = (n: number) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ''))
const below1000 = (n: number) =>
  [n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred` : '', below100(n % 100)].filter(Boolean).join(' ')

function words(n: number): string {
  const crore = Math.floor(n / 1e7)
  const lakh = Math.floor((n % 1e7) / 1e5)
  const thousand = Math.floor((n % 1e5) / 1e3)
  return [crore ? `${words(crore)} Crore` : '', lakh ? `${below100(lakh)} Lakh` : '', thousand ? `${below100(thousand)} Thousand` : '', below1000(n % 1e3)]
    .filter(Boolean)
    .join(' ')
}

/** Whole rupees in words, Indian system: "Rupees One Lakh Twenty-Five Thousand Only". */
export const amountInWords = (amount: number) => `Rupees ${words(Math.round(amount)) || 'Zero'} Only`
