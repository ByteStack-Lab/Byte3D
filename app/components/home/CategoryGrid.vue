<script setup lang="ts">
import type { Category } from '~/types/api'

defineProps<{ categories: Category[] }>()
</script>

<template>
  <section aria-labelledby="cat-heading" class="container-page mt-16 sm:mt-24">
    <div class="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 id="cat-heading" class="text-2xl font-bold sm:text-3xl">Shop by Category</h2>
        <p class="mt-1 text-sm text-muted">From pocket-sized keychains to prototype parts.</p>
      </div>
    </div>
    <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
      <li v-for="c in categories" :key="c.slug">
        <HomeCategoryCard :category="c" />
      </li>
    </ul>
  </section>
</template>
