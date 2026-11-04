<script setup lang="ts">
import type { Category } from '~/types/api'

defineProps<{ category: Category }>()
const { t } = useLocale()
</script>

<template>
  <NuxtLink
    :to="`/categories/${category.slug}`"
    class="group relative block aspect-[4/3] overflow-hidden rounded-lg border border-border bg-surface transition duration-300 hover:border-accent/70 hover:shadow-glow focus-visible:border-accent"
  >
    <div data-parallax class="size-full">
      <NuxtImg
        :src="category.image.url"
        :alt="category.image.alt"
        :width="category.image.width"
        :height="category.image.height"
        loading="lazy"
        decoding="async"
        class="size-full object-cover transition duration-500 group-hover:scale-105"
      />
    </div>
    <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
    <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4">
      <h3 class="font-display text-sm font-semibold leading-tight text-white sm:text-lg">{{ category.name }}</h3>
      <p class="mt-0.5 flex items-center gap-1 text-xs text-white/75 sm:text-sm">
        {{ t('home.productCount', { n: category.product_count }) }}
        <UiIcon name="arrow-right" :size="14" class="transition group-hover:translate-x-1 group-hover:text-accent" />
      </p>
    </div>
  </NuxtLink>
</template>
