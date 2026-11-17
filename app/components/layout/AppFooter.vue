<script setup lang="ts">
const { data: settings } = await useSettings()
const { data: categories } = await useCategories()
const { t } = useLocale()

const s = computed(() => settings.value?.data)
const telHref = computed(() => `tel:${(s.value?.contact.phone ?? '').replace(/[^+\d]/g, '')}`)
const socials = computed(() => [
  { name: 'Facebook', icon: 'facebook', href: s.value?.socials.facebook },
  { name: 'Instagram', icon: 'instagram', href: s.value?.socials.instagram },
  { name: 'TikTok', icon: 'tiktok', href: s.value?.socials.tiktok },
].filter(x => x.href))
</script>

<template>
  <footer class="mt-24 border-t border-border bg-surface/40">
    <div class="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
      <div class="sm:col-span-2 lg:col-span-1">
        <LayoutAppLogo />
        <p class="mt-4 max-w-xs text-sm leading-relaxed text-muted">
          {{ t('footer.about') }}
        </p>
        <ul v-if="socials.length" class="mt-5 flex gap-2">
          <li v-for="so in socials" :key="so.name">
            <a
              :href="so.href!"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="t('footer.on', { name: so.name })"
              class="grid size-11 place-items-center rounded-full border border-border text-muted transition hover:border-accent hover:text-accent"
            >
              <UiIcon :name="so.icon" :size="18" />
            </a>
          </li>
        </ul>
      </div>

      <nav :aria-label="t('footer.shop')">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-text">{{ t('footer.shop') }}</h2>
        <ul class="mt-4 space-y-2.5 text-sm text-muted">
          <li><NuxtLink to="/shop" class="transition hover:text-accent">{{ t('footer.allProducts') }}</NuxtLink></li>
          <li v-for="c in categories?.data.slice(0, 6)" :key="c.slug">
            <NuxtLink :to="`/categories/${c.slug}`" class="transition hover:text-accent">{{ c.name }}</NuxtLink>
          </li>
        </ul>
      </nav>

      <nav aria-label="Help">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-text">{{ t('footer.services') }}</h2>
        <ul class="mt-4 space-y-2.5 text-sm text-muted">
          <li><NuxtLink to="/custom-keyring" class="transition hover:text-accent">{{ t('footer.customKeyring') }}</NuxtLink></li>
          <li><NuxtLink to="/custom-order" class="transition hover:text-accent">{{ t('footer.customPrint') }}</NuxtLink></li>
          <li><NuxtLink to="/custom-order" class="transition hover:text-accent">{{ t('footer.prototypes') }}</NuxtLink></li>
          <li><NuxtLink to="/shop?customizable=1" class="transition hover:text-accent">{{ t('footer.personalised') }}</NuxtLink></li>
          <li><NuxtLink to="/track" class="transition hover:text-accent">{{ t('footer.trackOrder') }}</NuxtLink></li>
        </ul>
      </nav>

      <div>
        <h2 class="text-sm font-semibold uppercase tracking-wider text-text">{{ t('footer.contact') }}</h2>
        <ul class="mt-4 space-y-3 text-sm text-muted">
          <li v-if="s">
            <a :href="telHref" class="inline-flex items-center gap-2 transition hover:text-accent"><UiIcon name="phone" :size="16" />{{ s.contact.phone }}</a>
          </li>
          <li v-if="s">
            <a :href="`mailto:${s.contact.email}`" class="inline-flex items-center gap-2 transition hover:text-accent"><UiIcon name="mail" :size="16" />{{ s.contact.email }}</a>
          </li>
          <li class="inline-flex items-center gap-2"><UiIcon name="truck" :size="16" />{{ t('footer.delivery') }}</li>
        </ul>
      </div>
    </div>

    <div class="border-t border-border">
      <div class="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
        <p>{{ t('footer.rights', { year: new Date().getFullYear() }) }}</p>
        <nav :aria-label="t('footer.company')" class="flex flex-wrap justify-center gap-x-5 gap-y-2">
          <NuxtLink to="/about" class="transition hover:text-accent">{{ t('footer.aboutLink') }}</NuxtLink>
          <NuxtLink to="/contact" class="transition hover:text-accent">{{ t('footer.contactLink') }}</NuxtLink>
          <NuxtLink to="/returns" class="transition hover:text-accent">{{ t('footer.returns') }}</NuxtLink>
          <NuxtLink to="/privacy" class="transition hover:text-accent">{{ t('footer.privacy') }}</NuxtLink>
          <NuxtLink to="/terms" class="transition hover:text-accent">{{ t('footer.terms') }}</NuxtLink>
        </nav>
      </div>
    </div>
  </footer>
</template>
