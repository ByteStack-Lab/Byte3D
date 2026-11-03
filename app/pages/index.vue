<script setup lang="ts">
import type { HomeData } from '~/types/api'

const abs = useAbsoluteUrl()
const { data, error, refresh, status } = await useApi<{ data: HomeData }>('/home')

useSeoMeta({
  title: 'Byte3D — Custom 3D Printing, Gifts & Prototypes in Bangladesh',
  description: 'Custom 3D printing, personalised keychains, NFC keychains, fidget toys, gifts and prototypes. Delivery across Bangladesh. Cash on delivery.',
  ogTitle: 'Byte3D — We bring your ideas to life',
  ogDescription: 'Custom 3D printing, personalised gifts, prototypes and unique 3D products.',
  ogImage: () => abs(data.value?.data.featured_products[0]?.thumbnail.url ?? '/images/hero-poster.webp'),
})
useCanonical('/')
</script>

<template>
  <div v-if="data">
    <HomeHeroSection :hero="data.data.hero" />
    <HomeCategoryGrid v-if="data.data.categories.length" :categories="data.data.categories" />
    <HomeFeaturedProducts v-if="data.data.featured_products.length" :products="data.data.featured_products" />
  </div>

  <div v-else-if="status === 'pending'" class="container-page py-16" aria-busy="true">
    <UiSkeleton class="h-72 w-full" />
    <div class="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
      <ProductCardSkeleton v-for="n in 4" :key="n" />
    </div>
  </div>

  <div v-else class="container-page py-20">
    <UiEmptyState
      title="We couldn’t load the store"
      :description="error?.message ?? 'Please check your connection and try again.'"
      icon="info"
    >
      <UiButton @click="refresh()">Try again</UiButton>
    </UiEmptyState>
  </div>
</template>
