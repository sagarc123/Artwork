import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
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
import { Certificates, Customers, Enrolments, LessonProgress, OtpCodes } from './payload/collections/Students'
import { Consents, Subscribers } from './payload/collections/Newsletter'
import { DataRequests } from './payload/collections/Privacy'
import { ReviewPhotos, Reviews } from './payload/collections/Reviews'
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
      // Our own pages (each checks who may open it).
      views: {
        customers: { Component: '/payload/admin/Customers#CustomersView', path: '/customers', meta: { title: 'Customers' } },
        festivalPlanner: { Component: '/payload/admin/FestivalPlanner#FestivalPlannerView', path: '/festival-planner', meta: { title: 'Festival planner' } },
        addCall: { Component: '/payload/admin/AddCall#AddCallView', path: '/add-call', meta: { title: 'Enquiry from a call' } },
      },
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
          backToDashboard: 'Back to Today',
          // Lists with their own empty line (orders, paintings…) hide these; the rest show them.
          noResultsFound: 'Nothing here yet.',
          noResultsDescription: 'If you searched or picked a filter, clear it to see everything.',
          untitled: 'No name yet',
          createdAt: 'Added',
          updatedAt: 'Last changed',
          lastModified: 'Last changed',
          selectValue: 'Choose…',
          or: 'or',
        },
        // The ⋮ menu's "copy to another language" (Payload calls languages locales).
        localization: {
          copyToLocale: 'Copy to another language',
          copyTo: 'Copy to',
          copyFrom: 'Copy from',
          copyFromTo: 'Copying from {{from}} to {{to}}',
          cannotCopySameLocale: 'Pick a different language to copy to',
          selectedLocales: 'in chosen languages',
          selectLocaleToCopy: 'Choose a language to copy',
          selectLocaleToDuplicate: 'Choose the languages to copy into',
          localeToPublish: 'Language to put on website',
        },
        upload: { selectFile: 'Choose a file', fileName: 'File name' },
        authentication: { forceUnlock: 'Unlock (after too many wrong passwords)', login: 'Sign in' },
        // Drafts stay (a half-done piece can wait off the website), in plain words: "Save for later" keeps it off the
        // website, "Put on website" makes it live, "History" lists earlier saves.
        version: {
          saveDraft: 'Save for later',
          draftSavedSuccessfully: 'Saved for later. The website still shows what you last put on it.',
          publish: 'Put on website',
          publishChanges: 'Put on website',
          publishIn: 'Put on website ({{locale}} only)',
          published: 'On website',
          draft: 'Not on website',
          draftHasPublishedVersion: 'On website, with changes saved for later',
          unpublish: 'Take off website',
          confirmUnpublish: 'Take off website',
          aboutToUnpublish: 'This takes it off the website. You can put it back any time.',
          unpublishedSuccessfully: 'Taken off the website.',
          versions: 'History',
          versionID: 'Version number',
          currentlyPublished: 'On website now',
          previouslyPublished: 'Was on website',
          previouslyDraft: 'Was not on website',
          currentDraft: 'Latest, not on website',
          currentPublishedVersion: 'Version on website now',
          preview: 'See it on the website',
        },
      },
    },
  },
  // Menu groups follow this order: Orders & enquiries (orders, invoices, enquiries; the Customers page sits above them), Shop, Gallery & Festivals, (Courses, hidden), Lists (categories, mediums, GST classes), Settings.
  collections: [Orders, Invoices, Enquiries, Products, Artworks, Festivals, Testimonials, Reviews, ReviewPhotos, Media, Courses, Lessons, Enrolments, Certificates, LessonProgress, Customers, OtpCodes, Subscribers, Consents, DataRequests, Categories, Mediums, TaxClasses, Users].map(noApiTab),
  globals: [SiteSettings, CommerceSettings, ServicePrices].map(noApiTab),
  localization: {
    locales: [
      { code: 'en', label: 'English' },
      { code: 'mr', label: 'मराठी' },
      { code: 'hi', label: 'हिंदी' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET,
  graphQL: { disable: true },
  // Biggest upload anywhere (the making-of video). Photos get a smaller cap in the Media collection (see Media.ts).
  upload: { limits: { fileSize: 200 * 1024 * 1024 } },
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
