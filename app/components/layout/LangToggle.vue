<script setup lang="ts">
/** English ⇄ Bangla. Shows the language you will switch TO, written in that language. */
withDefaults(defineProps<{ block?: boolean }>(), { block: false })
const { locale, t, setLocale } = useLocale()
</script>

<template>
  <button
    type="button"
    class="inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-text"
    :class="block && 'w-full border border-border bg-surface-2'"
    :aria-label="t('lang.switchLabel')"
    :lang="locale === 'en' ? 'bn' : 'en'"
    @click="setLocale(locale === 'en' ? 'bn' : 'en')"
  >
    {{ t('lang.switchTo') }}
  </button>
</template>
