<script setup lang="ts">
import type { Paginated, ProductCard, ProductFilters } from '~/types/api'
import type { FilterState } from '~/composables/useShopQuery'
import type { Chip } from './ActiveFilters.vue'

const props = defineProps<{ lockedCategory?: string }>()
const { t } = useLocale()

const { query, apiQuery, filterState, page, sort, update, applyFilters, clearAll } = useShopQuery(() => props.lockedCategory)

const filtersParams = computed(() => (props.lockedCategory ? { category: props.lockedCategory } : {}))
const { data: filtersData } = await useApi<{ data: ProductFilters }>('/products/filters', {
  key: `filters-${props.lockedCategory ?? 'all'}`,
  query: filtersParams,
})
const filters = computed(() => filtersData.value?.data ?? null)

const { data, status, error, refresh } = await useApi<Paginated<ProductCard>>('/products', { query: apiQuery })
const products = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta)
const loading = computed(() => status.value === 'pending')
/** "Showing 1–24 of 60 products", with the total in bold. Built from numbers only, so rendering it as HTML is safe. */
const showing = computed(() => (meta.value
  ? t('shop.showing', { from: meta.value.from ?? 0, to: meta.value.to ?? 0, total: `<strong class="text-text">${meta.value.total}</strong>` })
  : ''))

const hideCategory = computed(() => !!props.lockedCategory)
const drawerOpen = ref(false)

const activeCount = computed(() => {
  const s = filterState.value
  return (hideCategory.value ? 0 : s.category.length) + s.material.length + s.color.length
    + (s.in_stock ? 1 : 0) + (s.customizable ? 1 : 0) + (s.min_price || s.max_price ? 1 : 0)
})
const hasAnyFilter = computed(() => activeCount.value > 0 || !!query.value.q)

function onRemove(chip: Chip) {
  const s: FilterState = { ...filterState.value }
  if (chip.kind === 'q') return update({ q: undefined })
  if (chip.kind === 'category') s.category = s.category.filter(v => v !== chip.value)
  if (chip.kind === 'material') s.material = s.material.filter(v => v !== chip.value)
  if (chip.kind === 'color') s.color = s.color.filter(v => v !== chip.value)
  if (chip.kind === 'in_stock') s.in_stock = false
  if (chip.kind === 'customizable') s.customizable = false
  if (chip.kind === 'price') { s.min_price = ''; s.max_price = '' }
  applyFilters(s)
}

// Bring the grid back into view when paging (the URL changes, the path doesn't).
watch(page, () => {
  if (import.meta.client) document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
})
</script>

<template>
  <div class="flex items-start gap-8">
    <ShopFilterSidebar
      :model-value="filterState"
      :filters="filters"
      :hide-category="hideCategory"
      :active-count="activeCount"
      @update:model-value="applyFilters"
      @clear="clearAll"
    />

    <div id="results" class="min-w-0 flex-1 scroll-mt-20">
      <h2 class="sr-only">{{ t('shop.products') }}</h2>
      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="flex-1">
          <ShopSearchInput :model-value="query.q ?? ''" @update:model-value="v => update({ q: v || undefined })" />
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            class="relative inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-surface-2 px-4 text-sm font-medium transition hover:border-accent sm:flex-none lg:hidden"
            aria-haspopup="dialog"
            @click="drawerOpen = true"
          >
            <UiIcon name="filter" :size="18" /> {{ t('shop.filter') }}
            <span v-if="activeCount" class="grid size-5 place-items-center rounded-full bg-accent text-xs font-bold text-on-accent">{{ activeCount }}</span>
          </button>
          <div class="flex-1 sm:w-52 sm:flex-none">
            <ShopSortSelect :model-value="sort" @update:model-value="v => update({ sort: v === 'newest' ? undefined : v })" />
          </div>
        </div>
      </div>

      <div class="mt-4 flex flex-col gap-3">
        <p class="text-sm text-muted" aria-live="polite">
          <template v-if="meta && !loading">
            <!-- eslint-disable-next-line vue/no-v-html -- only numbers from our own API go into the markup -->
            <span v-if="meta.total" v-html="showing" />
            <template v-else>{{ t('shop.noneFound') }}</template>
          </template>
          <template v-else>{{ t('shop.loadingProducts') }}</template>
        </p>
        <ShopActiveFilters
          :state="filterState"
          :q="query.q"
          :filters="filters"
          :hide-category="hideCategory"
          @remove="onRemove"
          @clear="clearAll"
        />
      </div>

      <div class="mt-5">
        <ul v-if="loading" class="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4" aria-busy="true" :aria-label="t('shop.loadingLabel')">
          <li v-for="n in 8" :key="n"><ProductCardSkeleton /></li>
        </ul>

        <UiEmptyState
          v-else-if="error"
          :title="t('shop.loadError')"
          :description="error.message"
          icon="info"
        >
          <UiButton @click="refresh()">{{ t('common.tryAgain') }}</UiButton>
        </UiEmptyState>

        <UiEmptyState
          v-else-if="!products.length"
          :title="t('shop.noMatch')"
          :description="t('shop.noMatchHint')"
          icon="search"
        >
          <UiButton v-if="hasAnyFilter" @click="clearAll">{{ t('shop.resetFilters') }}</UiButton>
          <UiButton variant="secondary" to="/custom-order">{{ t('shop.requestCustom') }}</UiButton>
        </UiEmptyState>

        <ul v-else class="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          <li v-for="(p, i) in products" :key="p.id" class="animate-fade-up" :style="{ animationDelay: `${Math.min(i, 8) * 30}ms` }">
            <ProductCard :product="p" :priority="i < 4" />
          </li>
        </ul>

        <ShopPagination v-if="meta && !loading" :current="meta.current_page" :last="meta.last_page" />
      </div>
    </div>

    <ShopFilterDrawer
      v-model:open="drawerOpen"
      :filters="filters"
      :hide-category="hideCategory"
      :current="filterState"
      @apply="applyFilters"
    />
  </div>
</template>
