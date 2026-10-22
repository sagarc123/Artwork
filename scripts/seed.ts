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
const fest = {
  diwali: await named('festivals', 'diwali', { en: 'Diwali', mr: 'दिवाळी', hi: 'दिवाली' }, { order: 1, intro: 'Five nights of light deserve a doorstep that glows. (sample text)' }),
  ganesh: await named('festivals', 'ganesh-chaturthi', { en: 'Ganesh Chaturthi', mr: 'गणेशोत्सव', hi: 'गणेश चतुर्थी' }, { order: 2 }),
  gudi: await named('festivals', 'gudi-padwa', { en: 'Gudi Padwa', mr: 'गुढीपाडवा', hi: 'गुड़ी पड़वा' }, { order: 3 }),
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

console.log(`Seeded ${products.length} sample products, ${artworks.length} artworks, 4 festivals.`)
process.exit(0)
