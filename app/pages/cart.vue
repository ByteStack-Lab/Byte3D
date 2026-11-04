<script setup lang="ts">
const { t } = useLocale()
useSeoMeta({ title: () => t('cart.seoTitle'), robots: 'noindex' })

const cart = useCartStore()
const { priced, pending, error } = useCartPricing()

const couponInput = ref(cart.couponCode)
watch(() => cart.couponCode, (code) => { couponInput.value = code })

/** The server's price for each stored line, once the answer matches the cart (same order, same length). */
const serverLines = computed(() => (priced.value && priced.value.lines.length === cart.lines.length ? priced.value.lines : null))
const messagesFor = (variantId: number) => priced.value?.messages.filter(m => m.variant_id === variantId) ?? []
const couponMessage = computed(() => priced.value?.messages.find(m => m.type === 'invalid_coupon')?.message ?? null)

const hasUnavailable = computed(() => !!serverLines.value?.some(l => !l.available))
const canCheckout = computed(() => !!priced.value && !pending.value && !hasUnavailable.value && !error.value)

function applyCoupon() {
  cart.couponCode = couponInput.value.trim().toUpperCase()
}
function removeCoupon() {
  cart.couponCode = ''
}
function removeUnavailable() {
  const keys = cart.lines.filter((_, i) => serverLines.value?.[i] && !serverLines.value[i]!.available).map(l => l.key)
  keys.forEach(k => cart.remove(k))
}
</script>

<template>
  <div class="container-page py-8 sm:py-12">
    <h1 class="text-3xl font-bold sm:text-4xl">{{ t('cart.seoTitle') }}</h1>

    <UiEmptyState
      v-if="cart.hydrated && cart.isEmpty"
      class="mt-8"
      icon="cart"
      :title="t('cart.empty')"
      :description="t('cart.emptyHint')"
    >
      <UiButton to="/shop">{{ t('cart.browse') }}</UiButton>
      <UiButton to="/custom-keyring" variant="secondary">{{ t('cart.designKeyring') }}</UiButton>
    </UiEmptyState>

    <div v-else class="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <section :aria-label="t('cart.itemsLabel')">
        <p v-if="error" class="mb-4 flex items-start gap-2 rounded-lg border border-danger/50 bg-danger/10 p-4 text-sm text-danger" role="alert">
          <UiIcon name="alert" :size="18" class="mt-0.5" /> {{ error.message }}
        </p>

        <ul class="space-y-4">
          <li
            v-for="(line, i) in cart.lines"
            :key="line.key"
            class="rounded-lg border bg-surface p-4"
            :class="serverLines && !serverLines[i]!.available ? 'border-danger/60' : 'border-border'"
          >
            <div class="flex gap-4">
              <NuxtLink :to="`/products/${line.productSlug}`" class="shrink-0">
                <NuxtImg
                  v-if="line.image"
                  :src="line.image.url"
                  :alt="line.image.alt"
                  :width="96"
                  :height="96"
                  class="size-20 rounded-md bg-surface-2 object-cover sm:size-24"
                />
              </NuxtLink>

              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <NuxtLink :to="`/products/${line.productSlug}`" class="font-semibold hover:text-accent">{{ line.productName }}</NuxtLink>
                    <p class="text-sm text-muted">{{ line.variantName }}</p>
                    <p v-for="text in line.customizationLabels" :key="text" class="mt-0.5 break-words text-sm text-accent-2">{{ text }}</p>
                  </div>
                  <button
                    type="button"
                    class="grid size-10 shrink-0 place-items-center rounded-md text-muted transition hover:bg-surface-2 hover:text-danger"
                    :aria-label="t('cart.removeItem', { name: line.productName })"
                    @click="cart.remove(line.key)"
                  >
                    <UiIcon name="trash" :size="18" />
                  </button>
                </div>

                <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center rounded-md border border-border bg-surface-2" role="group" :aria-label="t('cart.qtyOf', { name: line.productName })">
                    <button
                      type="button"
                      class="grid size-10 place-items-center rounded-l-md text-muted transition hover:text-text disabled:opacity-40"
                      :aria-label="t('product.decrease')"
                      :disabled="line.quantity <= 1"
                      @click="cart.setQuantity(line.key, line.quantity - 1)"
                    >
                      <UiIcon name="minus" :size="16" />
                    </button>
                    <output class="w-9 text-center text-sm font-semibold tabular-nums" aria-live="polite">{{ line.quantity }}</output>
                    <button
                      type="button"
                      class="grid size-10 place-items-center rounded-r-md text-muted transition hover:text-text disabled:opacity-40"
                      :aria-label="t('product.increase')"
                      :disabled="line.quantity >= MAX_LINE_QUANTITY"
                      @click="cart.setQuantity(line.key, line.quantity + 1)"
                    >
                      <UiIcon name="plus" :size="16" />
                    </button>
                  </div>

                  <div class="text-right">
                    <template v-if="serverLines">
                      <p v-if="serverLines[i]!.available" class="font-display text-lg font-bold tabular-nums">{{ formatTaka(serverLines[i]!.line_total) }}</p>
                      <p v-if="serverLines[i]!.available && line.quantity > 1" class="text-xs text-muted">{{ t('cart.each', { price: formatTaka(serverLines[i]!.unit_price) }) }}</p>
                    </template>
                    <UiSkeleton v-else class="ml-auto h-6 w-20" />
                  </div>
                </div>

                <ul v-if="messagesFor(line.variantId).length" class="mt-3 space-y-1">
                  <li
                    v-for="(m, k) in messagesFor(line.variantId)"
                    :key="k"
                    class="flex items-start gap-2 text-sm"
                    :class="m.type === 'price_changed' ? 'text-accent' : 'text-danger'"
                    role="alert"
                  >
                    <UiIcon name="alert" :size="16" class="mt-0.5" /> {{ m.message }}
                  </li>
                </ul>
              </div>
            </div>
          </li>
        </ul>

        <button v-if="hasUnavailable" type="button" class="mt-4 text-sm font-medium text-danger underline" @click="removeUnavailable">
          {{ t('cart.removeUnavailable') }}
        </button>
      </section>

      <aside class="rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-24" :aria-label="t('cart.orderSummary')">
        <h2 class="text-lg font-bold">{{ t('cart.summary') }}</h2>

        <form class="mt-4" @submit.prevent="applyCoupon">
          <label for="coupon" class="mb-1.5 block text-sm font-medium">{{ t('cart.coupon') }}</label>
          <div v-if="priced?.coupon" class="flex items-center justify-between rounded-md border border-success/50 bg-success/10 px-3 py-2 text-sm">
            <span class="flex items-center gap-2 font-semibold text-success"><UiIcon name="tag" :size="16" /> {{ priced.coupon.code }}</span>
            <button type="button" class="text-xs text-muted underline hover:text-text" @click="removeCoupon">{{ t('cart.remove') }}</button>
          </div>
          <div v-else class="flex gap-2">
            <input
              id="coupon"
              v-model="couponInput"
              type="text"
              autocomplete="off"
              autocapitalize="characters"
              placeholder="WELCOME10"
              :aria-invalid="!!couponMessage"
              aria-describedby="coupon-msg"
              class="h-11 min-w-0 flex-1 rounded-md border bg-surface-2 px-3 text-sm uppercase placeholder:normal-case placeholder:text-muted/70 focus:outline-none"
              :class="couponMessage ? 'border-danger' : 'border-border focus:border-accent'"
            >
            <UiButton type="submit" variant="secondary" :disabled="!couponInput.trim()">{{ t('filter.apply') }}</UiButton>
          </div>
          <p id="coupon-msg" class="mt-1 min-h-4 text-xs text-danger" role="alert">{{ couponMessage }}</p>
        </form>

        <dl class="mt-3 space-y-2 border-t border-border pt-4 text-sm" :class="pending && 'opacity-60'">
          <div class="flex justify-between">
            <dt class="text-muted">{{ t('cart.subtotal') }}</dt>
            <dd class="tabular-nums">{{ priced ? formatTaka(priced.subtotal) : '—' }}</dd>
          </div>
          <div v-if="priced && priced.discount" class="flex justify-between text-success">
            <dt>{{ t('cart.discount') }}</dt>
            <dd class="tabular-nums">−{{ formatTaka(priced.discount) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted">{{ t('cart.shipping') }}</dt>
            <dd class="text-muted">{{ t('cart.shippingAtCheckout') }}</dd>
          </div>
          <div class="flex items-baseline justify-between border-t border-border pt-3 text-base font-bold">
            <dt>{{ t('cart.total') }}</dt>
            <dd class="font-display text-xl tabular-nums">{{ priced ? formatTaka(priced.total) : '—' }}</dd>
          </div>
        </dl>

        <UiButton to="/checkout" size="lg" block class="mt-5" :disabled="!canCheckout">
          {{ t('cart.checkout') }}
          <UiIcon name="arrow-right" :size="18" />
        </UiButton>
        <p v-if="hasUnavailable" class="mt-2 text-xs text-danger">{{ t('cart.removeToContinue') }}</p>

        <ul class="mt-5 space-y-2 border-t border-border pt-4 text-xs text-muted">
          <li class="flex items-center gap-2"><UiIcon name="wallet" :size="14" class="text-accent" /> {{ t('cart.payCod') }}</li>
          <li class="flex items-center gap-2"><UiIcon name="truck" :size="14" class="text-accent" /> {{ t('footer.delivery') }}</li>
        </ul>
      </aside>
    </div>
  </div>
</template>
