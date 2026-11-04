import type { Ref } from 'vue'

/**
 * Homepage scroll scenes (GSAP + ScrollTrigger). Desktop pointers only, never on phones, never for
 * reduced motion / Save-Data: those visitors get the CSS-only reveal and pay for none of this.
 * gsap is imported dynamically when the browser is idle, so it is not in the initial bundle.
 *
 * Scenes (looked up inside `root` by data attribute, so markup stays the source of truth):
 *   [data-scene="hero"]      the hero scrolls away with depth: text drifts and fades, the 3D card sinks back
 *   [data-parallax]          category photos glide inside their frame
 */
export function useHomeScroll(root: Ref<HTMLElement | null>) {
  const nuxtApp = useNuxtApp()
  let ctx: { revert: () => void } | undefined
  let detach: (() => void) | undefined
  let disposed = false

  async function setup() {
    const scope = root.value
    if (!scope) return
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
    if (disposed || !root.value) return
    gsap.registerPlugin(ScrollTrigger)

    // Lenis drives the real scroll position; ScrollTrigger just needs to be told when it moves.
    const follow = (lenis: { on: (e: 'scroll', cb: () => void) => () => void }) => {
      detach = lenis.on('scroll', ScrollTrigger.update)
    }
    if (nuxtApp.$smooth.lenis) follow(nuxtApp.$smooth.lenis)
    else nuxtApp.hooks.hookOnce('b3d:smooth-scroll', follow)

    ctx = gsap.context(() => {
      const hero = scope.querySelector<HTMLElement>('[data-scene="hero"]')
      if (hero) {
        const text = hero.querySelector<HTMLElement>('[data-scene-text]')
        const stage = hero.querySelector<HTMLElement>('.hero-stage-wrap')
        const scrub = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 }
        if (text) gsap.to(text, { y: -48, opacity: 0.2, ease: 'none', scrollTrigger: scrub })
        if (stage) gsap.to(stage, { y: 36, scale: 0.93, ease: 'none', scrollTrigger: scrub })
      }

      scope.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
        gsap.fromTo(
          el,
          { yPercent: -7, scale: 1.14 },
          {
            yPercent: 7,
            ease: 'none',
            scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
      })
    }, scope)
  }

  onMounted(() => {
    if (!canUseRichMotion()) return
    if ('requestIdleCallback' in window) requestIdleCallback(() => void setup(), { timeout: 3000 })
    else setTimeout(() => void setup(), 1500)
  })

  onBeforeUnmount(() => {
    disposed = true
    detach?.()
    ctx?.revert()
  })
}
