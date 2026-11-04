/**
 * Presentation helpers for the name-keyring builder (`/custom-keyring`).
 *
 * The product itself is catalogue data from the API (`/products/custom-name-keyring`): which types and colours exist, their prices,
 * the fonts, the number of lines. Only how things LOOK lives here: which web font a font id uses and how big the preview is.
 */

export type KeyringShape = 'keyring' | 'bag_tag'

/** The catalogue product the builder sells. */
export const KEYRING_PRODUCT_SLUG = 'custom-name-keyring'

export interface KeyringFontStyle {
  /** CSS font-family name (loaded through @nuxt/fonts, see nuxt.config.ts). */
  family: string
  /** Average glyph width in em, to estimate the preview size before the font has loaded. */
  width: number
  weight?: number
}

/** Look of each font id the catalogue can offer. An id that is not listed here falls back to `DEFAULT_FONT_STYLE`. */
export const KEYRING_FONT_STYLES: Record<string, KeyringFontStyle> = {
  bubble: { family: 'Fredoka', width: 0.6, weight: 600 },
  script: { family: 'Pacifico', width: 0.62 },
  retro: { family: 'Lobster', width: 0.5 },
  comic: { family: 'Lilita One', width: 0.5 },
  marker: { family: 'Permanent Marker', width: 0.62 },
  block: { family: 'Bungee', width: 0.78 },
  heavy: { family: 'Bowlby One', width: 0.72 },
}
export const DEFAULT_FONT_STYLE: KeyringFontStyle = { family: 'Inter', width: 0.6 }

export const fontStyle = (id: string): KeyringFontStyle => KEYRING_FONT_STYLES[id] ?? DEFAULT_FONT_STYLE

/** A variant size such as "Bag tag" is drawn as a luggage tag; anything else as a keyring. */
export const shapeOf = (typeName: string): KeyringShape => (/bag/i.test(typeName) ? 'bag_tag' : 'keyring')

/** Letters, digits and spaces only: what the print file supports. */
export function sanitizeKeyringText(raw: string): string {
  return raw.replace(/[^A-Za-z0-9 ]/g, '').replace(/ {2,}/g, ' ').replace(/^ /, '')
}

/** Rough physical size in cm for the "About W × H cm" hint. */
export function keyringSizeCm(lines: string[], shape: KeyringShape): { w: number, h: number } {
  const scale = shape === 'bag_tag' ? 1.6 : 1
  const longest = Math.max(1, ...lines.map(l => l.trim().length))
  const w = (longest * 0.75 + 1.4) * scale
  const h = (lines.length * 1.5 + 0.3) * scale
  return { w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 }
}
