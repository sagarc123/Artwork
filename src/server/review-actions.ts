'use server'

// The review form's action: a public endpoint. It reads the signed session itself, then checks the order or the lesson
// progress on the server; nothing the browser says about who it is or what it bought is believed.
import config from '@payload-config'
import { randomUUID } from 'node:crypto'
import { getPayload } from 'payload'
import { cleanText, PHOTO_MAX_BYTES, reviewErrors, reviewerName, sniffImage, type ReviewCheck, type ReviewField } from '@/lib/reviews'
import { getCustomer } from './customer'
import { allow } from './rate-limit'
import { reviewCheck, type ReviewKind } from './reviews'

export type ReviewState =
  | { status: 'idle' | 'ok' | 'rate' | 'failed' | 'login' }
  | { status: 'error'; errors: (ReviewField | 'name')[] }
  | { status: 'blocked'; reason: Exclude<ReviewCheck, 'ok'> }

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const

export async function submitReview(_prev: ReviewState, form: FormData): Promise<ReviewState> {
  const me = await getCustomer()
  if (!me) return { status: 'login' }
  const kind: ReviewKind | null = form.get('kind') === 'product' ? 'product' : form.get('kind') === 'course' ? 'course' : null
  const idText = String(form.get('id'))
  if (!kind || !/^\d{1,9}$/.test(idText)) return { status: 'failed' }
  const id = Number(idText)
  if (!(await allow('review', 5, 60 * 60_000))) return { status: 'rate' }

  const text = cleanText(form.get('text'))
  const name = reviewerName(String(form.get('name') ?? ''))
  const rating = Number(form.get('rating'))
  const file = form.get('photo')
  const errors: (ReviewField | 'name')[] = reviewErrors(rating, text)
  if (!name) errors.push('name')
  let photo: { bytes: Uint8Array; type: keyof typeof EXT } | null = null
  if (file instanceof File && file.size > 0) {
    const bytes = file.size <= PHOTO_MAX_BYTES ? new Uint8Array(await file.arrayBuffer()) : null
    const type = bytes ? sniffImage(bytes) : null // what the bytes are, not what the browser claims
    if (bytes && type) photo = { bytes, type }
    else errors.push('photo')
  }
  if (errors.length) return { status: 'error', errors }

  const check = await reviewCheck(me, kind, id)
  if (check !== 'ok') return { status: 'blocked', reason: check }
  try {
    const payload = await getPayload({ config })
    const media = photo
      ? await payload.create({ collection: 'media', data: { alt: 'Photo sent with a review' }, file: { data: Buffer.from(photo.bytes), mimetype: photo.type, name: `review-${randomUUID()}.${EXT[photo.type]}`, size: photo.bytes.length } })
      : null
    // New reviews wait for approval. The unique (customer, item) index settles two taps at once.
    await payload.create({ collection: 'reviews', data: { status: 'pending', kind, [kind]: id, customer: me.id, name, rating, text, photo: media?.id } })
    return { status: 'ok' }
  } catch (error) {
    if ((await reviewCheck(me, kind, id)) === 'already') return { status: 'blocked', reason: 'already' }
    console.error('Review could not be saved', error)
    return { status: 'failed' }
  }
}
