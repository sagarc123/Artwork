import { NextResponse, type NextRequest } from 'next/server'
import { Pool } from 'pg'
import { LOCALE_COOKIE, resolveLocaleRoute } from './i18n/config'
import { readCertId } from './lib/learn'

// ponytail: one tiny pool just for the order-link check below; the CMS keeps its own.
let pool: Pool | undefined

/** Order pages render per request and stream, so an unknown link is turned into a real 404 here, before rendering. */
async function orderExists(publicId: string) {
  if (!/^[A-Za-z0-9_-]{12}$/.test(publicId)) return false
  try {
    pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 2 })
    const r = await pool.query('SELECT 1 FROM payload.orders WHERE public_id = $1 LIMIT 1', [publicId])
    return r.rows.length > 0
  } catch {
    return true // Let the page decide (it still shows "not found").
  }
}

/** Same for certificate links: an unknown number is a real 404, not a streamed 200. */
async function certificateExists(raw: string) {
  const id = readCertId(decodeURIComponent(raw))
  if (!id) return false
  try {
    pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 2 })
    return (await pool.query('SELECT 1 FROM payload.certificates WHERE public_id = $1 LIMIT 1', [id])).rows.length > 0
  } catch {
    return true
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const order = pathname.match(/^(?:\/(mr|hi))?\/order\/([^/]+)\/?$/)
  // Any unknown path under the locale renders the not-found page with a 404 status.
  const cert = pathname.match(/^(?:\/(mr|hi))?\/(?:verify|certificate)\/([^/]+)\/?$/)
  if (cert && !(await certificateExists(cert[2]))) return NextResponse.rewrite(new URL(`/${cert[1] ?? 'en'}/not-found`, request.url))
  if (order && !(await orderExists(order[2]))) return NextResponse.rewrite(new URL(`/${order[1] ?? 'en'}/not-found`, request.url))

  const route = resolveLocaleRoute(pathname, request.cookies.get(LOCALE_COOKIE)?.value, request.headers.get('accept-language'))
  if (route.action === 'next') return NextResponse.next()
  const url = new URL(`${route.to}${search}`, request.url)
  if (route.action === 'rewrite') return NextResponse.rewrite(url)
  const res = NextResponse.redirect(url)
  if (route.remember) {
    // Same cookie the language switcher writes; the first-visit strip then stays hidden.
    res.cookies.set(LOCALE_COOKIE, route.remember, { path: '/', maxAge: 31536000, sameSite: 'lax' })
    res.headers.set('Vary', 'Accept-Language, Cookie')
  }
  return res
}

export const config = {
  // Pages only: skip API, CMS admin, Next internals and any file with an extension.
  matcher: ['/((?!api|admin|cms-api|_next|_vercel|.*\\..*).*)'],
}
