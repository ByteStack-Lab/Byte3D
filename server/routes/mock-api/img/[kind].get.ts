import { mockImageSvg } from '../../../utils/mock-image'

// GET /mock-api/img/keychain?h=24&v=1 → generated SVG placeholder
export default defineEventHandler((event) => {
  const { h, v } = getQuery(event)
  const kind = getRouterParam(event, 'kind') ?? 'gift'
  setHeader(event, 'Content-Type', 'image/svg+xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')
  return mockImageSvg(kind, Number(h) || 24, Number(v) || 0)
})
