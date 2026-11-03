<script setup lang="ts">
const route = useRoute()

const page = computed(() => Number(route.query.page) || 1)
useSeoMeta({
  title: () => (page.value > 1 ? `Shop all products — page ${page.value}` : 'Shop all products'),
  description: 'Browse custom keychains, NFC keychains, figurines, fidget toys, gifts and prototype parts. 3D printed in Bangladesh, cash on delivery.',
  ogTitle: 'Shop 3D printed products | Byte3D',
  robots: () => (Object.keys(route.query).some(k => k !== 'page') ? 'noindex, follow' : 'index, follow'),
})
// Filtered URLs canonicalise to the clean shop page (+ page number).
useCanonical(() => (page.value > 1 ? `/shop?page=${page.value}` : '/shop'))
</script>

<template>
  <div class="container-page py-8 sm:py-10">
    <UiBreadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Shop' }]" />
    <h1 class="mt-3 text-3xl font-bold sm:text-4xl">Shop</h1>
    <p class="mt-1 text-muted">Everything we print — ready to ship or made just for you.</p>
    <div class="mt-8">
      <ShopView />
    </div>
  </div>
</template>
