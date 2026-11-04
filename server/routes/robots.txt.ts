/** Search engines may crawl the catalogue, not the private flows (cart, checkout, account, order pages). */
export default defineEventHandler((event) => {
  const siteUrl = useRuntimeConfig(event).public.siteUrl.replace(/\/$/, '')
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /account',
    'Disallow: /order/',
    'Disallow: /track',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n')
})
