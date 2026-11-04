import type { MessageKey } from '~/locales/en'
import type { LocationQuery } from 'vue-router'
import type { ProductQuery, SortKey } from '~/types/api'

export const PER_PAGE = 24

const first = (v: LocationQuery[string] | undefined): string | undefined => {
  const s = Array.isArray(v) ? v[0] : v
  return s ? String(s) : undefined
}
const split = (v?: string) => (v ? v.split(',').map(s => s.trim()).filter(Boolean) : [])

export const SORT_OPTIONS: { value: SortKey, key: MessageKey }[] = [
  { value: 'newest', key: 'sort.newest' },
  { value: 'price_asc', key: 'sort.priceAsc' },
  { value: 'price_desc', key: 'sort.priceDesc' },
  { value: 'popular', key: 'sort.popular' },
]

/** Filter values as the UI edits them. Prices are in taka here; the URL and API use paisa. */
export interface FilterState {
  category: string[]
  material: string[]
  color: string[]
  in_stock: boolean
  customizable: boolean
  min_price: string
  max_price: string
}

export function emptyFilterState(): FilterState {
  return { category: [], material: [], color: [], in_stock: false, customizable: false, min_price: '', max_price: '' }
}

const toTaka = (paisa?: string) => (paisa && Number(paisa) > 0 ? String(Math.round(Number(paisa) / 100)) : '')
const toPaisa = (taka: string) => (taka && Number(taka) > 0 ? String(Math.round(Number(taka) * 100)) : undefined)

/**
 * Shop state lives in the URL query (shareable, crawlable). `locked` fixes the category
 * (category pages) so the category filter is hidden and never leaks into the URL.
 */
export function useShopQuery(locked?: MaybeRefOrGetter<string | undefined>) {
  const route = useRoute()
  const router = useRouter()

  const query = computed<ProductQuery>(() => {
    const q = route.query
    const sort = first(q.sort) as SortKey | undefined
    return {
      category: first(q.category),
      q: first(q.q),
      min_price: first(q.min_price),
      max_price: first(q.max_price),
      material: first(q.material),
      color: first(q.color),
      in_stock: first(q.in_stock),
      customizable: first(q.customizable),
      sort: SORT_OPTIONS.some(o => o.value === sort) ? sort : undefined,
      page: first(q.page),
    }
  })

  /** Params sent to GET /products. */
  const apiQuery = computed(() => {
    const out: Record<string, string> = { per_page: String(PER_PAGE) }
    const lockedCategory = toValue(locked)
    for (const [k, v] of Object.entries(query.value)) {
      if (v) out[k] = v
    }
    if (lockedCategory) out.category = lockedCategory
    return out
  })

  const filterState = computed<FilterState>(() => ({
    category: split(query.value.category),
    material: split(query.value.material),
    color: split(query.value.color),
    in_stock: query.value.in_stock === '1',
    customizable: query.value.customizable === '1',
    min_price: toTaka(query.value.min_price),
    max_price: toTaka(query.value.max_price),
  }))

  const page = computed(() => Math.max(Number(query.value.page) || 1, 1))
  const sort = computed<SortKey>(() => query.value.sort ?? 'newest')

  function commit(next: Record<string, string | undefined>) {
    const clean: Record<string, string> = {}
    for (const [k, v] of Object.entries(next)) {
      if (v) clean[k] = v
    }
    return router.replace({ query: clean })
  }

  /** Merge a patch into the URL; filter changes reset to page 1. */
  function update(patch: Partial<Record<keyof ProductQuery, string | undefined>>, keepPage = false) {
    const base: Record<string, string | undefined> = { ...query.value }
    delete base.page
    commit({ ...base, ...(keepPage ? { page: query.value.page } : {}), ...patch })
  }

  function applyFilters(state: FilterState) {
    update({
      category: toValue(locked) ? undefined : (state.category.join(',') || undefined),
      material: state.material.join(',') || undefined,
      color: state.color.join(',') || undefined,
      in_stock: state.in_stock ? '1' : undefined,
      customizable: state.customizable ? '1' : undefined,
      min_price: toPaisa(state.min_price),
      max_price: toPaisa(state.max_price),
    })
  }

  /** Clear every filter and the search, but keep the chosen sort order. */
  function clearAll() {
    commit({ sort: query.value.sort })
  }

  return { query, apiQuery, filterState, page, sort, update, applyFilters, clearAll }
}
