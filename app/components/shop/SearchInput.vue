<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const text = ref(props.modelValue)
let timer: ReturnType<typeof setTimeout> | undefined

// URL → input (e.g. clear-all, header search)
watch(() => props.modelValue, (v) => { if (v !== text.value) text.value = v })

// input → URL, debounced 300 ms
function onInput() {
  clearTimeout(timer)
  timer = setTimeout(() => emit('update:modelValue', text.value.trim()), 300)
}
function clear() {
  text.value = ''
  clearTimeout(timer)
  emit('update:modelValue', '')
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <form class="relative" role="search" @submit.prevent="emit('update:modelValue', text.trim())">
    <label for="shop-search" class="sr-only">Search products</label>
    <UiIcon name="search" :size="18" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
    <input
      id="shop-search"
      v-model="text"
      type="search"
      placeholder="Search products…"
      autocomplete="off"
      class="h-11 w-full rounded-md border border-border bg-surface-2 pl-10 pr-10 text-sm placeholder:text-muted/80 focus:border-accent focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      @input="onInput"
    >
    <button v-if="text" type="button" class="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded text-muted hover:text-text" aria-label="Clear search" @click="clear">
      <UiIcon name="close" :size="16" />
    </button>
  </form>
</template>
