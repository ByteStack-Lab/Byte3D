<script setup lang="ts">
import type { Category } from '~/types/api'

defineProps<{ categories: Category[] }>()
const { t } = useLocale()
const open = defineModel<boolean>('open', { required: true })
const search = defineModel<string>('search', { default: '' })
const emit = defineEmits<{ search: [] }>()

const panel = ref<HTMLElement | null>(null)
useDialog(panel, open, () => { open.value = false })
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-200"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" @click="open = false" />
    </Transition>
    <!-- Slides in from the left edge and back out the same way. -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      enter-from-class="-translate-x-full"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="open"
        ref="panel"
        role="dialog"
        aria-modal="true"
        data-lenis-prevent
        :aria-label="t('nav.menu')"
        class="fixed inset-y-0 left-0 z-50 flex w-[min(22rem,88vw)] flex-col border-r border-border bg-bg shadow-2xl will-change-transform"
      >
        <div class="flex h-16 items-center justify-between border-b border-border px-4">
          <LayoutAppLogo />
          <button type="button" class="grid size-11 place-items-center rounded-md text-muted hover:text-text" :aria-label="t('nav.closeMenu')" @click="open = false">
            <UiIcon name="close" :size="22" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-4 py-5">
          <form role="search" class="relative" @submit.prevent="emit('search')">
            <label for="mobile-search" class="sr-only">{{ t('search.products') }}</label>
            <UiIcon name="search" :size="18" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="mobile-search"
              v-model="search"
              type="search"
              :placeholder="t('search.placeholder')"
              class="h-12 w-full rounded-md border border-border bg-surface-2 pl-10 pr-4 text-base placeholder:text-muted/80 focus:border-accent focus:outline-none"
            >
          </form>

          <nav class="mt-6" :aria-label="t('nav.mobile')">
            <ul class="space-y-1 text-lg font-medium">
              <li><NuxtLink to="/shop" class="flex min-h-12 items-center rounded-md px-3 hover:bg-surface-2">{{ t('nav.shopAll') }}</NuxtLink></li>
              <li><NuxtLink to="/custom-keyring" class="flex min-h-12 items-center rounded-md px-3 hover:bg-surface-2">{{ t('nav.customKeyring') }}</NuxtLink></li>
              <li><NuxtLink to="/custom-order" class="flex min-h-12 items-center rounded-md px-3 hover:bg-surface-2">{{ t('nav.customOrder') }}</NuxtLink></li>
              <li><NuxtLink to="/track" class="flex min-h-12 items-center rounded-md px-3 hover:bg-surface-2">{{ t('nav.track') }}</NuxtLink></li>
              <li><NuxtLink to="/account" class="flex min-h-12 items-center rounded-md px-3 hover:bg-surface-2">{{ t('nav.account') }}</NuxtLink></li>
            </ul>

            <p class="mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted">{{ t('nav.categories') }}</p>
            <ul class="mt-2 space-y-0.5">
              <li v-for="c in categories" :key="c.slug">
                <NuxtLink
                  :to="`/categories/${c.slug}`"
                  class="flex min-h-11 items-center justify-between rounded-md px-3 text-base text-text/90 hover:bg-surface-2 hover:text-accent"
                >
                  {{ c.name }}
                  <UiIcon name="chevron-right" :size="16" class="text-muted" />
                </NuxtLink>
              </li>
            </ul>
          </nav>
        </div>

        <div class="space-y-3 border-t border-border p-4">
          <LayoutThemeToggle variant="segmented" />
          <LayoutLangToggle block />
          <UiButton href="tel:+8801812209019" variant="secondary" block>
            <UiIcon name="phone" :size="18" /> {{ t('call.now', { phone: '+880 1812-209019' }) }}
          </UiButton>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
