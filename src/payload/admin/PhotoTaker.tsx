'use client'

import type { UIFieldClientComponent } from 'payload'
import { toast, useConfig, useField, useFormFields } from '@payloadcms/ui'
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cropBox, fitWithin } from '../../lib/admin-tools'

type Picked = { url: string; img: HTMLImageElement; name: string }
type Ref = number | { id: number }

const toBlob = (canvas: HTMLCanvasElement, type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.82))
const clamp = (n: number) => Math.min(1, Math.max(0, n))

/**
 * "Take or choose photo" on a painting or gallery piece: the phone's camera (or gallery), then the photo is turned the
 * right way up, made at most 2400 px and compressed (WebP, JPEG where the browser can't) before it uploads, so it is
 * quick on mobile data. Optional 4:5 crop with drag to position. The photo is added to "Photos"; Save keeps it.
 */
export const PhotoTaker: UIFieldClientComponent = () => {
  const { config } = useConfig()
  const { value, setValue } = useField<Ref[] | null>({ path: 'images' })
  const title = useFormFields(([f]) => (f.title?.value as string | undefined)?.trim() ?? '')
  const input = useRef<HTMLInputElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const [picked, setPicked] = useState<Picked | null>(null)
  const [crop, setCrop] = useState(true)
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 })
  const [alt, setAlt] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(
    () => () => {
      if (picked) URL.revokeObjectURL(picked.url)
    },
    [picked],
  )

  const choose = async (file: File | undefined) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.src = url
    // Browsers turn photos the right way up (EXIF) when they decode them, and the canvas copies that.
    const ok = await img.decode().then(() => true, () => false)
    if (!ok) {
      URL.revokeObjectURL(url)
      return void toast.error('This file could not be opened as a photo. Please try another one.')
    }
    setPicked({ url, img, name: file.name.replace(/\.[^.]+$/, '') })
    setPos({ x: 0.5, y: 0.5 })
    setAlt(title)
  }

  /** Dragging moves the photo under the 4:5 frame; the distance is turned into a 0..1 position. */
  const move = (dx: number, dy: number, box: DOMRect) => {
    if (!picked) return
    const { naturalWidth: w, naturalHeight: h } = picked.img
    const scale = Math.max(box.width / w, box.height / h)
    const spareX = w * scale - box.width
    const spareY = h * scale - box.height
    setPos((p) => ({ x: spareX > 1 ? clamp(p.x - dx / spareX) : 0.5, y: spareY > 1 ? clamp(p.y - dy / spareY) : 0.5 }))
  }
  const onPointer = {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      drag.current = { x: e.clientX, y: e.clientY }
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (!drag.current) return
      move(e.clientX - drag.current.x, e.clientY - drag.current.y, e.currentTarget.getBoundingClientRect())
      drag.current = { x: e.clientX, y: e.clientY }
    },
    onPointerUp: () => (drag.current = null),
    onPointerCancel: () => (drag.current = null),
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: [-0.05, 0], ArrowRight: [0.05, 0], ArrowUp: [0, -0.05], ArrowDown: [0, 0.05] }[e.key]
    if (!step) return
    e.preventDefault()
    setPos((p) => ({ x: clamp(p.x + step[0]), y: clamp(p.y + step[1]) }))
  }

  const upload = async () => {
    if (!picked) return
    setBusy(true)
    const { naturalWidth: w, naturalHeight: h } = picked.img
    const box = crop ? cropBox(w, h, 4 / 5, pos) : { sx: 0, sy: 0, sw: w, sh: h }
    const out = fitWithin(box.sw, box.sh, 2400)
    const canvas = document.createElement('canvas')
    canvas.width = out.width
    canvas.height = out.height
    canvas.getContext('2d')?.drawImage(picked.img, box.sx, box.sy, box.sw, box.sh, 0, 0, out.width, out.height)
    // Older iPhones can't make WebP: they hand back PNG, so fall back to JPEG.
    let blob = await toBlob(canvas, 'image/webp')
    if (blob?.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg')
    if (!blob) {
      setBusy(false)
      return void toast.error('Could not prepare the photo. Please try again.')
    }
    const form = new FormData()
    const base = (title || picked.name || 'photo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'photo'
    form.append('file', blob, `${base}.${blob.type === 'image/webp' ? 'webp' : 'jpg'}`)
    form.append('_payload', JSON.stringify({ alt: alt.trim() }))
    const res = await fetch(`${config.routes.api}/media`, { method: 'POST', credentials: 'include', body: form }).catch(() => null)
    const body = (await res?.json().catch(() => null)) as { doc?: { id: number }; errors?: { message?: string }[] } | null
    setBusy(false)
    if (!res?.ok || !body?.doc) return void toast.error(body?.errors?.[0]?.message ?? 'The photo did not upload. Please check your internet and try again.')
    setValue([...(value ?? []).map((v) => (typeof v === 'object' ? v.id : v)), body.doc.id])
    setPicked(null)
    if (input.current) input.current.value = ''
    toast.success('Photo added. Tap Save (or Put on website) to keep it.')
  }

  return (
    <div className="photo-taker">
      <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void choose(e.target.files?.[0])} />
      {!picked ? (
        <>
          <button type="button" className="one-tap__btn photo-taker__take" onClick={() => input.current?.click()}>
            Take or choose photo
          </button>
          <p className="field-description">Opens your camera or gallery. The photo is made smaller before it uploads, so it is quick on mobile data.</p>
        </>
      ) : (
        <div className="photo-taker__edit">
          <label className="photo-taker__check">
            <input type="checkbox" checked={crop} onChange={(e) => setCrop(e.target.checked)} />
            Crop to the shop’s shape (4:5)
          </label>
          <div
            className={`photo-taker__frame${crop ? ' is-crop' : ''}`}
            {...(crop ? { ...onPointer, onKeyDown: onKey, tabIndex: 0, role: 'group', 'aria-label': 'Photo position. Drag the photo, or use the arrow keys, to choose what stays inside the frame.' } : {})}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a local preview of the photo being added */}
            <img src={picked.url} alt="" style={crop ? { objectPosition: `${pos.x * 100}% ${pos.y * 100}%` } : undefined} draggable={false} />
          </div>
          {crop && <p className="field-description">Drag the photo to choose what stays in the frame.</p>}
          <label className="photo-taker__alt">
            What the photo shows
            <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. Peacock rangoli in blue and orange" />
          </label>
          <div className="one-tap__links">
            <button type="button" className="one-tap__btn is-primary" disabled={busy} onClick={() => void upload()}>
              {busy ? 'Uploading…' : 'Add this photo'}
            </button>
            <button type="button" className="one-tap__btn" disabled={busy} onClick={() => input.current?.click()}>
              Choose another
            </button>
            <button type="button" className="one-tap__btn" disabled={busy} onClick={() => setPicked(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
