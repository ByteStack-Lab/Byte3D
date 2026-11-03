<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error.statusCode === 404)

useHead({ title: is404.value ? 'Page not found' : 'Something went wrong', meta: [{ name: 'robots', content: 'noindex' }] })
const goHome = () => clearError({ redirect: '/' })
</script>

<template>
  <NuxtLayout>
    <section class="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div class="max-w-md">
        <p class="font-display text-7xl font-bold text-accent">{{ is404 ? '404' : 'Oops' }}</p>
        <h1 class="mt-4 text-2xl font-semibold">{{ is404 ? 'This page didn’t make it off the print bed' : 'Something went wrong' }}</h1>
        <p class="mt-2 text-muted">
          {{ is404 ? 'The page you’re looking for doesn’t exist or has moved.' : 'Please try again in a moment.' }}
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <UiButton @click="goHome">Back to home</UiButton>
          <UiButton variant="secondary" to="/shop" @click="clearError()">Browse the shop</UiButton>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>
