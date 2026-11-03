<script setup lang="ts">
defineProps<{ src: string, alt: string, poster?: string }>()

const ready = ref(false)
// The web component (and its bundled three.js) is only downloaded when this tab opens.
onMounted(async () => {
  await import('@google/model-viewer')
  ready.value = true
})
</script>

<template>
  <div class="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface">
    <UiSkeleton v-if="!ready" class="absolute inset-0 !rounded-none" />
    <model-viewer
      v-if="ready"
      :src="src"
      :alt="alt"
      :poster="poster"
      ar
      ar-modes="webxr scene-viewer quick-look"
      camera-controls
      auto-rotate
      shadow-intensity="1"
      touch-action="pan-y"
      style="width: 100%; height: 100%; background: transparent; --poster-color: transparent"
    />
    <p class="pointer-events-none absolute bottom-3 left-3 rounded-full bg-bg/70 px-3 py-1 text-xs text-muted backdrop-blur">
      Drag to rotate · pinch to zoom
    </p>
  </div>
</template>
