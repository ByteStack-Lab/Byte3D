import type { OrderStatus, PaymentMethod } from '~/types/api'
import type { MessageKey } from '~/locales/en'

/** Classes for text inputs and selects; the border turns red when the field is invalid. */
export const inputClass = (invalid: boolean) =>
  `h-12 w-full rounded-md border bg-surface-2 px-4 text-base placeholder:text-muted/70 focus:outline-none ${invalid ? 'border-danger' : 'border-border focus:border-accent'}`

/** Message keys for each payment method (see `useLocale`). */
export const PAYMENT_KEYS: Record<PaymentMethod, MessageKey> = {
  cod: 'footer.cod',
  sslcommerz: 'pay.sslcommerz',
  bkash: 'pay.bkash',
}


/** The happy path, in order. Cancelled and returned orders sit outside it. */
export const ORDER_STEPS: { status: OrderStatus, key: MessageKey }[] = [
  { status: 'pending', key: 'step.pending' },
  { status: 'confirmed', key: 'step.confirmed' },
  { status: 'in_production', key: 'step.in_production' },
  { status: 'ready_to_ship', key: 'step.ready_to_ship' },
  { status: 'shipped', key: 'step.shipped' },
  { status: 'delivered', key: 'step.delivered' },
]

export function formatDate(iso: string, locale: 'en' | 'bn' = 'en'): string {
  return new Date(iso).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
