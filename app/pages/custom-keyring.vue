<script setup lang="ts">
import type { ProductDetail } from '~/types/api'

useSeoMeta({
  title: 'Custom name keyring — design it online',
  description: 'Type a name, pick a font and colours, and see your 3D printed keyring or bag tag live. Made in Bangladesh, cash on delivery.',
  ogTitle: 'Design your custom name keyring — Byte3D',
})
useCanonical()

const { t } = useLocale()
const cart = useCartStore()
const { track } = useTracking()
const { data: settings } = await useSettings()
const s = computed(() => settings.value?.data)

// The keyring is a normal catalogue product: types and colours are its variants, fonts and letter colours are its choice fields.
const { data } = await useApi<{ data: ProductDetail }>(`/products/${KEYRING_PRODUCT_SLUG}`, { key: 'keyring-product' })
const product = computed(() => data.value?.data ?? null)
const variants = computed(() => product.value?.variants ?? [])
const schema = computed(() => product.value?.customization_schema ?? [])

const lineFields = computed(() => schema.value.filter(f => f.type === 'text' && /^line_\d+$/.test(f.key)))
const maxLines = computed(() => Math.max(1, lineFields.value.length))
const maxChars = computed(() => lineFields.value[0]?.max ?? 14)
const fonts = computed(() => schema.value.find(f => f.key === 'font')?.options ?? [])
const letterColors = computed(() => schema.value.find(f => f.key === 'letter_color')?.options ?? [])

/** "Keyring", "Bag tag": the distinct variant sizes, each at its lowest price. */
const types = computed(() => {
  const seen = new Map<string, number>()
  for (const v of variants.value) {
    const name = v.size ?? ''
    seen.set(name, Math.min(seen.get(name) ?? Infinity, v.price))
  }
  return [...seen].map(([name, price]) => ({ name, price }))
})

// ---- Builder state -------------------------------------------------------------------------
const first = variants.value.find(v => v.is_default) ?? variants.value[0]
const type = ref(first?.size ?? '')
const keyColor = ref(first?.color ?? '')
const lines = ref<string[]>([''])
const badChar = ref<number | null>(null)
const fontId = ref(fonts.value[0]?.value ?? '')
const letterColor = ref((letterColors.value.find(o => o.value === 'White') ?? letterColors.value[0])?.value ?? '')
const qty = ref(1)

const keyColors = computed(() => {
  const seen = new Map<string, string>()
  for (const v of variants.value) if (v.size === type.value && v.color) seen.set(v.color, v.color_hex ?? '#888')
  return [...seen].map(([name, hex]) => ({ name, hex }))
})
// A type may not offer the colour that was picked for the other one.
watch(type, () => { if (!keyColors.value.some(c => c.name === keyColor.value)) keyColor.value = keyColors.value[0]?.name ?? '' })

const variant = computed(() => variants.value.find(v => v.size === type.value && v.color === keyColor.value) ?? variants.value.find(v => v.size === type.value) ?? variants.value[0])
const shape = computed(() => shapeOf(type.value))
const keyHex = computed(() => keyColors.value.find(c => c.name === keyColor.value)?.hex ?? '#000')
const letterHex = computed(() => letterColors.value.find(o => o.value === letterColor.value)?.hex ?? '#fff')
const fontLabel = computed(() => fonts.value.find(f => f.value === fontId.value)?.label ?? fontId.value)

const filled = computed(() => lines.value.map(l => l.trim()).filter(Boolean))
const hasText = computed(() => filled.value.length > 0)
const previewLines = computed(() => (hasText.value ? filled.value : ['Your Name']))
const size = computed(() => keyringSizeCm(previewLines.value, shape.value))
const sameColor = computed(() => keyColor.value.toLowerCase() === letterColor.value.toLowerCase())

function onInput(i: number, e: Event) {
  const el = e.target as HTMLInputElement
  const clean = sanitizeKeyringText(el.value)
  badChar.value = /[^A-Za-z0-9 ]/.test(el.value) ? i : null
  el.value = clean
  lines.value[i] = clean
}
function addLine() {
  if (lines.value.length < maxLines.value) lines.value.push('')
  nextTick(() => document.getElementById(`kr-line-${lines.value.length - 1}`)?.focus())
}
function removeLine(i: number) {
  lines.value.splice(i, 1)
  badChar.value = null
}
function step(by: number) {
  qty.value = Math.min(MAX_LINE_QUANTITY, Math.max(1, qty.value + by))
}

// What the cart and the server get: one value per field of the product's customization schema.
const values = computed(() => {
  const out: Record<string, string> = {}
  filled.value.slice(0, maxLines.value).forEach((text, i) => { out[`line_${i + 1}`] = text })
  if (fontId.value) out.font = fontId.value
  if (letterColor.value) out.letter_color = letterColor.value
  return out
})
// Display only: the cart page and checkout show the server's price.
const unit = computed(() => (variant.value?.price ?? 0) + customizationExtras(schema.value, values.value))
const total = computed(() => unit.value * qty.value)
const canOrder = computed(() => hasText.value && !!variant.value?.in_stock)

const added = ref(false)
function addToCart(): boolean {
  if (!canOrder.value || !product.value || !variant.value) return false
  cart.add({
    variantId: variant.value.id,
    productSlug: product.value.slug,
    productName: product.value.name,
    variantName: variant.value.name,
    image: product.value.thumbnail,
    unitPrice: unit.value,
    quantity: qty.value,
    customization: values.value,
    customizationLabels: describeCustomization(schema.value, values.value, t),
  })
  track('AddToCart', { name: product.value.name, ids: [variant.value.sku], value: total.value, quantity: qty.value })
  added.value = true
  return true
}
async function buyNow() {
  if (addToCart()) await navigateTo('/checkout')
}
// Any change starts a new design: the "added" note no longer describes it.
watch([lines, type, keyColor, letterColor, fontId, qty], () => { added.value = false }, { deep: true })

const input = 'h-12 w-full rounded-md border border-border bg-surface-2 px-4 text-base placeholder:text-muted/70 transition focus:border-accent focus:outline-none'
</script>

<template>
  <div v-if="product">
    <div class="container-page py-6 sm:py-10">
      <UiBreadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Custom Keyring' }]" />

      <div class="mt-5 max-w-2xl">
        <h1 class="text-3xl font-bold sm:text-5xl">Make your keyring</h1>
        <p class="mt-3 text-base text-muted sm:text-lg">
          Type a name, pick a font and colours — watch it take shape. We 3D print it and deliver across Bangladesh.
        </p>
      </div>

      <div class="mt-6 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-12">
        <!-- Live preview: pinned under the header on mobile so changes stay visible while scrolling -->
        <div class="sticky top-16 z-30 -mx-4 bg-bg/95 px-4 pb-3 pt-2 backdrop-blur sm:-mx-6 sm:px-6 lg:top-24 lg:z-auto lg:mx-0 lg:self-start lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <KeyringPreview
            :lines="previewLines"
            :font-id="fontId"
            :key-color="keyHex"
            :letter-color="letterHex"
            :type="shape"
          />
          <div class="mt-2 flex items-center justify-between gap-3 px-1 text-xs text-muted sm:text-sm lg:mt-3">
            <span class="inline-flex items-center gap-1.5">
              <UiIcon name="ruler" :size="15" /> About {{ size.w }} × {{ size.h }} cm
            </span>
            <span class="font-display font-semibold text-text">{{ formatTaka(unit) }} <span class="font-sans font-normal text-muted">each</span></span>
          </div>
        </div>

        <!-- Options -->
        <div class="mt-6 space-y-9 lg:mt-0">
          <div class="flex gap-3 rounded-lg border border-border bg-surface p-4">
            <span class="grid size-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent"><UiIcon name="truck" :size="20" /></span>
            <div class="text-sm">
              <p class="font-semibold">Ordering a few? One delivery charge for all.</p>
              <p class="mt-0.5 text-muted">
                <template v-if="s">Inside Dhaka {{ formatTaka(s.shipping.inside_dhaka) }} · Outside Dhaka {{ formatTaka(s.shipping.outside_dhaka) }} · </template>Cash on delivery
              </p>
            </div>
          </div>

          <!-- 1. Name -->
          <section aria-labelledby="kr-h-name">
            <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
              <h2 id="kr-h-name" class="flex items-center gap-3 text-lg font-semibold whitespace-nowrap">
                <span class="grid size-8 place-items-center rounded-full bg-accent/15 font-display text-sm font-bold text-accent">1</span>
                Write the name
              </h2>
              <div role="radiogroup" aria-label="Product type" class="inline-flex rounded-full border border-border bg-surface-2 p-1">
                <label v-for="ty in types" :key="ty.name" class="cursor-pointer">
                  <input v-model="type" type="radio" name="kr-type" :value="ty.name" class="peer sr-only">
                  <span class="block min-h-9 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-muted transition peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent">{{ ty.name }}<span class="ml-1.5 text-xs font-normal opacity-80">{{ formatTaka(ty.price) }}</span></span>
                </label>
              </div>
            </div>

            <div class="mt-4 space-y-3">
              <div v-for="(_, i) in lines" :key="i">
                <div class="flex items-center gap-2">
                  <div class="relative flex-1">
                    <label :for="`kr-line-${i}`" class="sr-only">Line {{ i + 1 }}</label>
                    <input
                      :id="`kr-line-${i}`"
                      :value="lines[i]"
                      type="text"
                      :maxlength="maxChars"
                      autocomplete="off"
                      autocapitalize="words"
                      spellcheck="false"
                      :placeholder="i === 0 ? 'Type a name, e.g. Tanvir' : `Line ${i + 1}`"
                      :aria-describedby="i === 0 ? 'kr-hint' : undefined"
                      :class="[input, 'pr-14', badChar === i && 'border-danger']"
                      @input="onInput(i, $event)"
                    >
                    <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted">{{ lines[i]?.length ?? 0 }}/{{ maxChars }}</span>
                  </div>
                  <button
                    v-if="i > 0"
                    type="button"
                    class="grid size-12 shrink-0 place-items-center rounded-md border border-border text-muted transition hover:border-danger/60 hover:text-danger"
                    :aria-label="`Remove line ${i + 1}`"
                    @click="removeLine(i)"
                  >
                    <UiIcon name="close" :size="18" />
                  </button>
                </div>
              </div>

              <button
                v-if="lines.length < maxLines"
                type="button"
                class="flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm font-medium text-muted transition hover:border-accent/60 hover:text-accent"
                @click="addLine"
              >
                + Add line {{ lines.length + 1 }}
              </button>

              <p id="kr-hint" class="text-xs" :class="badChar !== null ? 'text-danger' : 'text-muted'" aria-live="polite">
                {{ badChar !== null ? 'Only English letters and numbers can be printed.' : `Up to ${maxLines} lines · English letters and numbers only` }}
              </p>
            </div>
          </section>

          <!-- 2. Font -->
          <section aria-labelledby="kr-h-font">
            <div class="flex items-baseline justify-between gap-3">
              <h2 id="kr-h-font" class="flex items-center gap-3 text-lg font-semibold">
                <span class="grid size-8 place-items-center rounded-full bg-accent/15 font-display text-sm font-bold text-accent">2</span>
                Pick a font
              </h2>
              <span class="text-sm text-muted">{{ fontLabel }}</span>
            </div>
            <fieldset class="mt-4">
              <legend class="sr-only">Font</legend>
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <label
                  v-for="f in fonts"
                  :key="f.value"
                  class="group relative block cursor-pointer rounded-lg border border-border bg-surface p-3 transition hover:border-muted has-[:checked]:border-accent has-[:checked]:shadow-glow has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
                >
                  <input v-model="fontId" type="radio" name="kr-font" :value="f.value" class="sr-only">
                  <span
:class="`kr-f-${f.value}`" class="block truncate py-1 leading-tight"
                    :style="{ fontSize: fontStyle(f.value).width > 0.7 ? '1.125rem' : '1.5rem' }">{{ filled[0] || 'Your Name' }}</span>
                  <span class="mt-1.5 block text-xs text-muted">{{ f.label }}</span>
                  <span class="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-accent text-on-accent opacity-0 transition group-has-[:checked]:opacity-100">
                    <UiIcon name="check" :size="12" />
                  </span>
                </label>
              </div>
            </fieldset>
          </section>

          <!-- 3. Colours -->
          <section aria-labelledby="kr-h-colour">
            <h2 id="kr-h-colour" class="flex items-center gap-3 text-lg font-semibold">
              <span class="grid size-8 place-items-center rounded-full bg-accent/15 font-display text-sm font-bold text-accent">3</span>
              Pick colours
            </h2>

            <div class="mt-4 space-y-5">
              <div>
                <div class="mb-2 flex items-baseline justify-between text-sm">
                  <span id="kr-l-key" class="font-medium">{{ type }} colour</span>
                  <span class="text-muted">{{ keyColor }}</span>
                </div>
                <div role="radiogroup" aria-labelledby="kr-l-key" class="flex flex-wrap gap-2">
                  <UiSwatch
                    v-for="c in keyColors"
                    :key="`k-${c.name}`"
                    :color="c.hex"
                    :label="c.name"
                    :size="44"
                    :selected="keyColor === c.name"
                    @click="keyColor = c.name"
                  />
                </div>
              </div>

              <div>
                <div class="mb-2 flex items-baseline justify-between text-sm">
                  <span id="kr-l-letter" class="font-medium">Letter colour</span>
                  <span class="text-muted">{{ letterColor }}</span>
                </div>
                <div role="radiogroup" aria-labelledby="kr-l-letter" class="flex flex-wrap gap-2">
                  <UiSwatch
                    v-for="c in letterColors"
                    :key="`l-${c.value}`"
                    :color="c.hex ?? '#888'"
                    :label="c.label"
                    :size="44"
                    :selected="letterColor === c.value"
                    @click="letterColor = c.value"
                  />
                </div>
                <p v-if="sameColor" class="mt-3 flex items-start gap-2 rounded-md bg-accent/10 p-3 text-sm text-accent" role="status">
                  <UiIcon name="info" :size="18" class="mt-0.5" />
                  Letters and {{ type.toLowerCase() }} are the same colour — the name will blend in. Pick a different letter colour.
                </p>
              </div>
            </div>
          </section>

          <!-- 4. Quantity -->
          <section aria-labelledby="kr-h-qty">
            <div class="flex items-center justify-between gap-3">
              <h2 id="kr-h-qty" class="flex items-center gap-3 text-lg font-semibold">
                <span class="grid size-8 place-items-center rounded-full bg-accent/15 font-display text-sm font-bold text-accent">4</span>
                How many
              </h2>
              <div class="inline-flex items-center rounded-full border border-border bg-surface-2">
                <button type="button" class="grid size-11 place-items-center rounded-full text-lg text-muted transition hover:text-text disabled:opacity-40" aria-label="Decrease quantity" :disabled="qty <= 1" @click="step(-1)">−</button>
                <output class="min-w-8 text-center font-display font-semibold tabular-nums" aria-live="polite">{{ qty }}</output>
                <button type="button" class="grid size-11 place-items-center rounded-full text-lg text-muted transition hover:text-text disabled:opacity-40" aria-label="Increase quantity" :disabled="qty >= MAX_LINE_QUANTITY" @click="step(1)">+</button>
              </div>
            </div>
            <p class="mt-2 text-sm text-muted">{{ formatTaka(unit) }} each · pay when it arrives.</p>
          </section>

          <!-- Summary -->
          <section aria-labelledby="kr-h-sum" class="rounded-lg border border-border bg-surface p-4 sm:p-5">
            <h2 id="kr-h-sum" class="flex items-center gap-2 text-sm font-semibold">
              <UiIcon name="sparkle" :size="16" class="text-accent" /> Your order
            </h2>
            <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-sm">
              <dt class="text-muted">Text</dt><dd class="truncate font-medium">{{ filled.join(' / ') || '—' }}</dd>
              <dt class="text-muted">Type</dt><dd class="font-medium">{{ type }}</dd>
              <dt class="text-muted">Font</dt><dd class="font-medium">{{ fontLabel }}</dd>
              <dt class="text-muted">Colours</dt><dd class="font-medium">{{ keyColor }} / {{ letterColor }} letters</dd>
              <dt class="text-muted">Quantity</dt><dd class="font-medium">{{ qty }}</dd>
            </dl>
            <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted">
              <li class="inline-flex items-center gap-1.5"><UiIcon name="cube" :size="15" class="text-accent-2" /> 3D printed in PLA</li>
              <li class="inline-flex items-center gap-1.5"><UiIcon name="clock" :size="15" class="text-accent-2" /> Ready in {{ product.production_days?.min ?? 2 }}–{{ product.production_days?.max ?? 4 }} days</li>
              <li class="inline-flex items-center gap-1.5"><UiIcon name="wallet" :size="15" class="text-accent-2" /> Cash on delivery</li>
            </ul>
            <p class="mt-3 text-xs text-muted">
              The preview is a close guide — we confirm the final design and price with you before printing.
            </p>
          </section>

          <p class="flex items-start gap-2 text-sm text-muted">
            <UiIcon name="facebook" :size="18" class="mt-0.5 text-accent-2" />
            <span>
              Need help with your design?
              <a :href="s?.socials.facebook ?? 'https://facebook.com/Byte3D'" target="_blank" rel="noopener noreferrer" class="text-accent-2 underline underline-offset-2">Message us on Facebook</a>
              and we’ll sort it out together.
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- Order bar -->
    <div class="sticky bottom-0 z-30 border-t border-border bg-bg/90 backdrop-blur-md">
      <div class="container-page flex items-center justify-between gap-4 py-3">
        <div class="min-w-0">
          <p class="font-display text-xl font-bold leading-none sm:text-2xl">{{ formatTaka(total) }}</p>
          <p class="mt-1 truncate text-xs text-muted" aria-live="polite">
            <template v-if="added">Added to your cart. <NuxtLink to="/cart" class="font-medium text-accent underline">View cart</NuxtLink></template>
            <template v-else>{{ hasText ? 'One delivery charge for all' : 'Write a name to continue' }}</template>
          </p>
        </div>
        <div class="flex shrink-0 gap-2">
          <UiButton variant="secondary" size="lg" class="hidden sm:inline-flex" :disabled="!canOrder" @click="buyNow">Buy now</UiButton>
          <UiButton size="lg" :disabled="!canOrder" @click="addToCart">
            <UiIcon name="cart" :size="18" /> Add to cart
          </UiButton>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="container-page py-20">
    <UiEmptyState icon="info" title="The keyring builder is not available right now" description="Please check back soon, or browse the rest of the shop.">
      <UiButton to="/shop">Browse the shop</UiButton>
      <UiButton variant="secondary" to="/custom-order">Request a custom print</UiButton>
    </UiEmptyState>
  </div>
</template>
