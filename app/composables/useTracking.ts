/**
 * Ad and analytics events (Meta Pixel, Google Analytics 4). The scripts themselves are loaded by `plugins/tracking.client.ts`
 * after the first interaction; until then calls are queued by the stubs the plugin installs, so nothing is lost.
 *
 * Money is paisa everywhere else; trackers want taka, so pass paisa and this converts.
 */
type TrackedEvent = 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'Lead'

interface TrackParams {
  /** Paisa. */
  value?: number
  name?: string
  /** SKUs or ids of the products involved. */
  ids?: string[]
  quantity?: number
  /** Order or quote number: also sent from the server, so Meta counts the conversion once. */
  eventId?: string
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    gtag?: (...args: unknown[]) => void
  }
}

const GA_EVENT: Record<TrackedEvent, string> = {
  ViewContent: 'view_item',
  AddToCart: 'add_to_cart',
  InitiateCheckout: 'begin_checkout',
  Purchase: 'purchase',
  Lead: 'generate_lead',
}

function cookie(name: string): string | undefined {
  return document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1]
}

export function useTracking() {
  function track(event: TrackedEvent, params: TrackParams = {}) {
    if (!import.meta.client) return
    const value = params.value === undefined ? undefined : Math.round(params.value) / 100

    window.fbq?.('track', event, {
      currency: 'BDT',
      ...(value !== undefined ? { value } : {}),
      ...(params.name ? { content_name: params.name } : {}),
      ...(params.ids?.length ? { content_ids: params.ids, content_type: 'product' } : {}),
      ...(params.quantity ? { num_items: params.quantity } : {}),
    }, params.eventId ? { eventID: params.eventId } : undefined)

    window.gtag?.('event', GA_EVENT[event], {
      currency: 'BDT',
      ...(value !== undefined ? { value } : {}),
      ...(event === 'Purchase' && params.eventId ? { transaction_id: params.eventId } : {}),
      ...(params.ids?.length ? { items: params.ids.map(id => ({ item_id: id, ...(params.name ? { item_name: params.name } : {}) })) } : {}),
    })
  }

  /**
   * Browser identifiers Meta needs to match a server-side event to this visit (`_fbp`, `_fbc`, the page URL). Sent along with
   * checkout and quote requests. `_fbc` is rebuilt from the ad click id when the Pixel has not written its own cookie yet.
   */
  function context(): { fbp?: string, fbc?: string, source_url: string } {
    if (!import.meta.client) return { source_url: '' }
    let fbc = cookie('_fbc')
    if (!fbc) {
      try {
        const clickId = sessionStorage.getItem('b3d-fbclid')
        if (clickId) fbc = `fb.1.${Date.now()}.${clickId}`
      }
      catch { /* storage blocked: go without */ }
    }
    return { ...(cookie('_fbp') ? { fbp: cookie('_fbp') } : {}), ...(fbc ? { fbc } : {}), source_url: window.location.href }
  }

  /** Once per key, remembered across reloads (a purchase must not be counted again when the order page is refreshed). */
  function once(key: string, fn: () => void) {
    const storageKey = `b3d-tracked:${key}`
    try {
      if (localStorage.getItem(storageKey)) return
      localStorage.setItem(storageKey, '1')
    }
    catch { /* storage blocked: better to risk a repeat than to lose the event */ }
    fn()
  }

  return { track, context, once }
}
