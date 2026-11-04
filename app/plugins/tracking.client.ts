/**
 * Meta Pixel and Google Analytics 4. The Pixel id comes from the store settings (admin); the GA4 id from NUXT_PUBLIC_GA_ID.
 *
 * Performance first (most visitors are on mobile 4G): a tiny stub is installed at once so events queue, and the heavy scripts load
 * on the first interaction, or after a few seconds on a page nobody touches. Nothing here blocks rendering.
 */
const LOAD_AFTER_MS = 4000

interface FbqStub {
  (...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  loaded: boolean
  version: string
  push: unknown
}

function load(src: string) {
  const script = document.createElement('script')
  script.async = true
  script.src = src
  document.head.appendChild(script)
}

export default defineNuxtPlugin(async () => {
  const { data: settings } = await useSettings()
  const pixelId = settings.value?.data.facebook_pixel_id
  const gaId = useRuntimeConfig().public.gaId
  if (!pixelId && !gaId) return

  // Remember which ad click brought the visitor, for `_fbc` (see useTracking().context()).
  try {
    const clickId = new URLSearchParams(window.location.search).get('fbclid')
    if (clickId) sessionStorage.setItem('b3d-fbclid', clickId)
  }
  catch { /* storage blocked */ }

  if (pixelId) {
    // Standard Meta stub: calls made before fbevents.js arrives are queued and replayed by the real script.
    if (!window.fbq) {
      const stub: FbqStub = Object.assign(
        (...args: unknown[]) => { if (stub.callMethod) stub.callMethod(...args); else stub.queue.push(args) },
        { queue: [] as unknown[], loaded: true, version: '2.0', callMethod: undefined as FbqStub['callMethod'] },
      ) as FbqStub
      stub.push = stub
      window.fbq = stub
      ;(window as unknown as { _fbq: FbqStub })._fbq = stub
    }
    window.fbq!('init', pixelId)
    window.fbq!('track', 'PageView')
  }

  if (gaId) {
    const w = window as unknown as { dataLayer: unknown[] }
    w.dataLayer = w.dataLayer || []
    // gtag.js only understands the real `arguments` object, not an array: the rest-params rule cannot apply here.
    // eslint-disable-next-line prefer-rest-params
    window.gtag = function () { w.dataLayer.push(arguments) }
    window.gtag('js', new Date())
    window.gtag('config', gaId, { send_page_view: false })
    window.gtag('event', 'page_view')
  }

  let loaded = false
  const loadScripts = () => {
    if (loaded) return
    loaded = true
    removeEventListener('pointerdown', loadScripts)
    removeEventListener('keydown', loadScripts)
    removeEventListener('scroll', loadScripts)
    removeEventListener('touchstart', loadScripts)
    if (pixelId) load('https://connect.facebook.net/en_US/fbevents.js')
    if (gaId) load(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`)
  }
  for (const type of ['pointerdown', 'keydown', 'scroll', 'touchstart']) addEventListener(type, loadScripts, { once: true, passive: true })
  setTimeout(loadScripts, LOAD_AFTER_MS)

  // Single-page navigation: the first page view was counted above.
  const router = useRouter()
  router.afterEach((to, from) => {
    if (to.fullPath === from.fullPath) return
    window.fbq?.('track', 'PageView')
    window.gtag?.('event', 'page_view', { page_path: to.fullPath })
  })
})
