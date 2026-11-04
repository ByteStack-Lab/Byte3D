import type { ApiImage } from '~/types/api'

export const MAX_LINE_QUANTITY = 20
const STORAGE_KEY = 'b3d-cart-v1'

/**
 * What the cart remembers about a line. Name, image and price here are only a display snapshot: the cart page and
 * checkout show the prices returned by POST /cart/validate, never these.
 */
export interface CartLine {
  key: string
  variantId: number
  productSlug: string
  productName: string
  variantName: string
  image: ApiImage | null
  unitPrice: number
  quantity: number
  customization: Record<string, string>
  /** Customization labels for display, e.g. "Name on keychain: Tanvir". */
  customizationLabels: string[]
}

export type NewCartLine = Omit<CartLine, 'key'>

const lineKey = (variantId: number, customization: Record<string, string>) =>
  `${variantId}:${JSON.stringify(Object.entries(customization).sort(([a], [b]) => a.localeCompare(b)))}`

const clampQuantity = (n: number) => Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.floor(n) || 1))

/** Client-side cart, persisted in localStorage (see plugins/cart.client.ts). Nothing here is trusted for prices. */
export const useCartStore = defineStore('cart', () => {
  const lines = ref<CartLine[]>([])
  const couponCode = ref('')
  /** False on the server and until localStorage is read: keeps the header badge out of the SSR HTML. */
  const hydrated = ref(false)

  const count = computed(() => lines.value.reduce((n, l) => n + l.quantity, 0))
  const isEmpty = computed(() => lines.value.length === 0)

  function add(line: NewCartLine) {
    const key = lineKey(line.variantId, line.customization)
    const existing = lines.value.find(l => l.key === key)
    if (existing) {
      existing.quantity = clampQuantity(existing.quantity + line.quantity)
      existing.unitPrice = line.unitPrice
    }
    else {
      lines.value.push({ ...line, key, quantity: clampQuantity(line.quantity) })
    }
  }

  function setQuantity(key: string, quantity: number) {
    const line = lines.value.find(l => l.key === key)
    if (line) line.quantity = clampQuantity(quantity)
  }

  function remove(key: string) {
    lines.value = lines.value.filter(l => l.key !== key)
  }

  function clear() {
    lines.value = []
    couponCode.value = ''
  }

  /** Keep the stored price snapshot in step with the server so the next "price changed" hint is accurate. */
  function syncUnitPrices(prices: number[]) {
    lines.value.forEach((line, i) => {
      if (prices[i] !== undefined && prices[i] > 0) line.unitPrice = prices[i]
    })
  }

  function hydrate() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as { lines?: CartLine[], couponCode?: string } | null
      if (saved && Array.isArray(saved.lines)) {
        lines.value = saved.lines
          .filter(l => l && Number.isInteger(l.variantId) && typeof l.key === 'string')
          .map(l => ({ ...l, quantity: clampQuantity(l.quantity), customization: l.customization ?? {}, customizationLabels: l.customizationLabels ?? [] }))
        couponCode.value = typeof saved.couponCode === 'string' ? saved.couponCode : ''
      }
    }
    catch { /* private mode or corrupt data: start with an empty cart */ }
    hydrated.value = true
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines: lines.value, couponCode: couponCode.value }))
    }
    catch { /* storage full or blocked: the cart still works for this visit */ }
  }

  return { lines, couponCode, hydrated, count, isEmpty, add, setQuantity, remove, clear, syncUnitPrices, hydrate, persist }
})
