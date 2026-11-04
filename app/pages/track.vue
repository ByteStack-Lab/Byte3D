<script setup lang="ts">
import type { Order } from '~/types/api'
import type { MessageKey } from '~/locales/en'

const { t, locale } = useLocale()
useSeoMeta({
  title: () => t('track.seoTitle'),
  description: () => t('track.seoDescription'),
  robots: 'noindex',
})

const route = useRoute()
const form = reactive({ order_number: typeof route.query.order_number === 'string' ? route.query.order_number : '', phone: '' })
const order = ref<Order | null>(null)
const loading = ref(false)
const errors = ref<Record<string, string>>({})
const notFound = ref(false)
const generalError = ref<string | null>(null)

// Right after ordering, the phone number is already known.
onMounted(() => {
  try {
    const saved = JSON.parse(sessionStorage.getItem('b3d-last-order') ?? 'null') as { number: string, phone: string } | null
    if (saved && (!form.order_number || saved.number === form.order_number.toUpperCase())) {
      form.order_number ||= saved.number
      form.phone ||= saved.phone
    }
  }
  catch { /* nothing remembered */ }
})

async function submit() {
  errors.value = {}
  notFound.value = false
  generalError.value = null
  order.value = null

  if (!form.order_number.trim()) errors.value.order_number = t('track.errOrder')
  if (!isValidPhone(form.phone)) errors.value.phone = t('track.errPhone')
  if (Object.keys(errors.value).length) return

  loading.value = true
  try {
    const res = await $api<{ data: Order }>('/orders/track', {
      query: { order_number: form.order_number.trim(), phone: normalizePhone(form.phone) },
    })
    order.value = res.data
  }
  catch (e) {
    const err = toApiError(e)
    if (err.status === 404) notFound.value = true
    else if (err.status === 422) for (const [k, v] of Object.entries(err.errors)) errors.value[k] = v[0]!
    else generalError.value = err.message
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container-page py-8 sm:py-12">
    <div class="mx-auto max-w-2xl">
      <h1 class="text-3xl font-bold sm:text-4xl">{{ t('track.seoTitle') }}</h1>
      <p class="mt-2 text-muted">{{ t('track.intro') }}</p>

      <form class="mt-6 space-y-4 rounded-lg border border-border bg-surface p-5" novalidate @submit.prevent="submit">
        <UiField id="t-order" :label="t('order.number')" required :error="errors.order_number">
          <template #default="{ invalid, describedBy }">
            <input
              id="t-order" v-model="form.order_number" type="text" autocomplete="off" autocapitalize="characters" placeholder="B3D-260001"
              :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy"
            >
          </template>
        </UiField>
        <UiField id="t-phone" :label="t('track.phone')" required :error="errors.phone">
          <template #default="{ invalid, describedBy }">
            <input
              id="t-phone" v-model="form.phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX"
              :class="inputClass(invalid)" :aria-invalid="invalid" :aria-describedby="describedBy"
            >
          </template>
        </UiField>
        <UiButton type="submit" size="lg" block :disabled="loading">{{ loading ? t('track.looking') : t('nav.track') }}</UiButton>
      </form>

      <p v-if="notFound" class="mt-6 flex items-start gap-2 rounded-lg border border-border bg-surface p-4 text-sm" role="alert">
        <UiIcon name="info" :size="18" class="mt-0.5 text-accent-2" />
        {{ t('track.notFound') }}
      </p>
      <p v-else-if="generalError" class="mt-6 flex items-start gap-2 rounded-lg border border-danger/50 bg-danger/10 p-4 text-sm text-danger" role="alert">
        <UiIcon name="alert" :size="18" class="mt-0.5" /> {{ generalError }}
      </p>

      <div v-if="order" class="mt-8">
        <AccountOrderCard :order="order" />
        <div
          v-if="order.payment_method !== 'cod' && order.payment_status !== 'paid' && order.payment_status !== 'refunded' && order.status !== 'cancelled' && order.status !== 'returned'"
          class="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-4"
        >
          <p class="mb-3 text-sm font-medium">{{ t('track.notPaid') }}</p>
          <AccountOrderPayNow :order-number="order.order_number" :phone="form.phone" />
        </div>
        <section v-if="order.timeline.length" class="mt-6" aria-labelledby="timeline-heading">
          <h2 id="timeline-heading" class="text-lg font-bold">{{ t('track.history') }}</h2>
          <ol class="mt-3 space-y-3 border-l border-border pl-5">
            <li v-for="(entry, i) in [...order.timeline].reverse()" :key="i" class="relative text-sm">
              <span class="absolute -left-[1.6rem] top-1.5 size-2.5 rounded-full" :class="i === 0 ? 'bg-accent' : 'bg-border'" />
              <p class="font-medium">{{ t(`status.${entry.status}` as MessageKey) }}</p>
              <p class="text-xs text-muted">{{ formatDate(entry.at, locale) }}</p>
            </li>
          </ol>
        </section>
      </div>
    </div>
  </div>
</template>
