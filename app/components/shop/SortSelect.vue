<script setup lang="ts">
import type { SortKey } from '~/types/api'
import { SORT_OPTIONS } from '~/composables/useShopQuery'

const sort = defineModel<SortKey>({ required: true })
</script>

<template>
  <div class="relative">
    <label for="sort" class="sr-only">Sort products</label>
    <select
      id="sort"
      v-model="sort"
      class="h-11 w-full cursor-pointer appearance-none rounded-md border border-border bg-surface-2 pl-3 pr-9 text-sm focus:border-accent focus:outline-none"
    >
      <option v-for="o in SORT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <UiIcon name="chevron-down" :size="16" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
  </div>
</template>
