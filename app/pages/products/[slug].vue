<script setup lang="ts">
import type { ProductDetail } from '~/types/api'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const abs = useAbsoluteUrl()

const { data } = await useApi<{ data: ProductDetail }>(() => `/products/${slug.value}`, { key: `product-${slug.value}` })
if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found', fatal: true })
}
const product = computed(() => data.value!.data)
const { data: settings } = await useSettings()

const defaultId = () => (product.value.variants.find(v => v.is_default) ?? product.value.variants[0])!.id
const variantId = ref(defaultId())
watch(slug, () => { variantId.value = defaultId() })
const variant = computed(() => product.value.variants.find(v => v.id === variantId.value) ?? product.value.variants[0]!)

const custom = ref<Record<string, string>>({})
const quantity = ref(1)
const showErrors = ref(false)
const justAdded = ref(false)
const cart = useCartStore()
const { track } = useTracking()

function trackView() {
  track('ViewContent', { name: product.value.name, ids: [variant.value.sku], value: variant.value.price })
}
onMounted(trackView)
watch(slug, () => void nextTick(trackView))
let addedTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(addedTimer))

// A new product or a different variant starts from a clean form.
watch(slug, () => { custom.value = {}; quantity.value = 1; showErrors.value = false; justAdded.value = false })

const customErrors = computed(() => validateCustomization(product.value.customization_schema, custom.value))
const extras = computed(() => customizationExtras(product.value.customization_schema, custom.value))
/** Display only; the cart page shows the server's price. */
const unitPrice = computed(() => variant.value.price + extras.value)
const maxQuantity = computed(() => Math.min(MAX_LINE_QUANTITY, variant.value.stock ?? MAX_LINE_QUANTITY))
watch(maxQuantity, (max) => { if (quantity.value > max) quantity.value = Math.max(1, max) })

/** Returns true when the item went into the cart. */
function addToCart(): boolean {
  if (!variant.value.in_stock) return false
  if (Object.keys(customErrors.value).length) {
    showErrors.value = true
    void nextTick(() => document.querySelector<HTMLElement>('[aria-invalid="true"], [role="note"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
    return false
  }
  const clean = cleanCustomization(product.value.customization_schema, custom.value)
  cart.add({
    variantId: variant.value.id,
    productSlug: product.value.slug,
    productName: product.value.name,
    variantName: variant.value.name,
    image: product.value.thumbnail,
    unitPrice: unitPrice.value,
    quantity: quantity.value,
    customization: clean,
    customizationLabels: describeCustomization(product.value.customization_schema, clean),
  })
  track('AddToCart', { name: product.value.name, ids: [variant.value.sku], value: unitPrice.value * quantity.value, quantity: quantity.value })
  justAdded.value = true
  clearTimeout(addedTimer)
  addedTimer = setTimeout(() => { justAdded.value = false }, 5000)
  return true
}

async function buyNow() {
  if (addToCart()) await navigateTo('/checkout')
}

const previewText = computed(() => {
  const f = product.value.customization_schema.find(x => x.type === 'text')
  return f ? (custom.value[f.key] ?? '').trim() : ''
})

const stock = computed(() => {
  const v = variant.value
  if (!v.in_stock) return { label: 'Out of stock', tone: 'text-danger', dot: 'bg-danger' }
  if (v.stock === null) return { label: 'Made to order', tone: 'text-accent-2', dot: 'bg-accent-2' }
  if (v.stock <= 5) return { label: `Only ${v.stock} left`, tone: 'text-accent', dot: 'bg-accent' }
  return { label: 'In stock', tone: 'text-success', dot: 'bg-success' }
})

const salePercent = computed(() => discountPercent(variant.value.price, variant.value.compare_at_price))
const days = computed(() => product.value.production_days)
const readyText = computed(() => {
  const d = days.value
  if (!d) return null
  return d.min === d.max ? `Ready in ${d.min} days` : `Ready in ${d.min}–${d.max} days`
})

const fb = computed(() => settings.value?.data.socials.facebook ?? 'https://facebook.com/Byte3D')
const phone = computed(() => settings.value?.data.contact.phone ?? '+880 1812-209019')
const tel = computed(() => `tel:${phone.value.replace(/[^+\d]/g, '')}`)

const specs = computed(() => [
  product.value.dimensions && { label: 'Dimensions', value: product.value.dimensions },
  variant.value.material && { label: 'Material', value: variant.value.material },
  variant.value.color && { label: 'Color', value: variant.value.color },
  variant.value.size && { label: 'Size', value: variant.value.size },
  { label: 'SKU', value: variant.value.sku },
].filter(Boolean) as { label: string, value: string }[])

useSeoMeta({
  title: () => product.value.seo.title,
  description: () => product.value.seo.description,
  ogTitle: () => product.value.seo.title,
  ogDescription: () => product.value.seo.description,
  ogType: 'website',
  ogImage: () => abs(product.value.images[0]?.url ?? product.value.thumbnail.url),
})
useCanonical(() => `/products/${slug.value}`)

useHead(() => {
  const p = product.value
  const prices = p.variants.map(v => v.price)
  const lo = Math.min(...prices)
  const hi = Math.max(...prices)
  const availability = p.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
  const url = abs(`/products/${p.slug}`)
  const offers = lo === hi
    ? { '@type': 'Offer', url, price: (lo / 100).toFixed(2), priceCurrency: 'BDT', availability }
    : { '@type': 'AggregateOffer', url, lowPrice: (lo / 100).toFixed(2), highPrice: (hi / 100).toFixed(2), priceCurrency: 'BDT', offerCount: p.variants.length, availability }
  return {
    script: [{
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        description: p.short_description,
        image: p.images.map(i => abs(i.url)),
        sku: p.variants[0]?.sku,
        category: p.category.name,
        brand: { '@type': 'Brand', name: 'Byte3D' },
        offers,
      }),
    }],
  }
})
</script>

<template>
  <div v-if="data" class="container-page py-6 sm:py-10">
    <UiBreadcrumbs
      :items="[
        { label: 'Home', to: '/' },
        { label: product.category.name, to: `/categories/${product.category.slug}` },
        { label: product.name },
      ]"
    />

    <div class="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-14">
      <div class="lg:sticky lg:top-24 lg:self-start">
        <ProductGallery
          :images="product.images"
          :model-url="product.model_3d_url"
          :preview-text="previewText"
          :name="product.name"
        />
      </div>

      <div class="min-w-0">
        <NuxtLink :to="`/categories/${product.category.slug}`" class="text-sm font-medium text-accent-2 hover:underline">
          {{ product.category.name }}
        </NuxtLink>
        <h1 class="mt-1 text-3xl font-bold leading-tight sm:text-4xl">{{ product.name }}</h1>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <UiBadge v-if="salePercent" variant="sale">−{{ salePercent }}%</UiBadge>
          <UiBadge v-if="product.badges.includes('new')" variant="new">New</UiBadge>
          <UiBadge v-if="product.is_customizable" variant="customizable">Customizable</UiBadge>
        </div>

        <UiPrice class="mt-5" size="lg" :price="unitPrice" :compare-at="extras ? null : variant.compare_at_price" />
        <p v-if="extras" class="mt-1 text-xs text-muted">Includes {{ formatTaka(extras) }} for your customization.</p>
        <p class="mt-2 flex items-center gap-2 text-sm font-medium" :class="stock.tone" aria-live="polite">
          <span class="size-2 rounded-full" :class="stock.dot" /> {{ stock.label }}
        </p>

        <p class="mt-5 leading-relaxed text-muted">{{ product.short_description }}</p>

        <div class="mt-7 space-y-6">
          <ProductVariantPicker v-model="variantId" :variants="product.variants" />
          <ProductCustomizationFields v-if="product.customization_schema.length" v-model="custom" :schema="product.customization_schema" :show-errors="showErrors" />
        </div>

        <p v-if="readyText" class="mt-6 flex items-center gap-2 text-sm text-muted">
          <UiIcon name="clock" :size="18" class="text-accent" /> {{ readyText }} <span aria-hidden="true">·</span> then delivered across Bangladesh
        </p>

        <div class="mt-6 rounded-lg border border-border bg-surface p-4 sm:p-5">
          <div class="flex items-center gap-4">
            <div class="flex items-center rounded-md border border-border bg-surface-2" role="group" aria-label="Quantity">
              <button
                type="button"
                class="grid size-11 place-items-center rounded-l-md text-muted transition hover:text-text disabled:opacity-40"
                aria-label="Decrease quantity"
                :disabled="quantity <= 1"
                @click="quantity--"
              >
                <UiIcon name="minus" :size="18" />
              </button>
              <output class="w-10 text-center font-semibold tabular-nums" aria-live="polite">{{ quantity }}</output>
              <button
                type="button"
                class="grid size-11 place-items-center rounded-r-md text-muted transition hover:text-text disabled:opacity-40"
                aria-label="Increase quantity"
                :disabled="quantity >= maxQuantity"
                @click="quantity++"
              >
                <UiIcon name="plus" :size="18" />
              </button>
            </div>
            <p class="text-sm text-muted">
              Total <strong class="font-display text-lg text-text">{{ formatTaka(unitPrice * quantity) }}</strong>
            </p>
          </div>

          <div class="mt-4 flex flex-col gap-3 sm:flex-row">
            <UiButton size="lg" class="flex-1" :disabled="!variant.in_stock" @click="addToCart">
              <UiIcon name="cart" :size="18" /> {{ variant.in_stock ? 'Add to cart' : 'Out of stock' }}
            </UiButton>
            <UiButton variant="secondary" size="lg" class="flex-1" :disabled="!variant.in_stock" @click="buyNow">
              Buy now
            </UiButton>
          </div>

          <p v-if="justAdded" class="mt-3 flex items-center gap-2 text-sm font-medium text-success" role="status">
            <UiIcon name="check" :size="16" /> Added to your cart.
            <NuxtLink to="/cart" class="underline hover:text-accent">View cart</NuxtLink>
          </p>
          <p v-else-if="showErrors && Object.keys(customErrors).length" class="mt-3 flex items-center gap-2 text-sm text-danger" role="alert">
            <UiIcon name="alert" :size="16" /> Please finish the details above first.
          </p>

          <ul class="mt-4 grid gap-2 border-t border-border pt-4 text-sm text-muted sm:grid-cols-2">
            <li class="flex items-center gap-2"><UiIcon name="wallet" :size="16" class="text-accent" /> Cash on delivery</li>
            <li class="flex items-center gap-2"><UiIcon name="truck" :size="16" class="text-accent" /> Delivery across Bangladesh</li>
          </ul>
          <p class="mt-3 text-xs text-muted">
            Prefer to chat?
            <a :href="fb" target="_blank" rel="noopener noreferrer" class="font-medium text-accent-2 hover:underline">Order on Facebook</a>
            or <a :href="tel" class="font-medium text-accent-2 hover:underline">call {{ phone }}</a>.
          </p>
        </div>

        <dl class="mt-8 divide-y divide-border rounded-lg border border-border bg-surface text-sm">
          <div v-for="s in specs" :key="s.label" class="flex justify-between gap-4 px-4 py-3">
            <dt class="text-muted">{{ s.label }}</dt>
            <dd class="text-right font-medium">{{ s.value }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <section class="mt-14 max-w-3xl" aria-labelledby="desc-heading">
      <h2 id="desc-heading" class="text-xl font-bold sm:text-2xl">About this product</h2>
      <!-- eslint-disable-next-line vue/no-v-html -- trusted HTML authored by admins in Filament -->
      <div class="description mt-4 space-y-4 leading-relaxed text-muted" v-html="product.description_html" />
    </section>

    <section v-if="product.related.length" class="mt-16" aria-labelledby="related-heading">
      <h2 id="related-heading" class="text-xl font-bold sm:text-2xl">You may also like</h2>
      <ul class="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
        <li v-for="p in product.related" :key="p.id"><ProductCard :product="p" /></li>
      </ul>
    </section>

    <!-- Mobile sticky order bar -->
    <div class="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <div class="flex items-center gap-3">
        <div class="min-w-0 flex-1">
          <p class="truncate text-xs text-muted">{{ product.name }}</p>
          <p class="font-display text-lg font-bold text-accent">{{ formatTaka(unitPrice * quantity) }}</p>
        </div>
        <UiButton :disabled="!variant.in_stock" @click="addToCart">
          <UiIcon name="cart" :size="18" /> {{ justAdded ? 'Added' : 'Add to cart' }}
        </UiButton>
      </div>
    </div>
    <div class="h-16 md:hidden" aria-hidden="true" />
  </div>
</template>
