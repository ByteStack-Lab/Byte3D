/** Small helpers shared by the motion code (client only; every function is safe to import on the server). */

export function prefersReducedMotion(): boolean {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Heavier effects (smooth wheel scrolling, GSAP scroll scenes) are for desktop-class visitors only:
 * a fine pointer, no reduced-motion request, no Save-Data. Phones keep native touch scrolling and the CSS-only motion.
 */
export function canUseRichMotion(): boolean {
  if (!import.meta.client) return false
  if (prefersReducedMotion()) return false
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return false
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return !conn?.saveData
}

/** True while a fly-to-cart clone is in the air, so the cart badge can wait for it to land before it bumps. */
export const flyState = { pending: false }

/**
 * Throws a copy of `source` (usually the product photo) into the header cart icon.
 * Purely decorative: it never touches the cart, and does nothing for reduced motion or if either end is missing.
 */
export function flyToCart(source: Element | null | undefined, fallback?: Element | null): void {
  if (!import.meta.client || prefersReducedMotion()) return
  const onScreen = (el: Element | null | undefined): el is Element => {
    if (!el) return false
    const b = el.getBoundingClientRect()
    return b.width > 0 && b.bottom > 0 && b.top < window.innerHeight
  }
  // The photo if it is visible, otherwise whatever the visitor just pressed (e.g. the sticky mobile button).
  source = onScreen(source) ? source : onScreen(fallback) && fallback !== document.body ? fallback : null
  if (!source) return
  const target = document.querySelector<HTMLElement>('[data-cart-target]')
  const from = source.getBoundingClientRect()
  const to = target?.getBoundingClientRect()
  if (!target || !to || !from.width || !to.width) return

  const photo = source instanceof HTMLImageElement ? source : source.querySelector('img')
  const src = photo?.currentSrc || photo?.src
  const size = Math.min(from.width, from.height, 140)
  const left = from.left + from.width / 2 - size / 2
  const top = from.top + from.height / 2 - size / 2
  const dx = to.left + to.width / 2 - (left + size / 2)
  const dy = to.top + to.height / 2 - (top + size / 2)

  const el = document.createElement('div')
  el.className = 'fly-clone'
  el.setAttribute('aria-hidden', 'true')
  el.style.cssText = `left:${left}px;top:${top}px;width:${size}px;height:${size}px;`
  if (src) el.style.backgroundImage = `url("${src.replace(/"/g, '%22')}")`
  else el.style.background = 'var(--color-accent)'
  document.body.append(el)

  flyState.pending = true
  const anim = el.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 48}px) scale(0.6)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0.35 },
    ],
    { duration: 720, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' },
  )
  const done = () => {
    el.remove()
    flyState.pending = false
    window.dispatchEvent(new Event('b3d:cart-landed'))
  }
  anim.addEventListener('finish', done, { once: true })
  anim.addEventListener('cancel', done, { once: true })
}
