import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { Artworks } from './payload/collections/Artworks'
import { Courses, Lessons } from './payload/collections/Courses'
import { Media } from './payload/collections/Media'
import { Products } from './payload/collections/Products'
import { Categories, Festivals, Mediums } from './payload/collections/Taxonomies'
import { Testimonials } from './payload/collections/Testimonials'
import { Users } from './payload/collections/Users'
import { SiteSettings } from './payload/globals/SiteSettings'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Fail closed: never run with a missing secret or database address.
if (!process.env.PAYLOAD_SECRET) throw new Error('PAYLOAD_SECRET is not set (see .env.example)')
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (see .env.example)')

export default buildConfig({
  serverURL: siteUrl,
  csrf: [siteUrl],
  routes: { api: '/cms-api' },
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' — Siddesh Mokashi admin' },
  },
  collections: [Products, Artworks, Courses, Lessons, Festivals, Testimonials, Media, Categories, Mediums, Users],
  globals: [SiteSettings],
  localization: {
    locales: [
      { code: 'en', label: 'English' },
      { code: 'mr', label: 'मराठी' },
      { code: 'hi', label: 'हिंदी' },
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
