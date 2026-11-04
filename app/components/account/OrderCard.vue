<script setup lang="ts">
import type { Order } from '~/types/api'

const props = defineProps<{ order: Order }>()

/** name_text → "Name text" (orders do not carry the product's field labels). */
const humanize = (key: string) => key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())

const stepIndex = computed(() => ORDER_STEPS.findIndex(s => s.status === props.order.status))
const stopped = computed(() => props.order.status === 'cancelled' || props.order.status === 'returned')
</script>

<template>
  <article class="rounded-lg border border-border bg-surface p-5">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="font-display text-lg font-bold tracking-wide">{{ order.order_number }}</h3>
        <p class="text-sm text-muted">Placed {{ formatDate(order.placed_at) }}</p>
      </div>
      <p
        class="rounded-full px-3 py-1 text-xs font-semibold"
        :class="stopped ? 'bg-danger/15 text-danger' : order.status === 'delivered' ? 'bg-success/15 text-success' : 'bg-accent/15 text-accent'"
      >
        {{ order.status_label }}
      </p>
    </header>

    <ol v-if="!stopped" class="mt-5 grid grid-cols-6 gap-1" aria-label="Order progress">
      <li v-for="(step, i) in ORDER_STEPS" :key="step.status" class="min-w-0">
        <span class="block h-1.5 rounded-full" :class="i <= stepIndex ? 'bg-accent' : 'bg-surface-2'" />
        <span class="mt-1.5 block truncate text-[11px] leading-tight sm:text-xs" :class="i === stepIndex ? 'font-semibold text-text' : 'text-muted'">{{ step.label }}</span>
      </li>
    </ol>
    <p v-else class="mt-4 rounded-md bg-danger/10 p-3 text-sm text-danger">This order was {{ order.status === 'cancelled' ? 'cancelled' : 'returned' }}.</p>

    <p v-if="order.shipment" class="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-surface-2 p-3 text-sm">
      <UiIcon name="truck" :size="16" class="text-accent" />
      <span>With <strong>{{ order.shipment.courier }}</strong></span>
      <span v-if="order.shipment.tracking_code" class="text-muted">· Tracking code <span class="font-medium text-text">{{ order.shipment.tracking_code }}</span></span>
      <a v-if="order.shipment.tracking_url" :href="order.shipment.tracking_url" target="_blank" rel="noopener noreferrer" class="font-medium text-accent-2 hover:underline">Track parcel</a>
    </p>

    <ul class="mt-5 divide-y divide-border border-t border-border text-sm">
      <li v-for="(item, i) in order.items" :key="i" class="flex justify-between gap-4 py-3">
        <div class="min-w-0">
          <p class="font-medium">{{ item.product_name }} <span class="text-muted">× {{ item.quantity }}</span></p>
          <p class="text-xs text-muted">{{ item.variant_name }}</p>
          <p v-for="(value, key) in item.customization" :key="key" class="break-words text-xs text-accent-2">{{ humanize(String(key)) }}: {{ value }}</p>
        </div>
        <p class="shrink-0 font-semibold tabular-nums">{{ formatTaka(item.line_total) }}</p>
      </li>
    </ul>

    <dl class="space-y-1.5 border-t border-border pt-4 text-sm">
      <div class="flex justify-between"><dt class="text-muted">Subtotal</dt><dd class="tabular-nums">{{ formatTaka(order.subtotal) }}</dd></div>
      <div v-if="order.discount" class="flex justify-between text-success"><dt>Discount</dt><dd class="tabular-nums">−{{ formatTaka(order.discount) }}</dd></div>
      <div class="flex justify-between"><dt class="text-muted">Shipping</dt><dd class="tabular-nums">{{ formatTaka(order.shipping_fee) }}</dd></div>
      <div class="flex justify-between text-base font-bold"><dt>Total</dt><dd class="font-display tabular-nums">{{ formatTaka(order.total) }}</dd></div>
      <div class="flex justify-between text-xs text-muted">
        <dt>Payment</dt>
        <dd>{{ PAYMENT_LABELS[order.payment_method] }} · {{ order.payment_status }}</dd>
      </div>
    </dl>
  </article>
</template>
