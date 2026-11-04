<script setup lang="ts">
import type { ProductFilters } from '~/types/api'
import type { FilterState } from '~/composables/useShopQuery'

export interface Chip { key: string, label: string, kind: 'category' | 'material' | 'color' | 'in_stock' | 'customizable' | 'price' | 'q', value?: string }

const props = defineProps<{ state: FilterState, q?: string, filters?: ProductFilters | null, hideCategory?: boolean }>()
const { t } = useLocale()
const emit = defineEmits<{ remove: [chip: Chip], clear: [] }>()

const chips = computed<Chip[]>(() => {
  const out: Chip[] = []
  if (props.q) out.push({ key: 'q', kind: 'q', label: `“${props.q}”` })
  if (!props.hideCategory) {
    for (const slug of props.state.category) {
      const name = props.filters?.categories.find(c => c.slug === slug)?.name ?? slug
      out.push({ key: `c-${slug}`, kind: 'category', value: slug, label: name })
    }
  }
  for (const m of props.state.material) out.push({ key: `m-${m}`, kind: 'material', value: m, label: m })
  for (const c of props.state.color) out.push({ key: `col-${c}`, kind: 'color', value: c, label: c })
  if (props.state.min_price || props.state.max_price) {
    const lo = props.state.min_price ? `৳${props.state.min_price}` : '৳0'
    const hi = props.state.max_price ? `৳${props.state.max_price}` : t('filter.any')
    out.push({ key: 'price', kind: 'price', label: `${lo} – ${hi}` })
  }
  if (props.state.in_stock) out.push({ key: 'in_stock', kind: 'in_stock', label: t('filter.inStock') })
  if (props.state.customizable) out.push({ key: 'customizable', kind: 'customizable', label: t('product.badgeCustomizable') })
  return out
})

defineExpose({ count: computed(() => chips.value.length) })
</script>

<template>
  <ul v-if="chips.length" class="flex flex-wrap items-center gap-2" :aria-label="t('filter.active')">
    <li v-for="chip in chips" :key="chip.key">
      <button
        type="button"
        class="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-surface-2 py-1 pl-3 pr-2 text-sm transition hover:border-accent hover:text-accent"
        :aria-label="t('filter.remove', { label: chip.label })"
        @click="emit('remove', chip)"
      >
        {{ chip.label }}
        <UiIcon name="close" :size="14" />
      </button>
    </li>
    <li>
      <button type="button" class="min-h-9 px-2 text-sm font-semibold text-accent hover:underline" @click="emit('clear')">{{ t('filter.clearAll') }}</button>
    </li>
  </ul>
</template>
