import { test } from 'node:test'
import assert from 'node:assert/strict'
import { amountInWords, financialYear, hsnSummary, invoiceLines, invoiceNumber, invoiceTotals, isIntraState, isValidGstin, splitGst } from './gst.ts'

test('GSTIN: format and check character', () => {
  assert.ok(isValidGstin('27AAPFU0939F1ZV'))
  assert.ok(isValidGstin(' 27aapfu0939f1zv ')) // case and spaces forgiven
  assert.ok(!isValidGstin('27AAPFU0939F1ZW')) // wrong check character
  assert.ok(!isValidGstin('27AAPFU0939F1Z')) // too short
  assert.ok(!isValidGstin('AAAPFU0939F1ZVX'))
})

test('financial year runs April to March, in IST', () => {
  assert.equal(financialYear(new Date('2026-04-01T00:00:00+05:30')), '26-27')
  assert.equal(financialYear(new Date('2027-03-31T23:59:00+05:30')), '26-27')
  assert.equal(financialYear(new Date('2026-03-31T20:00:00Z')), '26-27') // already 1 April in India
  assert.equal(financialYear(new Date('2026-03-31T12:00:00Z')), '25-26')
  assert.equal(financialYear(new Date('2099-06-01T00:00:00Z')), '99-00')
})

test('invoice numbers are 16 characters', () => {
  assert.equal(invoiceNumber('26-27', 1), 'INV/26-27/000001')
  assert.equal(invoiceNumber('26-27', 123456).length, 16)
})

test('tax is split out of inclusive prices, rounded to paise', () => {
  // ₹900 at 12%: taxable 803.57, tax 96.43
  assert.deepEqual(splitGst(90000, 12, true), { taxable: 80357, cgst: 4822, sgst: 4821, igst: 0 })
  assert.deepEqual(splitGst(90000, 12, false), { taxable: 80357, cgst: 0, sgst: 0, igst: 9643 })
  assert.deepEqual(splitGst(10000, 0, true), { taxable: 10000, cgst: 0, sgst: 0, igst: 0 })
  assert.ok(isIntraState(' maharashtra ', 'Maharashtra'))
  assert.ok(!isIntraState('Karnataka', 'Maharashtra'))
})

test('charges follow the highest item rate; bill of supply has no tax', () => {
  const items = [
    { description: 'Print', hsn: '4911', qty: 2, total: 1800, rate: 12 },
    { description: 'Original', hsn: '9701', qty: 1, total: 6500, rate: 18 },
  ]
  const lines = invoiceLines(items, [{ description: 'Delivery', total: 99 }, { description: 'COD fee', total: 0 }], false, true)
  assert.equal(lines.length, 3) // zero charge dropped
  assert.equal(lines[2].rate, 18)
  assert.equal(lines[2].hsn, '9701')
  const t = invoiceTotals(lines)
  assert.equal(t.total, 8399)
  assert.equal(Math.round((t.taxable + t.igst) * 100), 839900) // parts add back up to the total
  assert.equal(hsnSummary(lines).length, 2)

  const bos = invoiceLines(items, [], true, false)
  assert.ok(bos.every((l) => l.rate === 0 && l.cgst === 0 && l.taxable === l.total))
})

test('amount in words, Indian system', () => {
  assert.equal(amountInWords(8349), 'Rupees Eight Thousand Three Hundred Forty-Nine Only')
  assert.equal(amountInWords(125000), 'Rupees One Lakh Twenty-Five Thousand Only')
  assert.equal(amountInWords(0), 'Rupees Zero Only')
  assert.equal(amountInWords(10), 'Rupees Ten Only')
  assert.equal(amountInWords(23_45_67_890), 'Rupees Twenty-Three Crore Forty-Five Lakh Sixty-Seven Thousand Eight Hundred Ninety Only')
})
