<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { t } = useLocale()
const is404 = computed(() => props.error.statusCode === 404)

useHead({ title: () => (is404.value ? t('error.notFoundTitle') : t('error.title')), meta: [{ name: 'robots', content: 'noindex' }] })
const goHome = () => clearError({ redirect: '/' })
</script>

<template>
  <NuxtLayout>
    <section class="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div class="max-w-md">
        <p class="font-display text-7xl font-bold text-accent">{{ is404 ? '404' : 'Oops' }}</p>
        <h1 class="mt-4 text-2xl font-semibold">{{ is404 ? t('error.notFoundHeading') : t('error.title') }}</h1>
        <p class="mt-2 text-muted">
          {{ is404 ? t('error.notFoundText') : t('error.tryLater') }}
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <UiButton @click="goHome">{{ t('error.home') }}</UiButton>
          <UiButton variant="secondary" to="/shop" @click="clearError()">{{ t('cart.browse') }}</UiButton>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>
