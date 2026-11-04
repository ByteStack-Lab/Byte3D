<script setup lang="ts">
const route = useRoute()
const { t } = useLocale()

const page = computed(() => Number(route.query.page) || 1)
useSeoMeta({
  title: () => (page.value > 1 ? `${t('shop.seoTitle')} — ${t('common.pageN', { n: page.value })}` : t('shop.seoTitle')),
  description: () => t('shop.seoDescription'),
  ogTitle: () => t('shop.ogTitle'),
  robots: () => (Object.keys(route.query).some(k => k !== 'page') ? 'noindex, follow' : 'index, follow'),
})
// Filtered URLs canonicalise to the clean shop page (+ page number).
useCanonical(() => (page.value > 1 ? `/shop?page=${page.value}` : '/shop'))
</script>

<template>
  <div class="container-page py-8 sm:py-10">
    <UiBreadcrumbs :items="[{ label: t('nav.home'), to: '/' }, { label: t('nav.shop') }]" />
    <h1 class="mt-3 text-3xl font-bold sm:text-4xl">{{ t('nav.shop') }}</h1>
    <p class="mt-1 text-muted">{{ t('shop.intro') }}</p>
    <div class="mt-8">
      <ShopView />
    </div>
  </div>
</template>
