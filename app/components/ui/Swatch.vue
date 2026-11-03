<script setup lang="ts">
withDefaults(defineProps<{
  color: string
  label: string
  selected?: boolean
  unavailable?: boolean
  size?: number
  /** Multi-select (filters) uses checkbox semantics instead of radio. */
  multi?: boolean
}>(), { size: 36 })
</script>

<template>
  <button
    type="button"
    :role="multi ? 'checkbox' : 'radio'"
    :aria-checked="selected"
    :aria-label="unavailable ? `${label} (out of stock)` : label"
    :title="label"
    class="relative grid place-items-center rounded-full transition duration-150"
    :class="selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : 'ring-1 ring-border hover:ring-muted'"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <span
      class="block rounded-full ring-1 ring-black/30"
      :style="{ background: color, width: `${size - 10}px`, height: `${size - 10}px`, opacity: unavailable ? 0.35 : 1 }"
    />
    <span v-if="unavailable" class="pointer-events-none absolute h-0.5 w-[70%] rotate-45 bg-muted" />
  </button>
</template>
