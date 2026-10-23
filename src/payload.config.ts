import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { Artworks } from './payload/collections/Artworks'
import { Courses, Lessons } from './payload/collections/Courses'
import { Enquiries } from './payload/collections/Enquiries'
import { Invoices } from './payload/collections/Invoices'
import { Orders } from './payload/collections/Orders'
import { Media } from './payload/collections/Media'
import { Products } from './payload/collections/Products'
import { Categories, Festivals, Mediums } from './payload/collections/Taxonomies'
import { TaxClasses } from './payload/collections/TaxClasses'
import { Testimonials } from './payload/collections/Testimonials'
import { Users } from './payload/collections/Users'
import { CommerceSettings } from './payload/globals/CommerceSettings'
import { ServicePrices } from './payload/globals/ServicePrices'
import { SiteSettings } from './payload/globals/SiteSettings'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Fail closed: never run with a missing secret or database address.
if (!process.env.PAYLOAD_SECRET) throw new Error('PAYLOAD_SECRET is not set (see .env.example)')
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (see .env.example)')

// Development: the admin talks to whatever port `next dev` runs on (NEXT_PUBLIC_SITE_URL may still say :3000), so its
// requests stay same-origin and the login cookie is accepted. Production keeps the single site address.
const dev = process.env.NODE_ENV !== 'production'

/** No "API" tab on edit screens: it shows raw JSON, which only confuses. */
const noApiTab = <T extends { admin?: object }>(c: T): T => ({ ...c, admin: { ...c.admin, hideAPIURL: true } })

export default buildConfig({
  serverURL: dev ? undefined : siteUrl,
  csrf: dev ? [siteUrl, 'http://localhost:3000', 'http://localhost:3001'] : [siteUrl],
  routes: { api: '/cms-api' },
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · Siddesh Mokashi',
      description: 'Back office for siddeshmokashi.com',
      icons: [{ rel: 'icon', type: 'image/png', url: '/icon.png' }, { rel: 'apple-touch-icon', url: '/apple-icon.png' }],
      defaultOGImageType: 'off',
      robots: { index: false, follow: false },
    },
    dateFormat: 'd MMM yyyy, h:mm a',
    components: {
      graphics: { Logo: '/payload/admin/Brand#Logo', Icon: '/payload/admin/Brand#Icon' },
      // "Today": what needs doing, above the usual collection cards.
      beforeDashboard: ['/payload/admin/Today#Today'],
      beforeNavLinks: ['/payload/admin/Today#TodayNavLink'],
      actions: ['/payload/admin/LocaleNote#LocaleNote'],
    },
    // ponytail: the admin itself stays in English; Payload has no Marathi or Hindi admin translations yet.
  },
  // Plain words instead of Payload's own (merged over its English texts).
  i18n: {
    translations: {
      en: {
        general: {
          locale: 'Language',
          locales: 'Languages',
          payloadSettings: 'Your settings',
          adminTheme: 'Colours',
          createNew: 'Add new',
          dashboard: 'Today',
        },
        authentication: { forceUnlock: 'Unlock (after too many wrong passwords)', login: 'Sign in' },
      },
    },
  },
  // Menu groups follow this order: Orders, Enquiries, Shop, Gallery & Festivals, (Courses, hidden), Settings.
  collections: [Orders, Invoices, Enquiries, Products, Artworks, Festivals, Testimonials, Media, Courses, Lessons, Categories, Mediums, TaxClasses, Users].map(noApiTab),
  globals: [SiteSettings, CommerceSettings, ServicePrices].map(noApiTab),
  localization: {
    locales: [
      { code: 'en', label: 'English' },
      { code: 'mr', label: 'मराठी (Marathi)' },
      { code: 'hi', label: 'हिंदी (Hindi)' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET,
  graphQL: { disable: true },
  telemetry: false,
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    schemaName: 'payload',
    // Schema changes go through migrations (src/migrations), the same way in development and production.
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
})
