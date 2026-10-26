// Order status rules and stock arithmetic, shared by the admin (hooks and buttons), checkout and the maintenance job.
// No server-only imports.

type Mode = string | null | undefined

/**
 * The step before, which "Undo" after a one-tap button may go back to: packed → paid (or COD confirmed), shipped → packed.
 * Null where going back isn't allowed: confirming COD sells the stock, and delivery issues the invoice.
 */
export function stepBack(from: string | null | undefined, paymentMode: Mode): string | null {
  if (from === 'packed') return paymentMode === 'cod' ? 'cod_confirmed' : 'paid'
  if (from === 'shipped') return 'packed'
  return null
}

export type CancelPlan = {
  /** Status the order really ends up in. */
  status: 'cancelled' | 'needs_refund'
  /** release: give back held stock; restock: put sold stock back. */
  stock: 'release' | 'restock'
  ownerOnly: boolean
}

/** What "Cancel" does from each status. Null: it can't be cancelled from here (delivered, or already closed). */
export function cancelPlan(from: string | null | undefined, paymentMode: Mode): CancelPlan | null {
  if (from === 'pending_payment' || from === 'cod_pending_confirmation') return { status: 'cancelled', stock: 'release', ownerOnly: false }
  if (paymentMode === 'cod') return ['cod_confirmed', 'packed', 'shipped'].includes(from ?? '') ? { status: 'cancelled', stock: 'restock', ownerOnly: false } : null
  // Paid online: the money has to go back, so it is the owner's call, and the order waits as "Needs refund".
  return ['paid', 'packed', 'shipped'].includes(from ?? '') ? { status: 'needs_refund', stock: 'restock', ownerOnly: true } : null
}

/** Stock after adding (or removing) some: never below what is held for people paying right now, never negative. Same rule as the SQL. */
export const adjustedStock = (stock: number, reserved: number, delta: number) => Math.max(stock + delta, reserved, 0)

/** Variants whose held count disagrees with the orders still waiting (for payment or COD confirmation), and what it should be. */
export function reservedFixes(variants: { id: string; reserved: number | null }[], open: { variantId: string | null; qty: number | null }[]) {
  const held = new Map<string, number>()
  for (const it of open) if (it.variantId) held.set(it.variantId, (held.get(it.variantId) ?? 0) + (it.qty ?? 0))
  return variants.flatMap((v) => {
    const want = held.get(v.id) ?? 0
    return (v.reserved ?? 0) === want ? [] : [{ id: v.id, from: v.reserved ?? 0, to: want }]
  })
}
