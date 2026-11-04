<script setup lang="ts">
import type { PricedLine } from '~/types/api'

defineProps<{ lines: PricedLine[] }>()
const { t } = useLocale()
</script>

<template>
  <ul class="divide-y divide-border">
    <li v-for="(line, i) in lines" :key="i" class="flex gap-3 py-3">
      <NuxtImg
        v-if="line.thumbnail"
        :src="line.thumbnail.url"
        :alt="line.thumbnail.alt"
        :width="56"
        :height="56"
        loading="lazy"
        class="size-14 shrink-0 rounded-md bg-surface-2 object-cover"
      />
      <div class="min-w-0 flex-1 text-sm">
        <p class="truncate font-medium">{{ line.product?.name ?? t('cart.unavailableItem') }}</p>
        <p class="truncate text-xs text-muted">{{ line.variant_name }} · {{ t('cart.qty', { n: line.quantity }) }}</p>
      </div>
      <p class="shrink-0 text-sm font-semibold tabular-nums">{{ line.available ? formatTaka(line.line_total) : '—' }}</p>
    </li>
  </ul>
</template>
