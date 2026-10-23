// Order lookup and status timeline. No server-only imports.
import type { Order } from '@/payload-types'

/** "ART-10482", "art 10482", "#10482", "10482" → "ART-10482"; anything else → null. */
export function normaliseOrderNumber(raw: string | undefined | null): string | null {
  const m = (raw ?? '').trim().toUpperCase().replace(/^#/, '').match(/^(?:ART)?[\s-]*(\d{5,9})$/)
  return m ? `ART-${m[1]}` : null
}

export const TIMELINE = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'] as const
export type TimelineStep = (typeof TIMELINE)[number]

/** How far along the timeline an order is (index into TIMELINE), or the off-track state it is in. */
export function orderProgress(status: Order['status']): { step: number } | { stopped: 'cancelled' | 'refund' } {
  switch (status) {
    case 'cancelled':
      return { stopped: 'cancelled' }
    case 'needs_refund':
    case 'refunded':
      return { stopped: 'refund' }
    case 'pending_payment':
    case 'cod_pending_confirmation':
      return { step: 0 }
    case 'paid':
    case 'cod_confirmed':
      return { step: 1 }
    case 'packed':
      return { step: 2 }
    case 'shipped':
      return { step: 3 }
    case 'delivered':
      return { step: 4 }
  }
}
