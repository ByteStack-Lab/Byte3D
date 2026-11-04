/**
 * Options for the custom name-keyring builder (`/custom-keyring`).
 *
 * Prices here are a DISPLAY ESTIMATE only. Rule 1 (root CLAUDE.md): the server owns price, stock and
 * shipping. Until the backend has a customizable keyring product (phase 4), the order is confirmed
 * by the team on Messenger — so these numbers must be replaced by API data, not trusted for checkout.
 */

export type KeyringType = 'keyring' | 'bag_tag'

export interface KeyringFont {
  id: string
  label: string
  family: string
  /** Average glyph width in em — used to estimate the preview size before the font has loaded. */
  width: number
  weight?: number
}

export interface KeyringColor {
  name: string
  hex: string
}

export const KEYRING_TYPES: { id: KeyringType, label: string, price: number, scale: number }[] = [
  { id: 'keyring', label: 'Keyring', price: 25000, scale: 1 },
  { id: 'bag_tag', label: 'Bag tag', price: 35000, scale: 1.6 },
]

export const KEYRING_FONTS: KeyringFont[] = [
  { id: 'bubble', label: 'Bubble', family: 'Fredoka', width: 0.6, weight: 600 },
  { id: 'script', label: 'Script', family: 'Pacifico', width: 0.62 },
  { id: 'retro', label: 'Retro', family: 'Lobster', width: 0.5 },
  { id: 'comic', label: 'Comic', family: 'Lilita One', width: 0.5 },
  { id: 'marker', label: 'Marker', family: 'Permanent Marker', width: 0.62 },
  { id: 'block', label: 'Block', family: 'Bungee', width: 0.78 },
  { id: 'heavy', label: 'Heavy', family: 'Bowlby One', width: 0.72 },
]

export const KEYRING_COLORS: KeyringColor[] = [
  { name: 'White', hex: '#F3F3F1' },
  { name: 'Grey', hex: '#8A8D92' },
  { name: 'Yellow', hex: '#F5C518' },
  { name: 'Orange', hex: '#F57C00' },
  { name: 'Green', hex: '#2E7D32' },
  { name: 'Pink', hex: '#EC5A9C' },
  { name: 'Red', hex: '#D32F2F' },
  { name: 'Purple', hex: '#7B3FA0' },
  { name: 'Blue', hex: '#2D8CE8' },
  { name: 'Navy', hex: '#1B2A55' },
  { name: 'Brown', hex: '#6D4C34' },
  { name: 'Black', hex: '#1A1A1A' },
]

export const KEYRING_MAX_LINES = 3
export const KEYRING_MAX_CHARS = 14
export const KEYRING_MAX_QTY = 50
export const KEYRING_PRODUCTION_DAYS = { min: 2, max: 4 }

/** Letters, digits and spaces only — what the print file supports. */
export function sanitizeKeyringText(raw: string): string {
  return raw.replace(/[^A-Za-z0-9 ]/g, '').replace(/ {2,}/g, ' ').replace(/^ /, '')
}

/** Rough physical size in cm for the "About W × H cm" hint. */
export function keyringSizeCm(lines: string[], type: KeyringType): { w: number, h: number } {
  const scale = KEYRING_TYPES.find(t => t.id === type)?.scale ?? 1
  const longest = Math.max(1, ...lines.map(l => l.trim().length))
  const w = (longest * 0.75 + 1.4) * scale
  const h = (lines.length * 1.5 + 0.3) * scale
  return { w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 }
}
