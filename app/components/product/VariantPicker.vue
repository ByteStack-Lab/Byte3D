<script setup lang="ts">
import type { ProductVariant } from '~/types/api'

const props = defineProps<{ variants: ProductVariant[] }>()
const modelValue = defineModel<number>({ required: true })

type Attr = 'material' | 'color' | 'size'
const ATTRS: Attr[] = ['material', 'color', 'size']
const TITLES: Record<Attr, string> = { material: 'Material', color: 'Color', size: 'Size' }

const current = computed(() => props.variants.find(v => v.id === modelValue.value) ?? props.variants[0]!)

// Only show an option group when there is an actual choice to make.
const groups = computed(() => ATTRS
  .map(attr => ({
    attr,
    values: [...new Set(props.variants.map(v => v[attr]).filter((x): x is string => !!x))],
  }))
  .filter(g => g.values.length > 1))

const hexFor = (color: string) => props.variants.find(v => v.color === color)?.color_hex ?? '#888'
const available = (attr: Attr, value: string) => props.variants.some(v => v[attr] === value && v.in_stock)

/** Pick the variant that has the new value and agrees with as many other current choices as possible. */
function choose(attr: Attr, value: string) {
  const cur = current.value
  const score = (v: ProductVariant) =>
    ATTRS.filter(a => a !== attr && v[a] === cur[a]).length + (v.in_stock ? 0.5 : 0)
  const best = props.variants
    .filter(v => v[attr] === value)
    .sort((a, b) => score(b) - score(a))[0]
  if (best) modelValue.value = best.id
}
</script>

<template>
  <div v-if="groups.length" class="space-y-5">
    <div v-for="g in groups" :key="g.attr">
      <p :id="`variant-${g.attr}`" class="mb-2 text-sm font-semibold">
        {{ TITLES[g.attr] }}<span class="ml-2 font-normal text-muted">{{ current[g.attr] }}</span>
      </p>

      <div v-if="g.attr === 'color'" class="flex flex-wrap gap-2.5" role="radiogroup" :aria-labelledby="`variant-${g.attr}`">
        <UiSwatch
          v-for="v in g.values"
          :key="v"
          :color="hexFor(v)"
          :label="v"
          :selected="current.color === v"
          :unavailable="!available('color', v)"
          :size="44"
          @click="choose('color', v)"
        />
      </div>

      <div v-else class="flex flex-wrap gap-2" role="radiogroup" :aria-labelledby="`variant-${g.attr}`">
        <button
          v-for="v in g.values"
          :key="v"
          type="button"
          role="radio"
          :aria-checked="current[g.attr] === v"
          class="min-h-11 rounded-md border px-4 text-sm font-medium transition"
          :class="[
            current[g.attr] === v ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface-2 hover:border-muted',
            !available(g.attr, v) && 'text-muted line-through',
          ]"
          @click="choose(g.attr, v)"
        >
          {{ v }}
        </button>
      </div>
    </div>
  </div>
</template>
