'use client'

import { useRowLabel } from '@payloadcms/ui'
import { formatPrice } from '../../lib/site'

type Row = { label?: string | null; price?: number | null; extraPrice?: number | null }

/** Size and frame rows show what they are ("A4 print · ₹800", "Teak frame · +₹1,200") instead of "Size 01". */
export function PriceRowLabel() {
  const { data, rowNumber = 0 } = useRowLabel<Row>()
  const price = typeof data?.price === 'number' ? formatPrice(data.price) : typeof data?.extraPrice === 'number' ? `+${formatPrice(data.extraPrice)}` : null
  const name = data?.label?.trim() || `New row ${rowNumber + 1}`
  return <span className="row-label">{price ? `${name} · ${price}` : name}</span>
}
