import 'server-only'
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE = 'sm_vid'
const mac = (id: string) => createHmac('sha256', process.env.PAYLOAD_SECRET!).update(`visitor:${id}`).digest('base64url')

/**
 * The visitor id that cookie choices are recorded under: random, issued by the server and signed, so a browser cannot
 * make one up or point at somebody else's. Returns null when there is no valid one.
 */
export async function readVisitorId(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE)?.value ?? ''
  const [id, sig] = raw.split('.')
  if (!id || !sig || !/^[0-9a-f-]{36}$/.test(id)) return null
  const want = Buffer.from(mac(id))
  const got = Buffer.from(sig)
  return want.length === got.length && timingSafeEqual(want, got) ? id : null
}

/** The visitor's id, issuing a new one (httpOnly cookie) the first time. Only callable where cookies can be set (a server action). */
export async function visitorId(): Promise<string> {
  const have = await readVisitorId()
  if (have) return have
  const id = randomUUID()
  ;(await cookies()).set(COOKIE, `${id}.${mac(id)}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 180 * 86400 })
  return id
}
