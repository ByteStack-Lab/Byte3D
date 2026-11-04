<script setup lang="ts">
import type { CheckoutPayload, CheckoutResult, PaymentMethod } from '~/types/api'

useSeoMeta({ title: 'Checkout', robots: 'noindex' })

const cart = useCartStore()
const auth = useAuthStore()
const { data: settings } = await useSettings()

const form = reactive({ name: '', phone: '', email: '', district: '', area: '', address_line: '', note: '' })
const zone = computed(() => zoneForDistrict(form.district))
const { priced, pending, error: pricingError, refresh } = useCartPricing(zone)

const paymentMethods = computed(() => (settings.value?.data.payment_methods ?? ['cod']) as PaymentMethod[])
const paymentMethod = ref<PaymentMethod>('cod')
watchEffect(() => {
  if (!paymentMethods.value.includes(paymentMethod.value)) paymentMethod.value = paymentMethods.value[0] ?? 'cod'
})

// An empty cart has nothing to check out, except right after the order went through.
const placed = ref(false)
watch(() => [cart.hydrated, cart.isEmpty], () => {
  if (cart.hydrated && cart.isEmpty && !placed.value) void navigateTo('/cart')
}, { immediate: true })

// Signed-in customers get their details filled in.
onMounted(async () => {
  if (!auth.checked) await auth.fetchUser()
  if (auth.user) {
    form.name ||= auth.user.name
    form.phone ||= auth.user.phone ?? ''
    form.email ||= auth.user.email ?? ''
  }
})

const touched = reactive<Record<string, boolean>>({})
const submitted = ref(false)
const submitting = ref(false)
const formError = ref<string | null>(null)
const serverErrors = ref<Record<string, string>>({})

const clientErrors = computed(() => {
  const e: Record<string, string> = {}
  if (!form.name.trim()) e.name = 'Enter your name.'
  if (!form.phone.trim()) e.phone = 'Enter your mobile number.'
  else if (!isValidPhone(form.phone)) e.phone = 'Use a Bangladeshi mobile number, like 01XXXXXXXXX.'
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'That email does not look right.'
  if (!form.district) e.district = 'Choose your district.'
  if (!form.area.trim()) e.area = 'Enter your area or thana.'
  if (!form.address_line.trim()) e.address_line = 'Enter your full address.'
  return e
})

/** Client rule once the field was visited (or the form submitted), else the server's message for it. */
function fieldError(name: keyof typeof form): string | null {
  const show = touched[name] || submitted.value
  return (show ? clientErrors.value[name] : null) || serverErrors.value[name] || null
}
const clearServerError = (name: string) => { if (serverErrors.value[name]) serverErrors.value = { ...serverErrors.value, [name]: '' } }

const SERVER_FIELD: Record<string, string> = {
  'customer.name': 'name',
  'customer.phone': 'phone',
  'customer.email': 'email',
  'address.district': 'district',
  'address.area': 'area',
  'address.address_line': 'address_line',
  'note': 'note',
}

const hasUnavailable = computed(() => !!priced.value?.lines.some(l => !l.available))
const shippingText = computed(() => {
  if (!zone.value) return 'Choose your district'
  return priced.value ? formatTaka(priced.value.shipping_fee) : '—'
})

async function submit() {
  submitted.value = true
  formError.value = null
  serverErrors.value = {}

  const firstInvalid = Object.keys(clientErrors.value)[0]
  if (firstInvalid) {
    document.getElementById(`f-${firstInvalid}`)?.focus()
    return
  }
  if (!zone.value || !priced.value || hasUnavailable.value) {
    formError.value = hasUnavailable.value ? 'Some items in your cart are unavailable.' : 'Please wait while we check your cart.'
    return
  }

  const payload: CheckoutPayload = {
    customer: { name: form.name.trim(), phone: normalizePhone(form.phone), ...(form.email.trim() ? { email: form.email.trim() } : {}) },
    address: { district: form.district, area: form.area.trim(), address_line: form.address_line.trim() },
    shipping_zone: zone.value,
    payment_method: paymentMethod.value,
    items: cart.lines.map(l => ({ variant_id: l.variantId, quantity: l.quantity, customization: l.customization })),
    ...(cart.couponCode ? { coupon: cart.couponCode } : {}),
    ...(form.note.trim() ? { note: form.note.trim() } : {}),
  }

  submitting.value = true
  try {
    const result = await $send<CheckoutResult>('POST', '/checkout', payload)
    placed.value = true
    try {
      sessionStorage.setItem('b3d-last-order', JSON.stringify({ number: result.order_number, total: result.total, method: result.payment.method, phone: payload.customer.phone }))
    }
    catch { /* the confirmation page works without it */ }
    cart.clear()
    if (result.payment.redirect_url) window.location.href = result.payment.redirect_url
    else await navigateTo(`/order/${result.order_number}`)
  }
  catch (e) {
    const err = toApiError(e)
    for (const [key, messages] of Object.entries(err.errors)) {
      const field = SERVER_FIELD[key]
      if (field) serverErrors.value[field] = messages[0]!
    }
    if (Object.keys(err.errors).some(k => k.startsWith('items.'))) {
      formError.value = 'Something in your cart changed (price or stock). Please review it and try again.'
      void refresh()
    }
    else if (err.errors.coupon) {
      formError.value = `Your coupon could not be used: ${err.errors.coupon[0]}`
      cart.couponCode = ''
    }
    else if (!Object.keys(serverErrors.value).length) {
      formError.value = err.message
    }
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container-page py-8 sm:py-12">
    <NuxtLink to="/cart" class="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
      <UiIcon name="chevron-left" :size="16" /> Back to cart
    </NuxtLink>
    <h1 class="mt-2 text-3xl font-bold sm:text-4xl">Checkout</h1>

    <form class="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start" novalidate @submit.prevent="submit">
      <div class="space-y-8">
        <p v-if="formError" class="flex items-start gap-2 rounded-lg border border-danger/50 bg-danger/10 p-4 text-sm text-danger" role="alert">
          <UiIcon name="alert" :size="18" class="mt-0.5 shrink-0" />
          <span>{{ formError }} <NuxtLink v-if="hasUnavailable || formError.includes('cart')" to="/cart" class="font-semibold underline">Review cart</NuxtLink></span>
        </p>

        <fieldset class="space-y-4 rounded-lg border border-border bg-surface p-5">
          <legend class="-ml-1 px-1 text-lg font-bold">Your details</legend>
          <UiField id="f-name" label="Full name" required :error="fieldError('name')">
            <template #default="{ invalid, describedBy }">
              <input
                id="f-name" v-model="form.name" type="text" autocomplete="name" :class="inputClass(invalid)"
                :aria-invalid="invalid" :aria-describedby="describedBy" @blur="touched.name = true" @input="clearServerError('name')"
              >
            </template>
          </UiField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UiField id="f-phone" label="Mobile number" required :error="fieldError('phone')" hint="We call or message this number about your order.">
              <template #default="{ invalid, describedBy }">
                <input
                  id="f-phone" v-model="form.phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX" :class="inputClass(invalid)"
                  :aria-invalid="invalid" :aria-describedby="describedBy" @blur="touched.phone = true" @input="clearServerError('phone')"
                >
              </template>
            </UiField>
            <UiField id="f-email" label="Email" :error="fieldError('email')" hint="For your receipt, if you like.">
              <template #default="{ invalid, describedBy }">
                <input
                  id="f-email" v-model="form.email" type="email" inputmode="email" autocomplete="email" :class="inputClass(invalid)"
                  :aria-invalid="invalid" :aria-describedby="describedBy" @blur="touched.email = true" @input="clearServerError('email')"
                >
              </template>
            </UiField>
          </div>
        </fieldset>

        <fieldset class="space-y-4 rounded-lg border border-border bg-surface p-5">
          <legend class="-ml-1 px-1 text-lg font-bold">Delivery address</legend>
          <div class="grid gap-4 sm:grid-cols-2">
            <UiField id="f-district" label="District" required :error="fieldError('district')">
              <template #default="{ invalid, describedBy }">
                <select
                  id="f-district" v-model="form.district" autocomplete="address-level1" :class="inputClass(invalid)"
                  :aria-invalid="invalid" :aria-describedby="describedBy" @blur="touched.district = true" @change="clearServerError('district')"
                >
                  <option value="" disabled>Choose district</option>
                  <option v-for="d in DISTRICTS" :key="d" :value="d">{{ d }}</option>
                </select>
              </template>
            </UiField>
            <UiField id="f-area" label="Area / Thana" required :error="fieldError('area')">
              <template #default="{ invalid, describedBy }">
                <input
                  id="f-area" v-model="form.area" type="text" autocomplete="address-level2" placeholder="e.g. Mirpur 10" :class="inputClass(invalid)"
                  :aria-invalid="invalid" :aria-describedby="describedBy" @blur="touched.area = true" @input="clearServerError('area')"
                >
              </template>
            </UiField>
          </div>
          <UiField id="f-address_line" label="Full address" required :error="fieldError('address_line')" hint="House, road, landmark.">
            <template #default="{ invalid, describedBy }">
              <input
                id="f-address_line" v-model="form.address_line" type="text" autocomplete="street-address" :class="inputClass(invalid)"
                :aria-invalid="invalid" :aria-describedby="describedBy" @blur="touched.address_line = true" @input="clearServerError('address_line')"
              >
            </template>
          </UiField>
          <UiField id="f-note" label="Note for us" :error="fieldError('note')">
            <template #default="{ invalid, describedBy }">
              <textarea
                id="f-note" v-model="form.note" rows="2" maxlength="500" placeholder="Anything we should know?"
                class="w-full rounded-md border bg-surface-2 px-4 py-3 text-base placeholder:text-muted/70 focus:outline-none"
                :class="invalid ? 'border-danger' : 'border-border focus:border-accent'" :aria-describedby="describedBy"
              />
            </template>
          </UiField>
        </fieldset>

        <fieldset class="rounded-lg border border-border bg-surface p-5">
          <legend class="-ml-1 px-1 text-lg font-bold">Payment</legend>
          <div class="mt-3 space-y-2">
            <label
              v-for="m in paymentMethods"
              :key="m"
              class="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition"
              :class="paymentMethod === m ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'"
            >
              <input v-model="paymentMethod" type="radio" name="payment" :value="m" class="size-4 accent-[var(--color-accent)]">
              <span class="font-medium">{{ PAYMENT_LABELS[m] }}</span>
              <span v-if="m === 'cod'" class="ml-auto text-xs text-muted">Pay when it arrives</span>
            </label>
          </div>
        </fieldset>
      </div>

      <aside class="rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-24" aria-label="Order summary">
        <h2 class="text-lg font-bold">Order summary</h2>

        <p v-if="pricingError" class="mt-3 text-sm text-danger" role="alert">{{ pricingError.message }}</p>
        <CartOrderSummaryLines v-if="priced" class="mt-2" :lines="priced.lines" />
        <UiSkeleton v-else class="mt-3 h-20 w-full" />

        <dl class="mt-2 space-y-2 border-t border-border pt-4 text-sm" :class="pending && 'opacity-60'">
          <div class="flex justify-between">
            <dt class="text-muted">Subtotal</dt>
            <dd class="tabular-nums">{{ priced ? formatTaka(priced.subtotal) : '—' }}</dd>
          </div>
          <div v-if="priced?.coupon" class="flex justify-between text-success">
            <dt>Coupon {{ priced.coupon.code }}</dt>
            <dd class="tabular-nums">−{{ formatTaka(priced.discount) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted">Shipping <span v-if="zone" class="text-xs">({{ zone === 'inside_dhaka' ? 'inside' : 'outside' }} Dhaka)</span></dt>
            <dd class="tabular-nums" :class="!zone && 'text-muted'">{{ shippingText }}</dd>
          </div>
          <div class="flex items-baseline justify-between border-t border-border pt-3 text-base font-bold">
            <dt>Total</dt>
            <dd class="font-display text-xl tabular-nums">{{ priced ? formatTaka(priced.total) : '—' }}</dd>
          </div>
        </dl>

        <UiButton type="submit" size="lg" block class="mt-5" :disabled="submitting || !priced">
          {{ submitting ? 'Placing order…' : 'Place order' }}
        </UiButton>
        <p class="mt-3 text-center text-xs text-muted">
          By placing the order you agree to be contacted to confirm it. Prices are checked again when you order.
        </p>
      </aside>
    </form>
  </div>
</template>
