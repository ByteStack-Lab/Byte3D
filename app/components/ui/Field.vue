<script setup lang="ts">
/** Label + control slot + one line for the error or a hint. The control gets `invalid` and `describedBy` to bind. */
defineProps<{ id: string, label: string, error?: string | null, hint?: string, required?: boolean }>()
</script>

<template>
  <div>
    <label :for="id" class="mb-1.5 block text-sm font-medium">
      {{ label }}
      <span v-if="required" class="text-accent" aria-hidden="true">*</span>
      <span v-else class="text-xs font-normal text-muted">(optional)</span>
    </label>
    <slot :invalid="!!error" :described-by="`${id}-msg`" />
    <p :id="`${id}-msg`" class="mt-1 min-h-4 text-xs" :class="error ? 'text-danger' : 'text-muted'" :role="error ? 'alert' : undefined">
      {{ error || hint }}
    </p>
  </div>
</template>
