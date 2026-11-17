import type { MessageKey } from '~/locales/en'
import type { Translate } from '~/composables/useLocale'

/** Project types for the custom order form. Values mirror the backend QuoteServiceType enum. */
export type QuoteServiceType = 'print_from_file' | 'design_and_print' | 'prototype' | 'robotics' | 'laser_engraving' | 'other'

export const QUOTE_SERVICE_TYPES: { value: QuoteServiceType, key: MessageKey, hintKey: MessageKey }[] = [
  { value: 'design_and_print', key: 'quote.type.design_and_print', hintKey: 'quote.type.design_and_print.hint' },
  { value: 'print_from_file', key: 'quote.type.print_from_file', hintKey: 'quote.type.print_from_file.hint' },
  { value: 'prototype', key: 'quote.type.prototype', hintKey: 'quote.type.prototype.hint' },
  { value: 'robotics', key: 'quote.type.robotics', hintKey: 'quote.type.robotics.hint' },
  { value: 'laser_engraving', key: 'quote.type.laser_engraving', hintKey: 'quote.type.laser_engraving.hint' },
  { value: 'other', key: 'quote.type.other', hintKey: 'quote.type.other.hint' },
]

/** Pricing details. Values mirror the backend (material is free text there; the rest are enums). */
export const QUOTE_MATERIALS: { value: string, key: MessageKey }[] = [
  { value: 'PLA', key: 'quote.material.pla' },
  { value: 'PETG', key: 'quote.material.petg' },
  { value: 'TPU', key: 'quote.material.tpu' },
  { value: 'Not sure', key: 'quote.material.unsure' },
]
/** The printer's AMS holds 4 spools, so 4 colours is the most one print can have. */
export const QUOTE_COLOR_COUNTS = [1, 2, 3, 4]
export const QUOTE_USE_CASES: { value: string, key: MessageKey }[] = [
  { value: 'display', key: 'quote.useCase.display' },
  { value: 'functional', key: 'quote.useCase.functional' },
  { value: 'outdoor', key: 'quote.useCase.outdoor' },
  { value: 'flexible', key: 'quote.useCase.flexible' },
]
export const QUOTE_FINISHES: { value: string, key: MessageKey }[] = [
  { value: 'raw', key: 'quote.finish.raw' },
  { value: 'sanded', key: 'quote.finish.sanded' },
  { value: 'painted', key: 'quote.finish.painted' },
]
export const QUOTE_ZONES: { value: string, key: MessageKey }[] = [
  { value: 'inside_dhaka', key: 'quote.delivery.inside_dhaka' },
  { value: 'outside_dhaka', key: 'quote.delivery.outside_dhaka' },
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
export function quoteFileProblem(file: File, t: Translate): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!QUOTE_FILE_EXTENSIONS.includes(ext)) return t('quote.errFileType', { name: file.name })
  if (file.size > QUOTE_MAX_FILE_BYTES) return t('quote.errFileSize', { name: file.name })
  return null
}
