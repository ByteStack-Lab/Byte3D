import { START_LOCATION } from 'vue-router'
import type Lenis from 'lenis'

/**
 * Page-level motion, client only:
 *  1. marks the document after the first client-side navigation (`html.has-navigated`), which turns on the
 *     page-content rise in motion.css — never on the first load, so LCP is untouched;
 *  2. caps how long a View Transition may freeze the screen while a slow API call finishes;
 *  3. desktop-only smooth wheel scrolling with Lenis (loaded when the browser is idle, ~3 KB).
 */
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const root = document.documentElement

  // 1. First navigation marker. Added after the new page rendered, so the old page never re-animates.
  let navigating = false
  router.beforeEach((_to, from) => {
    if (from !== START_LOCATION) navigating = true
  })
  nuxtApp.hook('page:finish', () => {
    if (navigating) root.classList.add('has-navigated')
  })

  // 2. A View Transition freezes the screen until the next page's data has arrived. On a slow 4G call that
  // would look like a dead tap (and hide the loading bar), so after 700 ms we let the page update live.
  nuxtApp.hook('page:view-transition:start', (transition) => {
    const timer = setTimeout(() => transition.skipTransition(), 700)
    void transition.finished.finally(() => clearTimeout(timer))
  })

  // 3. Smooth wheel scrolling. Desktop pointers only; phones keep native touch scrolling.
  const api: SmoothScroll = { lenis: null, stop: () => api.lenis?.stop(), start: () => api.lenis?.start() }

  if (canUseRichMotion()) {
    const boot = async () => {
      const { default: LenisCtor } = await import('lenis')
      api.lenis = new LenisCtor({
        autoRaf: true,
        lerp: 0.11,
        smoothWheel: true,
        allowNestedScroll: true, // inner scrollers (drawers, carousels, selects) keep their own wheel scrolling
      })
      nuxtApp.callHook('b3d:smooth-scroll', api.lenis)
    }
    nuxtApp.hook('app:mounted', () => {
      if ('requestIdleCallback' in window) requestIdleCallback(() => void boot(), { timeout: 2500 })
      else setTimeout(() => void boot(), 1200)
    })
  }

  return { provide: { smooth: api } }
})

export interface SmoothScroll {
  lenis: Lenis | null
  stop: () => void
  start: () => void
}

declare module '#app' {
  interface RuntimeNuxtHooks {
    'b3d:smooth-scroll': (lenis: Lenis) => void
  }
}
