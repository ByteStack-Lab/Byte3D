<script setup lang="ts">
const { data: categories } = await useCategories()
const { t } = useLocale()
const route = useRoute()
const router = useRouter()

const menuOpen = ref(false)
const catOpen = ref(false)
const catWrap = ref<HTMLElement | null>(null)
const search = ref('')

function submitSearch() {
  const q = search.value.trim()
  menuOpen.value = false
  router.push({ path: '/shop', query: q ? { q } : {} })
}

function onDocClick(e: MouseEvent) {
  if (catOpen.value && catWrap.value && !catWrap.value.contains(e.target as Node)) catOpen.value = false
}
function onDocKey(e: KeyboardEvent) {
  if (e.key === 'Escape') catOpen.value = false
}
// Header pill gets a bit more presence once the page has scrolled (styles in motion.css).
const scrolled = ref(false)
function onScroll() {
  const v = window.scrollY > 12
  if (v !== scrolled.value) scrolled.value = v
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onDocKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onDocKey)
})

watch(() => route.fullPath, () => {
  menuOpen.value = false
  catOpen.value = false
})

// Keep the header search box in sync when the user lands on /shop?q=…
watch(() => route.query.q, (q) => { search.value = typeof q === 'string' ? q : '' }, { immediate: true })

const linkClass = 'rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:text-text'
</script>

<template>
  <!-- Floating pill: as wide as the page container, not the full screen. The page scrolls under its rounded edges. -->
  <header class="container-page sticky top-0 z-40 pt-3">
    <div class="header-pill flex h-16 items-center gap-3 rounded-2xl border border-border/70 bg-bg/80 px-3 shadow-lg shadow-black/10 backdrop-blur-md sm:gap-4 sm:px-5 lg:rounded-full lg:pl-6 lg:pr-3" :data-scrolled="scrolled">
      <LayoutAppLogo />

      <nav class="ml-6 hidden items-center gap-1 lg:flex" :aria-label="t('nav.main')">
        <NuxtLink to="/shop" :class="linkClass" active-class="!text-text">{{ t('nav.shop') }}</NuxtLink>

        <div ref="catWrap" class="relative">
          <button
            type="button"
            :class="linkClass"
            class="inline-flex items-center gap-1"
            :aria-expanded="catOpen"
            aria-haspopup="true"
            aria-controls="cat-menu"
            @click="catOpen = !catOpen"
          >
            {{ t('nav.categories') }}
            <UiIcon name="chevron-down" :size="16" class="transition" :class="catOpen && 'rotate-180'" />
          </button>
          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            leave-active-class="transition duration-100 ease-in"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <ul
              v-if="catOpen"
              id="cat-menu"
              class="absolute left-0 top-full mt-2 w-64 rounded-lg border border-border bg-surface p-2 shadow-2xl shadow-black/50"
            >
              <li v-for="c in categories?.data" :key="c.slug">
                <NuxtLink
                  :to="`/categories/${c.slug}`"
                  class="flex items-center justify-between rounded-md px-3 py-2 text-sm transition hover:bg-surface-2 hover:text-accent"
                >
                  {{ c.name }}
                  <span class="text-xs text-muted">{{ c.product_count }}</span>
                </NuxtLink>
              </li>
            </ul>
          </Transition>
        </div>

        <NuxtLink to="/custom-keyring" :class="linkClass" active-class="!text-text">{{ t('nav.customKeyring') }}</NuxtLink>
        <NuxtLink to="/custom-order" :class="linkClass" active-class="!text-text">{{ t('nav.customOrder') }}</NuxtLink>
      </nav>

      <form class="relative ml-auto hidden max-w-xs flex-1 md:block" role="search" @submit.prevent="submitSearch">
        <label for="header-search" class="sr-only">{{ t('search.products') }}</label>
        <UiIcon name="search" :size="18" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id="header-search"
          v-model="search"
          type="search"
          :placeholder="t('search.headerPlaceholder')"
          class="h-10 w-full rounded-full border border-border bg-surface-2 pl-10 pr-4 text-sm placeholder:text-muted/80 transition focus:border-accent focus:outline-none"
        >
      </form>

      <div class="ml-auto flex items-center gap-1 md:ml-0">
        <NuxtLink
          to="/shop"
          class="grid size-11 place-items-center rounded-md text-muted transition hover:text-text md:hidden"
          :aria-label="t('search.products')"
        >
          <UiIcon name="search" :size="22" />
        </NuxtLink>
        <!-- Small screens switch language from the side menu instead. -->
        <LayoutLangToggle class="max-lg:hidden" />
        <LayoutThemeToggle />
        <NuxtLink
          to="/account"
          class="grid size-11 place-items-center rounded-md text-muted transition hover:bg-surface-2 hover:text-text"
          :aria-label="t('nav.account')"
        >
          <UiIcon name="user" :size="22" />
        </NuxtLink>
        <LayoutCartButton />
        <button
          type="button"
          class="mr-1.5 grid size-11 place-items-center rounded-md text-text transition hover:bg-surface-2 lg:hidden"
          :aria-label="t('nav.openMenu')"
          aria-haspopup="dialog"
          @click="menuOpen = true"
        >
          <UiIcon name="menu" :size="24" />
        </button>
      </div>
    </div>

    <LayoutMobileNav v-model:open="menuOpen" v-model:search="search" :categories="categories?.data ?? []" @search="submitSearch" />
  </header>
</template>
