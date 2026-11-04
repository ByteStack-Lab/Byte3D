import type { CustomizationField } from '~/types/api'

/** Image uploads need the phase 4 endpoint. Until then a required image field cannot be completed online. */
export const IMAGE_UPLOAD_SOON = 'Image upload opens soon. For now, order this item on Facebook.'

const isUrl = (v: string) => /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(v)

/** Error message per field key. An empty object means the customization is complete. Mirrors the server rules. */
export function validateCustomization(schema: CustomizationField[], values: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of schema) {
    const v = (values[f.key] ?? '').trim()
    if (f.type === 'image') {
      if (f.required) errors[f.key] = IMAGE_UPLOAD_SOON
      continue
    }
    if (!v) {
      if (f.required) errors[f.key] = `${f.label} is required.`
      continue
    }
    if (f.type === 'text' && f.max && v.length > f.max) errors[f.key] = `${f.label} can be at most ${f.max} characters.`
    if (f.type === 'url' && !isUrl(v)) errors[f.key] = 'Enter a full link starting with https://'
  }
  return errors
}

/** Only the schema's text/url fields that are filled in, trimmed. This is what goes into the cart. */
export function cleanCustomization(schema: CustomizationField[], values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of schema) {
    if (f.type === 'image') continue
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
    const label = schema?.find(f => f.key === key)?.label ?? key
    return `${label}: ${value}`
  })
}
