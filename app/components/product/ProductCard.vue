<script setup lang="ts">
import type { ProductCard } from '~/types/api'

const props = withDefaults(defineProps<{ product: ProductCard, priority?: boolean }>(), { priority: false })

const { t } = useLocale()
const salePercent = computed(() => discountPercent(props.product.price, props.product.compare_at_price))
const href = computed(() => `/products/${props.product.slug}`)

// Photo morph into the product page gallery (View Transitions). Only the card the visitor is about to open
// carries the transition name, because names must be unique on the page. Armed early (hover / press / focus),
// before the click starts the navigation.
const vtProduct = useState<string | null>('vt-product', () => null)
const arm = () => { vtProduct.value = props.product.slug }
const photoStyle = computed(() => (vtProduct.value === props.product.slug ? { viewTransitionName: 'product-image' } : undefined))
const cta = computed(() => {
  if (!props.product.in_stock) return { label: t('product.outOfStock'), disabled: true }
  if (props.product.is_customizable) return { label: t('product.customize'), disabled: false }
  return { label: t('product.viewDetails'), disabled: false }
})
</script>

<template>
  <article
    class="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition duration-200 focus-within:border-accent/70 hover:-translate-y-1 hover:border-accent/60 hover:shadow-glow"
    @pointerenter="arm"
    @pointerdown="arm"
    @focusin="arm"
  >
    <div class="relative aspect-square overflow-hidden bg-surface-2" :style="photoStyle">
      <NuxtImg
        :src="product.thumbnail.url"
        :alt="product.thumbnail.alt"
        :width="product.thumbnail.width"
        :height="product.thumbnail.height"
        :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : undefined"
        decoding="async"
        class="size-full object-cover transition duration-500 group-hover:scale-105"
        :class="product.hover_image && 'group-hover:opacity-0'"
      />
      <NuxtImg
        v-if="product.hover_image"
        :src="product.hover_image.url"
        alt=""
        :width="product.hover_image.width"
        :height="product.hover_image.height"
        loading="lazy"
        decoding="async"
        class="absolute inset-0 hidden size-full scale-105 object-cover opacity-0 transition duration-500 group-hover:opacity-100 md:block"
      />

      <div class="absolute left-2 top-2 flex flex-wrap gap-1.5">
        <UiBadge v-if="salePercent" variant="sale" overlay>−{{ salePercent }}%</UiBadge>
        <UiBadge v-if="product.badges.includes('new')" variant="new" overlay>{{ t('product.badgeNew') }}</UiBadge>
        <UiBadge v-if="product.badges.includes('customizable')" variant="customizable" overlay>{{ t('product.badgeCustomizable') }}</UiBadge>
      </div>

      <div v-if="!product.in_stock" class="absolute inset-0 grid place-items-center bg-bg/60 backdrop-blur-[1px]">
        <span class="rounded-full bg-bg/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted ring-1 ring-border">{{ t('product.soldOut') }}</span>
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-1 p-3 sm:p-4">
      <p class="text-xs text-muted">{{ product.category.name }}</p>
      <h3 class="line-clamp-2 min-h-[2.6em] text-sm font-semibold leading-snug sm:text-base">
        <NuxtLink :to="href" class="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
          {{ product.name }}
        </NuxtLink>
      </h3>
      <UiPrice :price="product.price" :compare-at="product.compare_at_price" :range="product.price_range" class="mt-auto pt-1" />

      <div class="relative z-10 mt-3">
        <UiButton v-if="!cta.disabled" :to="href" variant="secondary" size="sm" block tabindex="-1" aria-hidden="true">
          {{ cta.label }}
        </UiButton>
        <UiButton v-else variant="ghost" size="sm" block disabled>{{ cta.label }}</UiButton>
      </div>
    </div>
  </article>
</template>
