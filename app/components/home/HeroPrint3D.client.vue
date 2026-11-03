<script setup lang="ts">
import type { PrintScene } from '~/composables/usePrintScene'

const emit = defineEmits<{ ready: [], fallback: [] }>()

const container = ref<HTMLElement | null>(null)
let scene: PrintScene | null = null
let cancelled = false
let idleHandle: number | undefined

const devForce = import.meta.dev && new URLSearchParams(location.search).has('hero_t')

/** WebGL available, not a low-end phone, user did not ask to save data. */
function canRun3D(): boolean {
  try {
    const probe = document.createElement('canvas')
    const gl = (probe.getContext('webgl2') || probe.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return false
    // Software rasteriser (SwiftShader, llvmpipe, …) = no GPU: 3D would be a slideshow. Poster only.
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    // (`?hero_t=` is a dev-only switch used to inspect the animation on CI / headless machines.)
    if (!devForce && /swiftshader|llvmpipe|software|basic render/i.test(renderer)) return false
  }
  catch {
    return false
  }
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return false
  const coarse = window.matchMedia('(pointer: coarse)').matches
  if (coarse && (navigator.hardwareConcurrency ?? 8) <= 4) return false
  return true
}

async function boot() {
  if (cancelled || !container.value) return
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
  try {
    const { createPrintScene } = await import('~/composables/usePrintScene')
    const instance = await createPrintScene({
      container: container.value,
      isMobile,
      reducedMotion,
      onFirstFrame: () => emit('ready'),
      onSlow: () => {
        // Too slow for real-time: bring the poster back and free the GPU.
        scene?.dispose()
        scene = null
        emit('fallback')
      },
      startAt: import.meta.dev ? Number(new URLSearchParams(location.search).get('hero_t')) || 0 : 0,
    })
    if (cancelled) instance.dispose()
    else scene = instance
  }
  catch {
    // WebGL failed at runtime: the poster stays.
  }
}

// Nothing 3D happens until the visitor interacts. Creating even a probe WebGL context costs
// seconds of main-thread time on software-rendered / low-end devices, and the poster is a fine
// first impression. Any first scroll, tap, key or mouse move starts it.
const WAKE_EVENTS = ['pointerdown', 'pointermove', 'touchstart', 'scroll', 'wheel', 'keydown'] as const

function disarm() {
  for (const e of WAKE_EVENTS) window.removeEventListener(e, wake)
}

function wake() {
  disarm()
  if (cancelled || !canRun3D()) return
  // Let the interaction itself finish painting before downloading three.js.
  if (typeof window.requestIdleCallback === 'function') {
    idleHandle = window.requestIdleCallback(boot, { timeout: 1500 })
  }
  else {
    idleHandle = window.setTimeout(boot, 300)
  }
}

onMounted(() => {
  for (const e of WAKE_EVENTS) window.addEventListener(e, wake, { passive: true })
})

onBeforeUnmount(() => {
  cancelled = true
  disarm()
  if (idleHandle !== undefined) {
    if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleHandle)
    else clearTimeout(idleHandle)
  }
  scene?.dispose()
  scene = null
})
</script>

<template>
  <div ref="container" class="absolute inset-0" />
</template>
