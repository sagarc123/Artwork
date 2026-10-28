// Business details. Values the owner hasn't supplied yet come from env and stay empty until then.
export const site = {
  artistName: 'Siddesh Mokashi',
  // ponytail: brand name not given yet; the artist's name stands in until it is.
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME || 'Siddesh Mokashi',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '', // digits incl. country code, e.g. 919800000000
  phone: process.env.NEXT_PUBLIC_PHONE || '',
  email: process.env.NEXT_PUBLIC_EMAIL || '',
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || '',
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || '',
  // Sections still being built: every link to them stays hidden until the flag is switched on.
  coursesLive: true,
  // "Enrol" adds the course to the cart (or enrols a free course) after phone sign-in. true brings back the part-1 WhatsApp chat.
  enrolByWhatsApp: false,
  accountsLive: true,
}

/** ₹4,500 style prices (Indian grouping). Stored as whole rupees. */
export const formatPrice = (rupees: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rupees)

/** wa.me link with a prefilled message. Without a number, WhatsApp asks which chat to use. */
export const whatsappLink = (message: string, number = site.whatsappNumber) =>
  `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
