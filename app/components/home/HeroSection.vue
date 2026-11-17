<script setup lang="ts">
import type { HomeData } from '~/types/api'

import { en, type MessageKey } from '~/locales/en'

defineProps<{ hero: HomeData['hero'] }>()
const { t } = useLocale()

/** Hero text is edited in the admin (English). While it is still the shipped default, show it in the visitor's language. */
const text = (value: string, key: MessageKey) => (value === en[key] ? t(key) : value)

const ready = ref(false)
const trust = [
  { icon: 'palette', key: 'hero.trustCustom' as const },
  { icon: 'truck', key: 'footer.delivery' as const },
]
</script>

<template>
  <section data-scene="hero" class="relative isolate overflow-hidden">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_75%_30%,rgb(102_117_247/0.16),transparent_70%),radial-gradient(40%_40%_at_10%_80%,rgb(104_219_242/0.08),transparent_70%)]" />

    <!-- Dotted-box grid: static CSS dots everywhere (SSR, phones); on desktop the canvas lifts the boxes toward the cursor. -->
    <div aria-hidden="true" class="hero-dots pointer-events-none absolute inset-0 -z-10">
      <HomeHeroDotsFx />
    </div>

    <div class="container-page grid items-center gap-8 py-10 md:py-16 lg:grid-cols-2 lg:gap-12">
      <!-- Text is SSR HTML and the LCP element; the canvas never blocks it. -->
      <div data-scene-text>
        <p class="hero-in mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-medium text-muted">
          <span class="size-1.5 animate-pulse rounded-full bg-accent" /> {{ t('hero.nowPrinting') }}
        </p>
        <h1 class="hero-in text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
          {{ text(hero.headline, 'hero.defaultHeadline') }}
        </h1>
        <p class="hero-in mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg" style="--d: 70ms">
          {{ text(hero.subheadline, 'hero.defaultSubheadline') }}
        </p>
        <div class="hero-in mt-8 flex flex-col gap-3 sm:flex-row" style="--d: 140ms">
          <UiButton :to="hero.primary_cta.href" size="lg">
            {{ text(hero.primary_cta.label, 'hero.defaultShopNow') }} <UiIcon name="arrow-right" :size="18" />
          </UiButton>
          <UiButton :to="hero.secondary_cta.href" variant="secondary" size="lg">
            {{ text(hero.secondary_cta.label, 'nav.customOrder') }}
          </UiButton>
        </div>
        <ul class="hero-in mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted" style="--d: 210ms">
          <li v-for="item in trust" :key="item.key" class="inline-flex items-center gap-2">
            <UiIcon :name="item.icon" :size="16" class="text-accent" /> {{ t(item.key) }}
          </li>
        </ul>
      </div>

      <!-- 3D "device" card: bezel, layered shadows, floor shadow, sheen; tilts on desktop and levels out on hover. -->
      <div
        class="hero-stage-wrap relative mx-auto w-full max-w-xl pb-8 lg:max-w-none"
        role="img"
        :aria-label="t('hero.imageLabel')"
      >
        <div class="hero-stage-floor" aria-hidden="true" />
        <div class="hero-stage rounded-[1.6rem] p-[7px]">
          <div class="relative aspect-[4/3] overflow-hidden rounded-[1.15rem] bg-[#0a0c1a] sm:aspect-square">
            <!-- Static poster: shown first, stays for low-end devices / no WebGL / save-data. -->
            <NuxtImg
              src="/images/hero-poster.webp"
              alt=""
              width="800"
              height="800"
              fetchpriority="high"
              decoding="async"
              class="absolute inset-0 size-full object-cover transition-opacity duration-700"
              :class="ready && 'opacity-0'"
            />
            <div class="absolute inset-0 transition-opacity duration-700" :class="ready ? 'opacity-100' : 'opacity-0'">
              <HomeHeroPrint3D @ready="ready = true" @fallback="ready = false" />
            </div>
            <div class="hero-sheen" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
