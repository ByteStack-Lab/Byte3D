<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  to?: string
  href?: string
  block?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>(), { variant: 'primary', size: 'md', type: 'button', to: undefined, href: undefined })

const tag = computed(() => (props.to ? resolveComponent('NuxtLink') : props.href ? 'a' : 'button'))

const variants = {
  primary: 'bg-accent text-black hover:bg-accent-hover shadow-[0_0_0_0_rgb(255_122_26/0)] hover:shadow-[0_8px_28px_-8px_rgb(255_122_26/0.6)]',
  secondary: 'border border-border bg-surface-2 text-text hover:border-accent/60 hover:text-accent',
  ghost: 'text-muted hover:text-text hover:bg-surface-2',
} as const
const sizes = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-7 text-base',
} as const

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap select-none',
  'transition duration-200 active:scale-[0.98]',
  variants[props.variant],
  sizes[props.size],
  props.block && 'w-full',
  props.disabled && 'pointer-events-none opacity-50',
])
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' ? disabled : undefined"
    :aria-disabled="disabled || undefined"
    :class="classes"
  >
    <slot />
  </component>
</template>
