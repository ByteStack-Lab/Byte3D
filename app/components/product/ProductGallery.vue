<script setup lang="ts">
import type { ApiImage } from '~/types/api'

const props = defineProps<{ images: ApiImage[], modelUrl?: string | null, previewText?: string, name: string }>()

const tab = ref<'photos' | '3d'>('photos')
const index = ref(0)
const scroller = ref<HTMLElement | null>(null)
let raf = 0

function onScroll() {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    const el = scroller.value
    if (el) index.value = Math.round(el.scrollLeft / el.clientWidth)
  })
}

function go(i: number) {
  const el = scroller.value
  if (!el) return
  const target = Math.min(Math.max(i, 0), props.images.length - 1)
  index.value = target
  el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' })
}

onBeforeUnmount(() => cancelAnimationFrame(raf))

const tabBtn = 'min-h-11 rounded-full px-4 text-sm font-medium transition'
</script>

<template>
  <div>
    <div v-if="modelUrl" class="mb-3 flex gap-2" role="tablist" aria-label="Product media">
      <button type="button" role="tab" :aria-selected="tab === 'photos'" :class="[tabBtn, tab === 'photos' ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted hover:text-text']" @click="tab = 'photos'">
        <UiIcon name="image" :size="16" class="mr-1 inline" /> Photos
      </button>
      <button type="button" role="tab" :aria-selected="tab === '3d'" :class="[tabBtn, tab === '3d' ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted hover:text-text']" @click="tab = '3d'">
        <UiIcon name="rotate" :size="16" class="mr-1 inline" /> View in 3D
      </button>
    </div>

    <ProductProduct3DViewer v-if="tab === '3d' && modelUrl" :src="modelUrl" :alt="`3D model of ${name}`" :poster="images[0]?.url" />

    <div v-else>
      <div class="relative overflow-hidden rounded-xl border border-border bg-surface">
        <div
          ref="scroller"
          class="scrollbar-none snap-x snap-mandatory overflow-x-auto scroll-smooth"
          role="region"
          aria-roledescription="carousel"
          :aria-label="`${name} photos`"
          tabindex="0"
          @scroll.passive="onScroll"
          @keydown.left.prevent="go(index - 1)"
          @keydown.right.prevent="go(index + 1)"
        >
          <ul class="flex">
            <li
              v-for="(img, i) in images"
              :key="img.url"
              class="aspect-square w-full shrink-0 snap-center"
            >
              <NuxtImg
                :src="img.url"
                :alt="img.alt"
                :width="img.width"
                :height="img.height"
                :loading="i === 0 ? 'eager' : 'lazy'"
                :fetchpriority="i === 0 ? 'high' : undefined"
                decoding="async"
                class="size-full object-cover"
                draggable="false"
              />
            </li>
          </ul>
        </div>

        <!-- Live preview of the customer's text on the product (decorative; the field itself is the source of truth). -->
        <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
          <div v-if="previewText" class="pointer-events-none absolute inset-x-4 bottom-5 flex flex-col items-center gap-1" aria-hidden="true">
            <span class="max-w-full truncate rounded-lg bg-bg/70 px-5 py-2 font-display text-2xl font-bold tracking-wide text-accent shadow-[0_0_24px_rgb(102_117_247/0.45)] ring-1 ring-accent/50 backdrop-blur sm:text-3xl">
              {{ previewText }}
            </span>
            <span class="text-[11px] uppercase tracking-widest text-muted">Live preview</span>
          </div>
        </Transition>

        <template v-if="images.length > 1">
          <button
            type="button"
            class="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-bg/70 text-text backdrop-blur transition hover:bg-bg md:grid"
            :class="index === 0 && 'pointer-events-none opacity-30'"
            aria-label="Previous photo"
            @click="go(index - 1)"
          >
            <UiIcon name="chevron-left" :size="22" />
          </button>
          <button
            type="button"
            class="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-bg/70 text-text backdrop-blur transition hover:bg-bg md:grid"
            :class="index === images.length - 1 && 'pointer-events-none opacity-30'"
            aria-label="Next photo"
            @click="go(index + 1)"
          >
            <UiIcon name="chevron-right" :size="22" />
          </button>
          <p class="absolute right-3 top-3 rounded-full bg-bg/70 px-2.5 py-1 text-xs font-medium backdrop-blur" aria-live="polite">
            {{ index + 1 }} / {{ images.length }}
          </p>
        </template>
      </div>

      <ul v-if="images.length > 1" class="scrollbar-none mt-3 flex gap-2 overflow-x-auto" aria-label="Photo thumbnails">
        <li v-for="(img, i) in images" :key="img.url" class="shrink-0">
          <button
            type="button"
            class="block size-16 overflow-hidden rounded-md border-2 transition sm:size-20"
            :class="i === index ? 'border-accent' : 'border-border opacity-70 hover:opacity-100'"
            :aria-label="`Show photo ${i + 1}`"
            :aria-current="i === index || undefined"
            @click="go(i)"
          >
            <NuxtImg :src="img.url" alt="" :width="80" :height="80" loading="lazy" class="size-full object-cover" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
