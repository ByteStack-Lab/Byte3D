<script setup lang="ts">
const config = useRuntimeConfig()
const { resolved } = useTheme()
const { locale } = useLocale()

// Browser UI colour (mobile address bar) follows the active theme.
useHead({ meta: [{ name: 'theme-color', content: () => (resolved.value === 'light' ? '#F6F7FD' : '#0A0C1A') }] })

useHead({
  titleTemplate: title => (title && !title.includes('Byte3D') ? `${title} | Byte3D` : title || 'Byte3D — Custom 3D Printing in Bangladesh'),
})
useHead({ htmlAttrs: { lang: locale } })
useSeoMeta({
  // Default share image; product and category pages set their own.
  ogImage: `${config.public.siteUrl}/images/hero-poster.webp`,
  ogSiteName: 'Byte3D',
  ogType: 'website',
  ogLocale: () => (locale.value === 'bn' ? 'bn_BD' : 'en_BD'),
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
  <NuxtLoadingIndicator color="#6675F7" :height="2" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
