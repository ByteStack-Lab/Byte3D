<script setup lang="ts">
import type { ProductFilters } from '~/types/api'
import type { FilterState } from '~/composables/useShopQuery'

defineProps<{ filters?: ProductFilters | null, hideCategory?: boolean, activeCount: number }>()
const state = defineModel<FilterState>({ required: true })
const { t } = useLocale()
const emit = defineEmits<{ clear: [] }>()
</script>

<template>
  <aside class="hidden w-64 shrink-0 lg:block" :aria-label="t('filter.title')">
    <div class="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-lg border border-border bg-surface p-5">
      <div class="mb-5 flex items-center justify-between">
        <h2 class="text-base font-semibold">{{ t('filter.title') }}</h2>
        <button v-if="activeCount" type="button" class="text-xs font-semibold text-accent hover:underline" @click="emit('clear')">
          {{ t('filter.clearAll') }}
        </button>
      </div>
      <ShopFilterPanel v-model="state" :filters="filters" :hide-category="hideCategory" id-prefix="side" />
    </div>
  </aside>
</template>
