<script setup lang="ts">
// `overlay`: badge sits on top of a photo, so it gets a solid theme-coloured backing for contrast in light and dark.
withDefaults(defineProps<{ variant?: 'new' | 'customizable' | 'sale' | 'neutral', overlay?: boolean }>(), { variant: 'neutral', overlay: false })

const styles = {
  new: 'bg-accent-2/15 text-accent-2 ring-accent-2/30',
  customizable: 'bg-accent/15 text-accent ring-accent/30',
  sale: 'bg-danger/15 text-danger ring-danger/40',
  neutral: 'bg-surface-2 text-muted ring-border',
} as const
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 backdrop-blur"
    :class="[styles[variant], overlay && '!bg-bg/90']"
  >
    <slot />
  </span>
</template>
