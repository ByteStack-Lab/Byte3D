/** Bangladeshi mobile numbers: `01XXXXXXXXX` (operator digit 3-9). Mirrors the backend rule. */
export const PHONE_PATTERN = /^01[3-9]\d{8}$/

/** Strip spaces, dashes and the +88 / 88 country code. Does not validate. */
export function normalizePhone(raw: string): string {
  const phone = raw.replace(/[\s\-().]/g, '')
  if (phone.startsWith('+88')) return phone.slice(3)
  if (phone.startsWith('88') && phone.length === 13) return phone.slice(2)
  return phone
}

export function isValidPhone(raw: string): boolean {
  return PHONE_PATTERN.test(normalizePhone(raw))
}
