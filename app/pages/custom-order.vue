<script setup lang="ts">
useSeoMeta({
  title: 'Custom 3D printing order',
  description: 'Send us your idea or STL file and get a custom 3D print, prototype or laser-engraved product made in Bangladesh.',
})
useCanonical()
const { data: settings } = await useSettings()
const s = computed(() => settings.value?.data)

const steps = [
  { n: '1', title: 'Share your idea', text: 'Send a sketch, photo or 3D file (STL, OBJ, 3MF, STEP).' },
  { n: '2', title: 'Get a quote', text: 'We review it and reply with price and timeline.' },
  { n: '3', title: 'We print & deliver', text: 'Printed, finished and delivered across Bangladesh.' },
]
</script>

<template>
  <div class="container-page py-10 sm:py-16">
    <UiBreadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Custom Order' }]" />
    <div class="mt-6 max-w-2xl">
      <h1 class="text-4xl font-bold sm:text-5xl">Custom order</h1>
      <p class="mt-4 text-lg text-muted">
        Got an idea, a broken part or a prototype? Tell us what you need and we’ll print it.
      </p>
    </div>

    <ol class="mt-10 grid gap-4 sm:grid-cols-3">
      <li v-for="st in steps" :key="st.n" class="rounded-lg border border-border bg-surface p-5">
        <span class="grid size-9 place-items-center rounded-full bg-accent/15 font-display font-bold text-accent">{{ st.n }}</span>
        <h2 class="mt-4 text-lg font-semibold">{{ st.title }}</h2>
        <p class="mt-1 text-sm text-muted">{{ st.text }}</p>
      </li>
    </ol>

    <div class="mt-10 max-w-2xl rounded-xl border border-accent/30 bg-accent/5 p-6">
      <h2 class="text-xl font-semibold">The online quote form is coming soon</h2>
      <p class="mt-2 text-muted">Until then, reach us directly — we usually reply within a few hours.</p>
      <div class="mt-5 flex flex-col gap-3 sm:flex-row">
        <UiButton :href="s?.socials.facebook ?? 'https://facebook.com/Byte3D'" size="lg" target="_blank" rel="noopener noreferrer">
          <UiIcon name="facebook" :size="18" /> Message on Facebook
        </UiButton>
        <UiButton :href="`tel:${(s?.contact.phone ?? '+8801812209019').replace(/[^+\d]/g, '')}`" variant="secondary" size="lg">
          <UiIcon name="phone" :size="18" /> {{ s?.contact.phone ?? '+880 1812-209019' }}
        </UiButton>
        <UiButton :href="`mailto:${s?.contact.email ?? 'hello@byte3d.store'}`" variant="ghost" size="lg">
          <UiIcon name="mail" :size="18" /> Email us
        </UiButton>
      </div>
    </div>
  </div>
</template>
