<script setup lang="ts">
const cart = useCartStore()
// The saved cart only exists in the browser: render the badge after it has loaded so SSR and hydration agree.
const label = computed(() => (cart.hydrated && cart.count ? `Cart, ${cart.count} item${cart.count === 1 ? '' : 's'}` : 'Cart'))
</script>

<template>
  <NuxtLink
    to="/cart"
    class="relative grid size-11 place-items-center rounded-md text-muted transition hover:bg-surface-2 hover:text-text"
    :aria-label="label"
  >
    <UiIcon name="cart" :size="22" />
    <span
      v-if="cart.hydrated && cart.count"
      class="absolute right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold leading-5 text-on-accent"
      aria-hidden="true"
    >
      {{ cart.count > 99 ? '99+' : cart.count }}
    </span>
  </NuxtLink>
</template>
