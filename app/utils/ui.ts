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

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cod: 'Cash on delivery',
  sslcommerz: 'Card / mobile banking',
  bkash: 'bKash',
}

/** The happy path, in order. Cancelled and returned orders sit outside it. */
export const ORDER_STEPS: { status: OrderStatus, label: string }[] = [
  { status: 'pending', label: 'Order placed' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'in_production', label: 'In production' },
  { status: 'ready_to_ship', label: 'Ready to ship' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'delivered', label: 'Delivered' },
]

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
