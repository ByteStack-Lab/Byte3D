<script setup lang="ts">
const props = defineProps<{ current: number, last: number }>()
const route = useRoute()

// 1 … 4 5 [6] 7 8 … 20
const pages = computed<(number | '…')[]>(() => {
  const { current, last } = props
  const set = new Set([1, last, current - 1, current, current + 1])
  const nums = [...set].filter(n => n >= 1 && n <= last).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  nums.forEach((n, i) => {
    const prev = nums[i - 1]
    if (prev !== undefined && n - prev > 1) out.push('…')
    out.push(n)
  })
  return out
})

const link = (page: number) => ({
  path: route.path,
  query: { ...route.query, page: page > 1 ? String(page) : undefined },
})

const base = 'grid size-11 place-items-center rounded-md border text-sm font-medium transition'
</script>

<template>
  <nav v-if="last > 1" aria-label="Pagination" class="mt-10 flex justify-center">
    <ul class="flex flex-wrap items-center justify-center gap-2">
      <li>
        <NuxtLink v-if="current > 1" :to="link(current - 1)" aria-current-value="false" rel="prev" :class="[base, 'border-border hover:border-accent hover:text-accent']" aria-label="Previous page">
          <UiIcon name="chevron-left" :size="18" />
        </NuxtLink>
        <span v-else :class="[base, 'border-border/50 text-muted/40']" aria-hidden="true"><UiIcon name="chevron-left" :size="18" /></span>
      </li>
      <li v-for="(p, i) in pages" :key="`${p}-${i}`">
        <span v-if="p === '…'" class="grid size-11 place-items-center text-muted" aria-hidden="true">…</span>
        <NuxtLink
          v-else
          :to="link(p)"
          :aria-label="`Page ${p}`"
          :aria-current-value="p === current ? 'page' : 'false'"
          :class="[base, p === current ? 'border-accent bg-accent text-on-accent' : 'border-border hover:border-accent hover:text-accent']"
        >
          {{ p }}
        </NuxtLink>
      </li>
      <li>
        <NuxtLink v-if="current < last" :to="link(current + 1)" aria-current-value="false" rel="next" :class="[base, 'border-border hover:border-accent hover:text-accent']" aria-label="Next page">
          <UiIcon name="chevron-right" :size="18" />
        </NuxtLink>
        <span v-else :class="[base, 'border-border/50 text-muted/40']" aria-hidden="true"><UiIcon name="chevron-right" :size="18" /></span>
      </li>
    </ul>
  </nav>
</template>
