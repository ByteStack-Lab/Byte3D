// Mock of the Laravel API (phase 1 endpoints). Query handling follows GET /products in ../../../../../CLAUDE.md.
import type { Paginated, ProductFilters, SortKey } from '~~/app/types/api'

export default defineEventHandler((event) => {
  const path = (getRouterParam(event, 'path') ?? '').replace(/\/$/, '')
  const query = getQuery(event) as Record<string, string | undefined>

  if (path === 'home') {
    const categories = CATEGORY_DEFS.filter(c => c.featured).slice(0, 6).map(buildCategory)
    const featured = allProductDefs()
      .filter(p => p.featured)
      .sort((a, b) => a.featured! - b.featured!)
      .slice(0, 12)
      .map(buildCard)
    return { data: { hero: HERO, categories, featured_products: featured } }
  }

  if (path === 'categories') return { data: CATEGORY_DEFS.map(buildCategory) }

  if (path.startsWith('categories/')) {
    const def = CATEGORY_DEFS.find(c => c.slug === path.slice('categories/'.length))
    if (!def) throw createError({ statusCode: 404, message: 'Category not found.' })
    return { data: buildCategory(def) }
  }

  if (path === 'settings/public') return { data: SETTINGS }

  if (path === 'products/filters') return { data: buildFilters(query.category) }

  if (path === 'products') return listProducts(query)

  if (path.startsWith('products/')) {
    const def = findProductDef(path.slice('products/'.length))
    if (!def) throw createError({ statusCode: 404, message: 'Product not found.' })
    return { data: buildDetail(def) }
  }

  throw createError({ statusCode: 404, message: 'Not found.' })
})

const csv = (v?: string) => (v ? v.split(',').map(s => s.trim()).filter(Boolean) : [])
const truthy = (v?: string) => v === '1' || v === 'true'

function inCategories(slugs: string[]) {
  const ids = CATEGORY_DEFS.filter(c => slugs.includes(c.slug)).map(c => c.id)
  return (catId: number) => slugs.length === 0 || ids.includes(catId)
}

function buildFilters(category?: string): ProductFilters {
  const slugs = csv(category)
  const scoped = allProductDefs().filter(p => inCategories(slugs)(p.cat))
  const materials = new Map<string, number>()
  const colors = new Map<string, { hex: string, count: number }>()
  const prices: number[] = []
  for (const p of scoped) {
    const vs = variantsOf(p)
    prices.push(defaultVariantOf(p).price)
    for (const m of new Set(vs.map(v => v.material).filter(Boolean) as string[])) materials.set(m, (materials.get(m) ?? 0) + 1)
    const seen = new Set<string>()
    for (const v of vs) {
      if (!v.color || seen.has(v.color)) continue
      seen.add(v.color)
      colors.set(v.color, { hex: v.color_hex ?? '#888888', count: (colors.get(v.color)?.count ?? 0) + 1 })
    }
  }
  return {
    categories: CATEGORY_DEFS.map(c => ({
      slug: c.slug, name: c.name, count: allProductDefs().filter(p => p.cat === c.id).length,
    })),
    materials: [...materials].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
    colors: [...colors].map(([name, v]) => ({ name, hex: v.hex, count: v.count })).sort((a, b) => b.count - a.count),
    price: { min: Math.min(...prices), max: Math.max(...prices) },
  }
}

function listProducts(query: Record<string, string | undefined>): Paginated<ReturnType<typeof buildCard>> {
  const slugs = csv(query.category)
  const materials = csv(query.material).map(s => s.toLowerCase())
  const colors = csv(query.color).map(s => s.toLowerCase())
  const q = query.q?.trim().toLowerCase()
  const min = query.min_price ? Number(query.min_price) : null
  const max = query.max_price ? Number(query.max_price) : null
  const catMatch = inCategories(slugs)

  let items = allProductDefs().filter((p) => {
    if (!catMatch(p.cat)) return false
    const card = buildCard(p)
    const vs = variantsOf(p)
    if (q && !`${p.name} ${card.category.name} ${p.short}`.toLowerCase().includes(q)) return false
    if (min !== null && card.price < min) return false
    if (max !== null && card.price > max) return false
    if (materials.length && !vs.some(v => v.material && materials.includes(v.material.toLowerCase()))) return false
    if (colors.length && !vs.some(v => v.color && colors.includes(v.color.toLowerCase()))) return false
    if (truthy(query.in_stock) && !card.in_stock) return false
    if (truthy(query.customizable) && !card.is_customizable) return false
    if (truthy(query.featured) && !p.featured) return false
    return true
  })

  const sort = (query.sort ?? 'newest') as SortKey
  const priceOf = (p: ProductDef) => defaultVariantOf(p).price
  items = items.sort((a, b) => {
    if (sort === 'price_asc') return priceOf(a) - priceOf(b)
    if (sort === 'price_desc') return priceOf(b) - priceOf(a)
    if (sort === 'popular') return (a.featured ?? 99) - (b.featured ?? 99) || b.id - a.id
    return b.id - a.id
  })

  const perPage = Math.min(Math.max(Number(query.per_page) || 24, 1), 48)
  const total = items.length
  const lastPage = Math.max(Math.ceil(total / perPage), 1)
  const page = Math.min(Math.max(Number(query.page) || 1, 1), lastPage)
  const slice = items.slice((page - 1) * perPage, page * perPage)
  return {
    data: slice.map(buildCard),
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: page,
      last_page: lastPage,
      per_page: perPage,
      total,
      from: total ? (page - 1) * perPage + 1 : null,
      to: total ? (page - 1) * perPage + slice.length : null,
    },
  }
}
