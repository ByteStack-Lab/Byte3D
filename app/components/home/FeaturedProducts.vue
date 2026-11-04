<script setup lang="ts">
import type { ProductCard } from '~/types/api'

defineProps<{ products: ProductCard[] }>()
const { t } = useLocale()
</script>

<template>
  <section aria-labelledby="featured-heading" class="container-page mt-16 sm:mt-24">
    <div class="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 id="featured-heading" class="text-2xl font-bold sm:text-3xl">{{ t('home.featured') }}</h2>
        <p class="mt-1 text-sm text-muted">{{ t('home.featuredSub') }}</p>
      </div>
      <NuxtLink to="/shop" class="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent transition hover:gap-2">
        {{ t('home.viewAll') }} <UiIcon name="arrow-right" :size="16" />
      </NuxtLink>
    </div>
    <ul class="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      <li v-for="p in products" :key="p.id">
        <ProductCard :product="p" />
      </li>
    </ul>
  </section>
</template>
