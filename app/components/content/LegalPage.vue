<script setup lang="ts">
/** Shared shell for the plain-text pages (About, Privacy, Terms, Returns). Content goes in the slot as ordinary h2 / p / ul. */
defineProps<{ title: string, intro?: string, updated?: string }>()
</script>

<template>
  <div class="container-page py-10 sm:py-16">
    <UiBreadcrumbs :items="[{ label: 'Home', to: '/' }, { label: title }]" />
    <article class="mt-6 max-w-3xl">
      <h1 class="text-4xl font-bold sm:text-5xl">{{ title }}</h1>
      <p v-if="intro" class="mt-4 text-lg text-muted">{{ intro }}</p>
      <p v-if="updated" class="mt-2 text-sm text-muted">Last updated {{ updated }}</p>
      <div class="prose-page mt-8 space-y-4 leading-relaxed text-muted [&_a]:text-accent-2 [&_a]:underline [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-text [&_li]:pl-1 [&_strong]:text-text [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        <slot />
      </div>
    </article>
  </div>
</template>
