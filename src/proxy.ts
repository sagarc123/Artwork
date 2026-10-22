import { NextResponse, type NextRequest } from 'next/server'
import { Pool } from 'pg'
import { LOCALE_COOKIE, resolveLocaleRoute } from './i18n/config'

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

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const order = pathname.match(/^(?:\/(mr|hi))?\/order\/([^/]+)\/?$/)
  // Any unknown path under the locale renders the not-found page with a 404 status.
  if (order && !(await orderExists(order[2]))) return NextResponse.rewrite(new URL(`/${order[1] ?? 'en'}/not-found`, request.url))

  const route = resolveLocaleRoute(pathname, request.cookies.get(LOCALE_COOKIE)?.value)
  if (route.action === 'next') return NextResponse.next()
  const url = new URL(`${route.to}${search}`, request.url)
  return route.action === 'redirect' ? NextResponse.redirect(url) : NextResponse.rewrite(url)
}

export const config = {
  // Pages only: skip API, CMS admin, Next internals and any file with an extension.
  matcher: ['/((?!api|admin|cms-api|_next|_vercel|.*\\..*).*)'],
}
