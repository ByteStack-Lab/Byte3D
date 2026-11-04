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
