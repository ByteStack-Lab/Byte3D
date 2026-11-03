import type { Category, PublicSettings } from '~/types/api'

/** Shared, cached store data (header, footer, product pages). Same key → one request per page load. */
export function useCategories() {
  return useApi<{ data: Category[] }>('/categories', { key: 'categories', cache: true })
}

export function useSettings() {
  return useApi<{ data: PublicSettings }>('/settings/public', { key: 'settings', cache: true })
}

/** Returns a function that makes absolute URLs. Call it in setup; the returned function is safe in lazy getters. */
export function useAbsoluteUrl() {
  const siteUrl = useRuntimeConfig().public.siteUrl
  return (path: string) => (/^https?:\/\//.test(path) ? path : `${siteUrl}${path}`)
}

/** Canonical link for the current page (or a given path). */
export function useCanonical(path?: MaybeRefOrGetter<string | undefined>) {
  const route = useRoute()
  const abs = useAbsoluteUrl()
  useHead({
    link: [{ rel: 'canonical', href: () => abs(toValue(path) ?? route.path) }],
  })
}
