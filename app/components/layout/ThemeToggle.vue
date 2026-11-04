<script setup lang="ts">
import type { ThemeResolved } from '~/composables/useTheme'

// `icon`: one button (header) — shows the mode you will switch TO.
// `segmented`: Light | Dark (mobile menu) — shows the mode you are in.
withDefaults(defineProps<{ variant?: 'icon' | 'segmented' }>(), { variant: 'icon' })

const { resolved, setTheme, toggle } = useTheme()
const { t } = useLocale()

const options = computed<{ value: ThemeResolved, label: string, icon: string }[]>(() => [
  { value: 'light', label: t('theme.light'), icon: 'sun' },
  { value: 'dark', label: t('theme.dark'), icon: 'moon' },
])
const target = computed(() => (resolved.value === 'light' ? 'dark' : 'light'))
const switchLabel = computed(() => t(target.value === 'dark' ? 'theme.switchToDark' : 'theme.switchToLight'))
</script>

<template>
  <!-- Client only: the device setting is unknown on the server, so this avoids a hydration mismatch. -->
  <ClientOnly>
    <button
      v-if="variant === 'icon'"
      type="button"
      class="grid size-11 place-items-center rounded-md text-muted transition hover:bg-surface-2 hover:text-text"
      :aria-label="switchLabel"
      :title="switchLabel"
      @click="toggle"
    >
      <UiIcon :name="target === 'dark' ? 'moon' : 'sun'" :size="20" />
    </button>

    <div v-else role="radiogroup" :aria-label="t('theme.label')" class="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface-2 p-1">
      <button
        v-for="o in options"
        :key="o.value"
        type="button"
        role="radio"
        :aria-checked="resolved === o.value"
        class="flex min-h-11 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition"
        :class="resolved === o.value ? 'bg-surface text-text shadow-sm ring-1 ring-border' : 'text-muted hover:text-text'"
        @click="setTheme(o.value)"
      >
        <UiIcon :name="o.icon" :size="16" /> {{ o.label }}
      </button>
    </div>

    <template #fallback>
      <span v-if="variant === 'icon'" class="block size-11" aria-hidden="true" />
      <span v-else class="block h-[52px]" aria-hidden="true" />
    </template>
  </ClientOnly>
</template>
