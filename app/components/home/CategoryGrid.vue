<script setup lang="ts">
import type { Category } from '~/types/api'

defineProps<{ categories: Category[] }>()
const { t } = useLocale()
</script>

<template>
  <section aria-labelledby="cat-heading" class="container-page mt-16 sm:mt-24">
    <div v-reveal class="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 id="cat-heading" class="text-2xl font-bold sm:text-3xl">{{ t('home.categories') }}</h2>
        <p class="mt-1 text-sm text-muted">{{ t('home.categoriesSub') }}</p>
      </div>
    </div>
    <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
      <li v-for="c in categories" :key="c.slug" v-reveal>
        <HomeCategoryCard :category="c" />
      </li>
    </ul>
  </section>
</template>
