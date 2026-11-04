import type { ApiError } from '~/composables/useApi'
import type { PricedCart, ShippingZone } from '~/types/api'

/**
 * Prices the cart on the server (POST /cart/validate) and keeps the result fresh while the cart, the coupon or the
 * shipping zone change. Only `priced` may be shown as a price.
 */
export function useCartPricing(zone: MaybeRefOrGetter<ShippingZone | null> = null) {
  const cart = useCartStore()
  const priced = ref<PricedCart | null>(null)
  const pending = ref(false)
  const error = ref<ApiError | null>(null)
  let latest = 0

  async function refresh() {
    if (!cart.lines.length) {
      priced.value = null
      error.value = null
      return
    }

    const ticket = ++latest
    pending.value = true
    try {
      const response = await $send<{ data: PricedCart }>('POST', '/cart/validate', {
        items: cart.lines.map(l => ({ variant_id: l.variantId, quantity: l.quantity, customization: l.customization, unit_price: l.unitPrice })),
        coupon: cart.couponCode || undefined,
        shipping_zone: toValue(zone) ?? undefined,
      })
      if (ticket !== latest) return // a newer request is already on its way
      priced.value = response.data
      error.value = null
      cart.syncUnitPrices(response.data.lines.map(l => l.unit_price))
    }
    catch (e) {
      if (ticket === latest) error.value = toApiError(e)
    }
    finally {
      if (ticket === latest) pending.value = false
    }
  }

  // Wait for the saved cart to load, then price it; re-price (debounced) on every relevant change.
  let timer: ReturnType<typeof setTimeout> | undefined
  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(refresh, 250)
  }
  watch(() => cart.hydrated, (ready) => { if (ready) void refresh() }, { immediate: true })
  watch(
    [() => cart.lines.map(l => `${l.key}x${l.quantity}`).join('|'), () => cart.couponCode, () => toValue(zone)],
    () => { if (cart.hydrated) schedule() },
  )
  onBeforeUnmount(() => clearTimeout(timer))

  return { priced, pending, error, refresh }
}
