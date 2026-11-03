import type { AsyncData } from 'nuxt/app'
import type { ApiErrorBody } from '~/types/api'

export interface ApiError {
  status: number
  message: string
  errors: Record<string, string[]>
}

/** Map any fetch failure to the API error shape (`422 { message, errors }`, `404 { message }`, 429). */
export function toApiError(error: unknown): ApiError {
  const e = error as { statusCode?: number, status?: number, data?: Partial<ApiErrorBody>, message?: string }
  const status = e?.statusCode ?? e?.status ?? 0
  const fallback = status === 429
    ? 'Too many requests. Please wait a moment and try again.'
    : status === 404
      ? 'Not found.'
      : 'Something went wrong. Please try again.'
  return { status, message: e?.data?.message ?? fallback, errors: e?.data?.errors ?? {} }
}

export interface ApiOptions {
  /** Explicit key: same key = one request, shared between components. */
  key?: string
  /** Reactive query params; changing them refetches. */
  query?: MaybeRefOrGetter<Record<string, unknown>>
  lazy?: boolean
  server?: boolean
  /** Reuse data already in the SSR payload instead of refetching on the client (shared header/footer data). */
  cache?: boolean
}

/** SSR-friendly GET against the API. All page data goes through here. */
export function useApi<T>(path: string | (() => string), options: ApiOptions = {}): AsyncData<T | undefined, ApiError | undefined> {
  const { cache, ...rest } = options
  const config = useRuntimeConfig()
  return useFetch(path, {
    baseURL: config.public.apiBase,
    ...rest,
    ...(cache
      ? { getCachedData: (key: string, nuxt: { payload: { data: Record<string, unknown> }, static: { data: Record<string, unknown> } }) => nuxt.payload.data[key] ?? nuxt.static.data[key] }
      : {}),
  } as never) as unknown as AsyncData<T | undefined, ApiError | undefined>
}

/** Imperative client-side call (mutations, one-off requests). */
export function $api<T>(path: string, options: Record<string, unknown> = {}) {
  const config = useRuntimeConfig()
  return $fetch<T>(path, { baseURL: config.public.apiBase, ...options } as never)
}
