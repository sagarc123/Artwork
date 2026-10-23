// Development only: fills the LOCAL database with clearly marked sample content so the pages can be seen working.
// Run: npm run seed   (re-running replaces the old samples). Real content is never touched: samples use "sample-" slugs.
import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../src/payload.config'
import { seededRandom } from '../src/lib/seed'

const url = process.env.DATABASE_URL ?? ''
if (process.env.NODE_ENV === 'production' || !/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  throw new Error('The sample seed only runs against a local database.')
}

const COLOURS = ['#a6261d', '#e8890c', '#0b5e73', '#f2b705', '#2e6b3c']
const FLOORS = ['#1e1b18', '#0b5e73', '#a6261d', '#2e6b3c', '#faf6ef']

/** A seeded rangoli as a PNG photo stand-in (white powder lines, colour petals). */
async function rangoliPng(seed: string) {
  const rand = seededRandom(seed)
  const floor = FLOORS[Math.floor(rand() * FLOORS.length)]
  const line = floor === '#faf6ef' ? '#1e1b18' : '#faf6ef'
  const k = [6, 8, 12][Math.floor(rand() * 3)]
  const pt = (r: number, deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180
    return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`
  }
  let petals = ''
  for (const [r1, r2] of [[60, 140], [140, 230], [230, 320]]) {
    const off = rand() < 0.5 ? 0 : 180 / k
    const w = 10 + rand() * 30
    const fill = COLOURS[Math.floor(rand() * COLOURS.length)]
    const d = `M${pt(r1, off)}Q${pt((r1 + r2) / 2, off - w)} ${pt(r2, off)}Q${pt((r1 + r2) / 2, off + w)} ${pt(r1, off)}Z`
    for (let i = 0; i < k; i++) petals += `<path d="${d}" transform="rotate(${(i * 360) / k})" fill="${fill}" stroke="${line}" stroke-width="7"/>`
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-400 -500 800 1000" width="800" height="1000">
    <rect x="-400" y="-500" width="800" height="1000" fill="${floor}"/>
    <circle r="350" fill="none" stroke="${line}" stroke-width="6" stroke-dasharray="2 22" stroke-linecap="round"/>
    ${petals}<circle r="45" fill="${COLOURS[Math.floor(rand() * COLOURS.length)]}" stroke="${line}" stroke-width="7"/>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

const payload = await getPayload({ config })

// Remove earlier samples (only "sample-" slugs).
for (const collection of ['artworks', 'products', 'festivals', 'categories', 'mediums'] as const) {
  await payload.delete({ collection, where: { slug: { like: 'sample-' } } })
}
await payload.delete({ collection: 'media', where: { alt: { like: 'Sample:' } } })

type Names = { en: string; mr: string; hi: string }
async function named<C extends 'categories' | 'mediums' | 'festivals'>(collection: C, slug: string, n: Names, extra: Record<string, unknown> = {}) {
  const doc = await payload.create({ collection, locale: 'en', data: { name: n.en, slug: `sample-${slug}`, ...extra } as never })
  for (const locale of ['mr', 'hi'] as const) await payload.update({ collection, id: doc.id, locale, data: { name: n[locale] } as never })
  return doc.id
}

const shopCats = {
  drawings: await named('categories', 'drawings', { en: 'Drawings', mr: 'रेखाटने', hi: 'स्केच' }, { scope: 'shop', order: 1 }),
  paintings: await named('categories', 'paintings', { en: 'Paintings', mr: 'रंगचित्रे', hi: 'पेंटिंग' }, { scope: 'shop', order: 2 }),
  rangoli: await named('categories', 'rangoli-designs', { en: 'Rangoli Designs', mr: 'रांगोळी डिझाइन्स', hi: 'रंगोली डिज़ाइन' }, { scope: 'shop', order: 3 }),
}
const artCats = {
  rangoli: await named('categories', 'art-rangoli', { en: 'Rangoli', mr: 'रांगोळी', hi: 'रंगोली' }, { scope: 'artwork', order: 1 }),
  drawings: await named('categories', 'art-drawings', { en: 'Drawings', mr: 'रेखाटने', hi: 'स्केच' }, { scope: 'artwork', order: 2 }),
  paintings: await named('categories', 'art-paintings', { en: 'Paintings', mr: 'रंगचित्रे', hi: 'पेंटिंग' }, { scope: 'artwork', order: 3 }),
  commissions: await named('categories', 'art-commissions', { en: 'Commissions', mr: 'खास ऑर्डर', hi: 'कस्टम काम' }, { scope: 'artwork', order: 4 }),
}
const mediums = {
  charcoal: await named('mediums', 'charcoal', { en: 'Charcoal', mr: 'चारकोल', hi: 'चारकोल' }),
  acrylic: await named('mediums', 'acrylic', { en: 'Acrylic', mr: 'ॲक्रिलिक', hi: 'एक्रिलिक' }),
  rangoli: await named('mediums', 'rangoli-colours', { en: 'Rangoli colours', mr: 'रांगोळीचे रंग', hi: 'रंगोली के रंग' }),
}
// Sample festival dates (check the panchang each year): they drive the home page countdown.
const fest = {
  diwali: await named('festivals', 'diwali', { en: 'Diwali', mr: 'दिवाळी', hi: 'दिवाली' }, { order: 1, nextDate: '2026-11-08T12:00:00.000Z', intro: 'Five nights of light deserve a doorstep that glows. (sample text)' }),
  ganesh: await named('festivals', 'ganesh-chaturthi', { en: 'Ganesh Chaturthi', mr: 'गणेशोत्सव', hi: 'गणेश चतुर्थी' }, { order: 2, nextDate: '2027-09-04T12:00:00.000Z' }),
  gudi: await named('festivals', 'gudi-padwa', { en: 'Gudi Padwa', mr: 'गुढीपाडवा', hi: 'गुड़ी पड़वा' }, { order: 3, nextDate: '2027-04-07T12:00:00.000Z' }),
  wedding: await named('festivals', 'wedding', { en: 'Weddings', mr: 'लग्नसोहळा', hi: 'शादी' }, { order: 4 }),
}

async function photo(seed: string, alt: string) {
  const data = await rangoliPng(seed)
  const doc = await payload.create({ collection: 'media', data: { alt: `Sample: ${alt}` }, file: { data, mimetype: 'image/png', name: `sample-${seed}.png`, size: data.length } })
  return doc.id
}

const products = [
  { slug: 'peacock-rangoli', title: 'Peacock Sanskar Bharti rangoli', type: 'original', cat: shopCats.rangoli, medium: mediums.rangoli, festival: fest.diwali, variants: [{ label: 'Original', price: 6500, stock: 1 }], framing: true },
  { slug: 'monsoon-evening', title: 'Monsoon evening', type: 'original', cat: shopCats.paintings, medium: mediums.acrylic, variants: [{ label: 'Original', price: 12000, stock: 1 }], framing: true },
  { slug: 'grandmother', title: 'Grandmother in charcoal', type: 'original', cat: shopCats.drawings, medium: mediums.charcoal, variants: [{ label: 'Original', price: 8500, stock: 0 }] },
  { slug: 'diya-print', title: 'Diya rangoli print', type: 'print', cat: shopCats.rangoli, festival: fest.diwali, variants: [{ label: 'A4 print', price: 900, stock: 30 }, { label: 'A3 print', price: 1500, stock: 20 }], framing: true },
  { slug: 'lotus-stencil', title: 'Lotus rangoli pattern (printable)', type: 'digital', cat: shopCats.rangoli, festival: fest.gudi, variants: [{ label: 'PDF, A4 and A3', price: 199, stock: 999 }] },
  { slug: 'ganesh-sketch', title: 'Ganesh sketch print', type: 'print', cat: shopCats.drawings, medium: mediums.charcoal, festival: fest.ganesh, variants: [{ label: 'A4 print', price: 800, stock: 15 }] },
] as const

// Sample GST classes: the CA must confirm codes and rates before going live.
await payload.delete({ collection: 'tax-classes', where: { name: { like: '(sample' } } })
const taxClass = async (name: string, hsn: string, rate: number) =>
  (await payload.create({ collection: 'tax-classes', data: { name: `${name} (sample — confirm with CA)`, hsn, rate } })).id
const taxClasses = { original: await taxClass('Original artwork', '9701', 12), print: await taxClass('Print', '4911', 12) }
await payload.updateGlobal({ slug: 'commerce-settings', data: { giftWrapFee: 49, tax: { sellerState: 'Maharashtra', defaultTaxClass: taxClasses.print } } })

// SAMPLE starting prices — the owner confirms or replaces them in Admin → Settings → Service prices.
const round100 = (n: number) => Math.round(n / 100) * 100
const pencil = { a4: 1800, a3: 2800, a2: 4500 }
const scaled = (pct: number) => ({ a4: round100(pencil.a4 * pct), a3: round100(pencil.a3 * pct), a2: round100(pencil.a2 * pct) })
await payload.updateGlobal({
  slug: 'service-prices',
  locale: 'en',
  data: {
    events: { small: 1500, medium: 3500, large: 7500, travelNote: 'Sample: travel outside Pune is added to the quote.' },
    portraits: {
      pencil: { ...pencil, days: '7–10' },
      charcoal: { ...scaled(1.2), days: '10–14' }, // +20%
      colour: { ...scaled(1.5), days: '10–14' }, // +50%
      extraPersonPercent: 40,
      advancePercent: 50,
    },
  },
})
await payload.updateGlobal({ slug: 'service-prices', locale: 'mr', data: { events: { travelNote: 'नमुना: पुण्याबाहेरचा प्रवास खर्च किमतीत जोडला जातो.' } } })
await payload.updateGlobal({ slug: 'service-prices', locale: 'hi', data: { events: { travelNote: 'नमूना: पुणे से बाहर का यात्रा खर्च कीमत में जुड़ता है।' } } })

// Sample reviews, clearly marked, so the review sections can be seen working. Real ones need the customer's permission.
await payload.delete({ collection: 'testimonials', where: { name: { like: '(sample)' } } })
const reviews = [
  {
    name: 'Priya, Nashik (sample)', rating: 5, featured: true,
    context: { en: 'Wedding rangoli', mr: 'लग्नाची रांगोळी', hi: 'शादी की रंगोली' },
    quote: {
      en: 'The entrance rangoli was the first thing every guest photographed. He came early and finished before the baraat.',
      mr: 'प्रवेशद्वारावरची रांगोळी पाहून प्रत्येक पाहुण्याने आधी फोटो काढला. ते लवकर आले आणि वरात येण्याआधी काम पूर्ण झाले.',
      hi: 'प्रवेश द्वार की रंगोली की हर मेहमान ने सबसे पहले फ़ोटो ली। वे जल्दी आए और बारात से पहले काम पूरा हो गया।',
    },
  },
  {
    name: 'Rohan, Pune (sample)', rating: 5, featured: true,
    context: { en: 'Charcoal portrait', mr: 'चारकोल पोर्ट्रेट', hi: 'चारकोल पोर्ट्रेट' },
    quote: {
      en: 'I only had one torn photo of my grandfather. The portrait looks just like him — my father was in tears.',
      mr: 'आजोबांचा एकच फाटलेला फोटो होता. पोर्ट्रेट अगदी त्यांच्यासारखे दिसते — बाबांच्या डोळ्यांत पाणी आले.',
      hi: 'दादाजी की बस एक फटी फ़ोटो थी। पोर्ट्रेट बिल्कुल उनके जैसा है — पापा की आँखें भर आईं।',
    },
  },
  {
    name: 'Sunita, Pune (sample)', rating: 5, featured: false,
    context: { en: 'Diwali print, cash on delivery', mr: 'दिवाळी प्रिंट, कॅश ऑन डिलिव्हरी', hi: 'दिवाली प्रिंट, कैश ऑन डिलीवरी' },
    quote: {
      en: 'Ordered on WhatsApp, paid when it arrived. Packed so well, and it came before Diwali.',
      mr: 'WhatsApp वर ऑर्डर केली, आल्यावर पैसे दिले. छान पॅकिंग, आणि दिवाळीआधी पोहोचली.',
      hi: 'WhatsApp पर ऑर्डर किया, आने पर पैसे दिए। बढ़िया पैकिंग, और दिवाली से पहले पहुँच गया।',
    },
  },
  {
    name: 'Kulkarni family, Satara (sample)', rating: 4, featured: false,
    context: { en: 'Society Ganesh festival', mr: 'सोसायटीचा गणेशोत्सव', hi: 'सोसायटी का गणेशोत्सव' },
    quote: {
      en: 'Quick reply, a clear price before the day, and a huge rangoli the children still talk about.',
      mr: 'लगेच उत्तर, आधीच स्पष्ट किंमत, आणि मुले अजूनही जिच्याबद्दल बोलतात अशी भव्य रांगोळी.',
      hi: 'तुरंत जवाब, पहले से साफ़ कीमत, और इतनी बड़ी रंगोली कि बच्चे आज भी उसकी बात करते हैं।',
    },
  },
] as const
for (const r of reviews) {
  const doc = await payload.create({ collection: 'testimonials', locale: 'en', data: { name: r.name, rating: r.rating, featured: r.featured, permission: true, context: r.context.en, quote: r.quote.en } })
  for (const locale of ['mr', 'hi'] as const) await payload.update({ collection: 'testimonials', id: doc.id, locale, data: { context: r.context[locale], quote: r.quote[locale] } })
}

const productIds: Record<string, number> = {}
for (const p of products) {
  const doc = await payload.create({
    collection: 'products',
    locale: 'en',
    data: {
      title: `${p.title} (sample)`,
      slug: `sample-${p.slug}`,
      type: p.type,
      category: p.cat,
      medium: 'medium' in p ? p.medium : undefined,
      festival: 'festival' in p ? p.festival : undefined,
      images: [await photo(p.slug, p.title)],
      story: 'This is sample text so the page can be seen working. Replace it with the real story behind the piece.',
      widthCm: 30,
      heightCm: 40,
      year: 2026,
      variants: p.variants.map((v) => ({ ...v })),
      taxClass: p.type === 'digital' ? undefined : taxClasses[p.type],
      framing: 'framing' in p ? [{ label: 'Black wood frame', extraPrice: 1800 }, { label: 'Natural teak frame', extraPrice: 2400 }] : [],
      featured: true,
      _status: 'published',
    },
  })
  productIds[p.slug] = doc.id
}

const artworks = [
  ['diwali-doorstep', 'Diwali doorstep, Pune', artCats.rangoli, fest.diwali],
  ['ganesh-mandal', 'Ganesh mandal entrance', artCats.rangoli, fest.ganesh],
  ['gudi-morning', 'Gudi Padwa morning', artCats.rangoli, fest.gudi],
  ['wedding-mandap', 'Wedding mandap, Nashik', artCats.commissions, fest.wedding],
  ['old-wada', 'The old wada', artCats.drawings, undefined],
  ['river-ghat', 'River ghat at dusk', artCats.paintings, undefined],
  ['peacock', 'Peacock rangoli', artCats.rangoli, fest.diwali],
  ['portrait-aaji', 'Aaji, from a photo', artCats.commissions, undefined],
] as const
for (const [i, [slug, title, category, festival]] of artworks.entries()) {
  const forSale = slug === 'peacock'
  await payload.create({
    collection: 'artworks',
    locale: 'en',
    data: {
      title: `${title} (sample)`,
      slug: `sample-${slug}`,
      images: [await photo(`art-${slug}`, title)],
      category,
      festival,
      year: 2020 + (i % 6),
      story: 'Sample story: a few lines about the day this was drawn, the colours chosen and who it was for.',
      forSale,
      product: forSale ? productIds['peacock-rangoli'] : undefined,
      order: i,
      _status: 'published',
    },
  })
}

console.log(`Seeded ${products.length} sample products, ${artworks.length} artworks, 4 festivals, ${reviews.length} reviews and sample service prices.`)
process.exit(0)
