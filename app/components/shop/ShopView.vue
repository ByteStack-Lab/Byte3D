<script setup lang="ts">
import type { Paginated, ProductCard, ProductFilters } from '~/types/api'
import type { FilterState } from '~/composables/useShopQuery'
import type { Chip } from './ActiveFilters.vue'

const props = defineProps<{ lockedCategory?: string }>()

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
      <h2 class="sr-only">Products</h2>
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
            <UiIcon name="filter" :size="18" /> Filter
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
            <template v-if="meta.total">Showing {{ meta.from }}–{{ meta.to }} of <strong class="text-text">{{ meta.total }}</strong> products</template>
            <template v-else>No products found</template>
          </template>
          <template v-else>Loading products…</template>
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
        <ul v-if="loading" class="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading products">
          <li v-for="n in 8" :key="n"><ProductCardSkeleton /></li>
        </ul>

        <UiEmptyState
          v-else-if="error"
          title="We couldn’t load products"
          :description="error.message"
          icon="info"
        >
          <UiButton @click="refresh()">Try again</UiButton>
        </UiEmptyState>

        <UiEmptyState
          v-else-if="!products.length"
          title="No products match your filters"
          description="Try removing a filter or searching for something else."
          icon="search"
        >
          <UiButton v-if="hasAnyFilter" @click="clearAll">Reset filters</UiButton>
          <UiButton variant="secondary" to="/custom-order">Request a custom print</UiButton>
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
