// Admin helpers for the Today page and the one-tap WhatsApp buttons. No server-only imports (used by admin client components).
import { formatPrice, site, whatsappLink } from './site.ts'
import { isLocale, localePath } from '../i18n/config.ts'

type Lang = 'en' | 'mr' | 'hi'
const lang = (l?: string | null): Lang => (l === 'mr' || l === 'hi' ? l : 'en')

const ARTIST: Record<Lang, string> = { en: site.artistName, mr: 'सिद्धेश मोकाशी', hi: 'सिद्धेश मोकाशी' }

const ENQUIRY_WORDS: Record<Lang, Record<string, string>> = {
  en: { event: 'rangoli for your event', portrait: 'a custom portrait', workshop: 'a workshop', general: 'your message' },
  mr: { event: 'कार्यक्रमासाठी रांगोळी', portrait: 'खास पोर्ट्रेट', workshop: 'कार्यशाळा', general: 'तुमचा संदेश' },
  hi: { event: 'कार्यक्रम के लिए रंगोली', portrait: 'कस्टम पोर्ट्रेट', workshop: 'वर्कशॉप', general: 'आपका संदेश' },
}

/** Customer's 10-digit mobile → wa.me chat with the message filled in. */
export const customerChat = (phone: string | null | undefined, message: string) => {
  const digits = (phone ?? '').replace(/\D/g, '')
  return whatsappLink(message, digits.length === 10 ? `91${digits}` : digits)
}

/** First reply to an enquiry, in the language the customer used on the website. */
export function enquiryReply(e: { name?: string | null; type?: string | null; locale?: string | null }) {
  const l = lang(e.locale)
  const name = e.name?.trim() || ''
  const what = ENQUIRY_WORDS[l][e.type ?? ''] ?? ENQUIRY_WORDS[l].general
  return {
    en: `Namaste ${name}! This is ${ARTIST.en}. Thank you for asking about ${what}. I would be happy to help. Could you tell me a little more (date, place and size)?`,
    mr: `नमस्कार ${name}! मी ${ARTIST.mr}. ${what} बद्दल विचारल्याबद्दल धन्यवाद. मला मदत करायला नक्की आवडेल. थोडी अधिक माहिती (तारीख, ठिकाण आणि आकार) सांगाल का?`,
    hi: `नमस्ते ${name}! मैं ${ARTIST.hi} हूँ। ${what} के बारे में पूछने के लिए धन्यवाद। मुझे मदद करके खुशी होगी। क्या आप थोड़ा और (तारीख, जगह और आकार) बता सकते हैं?`,
  }[l]
}

type OrderInfo = { name?: string | null; orderNumber?: string | null; total?: number | null; locale?: string | null }

/** Asks a cash-on-delivery customer to confirm before anything is packed. */
export function codConfirmAsk(o: OrderInfo) {
  const l = lang(o.locale)
  const amount = formatPrice(o.total ?? 0)
  return {
    en: `Namaste ${o.name ?? ''}! This is ${ARTIST.en}. We received your cash-on-delivery order ${o.orderNumber} for ${amount}. Please reply YES to confirm, and I will pack it for you.`,
    mr: `नमस्कार ${o.name ?? ''}! मी ${ARTIST.mr}. तुमची कॅश ऑन डिलिव्हरी ऑर्डर ${o.orderNumber} (${amount}) मिळाली. पक्की करण्यासाठी कृपया "हो" असे उत्तर द्या, मग मी ती पॅक करतो.`,
    hi: `नमस्ते ${o.name ?? ''}! मैं ${ARTIST.hi} हूँ। आपका कैश ऑन डिलीवरी ऑर्डर ${o.orderNumber} (${amount}) मिला। पक्का करने के लिए कृपया "हाँ" लिखें, फिर मैं इसे पैक करूँगा।`,
  }[l]
}

/** "On its way" message with the courier, tracking number and the private order page. */
export function trackingMessage(o: OrderInfo & { courier?: string | null; trackingNumber?: string | null; link: string }) {
  const l = lang(o.locale)
  return {
    en: `Namaste ${o.name ?? ''}! Your order ${o.orderNumber} is on its way. Courier: ${o.courier}, tracking number: ${o.trackingNumber}. You can see your order here: ${o.link}`,
    mr: `नमस्कार ${o.name ?? ''}! तुमची ऑर्डर ${o.orderNumber} पाठवली आहे. कुरिअर: ${o.courier}, ट्रॅकिंग नंबर: ${o.trackingNumber}. तुमची ऑर्डर इथे पाहा: ${o.link}`,
    hi: `नमस्ते ${o.name ?? ''}! आपका ऑर्डर ${o.orderNumber} भेज दिया गया है। कूरियर: ${o.courier}, ट्रैकिंग नंबर: ${o.trackingNumber}। अपना ऑर्डर यहाँ देखें: ${o.link}`,
  }[l]
}

/** "just now", "40 min ago", "5 h ago", "3 days ago": how long ago something came in. */
export function ago(ms: number) {
  const min = Math.floor(ms / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  if (h < 48) return `${h} h ago`
  return `${Math.floor(h / 24)} days ago`
}

/** Admin list link with a filter, e.g. listUrl('orders', 'status', ['paid', 'cod_confirmed']). */
export function listUrl(collection: string, field: string, values: string[]) {
  const where = values.length === 1 ? `where[${field}][equals]=${values[0]}` : values.map((v, i) => `where[${field}][in][${i}]=${v}`).join('&')
  return `/admin/collections/${collection}?${where}`
}

/** A page on the public site in the given language, for "View on site" buttons. */
export const sitePath = (locale: string | undefined, path: string) => localePath(isLocale(locale) ? locale : 'en', path)
