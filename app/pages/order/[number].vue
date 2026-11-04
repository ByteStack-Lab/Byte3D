<script setup lang="ts">
import type { Order } from '~/types/api'

useSeoMeta({ title: 'Your order', robots: 'noindex' })

const route = useRoute()
const number = computed(() => String(route.params.number))
/** What the payment gateway page sent the shopper back with. Only a hint: the order itself is the source of truth. */
const returned = computed(() => (typeof route.query.payment === 'string' ? route.query.payment : null))

interface LastOrder { number: string, total: number, method: string, phone: string }
const last = ref<LastOrder | null>(null)
const order = ref<Order | null>(null)

async function loadOrder() {
  if (!last.value) return
  try {
    order.value = (await $api<{ data: Order }>('/orders/track', { query: { order_number: number.value, phone: last.value.phone } })).data
  }
  catch { /* the page still works from what checkout remembered */ }
}

let pollTimer: ReturnType<typeof setTimeout> | undefined
/** The gateway's own server call can arrive a few seconds after the shopper: look again a few times. */
function pollWhileConfirming(attempt = 0) {
  if (attempt >= 4 || order.value?.payment_status === 'paid' || (returned.value !== 'paid' && returned.value !== 'pending')) return
  pollTimer = setTimeout(async () => { await loadOrder(); pollWhileConfirming(attempt + 1) }, 3000)
}

onMounted(async () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem('b3d-last-order') ?? 'null') as LastOrder | null
    if (saved?.number === number.value) last.value = saved
  }
  catch { /* opened directly: show the generic confirmation */ }
  await loadOrder()
  pollWhileConfirming()
})
onBeforeUnmount(() => clearTimeout(pollTimer))

const method = computed(() => order.value?.payment_method ?? (last.value?.method as keyof typeof PAYMENT_LABELS | undefined))
const isOnline = computed(() => !!method.value && method.value !== 'cod')
const total = computed(() => order.value?.total ?? last.value?.total)
const isPaid = computed(() => order.value?.payment_status === 'paid')
const stopped = computed(() => order.value?.status === 'cancelled' || order.value?.status === 'returned')
/** Online order, not paid yet, and the shopper can act on it. */
const needsPayment = computed(() => isOnline.value && !isPaid.value && !stopped.value && (!order.value || order.value.payment_status !== 'refunded'))
const confirming = computed(() => needsPayment.value && (returned.value === 'paid' || returned.value === 'pending') && !order.value)

const { data: settings } = await useSettings()
const phone = computed(() => settings.value?.data.contact.phone ?? '+880 1812-209019')
</script>

<template>
  <div class="container-page py-10 sm:py-16">
    <div class="mx-auto max-w-xl text-center">
      <span class="mx-auto grid size-16 place-items-center rounded-full" :class="needsPayment ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'">
        <UiIcon :name="needsPayment ? 'alert' : 'check'" :size="32" />
      </span>
      <template v-if="isPaid">
        <h1 class="mt-5 text-3xl font-bold sm:text-4xl">Payment received. Thank you!</h1>
        <p class="mt-3 text-muted">Your order is in. We will call or message you soon to confirm it.</p>
      </template>
      <template v-else-if="confirming">
        <h1 class="mt-5 text-3xl font-bold sm:text-4xl">Confirming your payment…</h1>
        <p class="mt-3 text-muted" role="status">Your order is placed. This can take a minute. We will confirm as soon as the payment arrives.</p>
      </template>
      <template v-else-if="needsPayment">
        <h1 class="mt-5 text-3xl font-bold sm:text-4xl">Your order is placed. Payment is not complete.</h1>
        <p class="mt-3 text-muted">
          <template v-if="returned === 'cancelled'">You cancelled the payment.</template>
          <template v-else-if="returned === 'failed'">The payment did not go through.</template>
          <template v-else>We have not received your payment yet.</template>
          Pay now to confirm the order, or call us to pay another way.
        </p>
        <div class="mx-auto mt-6 max-w-sm"><AccountOrderPayNow :order-number="number" :phone="last?.phone" /></div>
      </template>
      <template v-else>
        <h1 class="mt-5 text-3xl font-bold sm:text-4xl">Thank you! Your order is in.</h1>
        <p class="mt-3 text-muted">We will call or message you soon to confirm it.</p>
      </template>

      <dl class="mt-8 divide-y divide-border rounded-lg border border-border bg-surface text-left text-sm">
        <div class="flex justify-between gap-4 px-4 py-3">
          <dt class="text-muted">Order number</dt>
          <dd class="font-display text-base font-bold tracking-wide">{{ number }}</dd>
        </div>
        <div v-if="total !== undefined" class="flex justify-between gap-4 px-4 py-3">
          <dt class="text-muted">Total</dt>
          <dd class="font-semibold">{{ formatTaka(total) }}</dd>
        </div>
        <div v-if="method" class="flex justify-between gap-4 px-4 py-3">
          <dt class="text-muted">Payment</dt>
          <dd class="font-medium">{{ PAYMENT_LABELS[method] ?? method }}<template v-if="isOnline"> · {{ isPaid ? 'paid' : 'not paid yet' }}</template></dd>
        </div>
      </dl>
      <p class="mt-3 text-xs text-muted">Keep your order number. You will need it with your phone number to track the order.</p>

      <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <UiButton :to="`/track?order_number=${number}`" size="lg">Track this order</UiButton>
        <UiButton to="/shop" variant="secondary" size="lg">Keep shopping</UiButton>
      </div>
      <p class="mt-8 text-sm text-muted">Questions? Call <a :href="`tel:${phone.replace(/[^+\d]/g, '')}`" class="font-medium text-accent-2 hover:underline">{{ phone }}</a>.</p>
    </div>
  </div>
</template>
