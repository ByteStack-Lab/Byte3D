<script setup lang="ts">
const cart = useCartStore()
const { t, tp } = useLocale()
// The saved cart only exists in the browser: render the badge after it has loaded so SSR and hydration agree.
/** Badge pops (and the icon hops) when an item is added. With a fly-to-cart clone in the air, it waits for the landing. */
const bump = ref(false)
let bumpTimer: ReturnType<typeof setTimeout> | undefined
function doBump() {
  bump.value = false
  void nextTick(() => {
    bump.value = true
    clearTimeout(bumpTimer)
    bumpTimer = setTimeout(() => { bump.value = false }, 600)
  })
}
watch(() => cart.count, (now, before) => {
  if (now > before && !flyState.pending) doBump()
})
onMounted(() => window.addEventListener('b3d:cart-landed', doBump))
onBeforeUnmount(() => {
  window.removeEventListener('b3d:cart-landed', doBump)
  clearTimeout(bumpTimer)
})

const label = computed(() => (cart.hydrated && cart.count ? tp('cart.labelCount', cart.count) : t('cart.label')))
</script>

<template>
  <NuxtLink
    to="/cart"
    class="relative grid size-11 place-items-center rounded-md text-muted transition hover:bg-surface-2 hover:text-text"
    data-cart-target
    :aria-label="label"
  >
    <UiIcon name="cart" :size="22" :class="bump && 'cart-bump'" />
    <span
      v-if="cart.hydrated && cart.count"
      class="absolute right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold leading-5 text-on-accent"
      :class="bump && 'badge-pop'"
      aria-hidden="true"
    >
      {{ cart.count > 99 ? '99+' : cart.count }}
    </span>
  </NuxtLink>
</template>
