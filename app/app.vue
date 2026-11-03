<script setup lang="ts">
const config = useRuntimeConfig()
const { resolved } = useTheme()

// Browser UI colour (mobile address bar) follows the active theme.
useHead({ meta: [{ name: 'theme-color', content: () => (resolved.value === 'light' ? '#F7F6F3' : '#0B0D10') }] })

useHead({
  titleTemplate: title => (title && !title.includes('Byte3D') ? `${title} | Byte3D` : title || 'Byte3D — Custom 3D Printing in Bangladesh'),
})
useSeoMeta({
  ogSiteName: 'Byte3D',
  ogType: 'website',
  ogLocale: 'en_BD',
  twitterCard: 'summary_large_image',
})
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Byte3D',
      url: config.public.siteUrl,
      telephone: '+880 1812-209019',
      email: 'hello@byte3d.store',
      sameAs: ['https://facebook.com/Byte3D'],
    }),
  }],
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLoadingIndicator color="#FF7A1A" :height="2" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
