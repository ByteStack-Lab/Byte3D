<script setup lang="ts">
import type { KeyringType } from '~/utils/keyring'

const props = defineProps<{
  lines: string[]
  fontId: string
  keyColor: string
  letterColor: string
  type: KeyringType
}>()

const uid = useId()
const font = computed(() => KEYRING_FONTS.find(f => f.id === props.fontId) ?? KEYRING_FONTS[0]!)

// All geometry is in SVG units where the font size is F. The viewBox is fitted to the measured text,
// so the whole keyring scales to its container (mobile → desktop) without any media queries.
const F = 100
const tag = computed(() => props.type === 'bag_tag')
const S = computed(() => (tag.value ? 0.34 : 0.24) * F) // thickness of the printed base around the letters
const LH = computed(() => (tag.value ? 0.98 : 0.92) * F)
const ringR = computed(() => (tag.value ? 0.5 : 0.34) * F)
const holeR = computed(() => (tag.value ? 0.2 : 0.14) * F)
const depth = 0.07 * F

const shown = computed(() => (props.lines.length ? props.lines : ['']).map(l => l.trim() || ' '))

// Estimated widths work for SSR and the first paint; real glyph widths replace them once the font is in.
const widths = ref<number[]>([])
const estimate = () => shown.value.map(l => Math.max(1, l.length) * font.value.width * F)
const lineW = computed(() => (widths.value.length === shown.value.length ? widths.value : estimate()))
const maxW = computed(() => Math.max(...lineW.value, F))

const textEls = ref<SVGTextElement[]>([])
function measure() {
  const els = textEls.value
  if (!els.length) return
  widths.value = shown.value.map((_, i) => els[i]?.getComputedTextLength?.() ?? 0)
}
async function remeasure() {
  if (!import.meta.client) return
  await nextTick()
  measure()
  try {
    await document.fonts.load(`${font.value.weight ?? 400} ${F}px "${font.value.family}"`)
  }
  catch { /* font blocked: the estimate stays */ }
  measure()
}
watch([shown, () => props.fontId], remeasure, { flush: 'post' })
onMounted(remeasure)

const totalH = computed(() => shown.value.length * LH.value)
// Keyring: ring tab on the left. Bag tag: ring tab centred on top, like a luggage tag.
const ringCx = computed(() => (tag.value ? 0 : -maxW.value / 2 - S.value * 0.45))
const ringCy = computed(() => (tag.value ? -0.32 * F : totalH.value / 2))
const m = 0.12 * F
const view = computed(() => {
  const textL = -maxW.value / 2 - S.value / 2
  const textR = maxW.value / 2 + S.value / 2
  const x0 = Math.min(textL, ringCx.value - ringR.value) - m
  const x1 = Math.max(textR, ringCx.value + ringR.value) + m
  const y0 = Math.min(-S.value / 2, ringCy.value - ringR.value) - m
  const y1 = Math.max(totalH.value + S.value / 2, ringCy.value + ringR.value) + depth + m
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
})
const viewBox = computed(() => `${view.value.x} ${view.value.y} ${view.value.w} ${view.value.h}`)
const lineY = (i: number) => i * LH.value + LH.value / 2

const label = computed(() => `Preview of a ${tag.value ? 'bag tag' : 'keyring'} reading ${props.lines.filter(Boolean).join(', ') || 'your name'}`)
</script>

<template>
  <div class="kr-plate relative overflow-hidden rounded-xl border border-border">
    <div class="relative flex min-h-32 items-center justify-center p-3 lg:min-h-96 lg:p-10">
      <svg
        :viewBox="viewBox"
        role="img"
        :aria-label="label"
        class="block max-h-28 w-full overflow-visible drop-shadow-[0_10px_10px_rgb(0_0_0/0.28)] lg:max-h-80 lg:drop-shadow-[0_14px_14px_rgb(0_0_0/0.28)]"
        text-anchor="middle"
        dominant-baseline="central"
        :font-size="F"
      >
        <defs>
          <mask :id="`hole-${uid}`" maskUnits="userSpaceOnUse" :x="view.x - 50" :y="view.y - 50" :width="view.w + 100" :height="view.h + 100">
            <rect :x="view.x - 50" :y="view.y - 50" :width="view.w + 100" :height="view.h + 100" fill="#fff" />
            <circle :cx="ringCx" :cy="ringCy" :r="holeR" fill="#000" />
          </mask>
        </defs>

        <!-- printed base: letters thickened into one solid silhouette, plus the ring tab -->
        <g :mask="`url(#hole-${uid})`" stroke-linejoin="round" stroke-linecap="round" :class="`kr-f-${font.id}`">
          <g :transform="`translate(0 ${depth})`" fill="#000" stroke="#000" opacity="0.32" :stroke-width="S">
            <text v-for="(l, i) in shown" :key="`s${i}`" x="0" :y="lineY(i)">{{ l }}</text>
            <circle :cx="ringCx" :cy="ringCy" :r="ringR" stroke="none" />
            <rect v-if="tag" :x="ringCx - ringR * 0.85" :y="ringCy" :width="ringR * 1.7" :height="lineY(0) - ringCy" stroke="none" />
          </g>
          <g :fill="keyColor" :stroke="keyColor" :stroke-width="S" class="kr-fade">
            <text v-for="(l, i) in shown" :key="`b${i}`" x="0" :y="lineY(i)">{{ l }}</text>
            <circle :cx="ringCx" :cy="ringCy" :r="ringR" stroke="none" />
            <rect v-if="tag" :x="ringCx - ringR * 0.85" :y="ringCy" :width="ringR * 1.7" :height="lineY(0) - ringCy" stroke="none" />
          </g>
        </g>

        <!-- raised letters -->
        <g :class="`kr-f-${font.id}`">
          <g fill="#000" opacity="0.28" :transform="`translate(0 ${depth / 2})`">
            <text v-for="(l, i) in shown" :key="`d${i}`" x="0" :y="lineY(i)">{{ l }}</text>
          </g>
          <g :fill="letterColor" class="kr-fade">
            <text v-for="(l, i) in shown" :key="`t${i}`" :ref="(el) => { if (el) textEls[i] = el as SVGTextElement }" x="0" :y="lineY(i)">{{ l }}</text>
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>

<style>
/* Print-bed plate: stays the same in light and dark, like product photos, so every filament colour reads. */
.kr-plate {
  background-color: #dcd9d1;
  background-image:
    radial-gradient(120% 90% at 50% 40%, rgb(255 255 255 / 0.55), transparent 70%),
    linear-gradient(rgb(20 23 28 / 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgb(20 23 28 / 0.07) 1px, transparent 1px);
  background-size: auto, 24px 24px, 24px 24px;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.35), 0 0 60px -28px rgb(102 117 247 / 0.45);
}
.kr-fade { transition: fill 0.2s, stroke 0.2s; }

.kr-f-bubble { font-family: 'Fredoka', 'Inter', sans-serif; font-weight: 600; }
.kr-f-script { font-family: 'Pacifico', 'Inter', cursive; }
.kr-f-retro { font-family: 'Lobster', 'Inter', cursive; }
.kr-f-comic { font-family: 'Lilita One', 'Inter', sans-serif; }
.kr-f-marker { font-family: 'Permanent Marker', 'Inter', cursive; }
.kr-f-block { font-family: 'Bungee', 'Inter', sans-serif; }
.kr-f-heavy { font-family: 'Bowlby One', 'Inter', sans-serif; }
</style>
