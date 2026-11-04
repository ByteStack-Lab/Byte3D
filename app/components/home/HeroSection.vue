<script setup lang="ts">
import type { HomeData } from '~/types/api'

defineProps<{ hero: HomeData['hero'] }>()

const ready = ref(false)
const trust = [
  { icon: 'palette', label: 'Custom designs' },
  { icon: 'truck', label: 'Delivery across Bangladesh' },
  { icon: 'wallet', label: 'Cash on delivery' },
]
</script>

<template>
  <section class="relative isolate overflow-hidden">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_75%_30%,rgb(102_117_247/0.16),transparent_70%),radial-gradient(40%_40%_at_10%_80%,rgb(104_219_242/0.08),transparent_70%)]" />

    <div class="container-page grid items-center gap-8 py-10 md:py-16 lg:grid-cols-2 lg:gap-12">
      <!-- Text is SSR HTML and the LCP element; the canvas never blocks it. -->
      <div class="animate-fade-up">
        <p class="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-medium text-muted">
          <span class="size-1.5 animate-pulse rounded-full bg-accent" /> Now printing in Dhaka
        </p>
        <h1 class="text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
          {{ hero.headline }}
        </h1>
        <p class="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          {{ hero.subheadline }}
        </p>
        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
          <UiButton :to="hero.primary_cta.href" size="lg">
            {{ hero.primary_cta.label }} <UiIcon name="arrow-right" :size="18" />
          </UiButton>
          <UiButton :to="hero.secondary_cta.href" variant="secondary" size="lg">
            {{ hero.secondary_cta.label }}
          </UiButton>
        </div>
        <ul class="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <li v-for="t in trust" :key="t.label" class="inline-flex items-center gap-2">
            <UiIcon :name="t.icon" :size="16" class="text-accent" /> {{ t.label }}
          </li>
        </ul>
      </div>

      <!-- 3D "device" card: bezel, layered shadows, floor shadow, sheen; tilts on desktop and levels out on hover. -->
      <div
        class="hero-stage-wrap relative mx-auto w-full max-w-xl pb-8 lg:max-w-none"
        role="img"
        aria-label="A 3D printer building a product layer by layer"
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
