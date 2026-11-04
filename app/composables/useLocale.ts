import { bn } from '~/locales/bn'
import { en, type MessageKey } from '~/locales/en'

export type Locale = 'en' | 'bn'

/** What `useLocale().t` is: pass it to plain functions (validation, formatting) that cannot call composables themselves. */
export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string

/** Keys that have `.one` and `.other` forms, e.g. `cart.labelCount`. */
type PluralKey = Extract<MessageKey, `${string}.one`> extends `${infer Base}.one` ? Base : never

/**
 * Site language: English (default) or Bangla. The choice lives in a cookie, so the server renders the right language on the
 * first request (no flash). Text that comes from the backend (product names, descriptions) stays as the admin wrote it.
 */
export function useLocale() {
  const cookie = useCookie<string>('b3d-lang', { default: () => 'en', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  const locale = computed<Locale>(() => (cookie.value === 'bn' ? 'bn' : 'en'))

  function t(key: MessageKey, params?: Record<string, string | number>): string {
    const text = (locale.value === 'bn' ? bn[key] : en[key]) || en[key]
    return params ? text.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`)) : text
  }

  /** Singular or plural text for a count: `tp('cart.labelCount', 3)` uses `cart.labelCount.other`. */
  function tp(base: PluralKey, n: number, params: Record<string, string | number> = {}): string {
    return t(`${base}.${n === 1 ? 'one' : 'other'}` as MessageKey, { n, ...params })
  }

  function setLocale(value: Locale) {
    cookie.value = value
  }

  return { locale, isBn: computed(() => locale.value === 'bn'), t, tp, setLocale }
}
