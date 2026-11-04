/**
 * `v-reveal` — fade/rise an element in the first time it scrolls into view.
 *
 *   <li v-reveal>…</li>          rise + fade (default)
 *   <div v-reveal.fade>…</div>   fade only
 *   <div v-reveal.scale>…</div>  fade + slight scale
 *
 * Safe by construction (this runs on every page, including the LCP one):
 *  - The server renders everything visible; no-JS and crawlers see the full page.
 *  - On the client, only elements that start BELOW the fold are hidden, so nothing visible ever flashes.
 *  - Elements revealed together (a new row of cards) stagger by 60 ms each, capped.
 *  - Reduced motion, or no IntersectionObserver → the directive does nothing.
 *  - After the animation the attributes are removed, so the element has no leftover transform/will-change
 *    (card hover effects etc. work normally).
 * The look lives in assets/css/motion.css.
 */
export default defineNuxtPlugin((nuxtApp) => {
  let io: IntersectionObserver | null = null

  function observer(): IntersectionObserver {
    return (io ??= new IntersectionObserver((entries) => {
      let k = 0
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target as HTMLElement
        io!.unobserve(el)
        el.style.setProperty('--reveal-delay', `${Math.min(k++, 6) * 60}ms`)
        el.dataset.reveal = 'in'
        setTimeout(() => {
          delete el.dataset.reveal
          delete el.dataset.revealKind
          el.style.removeProperty('--reveal-delay')
        }, 1300)
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }))
  }

  nuxtApp.vueApp.directive<HTMLElement>('reveal', {
    // The server never hides anything.
    getSSRProps: () => ({}),
    mounted(el, binding) {
      if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) return
      const r = el.getBoundingClientRect()
      // Already on screen (or already scrolled past): leave it alone.
      if (r.top < window.innerHeight * 0.92) return
      el.dataset.reveal = 'out'
      const kind = binding.modifiers.fade ? 'fade' : binding.modifiers.scale ? 'scale' : ''
      if (kind) el.dataset.revealKind = kind
      observer().observe(el)
    },
    beforeUnmount(el) {
      io?.unobserve(el)
    },
  })
})
