<script setup lang="ts">
import type { ProductFilters } from '~/types/api'
import type { FilterState } from '~/composables/useShopQuery'

const props = defineProps<{ filters?: ProductFilters | null, hideCategory?: boolean, idPrefix: string }>()
const { t } = useLocale()
const state = defineModel<FilterState>({ required: true })

type ListKey = 'category' | 'material' | 'color'

function toggle(key: ListKey, value: string) {
  const list = state.value[key]
  state.value = { ...state.value, [key]: list.includes(value) ? list.filter(v => v !== value) : [...list, value] }
}

function setFlag(key: 'in_stock' | 'customizable', value: boolean) {
  state.value = { ...state.value, [key]: value }
}

// Price inputs commit on change/blur (not per keystroke) so the URL isn't spammed.
const min = ref(state.value.min_price)
const max = ref(state.value.max_price)
watch(() => [state.value.min_price, state.value.max_price], ([a, b]) => { min.value = a ?? ''; max.value = b ?? '' })

function commitPrice() {
  const lo = min.value.replace(/\D/g, '')
  const hi = max.value.replace(/\D/g, '')
  state.value = { ...state.value, min_price: lo, max_price: hi }
}

const priceHint = computed(() => props.filters
  ? `${Math.floor(props.filters.price.min / 100)} – ${Math.ceil(props.filters.price.max / 100)}`
  : '')

const row = 'flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-1 text-sm transition hover:text-accent'
const box = 'size-[18px] shrink-0 cursor-pointer rounded border-border bg-surface-2 accent-[var(--color-accent)]'
const legend = 'mb-2 text-xs font-semibold uppercase tracking-wider text-muted'
</script>

<template>
  <div class="space-y-6">
    <fieldset v-if="!hideCategory && filters?.categories.length">
      <legend :class="legend">{{ t('filter.category') }}</legend>
      <label v-for="c in filters.categories" :key="c.slug" :class="row">
        <input type="checkbox" :class="box" :checked="state.category.includes(c.slug)" @change="toggle('category', c.slug)">
        <span class="flex-1">{{ c.name }}</span>
        <span class="text-xs text-muted">{{ c.count }}</span>
      </label>
    </fieldset>

    <fieldset>
      <legend :class="legend">{{ t('filter.price') }}</legend>
      <div class="flex items-center gap-2">
        <label :for="`${idPrefix}-min`" class="sr-only">{{ t('filter.minAria') }}</label>
        <input
          :id="`${idPrefix}-min`"
          v-model="min"
          inputmode="numeric"
          :placeholder="filters ? String(Math.floor(filters.price.min / 100)) : t('filter.min')"
          class="h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-sm focus:border-accent focus:outline-none"
          @change="commitPrice"
          @keydown.enter="commitPrice"
        >
        <span class="text-muted" aria-hidden="true">–</span>
        <label :for="`${idPrefix}-max`" class="sr-only">{{ t('filter.maxAria') }}</label>
        <input
          :id="`${idPrefix}-max`"
          v-model="max"
          inputmode="numeric"
          :placeholder="filters ? String(Math.ceil(filters.price.max / 100)) : t('filter.max')"
          class="h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-sm focus:border-accent focus:outline-none"
          @change="commitPrice"
          @keydown.enter="commitPrice"
        >
      </div>
      <p v-if="priceHint" class="mt-1.5 text-xs text-muted">{{ t('filter.priceRange', { range: priceHint }) }}</p>
    </fieldset>

    <fieldset v-if="filters?.materials.length">
      <legend :class="legend">{{ t('filter.material') }}</legend>
      <label v-for="m in filters.materials" :key="m.value" :class="row">
        <input type="checkbox" :class="box" :checked="state.material.includes(m.value)" @change="toggle('material', m.value)">
        <span class="flex-1">{{ m.value }}</span>
        <span class="text-xs text-muted">{{ m.count }}</span>
      </label>
    </fieldset>

    <fieldset v-if="filters?.colors.length">
      <legend :class="legend">{{ t('filter.color') }}</legend>
      <div class="flex flex-wrap gap-2" role="group" :aria-label="t('filter.color')">
        <UiSwatch
          v-for="c in filters.colors"
          :key="c.name"
          multi
          :color="c.hex"
          :label="c.name"
          :selected="state.color.includes(c.name)"
          :size="40"
          @click="toggle('color', c.name)"
        />
      </div>
    </fieldset>

    <fieldset>
      <legend :class="legend">{{ t('filter.availability') }}</legend>
      <label :class="row">
        <input type="checkbox" :class="box" :checked="state.in_stock" @change="setFlag('in_stock', ($event.target as HTMLInputElement).checked)">
        {{ t('filter.inStockOnly') }}
      </label>
      <label :class="row">
        <input type="checkbox" :class="box" :checked="state.customizable" @change="setFlag('customizable', ($event.target as HTMLInputElement).checked)">
        {{ t('product.badgeCustomizable') }}
      </label>
    </fieldset>
  </div>
</template>
