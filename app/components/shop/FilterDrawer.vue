<script setup lang="ts">
import type { ProductFilters } from '~/types/api'
import { emptyFilterState, type FilterState } from '~/composables/useShopQuery'

const props = defineProps<{ filters?: ProductFilters | null, hideCategory?: boolean, current: FilterState }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ apply: [state: FilterState] }>()

const panel = ref<HTMLElement | null>(null)
const draft = ref<FilterState>({ ...props.current })
useDialog(panel, open, () => { open.value = false })

// Start every open from the live URL state.
watch(open, (isOpen) => {
  if (isOpen) draft.value = { ...props.current }
})

function apply() {
  emit('apply', draft.value)
  open.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" leave-active-class="transition duration-200" leave-to-class="opacity-0">
      <div v-if="open" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden" @click="open = false" />
    </Transition>
    <Transition
      enter-active-class="transition duration-250 ease-out"
      enter-from-class="translate-y-full"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="open"
        ref="panel"
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        class="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-xl border-t border-border bg-bg shadow-2xl lg:hidden"
      >
        <div class="mx-auto mt-2 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
        <div class="flex items-center justify-between px-5 py-3">
          <h2 class="text-lg font-semibold">Filters</h2>
          <button type="button" class="grid size-11 place-items-center rounded-md text-muted hover:text-text" aria-label="Close filters" @click="open = false">
            <UiIcon name="close" :size="22" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto px-5 pb-4">
          <ShopFilterPanel v-model="draft" :filters="filters" :hide-category="hideCategory" id-prefix="drawer" />
        </div>
        <div class="flex gap-3 border-t border-border bg-bg p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <UiButton variant="secondary" class="flex-1" @click="draft = emptyFilterState()">Clear</UiButton>
          <UiButton class="flex-[2]" @click="apply">Apply</UiButton>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
