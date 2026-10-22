import { NextResponse, type NextRequest } from 'next/server'
import { LOCALE_COOKIE, resolveLocaleRoute } from './i18n/config'

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const route = resolveLocaleRoute(pathname, request.cookies.get(LOCALE_COOKIE)?.value)

  if (route.action === 'next') return NextResponse.next()
  const url = new URL(`${route.to}${search}`, request.url)
  return route.action === 'redirect' ? NextResponse.redirect(url) : NextResponse.rewrite(url)
}

export const config = {
  // Pages only: skip API, CMS admin, Next internals and any file with an extension.
  matcher: ['/((?!api|admin|cms-api|_next|_vercel|.*\\..*).*)'],
}
