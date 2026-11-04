<script setup lang="ts">
useSeoMeta({
  title: 'Contact us',
  description: 'Call, message or email Byte3D for orders, custom prints and prototypes.',
})
useCanonical()
const { data: settings } = await useSettings()
const s = computed(() => settings.value?.data)
const tel = computed(() => (s.value?.contact.phone ?? '+880 1812-209019').replace(/[^+\d]/g, ''))
</script>

<template>
  <div class="container-page py-10 sm:py-16">
    <UiBreadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Contact' }]" />
    <div class="mt-6 max-w-2xl">
      <h1 class="text-4xl font-bold sm:text-5xl">Contact us</h1>
      <p class="mt-4 text-lg text-muted">Questions about an order, a custom print or a prototype? We usually reply within a few hours.</p>
    </div>

    <ul class="mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
      <li class="rounded-lg border border-border bg-surface p-5">
        <UiIcon name="phone" :size="22" class="text-accent" />
        <h2 class="mt-3 font-semibold">Call or WhatsApp</h2>
        <a :href="`tel:${tel}`" class="mt-1 block text-lg font-semibold text-accent-2 hover:underline">{{ s?.contact.phone ?? '+880 1812-209019' }}</a>
      </li>
      <li class="rounded-lg border border-border bg-surface p-5">
        <UiIcon name="mail" :size="22" class="text-accent" />
        <h2 class="mt-3 font-semibold">Email</h2>
        <a :href="`mailto:${s?.contact.email ?? 'hello@byte3d.store'}`" class="mt-1 block break-all text-lg font-semibold text-accent-2 hover:underline">{{ s?.contact.email ?? 'hello@byte3d.store' }}</a>
      </li>
      <li class="rounded-lg border border-border bg-surface p-5">
        <UiIcon name="facebook" :size="22" class="text-accent" />
        <h2 class="mt-3 font-semibold">Facebook</h2>
        <a :href="s?.socials.facebook ?? 'https://facebook.com/Byte3D'" target="_blank" rel="noopener noreferrer" class="mt-1 block text-lg font-semibold text-accent-2 hover:underline">facebook.com/Byte3D</a>
      </li>
      <li class="rounded-lg border border-border bg-surface p-5">
        <UiIcon name="box" :size="22" class="text-accent" />
        <h2 class="mt-3 font-semibold">Custom project?</h2>
        <NuxtLink to="/custom-order" class="mt-1 block text-lg font-semibold text-accent-2 hover:underline">Send your idea or file</NuxtLink>
      </li>
    </ul>

    <p class="mt-8 max-w-2xl text-sm text-muted">
      Already ordered? <NuxtLink to="/track" class="text-accent-2 underline">Track your order</NuxtLink> with your order number and phone number.
    </p>
  </div>
</template>
