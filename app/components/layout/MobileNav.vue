<script setup lang="ts">
import type { Category } from '~/types/api'

defineProps<{ categories: Category[] }>()
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
    <Transition
      enter-active-class="transition duration-250 ease-out"
      enter-from-class="translate-x-full"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="open"
        ref="panel"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        class="fixed inset-y-0 right-0 z-50 flex w-[min(22rem,88vw)] flex-col border-l border-border bg-bg shadow-2xl"
      >
        <div class="flex h-16 items-center justify-between border-b border-border px-4">
          <LayoutAppLogo />
          <button type="button" class="grid size-11 place-items-center rounded-md text-muted hover:text-text" aria-label="Close menu" @click="open = false">
            <UiIcon name="close" :size="22" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-4 py-5">
          <form role="search" class="relative" @submit.prevent="emit('search')">
            <label for="mobile-search" class="sr-only">Search products</label>
            <UiIcon name="search" :size="18" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="mobile-search"
              v-model="search"
              type="search"
              placeholder="Search products…"
              class="h-12 w-full rounded-md border border-border bg-surface-2 pl-10 pr-4 text-base placeholder:text-muted/80 focus:border-accent focus:outline-none"
            >
          </form>

          <nav class="mt-6" aria-label="Mobile">
            <ul class="space-y-1 text-lg font-medium">
              <li><NuxtLink to="/shop" class="flex min-h-12 items-center rounded-md px-3 hover:bg-surface-2">Shop all</NuxtLink></li>
              <li><NuxtLink to="/custom-keyring" class="flex min-h-12 items-center rounded-md px-3 hover:bg-surface-2">Custom Keyring</NuxtLink></li>
              <li><NuxtLink to="/custom-order" class="flex min-h-12 items-center rounded-md px-3 hover:bg-surface-2">Custom Order</NuxtLink></li>
              <li><NuxtLink to="/track" class="flex min-h-12 items-center rounded-md px-3 hover:bg-surface-2">Track order</NuxtLink></li>
              <li><NuxtLink to="/account" class="flex min-h-12 items-center rounded-md px-3 hover:bg-surface-2">My account</NuxtLink></li>
            </ul>

            <p class="mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Categories</p>
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
          <UiButton href="tel:+8801812209019" variant="secondary" block>
            <UiIcon name="phone" :size="18" /> Call +880 1812-209019
          </UiButton>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
