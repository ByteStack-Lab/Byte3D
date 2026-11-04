interface Page<T> { data: T[], meta: { current_page: number, last_page: number } }

const STATIC_PATHS = ['/', '/shop', '/custom-order', '/custom-keyring', '/about', '/contact', '/privacy', '/terms', '/returns']
const MAX_PAGES = 50 // safety stop: 50 × 48 products

const escapeXml = (s: string) => s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;' })[c]!)

/** Built from the live catalogue so new products and categories appear without a deploy. Cached for an hour. */
export default defineCachedEventHandler(async (event) => {
  const { siteUrl, apiBase } = useRuntimeConfig(event).public
  const base = siteUrl.replace(/\/$/, '')

  const categories = await $fetch<{ data: { slug: string }[] }>('/categories', { baseURL: apiBase })

  const products: { slug: string }[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await $fetch<Page<{ slug: string }>>('/products', { baseURL: apiBase, query: { page, per_page: 48 } })
    products.push(...res.data)
    if (page >= res.meta.last_page) break
  }

  const paths = [
    ...STATIC_PATHS,
    ...categories.data.map(c => `/categories/${c.slug}`),
    ...products.map(p => `/products/${p.slug}`),
  ]

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    paths.map(p => `  <url><loc>${escapeXml(base + p)}</loc></url>`).join('\n')
  }\n</urlset>\n`
}, { maxAge: 60 * 60, swr: true, name: 'sitemap' })
