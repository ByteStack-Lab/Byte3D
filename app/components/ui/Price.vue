<script setup lang="ts">
const props = withDefaults(defineProps<{
  price: number
  compareAt?: number | null
  range?: { min: number, max: number } | null
  size?: 'md' | 'lg'
}>(), { compareAt: null, range: null, size: 'md' })

const { t } = useLocale()
const onSale = computed(() => !!props.compareAt && props.compareAt > props.price)
</script>

<template>
  <p class="flex flex-wrap items-baseline gap-x-2 font-display">
    <span v-if="range" class="text-xs font-medium text-muted">{{ t('price.from') }}</span>
    <span
      class="font-bold"
      :class="[size === 'lg' ? 'text-3xl' : 'text-lg', onSale ? 'text-accent' : 'text-text']"
    >
      {{ formatTaka(range ? range.min : price) }}
    </span>
    <s v-if="onSale && !range" class="text-sm text-muted" :aria-label="t('price.was', { price: formatTaka(compareAt!) })">
      {{ formatTaka(compareAt!) }}
    </s>
  </p>
</template>
