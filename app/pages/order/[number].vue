<script setup lang="ts">
useSeoMeta({ title: 'Order placed', robots: 'noindex' })

const route = useRoute()
const number = computed(() => String(route.params.number))

interface LastOrder { number: string, total: number, method: string, phone: string }
const last = ref<LastOrder | null>(null)
onMounted(() => {
  try {
    const saved = JSON.parse(sessionStorage.getItem('b3d-last-order') ?? 'null') as LastOrder | null
    if (saved?.number === number.value) last.value = saved
  }
  catch { /* opened directly: show the generic confirmation */ }
})

const { data: settings } = await useSettings()
const phone = computed(() => settings.value?.data.contact.phone ?? '+880 1812-209019')
</script>

<template>
  <div class="container-page py-10 sm:py-16">
    <div class="mx-auto max-w-xl text-center">
      <span class="mx-auto grid size-16 place-items-center rounded-full bg-success/15 text-success">
        <UiIcon name="check" :size="32" />
      </span>
      <h1 class="mt-5 text-3xl font-bold sm:text-4xl">Thank you! Your order is in.</h1>
      <p class="mt-3 text-muted">We will call or message you soon to confirm it.</p>

      <dl class="mt-8 divide-y divide-border rounded-lg border border-border bg-surface text-left text-sm">
        <div class="flex justify-between gap-4 px-4 py-3">
          <dt class="text-muted">Order number</dt>
          <dd class="font-display text-base font-bold tracking-wide">{{ number }}</dd>
        </div>
        <div v-if="last" class="flex justify-between gap-4 px-4 py-3">
          <dt class="text-muted">Total</dt>
          <dd class="font-semibold">{{ formatTaka(last.total) }}</dd>
        </div>
        <div v-if="last" class="flex justify-between gap-4 px-4 py-3">
          <dt class="text-muted">Payment</dt>
          <dd class="font-medium">{{ PAYMENT_LABELS[last.method as keyof typeof PAYMENT_LABELS] ?? last.method }}</dd>
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
