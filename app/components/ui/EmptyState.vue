<script setup lang="ts">
withDefaults(defineProps<{ title: string, description?: string, icon?: string }>(), { icon: 'box', description: undefined })
</script>

<template>
  <div class="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
    <span class="mb-4 grid size-14 place-items-center rounded-full bg-surface-2 text-accent">
      <UiIcon :name="icon" :size="26" />
    </span>
    <h2 class="text-lg font-semibold">{{ title }}</h2>
    <p v-if="description" class="mt-1 max-w-sm text-sm text-muted">{{ description }}</p>
    <div class="mt-5 flex flex-wrap justify-center gap-3">
      <slot />
    </div>
  </div>
</template>
