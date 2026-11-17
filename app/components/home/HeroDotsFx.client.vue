<script setup lang="ts">
/**
 * Hero background, interactive layer: the dotted grid (CSS, in HeroSection) turns into little boxes that rise toward
 * the cursor like pins on a pin-art board. Each box is a real extruded cube drawn with a vanishing point at the cursor,
 * so it looks 3D. Desktop only (fine pointer, no reduced motion, no Save-Data); phones keep the static dots.
 * The animation loop only runs while the pointer is over the hero or boxes are still settling back down.
 */
const CELL = 28 // must equal the CSS dot spacing in `.hero-dots`
const RADIUS = 170 // reach of the cursor, px
const RISE = 0.2 // perspective strength: how far a raised box leans away from the cursor
const BASE_HALF = 1.4 // resting box half-size, px
const GROW_HALF = 4.6 // extra half-size at full height, px

const canvas = ref<HTMLCanvasElement | null>(null)

let host: HTMLElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | undefined
let raf = 0
let cols = 0
let rows = 0
let heights = new Float32Array(0)
let width = 0
let height = 0
let dpr = 1
const mouse = { x: 0, y: 0, sx: 0, sy: 0, over: false }
let glow = 0
let accent: [number, number, number] = [102, 117, 247]
let accent2: [number, number, number] = [104, 219, 242]

function hexToRgb(value: string, fallback: [number, number, number]): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(value.trim())
  if (!m) return fallback
  const n = Number.parseInt(m[1]!, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function readColors() {
  const style = getComputedStyle(document.documentElement)
  accent = hexToRgb(style.getPropertyValue('--color-accent'), accent)
  accent2 = hexToRgb(style.getPropertyValue('--color-accent-2'), accent2)
}

function resize() {
  if (!canvas.value || !host) return
  const rect = host.getBoundingClientRect()
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = rect.width
  height = rect.height
  canvas.value.width = Math.round(width * dpr)
  canvas.value.height = Math.round(height * dpr)
  cols = Math.ceil(width / CELL)
  rows = Math.ceil(height / CELL)
  heights = new Float32Array(cols * rows)
  ctx = canvas.value.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  if (!raf) frame() // repaint (clears the old size) even when idle
}

const rgba = (c: [number, number, number], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`
const mix = (a: number, b: number, t: number) => a + (b - a) * t

function drawBox(cx: number, cy: number, h: number, vx: number, vy: number) {
  if (!ctx) return
  const half = BASE_HALF + GROW_HALF * h
  // Top face leans away from the cursor (vanishing point) and gets bigger: it is closer to the viewer.
  const tx = cx + (cx - vx) * RISE * h
  const ty = cy + (cy - vy) * RISE * h - h * 7
  const b = BASE_HALF
  // corners, clockwise from top-left
  const base: [number, number][] = [[cx - b, cy - b], [cx + b, cy - b], [cx + b, cy + b], [cx - b, cy + b]]
  const top: [number, number][] = [[tx - half, ty - half], [tx + half, ty - half], [tx + half, ty + half], [tx - half, ty + half]]

  // side walls: darker, deeper toward the base
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4
    ctx.beginPath()
    ctx.moveTo(base[i]![0], base[i]![1])
    ctx.lineTo(base[j]![0], base[j]![1])
    ctx.lineTo(top[j]![0], top[j]![1])
    ctx.lineTo(top[i]![0], top[i]![1])
    ctx.closePath()
    // walls facing the cursor are lit a bit more than the ones facing away
    ctx.fillStyle = rgba(accent, (0.28 + 0.3 * h) * (i === 0 || i === 3 ? 1 : 0.75))
    ctx.fill()
  }

  // top face: accent → cyan as it rises
  const r = Math.round(mix(accent[0], accent2[0], h * 0.7))
  const g = Math.round(mix(accent[1], accent2[1], h * 0.7))
  const bl = Math.round(mix(accent[2], accent2[2], h * 0.7))
  ctx.fillStyle = `rgba(${r},${g},${bl},${0.35 + 0.6 * h})`
  ctx.beginPath()
  ctx.rect(tx - half, ty - half, half * 2, half * 2)
  ctx.fill()
  // thin highlight on the top-left edge
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillRect(tx - half, ty - half, half * 2, Math.max(1, half * 0.35))
}

function frame() {
  raf = 0
  const c = ctx
  if (!c) return

  // ease the cursor and the intensity so nothing snaps
  mouse.sx += (mouse.x - mouse.sx) * 0.2
  mouse.sy += (mouse.y - mouse.sy) * 0.2
  glow += ((mouse.over ? 1 : 0) - glow) * 0.12

  c.clearRect(0, 0, width, height)

  // soft light pool under the cursor
  if (glow > 0.01) {
    const g = c.createRadialGradient(mouse.sx, mouse.sy, 0, mouse.sx, mouse.sy, RADIUS * 1.2)
    g.addColorStop(0, rgba(accent, 0.12 * glow))
    g.addColorStop(1, rgba(accent, 0))
    c.fillStyle = g
    c.fillRect(0, 0, width, height)
  }

  // only visit the cells the cursor can reach (plus whatever is still falling)
  const reach = Math.ceil(RADIUS / CELL) + 1
  const mc = Math.floor(mouse.sx / CELL)
  const mr = Math.floor(mouse.sy / CELL)
  const c0 = Math.max(0, mc - reach)
  const c1 = Math.min(cols - 1, mc + reach)
  const r0 = Math.max(0, mr - reach)
  const r1 = Math.min(rows - 1, mr + reach)

  let busy = mouse.over || glow > 0.01
  // Far boxes may still be settling after a fast mouse move, so walk the whole grid but only draw raised ones.
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col
      const cx = col * CELL + CELL / 2
      const cy = row * CELL + CELL / 2
      let target = 0
      if (mouse.over && col >= c0 && col <= c1 && row >= r0 && row <= r1) {
        const d = Math.hypot(cx - mouse.sx, cy - mouse.sy)
        if (d < RADIUS) {
          const k = 1 - d / RADIUS
          target = k * k * (3 - 2 * k) // smoothstep falloff
        }
      }
      const cur = heights[i]!
      // rise quickly, fall slowly: leaves a short trail behind the cursor
      const next = cur + (target - cur) * (target > cur ? 0.22 : 0.08)
      heights[i] = next < 0.004 ? 0 : next
      if (heights[i]! > 0) {
        busy = true
        drawBox(cx, cy, heights[i]!, mouse.sx, mouse.sy)
      }
    }
  }

  if (busy) raf = requestAnimationFrame(frame)
}

function start() {
  if (!raf) raf = requestAnimationFrame(frame)
}

function onMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse' || !host) return
  const rect = host.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  if (!mouse.over) {
    mouse.sx = x
    mouse.sy = y
    readColors() // picks up a theme change since the last hover
  }
  mouse.x = x
  mouse.y = y
  mouse.over = true
  start()
}

function onLeave() {
  mouse.over = false
  start()
}

onMounted(async () => {
  if (!canUseRichMotion()) return
  // As a `.client` component inside a hydrated page, the template ref is only filled after the next render.
  await nextTick()
  if (!canvas.value) return
  host = canvas.value.closest('section')
  if (!host) return
  readColors()
  resize()
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  host.addEventListener('pointermove', onMove, { passive: true })
  host.addEventListener('pointerleave', onLeave)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  raf = 0
  resizeObserver?.disconnect()
  host?.removeEventListener('pointermove', onMove)
  host?.removeEventListener('pointerleave', onLeave)
  host = null
  ctx = null
})
</script>

<template>
  <canvas ref="canvas" aria-hidden="true" class="absolute inset-0 size-full" />
</template>
