// India Post pincode lookup (https://api.postalpincode.in/pincode/{pin}): response parsing. No server-only imports.

export type PincodePlace = { city: string; state: string }

export const isPincode = (s: unknown): s is string => typeof s === 'string' && /^[1-9]\d{5}$/.test(s)

/** `[{ Status: "Success", PostOffice: [{ District, State, … }] }]` → the district (as city) and state; anything else → null. */
export function parsePincodeResponse(json: unknown): PincodePlace | null {
  const first = Array.isArray(json) ? json[0] : null
  if (!first || typeof first !== 'object' || (first as { Status?: unknown }).Status !== 'Success') return null
  const offices = (first as { PostOffice?: unknown }).PostOffice
  const office = Array.isArray(offices) ? offices.find((o) => o && typeof o.District === 'string' && typeof o.State === 'string') : null
  if (!office) return null
  const city = String(office.District).trim().slice(0, 60)
  const state = String(office.State).trim().slice(0, 60)
  return city && state ? { city, state } : null
}
