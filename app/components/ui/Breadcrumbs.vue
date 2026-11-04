<script setup lang="ts">
defineProps<{ items: { label: string, to?: string }[] }>()
const { t } = useLocale()
</script>

<template>
  <nav :aria-label="t('common.breadcrumb')" class="text-sm text-muted">
    <ol class="flex flex-wrap items-center gap-1.5">
      <li v-for="(item, i) in items" :key="i" class="flex items-center gap-1.5">
        <UiIcon v-if="i > 0" name="chevron-right" :size="14" class="opacity-60" />
        <NuxtLink v-if="item.to" :to="item.to" class="transition hover:text-accent">{{ item.label }}</NuxtLink>
        <span v-else aria-current="page" class="text-text">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>
