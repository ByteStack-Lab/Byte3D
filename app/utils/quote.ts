/** Project types for the custom order form. Values mirror the backend QuoteServiceType enum. */
export type QuoteServiceType = 'print_from_file' | 'design_and_print' | 'prototype' | 'robotics' | 'laser_engraving' | 'other'

export const QUOTE_SERVICE_TYPES: { value: QuoteServiceType, label: string, hint: string }[] = [
  { value: 'design_and_print', label: 'Design + print from my idea', hint: 'You have a sketch or photo, we design it' },
  { value: 'print_from_file', label: 'Print my 3D file', hint: 'You already have an STL / OBJ / 3MF / STEP' },
  { value: 'prototype', label: 'Prototype', hint: 'A working part to test your product' },
  { value: 'robotics', label: 'Robotics / electronics parts', hint: 'Brackets, mounts, enclosures, gears' },
  { value: 'laser_engraving', label: 'Laser engraving', hint: 'Names, logos or 2D designs on a product' },
  { value: 'other', label: 'Something else', hint: 'Tell us in the details' },
]

export const QUOTE_DETAILS_MIN = 10
export const QUOTE_DETAILS_MAX = 3000

/** Files a customer may attach. Mirrors the backend rules (3D formats + reference images / drawings). */
export const QUOTE_FILE_EXTENSIONS = ['stl', 'obj', '3mf', 'step', 'stp', 'png', 'jpg', 'jpeg', 'pdf']
export const QUOTE_FILE_ACCEPT = QUOTE_FILE_EXTENSIONS.map(e => `.${e}`).join(',')
export const QUOTE_MAX_FILES = 5
export const QUOTE_MAX_FILE_BYTES = 50 * 1024 * 1024

export function formatFileSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/** Why a picked file cannot be attached, or null when it is fine. */
export function quoteFileProblem(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!QUOTE_FILE_EXTENSIONS.includes(ext)) return `${file.name}: use STL, OBJ, 3MF, STEP, PNG, JPG or PDF.`
  if (file.size > QUOTE_MAX_FILE_BYTES) return `${file.name} is bigger than 50 MB.`
  return null
}
