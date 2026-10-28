import { NextResponse } from 'next/server'
import { isLocale, localePath } from '@/i18n/config'
import { site } from '@/lib/site'
import { unsubscribeByToken } from '@/server/newsletter'

// The link in every email. GET: one click, then a thank-you page. POST: the mail program's own one-click button (List-Unsubscribe-Post).
async function run(req: Request) {
  const url = new URL(req.url)
  const ok = await unsubscribeByToken(url.searchParams.get('t'))
  const lang = url.searchParams.get('lang') ?? ''
  return { ok, lang: isLocale(lang) ? lang : 'en' }
}

export async function GET(req: Request) {
  const { ok, lang } = await run(req)
  return NextResponse.redirect(new URL(`${localePath(lang, '/newsletter/unsubscribed')}${ok ? '' : '?error=1'}`, site.url), 303)
}

export async function POST(req: Request) {
  const { ok } = await run(req)
  return new Response(ok ? 'Unsubscribed' : 'Invalid link', { status: ok ? 200 : 400 })
}
