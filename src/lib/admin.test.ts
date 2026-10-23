import { test } from 'node:test'
import assert from 'node:assert/strict'
import { codConfirmAsk, customerChat, enquiryReply, listUrl, sitePath, trackingMessage, waited } from './admin.ts'

test('enquiry reply is in the customer language, with their name and what they asked about', () => {
  assert.match(enquiryReply({ name: 'Priya', type: 'event', locale: 'en' }), /^Namaste Priya!.*rangoli for your event/)
  assert.match(enquiryReply({ name: 'प्रिया', type: 'portrait', locale: 'mr' }), /^नमस्कार प्रिया!.*खास पोर्ट्रेट/)
  assert.match(enquiryReply({ name: 'Ravi', type: 'workshop', locale: 'hi' }), /^नमस्ते Ravi!.*वर्कशॉप/)
  // Unknown language or type: English, general wording.
  assert.match(enquiryReply({ name: 'A', type: 'weird', locale: 'fr' }), /your message/)
})

test('WhatsApp links go to the Indian number with the message encoded', () => {
  const url = customerChat('9876543210', 'Hi & bye')
  assert.equal(url, 'https://wa.me/919876543210?text=Hi%20%26%20bye')
  assert.ok(customerChat('919876543210', 'x').startsWith('https://wa.me/919876543210'))
})

test('order messages carry the number, amount, courier, tracking and link', () => {
  assert.match(codConfirmAsk({ name: 'Sunita', orderNumber: 'ART-10001', total: 1899, locale: 'en' }), /ART-10001 for ₹1,899.*YES/)
  assert.match(codConfirmAsk({ name: 'S', orderNumber: 'ART-1', total: 900, locale: 'mr' }), /ART-1 \(₹900\)/)
  const t = trackingMessage({ name: 'S', orderNumber: 'ART-2', courier: 'DTDC', trackingNumber: 'D123', link: 'https://x.in/order/abc', locale: 'hi' })
  assert.match(t, /DTDC.*D123.*https:\/\/x\.in\/order\/abc/)
})

test('waiting time reads naturally', () => {
  assert.equal(waited(25 * 60_000), '25 min')
  assert.equal(waited(5 * 3_600_000), '5 h')
  assert.equal(waited(50 * 3_600_000), '2 days')
  assert.equal(waited(-1), '0 min')
})

test('list links filter by one or several values', () => {
  assert.equal(listUrl('enquiries', 'status', ['new']), '/admin/collections/enquiries?where[status][equals]=new')
  assert.equal(listUrl('orders', 'status', ['paid', 'cod_confirmed']), '/admin/collections/orders?where[status][in][0]=paid&where[status][in][1]=cod_confirmed')
})

test('View on site links follow the language being edited', () => {
  assert.equal(sitePath('en', '/shop/p/x'), '/shop/p/x')
  assert.equal(sitePath('mr', '/shop/p/x'), '/mr/shop/p/x')
  assert.equal(sitePath(undefined, '/artwork'), '/artwork')
})
