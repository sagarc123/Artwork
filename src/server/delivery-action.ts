'use server'

import { deliveryFor, type DeliveryEstimate } from '@/lib/delivery'
import { getDeliveryRules } from './content'
import { allow } from './rate-limit'

/** "Check delivery": days for a PIN code and whether cash on delivery reaches it. */
export async function checkDelivery(pincode: string): Promise<DeliveryEstimate | 'invalid' | 'busy'> {
  if (!(await allow('delivery', 30, 60_000))) return 'busy'
  const { rules, blockedPincodes } = await getDeliveryRules()
  const e = deliveryFor(pincode, rules)
  return e ? { ...e, codHere: e.codHere && !blockedPincodes.has(pincode) } : 'invalid'
}
