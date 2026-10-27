import 'server-only'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { BINDU_STROKE } from '@/components/Art'
import { photoSrc } from '@/components/MediaImage'
import type { Media } from '@/payload-types'

// Share pictures (WhatsApp, Facebook previews): 1200×630, the real photo when there is one, else a branded paper card.
export const ogSize = { width: 1200, height: 630 }
export const ogType = 'image/png'

const FONT = path.join(process.cwd(), 'src/assets/fonts/RozhaOne-Regular.ttf')
const C = { paper: '#faf6ef', charcoal: '#1e1b18', kumkum: '#a6261d', turmeric: '#f2b705', marigold: '#e8890c', muted: '#5f574f' }
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Text as a picture, drawn by sharp (Pango shapes Devanagari: matras and conjuncts like द्ध come out right; the OG renderer
 * can't). Drawn at 2× and shown at half size so it stays crisp.
 */
async function text(s: string, px: number, color: string, maxWidth: number) {
  const { data, info } = await sharp({
    text: { text: `<span foreground="${color}">${escape(s)}</span>`, font: `Rozha One ${px * 2}`, fontfile: FONT, width: maxWidth * 2, dpi: 72, rgba: true, wrap: 'word' },
  })
    .png()
    .toBuffer({ resolveWithObject: true })
  return { src: `data:image/png;base64,${data.toString('base64')}`, width: info.width / 2, height: info.height / 2 }
}

/** An uploaded photo from the media folder, cropped to the left panel. Null for stand-ins, missing files or remote URLs. */
async function photo(media: number | Media | null | undefined) {
  if (!photoSrc(media) || !media || typeof media !== 'object' || !media.filename) return null
  try {
    const jpg = await sharp(path.resolve(process.cwd(), 'media', path.basename(media.filename))).resize(480, 630, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer()
    return `data:image/jpeg;base64,${jpg.toString('base64')}`
  } catch {
    return null
  }
}

export async function ogImage({ title, kicker, media }: { title: string; kicker?: string; media?: number | Media | null }) {
  const pic = await photo(media)
  const textWidth = pic ? 620 : 700
  const [heading, sub, name] = await Promise.all([
    text(title, title.length > 40 ? 58 : 72, C.charcoal, textWidth),
    kicker ? text(kicker, 32, C.kumkum, textWidth) : null,
    text('सिद्धेश मोकाशी', 34, C.charcoal, 400),
  ])
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: C.paper }}>
        {pic ? (
          // eslint-disable-next-line @next/next/no-img-element -- rendered to PNG, not a page
          <img src={pic} width={480} height={630} alt="" style={{ objectFit: 'cover' }} />
        ) : (
          // No photo yet: the Bindu, large, in marigold powder on the right.
          <svg width="380" height="380" viewBox="0 0 34 34" style={{ position: 'absolute', right: 70, top: 110 }}>
            <path transform="translate(17 17)" d={BINDU_STROKE} fill={C.marigold} />
            <circle cx="27.4" cy="8.87" r="2.8" fill={C.kumkum} />
          </svg>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, padding: '64px 56px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG */}
            {sub && <img src={sub.src} width={sub.width} height={sub.height} alt="" />}
            {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG */}
            <img src={heading.src} width={heading.width} height={Math.min(heading.height, 330)} alt="" style={{ objectFit: 'cover', objectPosition: 'top' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingBottom: 36 }}>
              <svg width="64" height="64" viewBox="0 0 34 34">
                <path transform="translate(17 17)" d={BINDU_STROKE} fill={C.charcoal} />
                <circle cx="27.4" cy="8.87" r="2.8" fill={C.kumkum} />
              </svg>
              {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG */}
              <img src={name.src} width={name.width} height={name.height} alt="" />
            </div>
          </div>
        </div>
        {/* The paithani border along the bottom edge. */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 6, background: C.turmeric }} />
          <div style={{ height: 14, background: C.kumkum }} />
        </div>
      </div>
    ),
    ogSize,
  )
}
