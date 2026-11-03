<script setup lang="ts">
import type { Category } from '~/types/api'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const abs = useAbsoluteUrl()

const { data } = await useApi<{ data: Category }>(() => `/categories/${slug.value}`, { key: `category-${slug.value}` })
if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found', fatal: true })
}
const category = computed(() => data.value!.data)

const page = computed(() => Number(route.query.page) || 1)
useSeoMeta({
  title: () => `${category.value.name}${page.value > 1 ? ` — page ${page.value}` : ''}`,
  description: () => category.value.description,
  ogTitle: () => `${category.value.name} | Byte3D`,
  ogDescription: () => category.value.description,
  ogImage: () => abs(category.value.image.url),
  robots: () => (Object.keys(route.query).some(k => k !== 'page') ? 'noindex, follow' : 'index, follow'),
})
useCanonical(() => `/categories/${slug.value}${page.value > 1 ? `?page=${page.value}` : ''}`)
</script>

<template>
  <div v-if="data">
    <section class="relative isolate overflow-hidden border-b border-border">
      <NuxtImg
        :src="category.image.url"
        alt=""
        :width="category.image.width"
        :height="category.image.height"
        fetchpriority="high"
        class="absolute inset-0 -z-10 size-full object-cover opacity-40"
      />
      <div class="absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/85 to-bg/30" />
      <div class="container-page py-10 sm:py-16">
        <UiBreadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, { label: category.name }]" />
        <h1 class="mt-4 text-3xl font-bold sm:text-5xl">{{ category.name }}</h1>
        <p class="mt-3 max-w-2xl text-base text-muted sm:text-lg">{{ category.description }}</p>
        <p class="mt-4 text-sm text-muted">{{ category.product_count }} products</p>
      </div>
    </section>

    <div class="container-page py-8 sm:py-10">
      <ShopView :key="slug" :locked-category="slug" />
    </div>
  </div>
</template>
