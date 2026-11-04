import type { CustomizationField } from '~/types/api'

/** Engraving images: what POST /uploads/customization accepts. Mirrors the server rules. */
export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp'
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024

const isUrl = (v: string) => /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(v)

/** Error message per field key. An empty object means the customization is complete. Mirrors the server rules. */
export function validateCustomization(schema: CustomizationField[], values: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of schema) {
    const v = (values[f.key] ?? '').trim()
    if (!v) {
      if (f.required) errors[f.key] = f.type === 'image' ? `Upload an image for “${f.label}”.` : `${f.label} is required.`
      continue
    }
    if (f.type === 'text' && f.max && v.length > f.max) errors[f.key] = `${f.label} can be at most ${f.max} characters.`
    if (f.type === 'url' && !isUrl(v)) errors[f.key] = 'Enter a full link starting with https://'
  }
  return errors
}

/** Only the schema's fields that are filled in, trimmed (an image field holds its upload token). This is what goes into the cart. */
export function cleanCustomization(schema: CustomizationField[], values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of schema) {
    const v = (values[f.key] ?? '').trim()
    if (v) out[f.key] = v
  }
  return out
}

/** Extra paisa per unit for the filled fields (display only; the server recomputes it). */
export function customizationExtras(schema: CustomizationField[], values: Record<string, string>): number {
  const clean = cleanCustomization(schema, values)
  return schema.reduce((sum, f) => sum + (clean[f.key] ? f.extra_price : 0), 0)
}

/** "Name on keychain: Tanvir" lines for cart and order summaries. */
export function describeCustomization(schema: CustomizationField[] | null, values: Record<string, string>): string[] {
  return Object.entries(values).map(([key, value]) => {
    const field = schema?.find(f => f.key === key)
    return `${field?.label ?? key}: ${field?.type === 'image' ? 'image attached' : value}`
  })
}
