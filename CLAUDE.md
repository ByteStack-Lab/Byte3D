# Frontend — Nuxt 4 Storefront + Three.js

Read `../CLAUDE.md` first: shared rules, API contract and phases live there. This file covers
how the storefront is built.

## Setup (only if `frontend/` is empty)
```bash
npx nuxi@latest init frontend
cd frontend
npm i three pinia @pinia/nuxt @nuxt/image @nuxt/fonts
npm i -D @types/three tailwindcss @tailwindcss/vite @nuxt/eslint eslint typescript vue-tsc
```
Package manager is **npm** (decision 2026-11). Commit `package-lock.json`.
Tailwind v4 via the Vite plugin; `app/assets/css/main.css` starts with `@import "tailwindcss";`
and defines tokens in `@theme`.

## Commands
```bash
npm run dev          # http://localhost:3000
npm run build && npm run preview
npm run lint
npm run typecheck    # nuxt typecheck
```
Run `npm run lint && npm run typecheck` before finishing any task.

## API
The storefront talks to the Laravel backend only (`NUXT_PUBLIC_API_BASE`, default `http://localhost:8000/api/v1`).
The Nitro mock API was removed once backend phase 1 went live; start the backend (`php artisan serve`) before `npm run dev`.

## Config
- `runtimeConfig.public.apiBase` ← `NUXT_PUBLIC_API_BASE` (dev: `http://localhost:8000/api/v1`)
- `runtimeConfig.public.siteUrl` ← `NUXT_PUBLIC_SITE_URL` (dev: `http://localhost:3000`)
- `vue.compilerOptions.isCustomElement: tag => tag === 'model-viewer'` (phase 2, product 3D viewer)
- SSR on for all pages; `routeRules`: `/cart` and `/checkout` → `ssr: false` + `noindex`.

## Structure (Nuxt 4 `app/` directory)
```
app/
├── assets/css/main.css
├── components/
│   ├── layout/      AppHeader, AppFooter, MobileNav, CartButton
│   ├── home/        HeroSection, HeroPrint3D.client.vue, CategoryGrid, CategoryCard, FeaturedProducts
│   ├── product/     ProductCard, ProductGallery, Product3DViewer, VariantPicker, CustomizationFields
│   ├── shop/        FilterSidebar, FilterDrawer, SortSelect, SearchInput, Pagination, ActiveFilters
│   └── ui/          Button, Badge, Price, Skeleton, Swatch, EmptyState
├── composables/
│   ├── useApi.ts         # $fetch/useFetch wrapper with baseURL, error mapping
│   ├── useMoney.ts       # formatTaka(paisa) → "৳450"
│   └── usePrintScene.ts  # all Three.js hero logic (framework-free, testable)
├── layouts/default.vue
├── pages/
│   ├── index.vue                 # home
│   ├── shop/index.vue            # all products
│   ├── categories/[slug].vue     # category page (same shop view, category locked)
│   ├── products/[slug].vue       # product detail
│   ├── cart.vue                  # phase 3
│   ├── checkout.vue              # phase 3
│   ├── order/[number].vue        # phase 3 success page
│   ├── track.vue                 # phase 3
│   └── custom-order.vue          # phase 4 quote form
├── stores/cart.ts                # phase 3
└── types/api.ts                  # TS types mirroring the API contract exactly
public/
├── models/hero.glb               # Draco-compressed hero model(s), ≤ 1.5 MB each
└── images/hero-poster.webp       # static render of the finished hero model
```

## Design system
**Direction: "maker lab"** — dark, technical, with a glowing blue/indigo accent (palette taken from the ByteStackLab site). It should feel
like a premium 3D-print studio, not a generic shop template.

Tokens (dark values; placeholders until the Byte3D brand kit exists — keep them in `@theme` so they swap in one place):
| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0A0C1A` | page background |
| `--color-surface` | `#11142A` | cards |
| `--color-surface-2` | `#1A1E3B` | hover, inputs |
| `--color-border` | `#272C54` | dividers, card borders |
| `--color-text` | `#F1F2FF` | primary text |
| `--color-muted` | `#A3A9D0` | secondary text |
| `--color-accent` | `#6675F7` | periwinkle indigo — CTAs, glow, prices on sale |
| `--color-on-accent` | `#0A0C1A` | text/icons placed on an accent background (white in light theme) |
| `--color-accent-2` | `#68DBF2` | cyan — secondary highlights, links |
| `--color-success` / `--color-danger` | `#22C55E` / `#EF4444` | states |

### Theme (light / dark)
- Visitors only see **Light** and **Dark** (header: one sun/moon button showing the mode you switch to;
  mobile menu: Light | Dark control). There is no visible "System" option.
- Behind the scenes the default is the **device setting**: the site opens in the device's mode and keeps
  following it live. A choice is saved in `localStorage['b3d-theme']` only while it differs from the
  device; switching back to the device's own mode drops the override and follows the device again.
- Mechanism: dark tokens live in `@theme`; light overrides the **same** `--color-*` variables in
  `main.css` under `:root[data-theme="light"]` (plus a `prefers-color-scheme` fallback for no-JS).
  Components must use the tokens (`bg-bg`, `text-muted`, `border-border`, …) — never hard-coded greys/white/black.
- An inline script in `nuxt.config.ts` sets `data-theme` before first paint (no flash). `useTheme()`
  keeps it in sync; the toggle is `<ClientOnly>` (the saved choice is unknown on the server).
- Light accent is deeper indigo (`#3533CD`) so accent text meets WCAG AA on white, with white `--color-on-accent`; light secondary is `#1D6FB8`.
- Things that stay dark in both themes on purpose: the hero 3D stage and its poster, product/category
  photos and their overlay text (`text-white`). Badges on top of photos use `<UiBadge overlay>`.
- Radius 12 / 16 / 24. Container `max-w-7xl`, side gutter 16px on mobile.
- Fonts via `@nuxt/fonts`: headings **Space Grotesk**, body **Inter**, Bangla fallback **Hind Siliguri**.
- Motion: 150–250 ms transitions, card hover lift + image swap, subtle accent glow. Respect
  `prefers-reduced-motion` everywhere.
- Contrast WCAG AA on dark backgrounds; visible focus rings (accent color).

## Homepage (`pages/index.vue`)
One SSR request: `useApi('/home')` → `hero`, `categories` (6), `featured_products` (12).
Show skeletons during client-side navigation. Section order: Hero → Categories → Featured Products → Footer.

### 1. Hero — a 3D printer building a product
**Layout.** Desktop: two columns — left text, right 3D canvas (~1:1, min-height 460px).
Mobile: text first, canvas below (height ~320px).
Left column: headline (h1), subheadline, primary CTA "Shop Now" → `/shop`, secondary CTA
"Custom Order" → `/custom-order`, trust row: "Custom designs · Delivery across Bangladesh · Cash on delivery".
The text is SSR HTML and is the LCP element. The canvas must never block LCP.

**Scene** (`HeroPrint3D.client.vue` renders; `usePrintScene.ts` owns the logic):
- **Print bed** — rounded dark plate with fine grid lines and a faint indigo edge glow.
- **Model** — GLB from `/models/hero.glb`, centered on the bed, scaled to fit. Until a real model
  exists, a procedural placeholder is used (mini robot, mini house, keychain, fidget spinner — currently the only models;
  no GLTFLoader yet, add it with the first real asset). Procedural placeholder (e.g. `LatheGeometry` vase, or an `ExtrudeGeometry` keychain
  shape with a ring hole) so work is never blocked on assets.
- **Layer-by-layer build** — `renderer.localClippingEnabled = true`; the model material gets
  `clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), h)]`. Animate `h` from the model's
  bottom to its top over ~6 s, mostly linear like a real print, with gentle ease at start and end.
- **Hot layer glow** — patch the material with `onBeforeCompile`: uniforms `uCutHeight`, `uBand`,
  `uGlowColor`; add emissive accent-color glow where `abs(worldPos.y - uCutHeight) < uBand`. This sells the
  "freshly extruded" line.
- **Printed texture** — faint horizontal layer lines on the model (shader stripes every ~0.3–0.4 units).
- **Print head** — small hotend (cylinder + cone nozzle) sitting just above the cut height, moving in a
  zigzag raster across the model's XZ bounds each layer. Tiny indigo point light at the nozzle tip with
  a subtle flicker. Optional thin gantry bars for context.
- **Loop sequence** — print (~6 s) → head lifts and slides away (~0.8 s) → finished model turntable
  360° with a soft highlight sweep (~4 s) → model dissolves downward (reverse the clip) → next loop.
  Optionally cycle 2–3 models per loop (keychain, figurine, fidget).
- **Camera** — perspective, 3/4 view. Desktop: slight mouse parallax (lerped, max ±3°).
  Touch devices: no parallax. No OrbitControls in the hero (prevents scroll hijacking).
- **Lighting & color** — hemisphere light + soft key directional + indigo rim light; soft contact
  shadow under the model (blurred radial texture on a plane). `ACESFilmicToneMapping`,
  `SRGBColorSpace` output.

**Performance rules (must):**
- `import('three')` dynamically; never import three in a global plugin or a server-rendered component.
  The poster (`hero-poster.webp`, `fetchpriority="high"`) is the LCP image and stays until the first
  frame renders, then crossfades.
- **Nothing 3D starts before the first user interaction** (scroll / tap / key / mouse move). Even a
  probe WebGL context costs seconds of main-thread time on software-rendered devices; measured with
  Lighthouse mobile: probe on load = Performance 33–66, gated on interaction = 83–95.
- Software renderers (SwiftShader, llvmpipe, …) are detected via `WEBGL_debug_renderer_info` and keep
  the poster. `usePrintScene` also samples frame times and calls `onSlow` (< 20 fps median) so the
  component disposes the scene and brings the poster back.
- Dev only: `/?hero_t=<seconds>` bypasses the software-renderer check and starts the loop at that time,
  to inspect a phase in headless browsers.
- Pixel ratio: `Math.min(devicePixelRatio, 1.5)` on mobile, `2` on desktop. Antialias on desktop only.
- Pause the render loop when the canvas leaves the viewport (`IntersectionObserver`) or `document.hidden`.
- `prefers-reduced-motion` → render one frame of the finished model, no loop.
- No WebGL, `Save-Data`, or low-end mobile (`hardwareConcurrency <= 4` and coarse pointer) → keep the poster image only.
- `ResizeObserver` for sizing. On unmount dispose geometries, materials, textures and the renderer.
- Targets: 60 fps desktop, ≥ 30 fps mid-range Android, Lighthouse mobile performance ≥ 85.

### 2. Categories — 6 cards in 2 rows
Heading "Shop by Category". Grid: desktop and tablet 3 columns × 2 rows; mobile 2 columns × 3 rows.
`CategoryCard`: image (`NuxtImg`, lazy, `sizes`), dark gradient at the bottom, name + product count,
hover: image scale 1.05 + accent border glow. Links to `/categories/{slug}`.
Which 6 appear is decided in the admin (featured + sort order) — never hardcode.

### 3. Featured Products — 12 cards
Heading "Featured Products" with "View all →" linking to `/shop`.
Grid: desktop 4 columns × 3 rows, tablet 3, mobile 2.

`ProductCard` (reused on every grid):
- Image with hover swap to `hover_image` (desktop only).
- Badges: New, Customizable, Sale −X% (computed from `compare_at_price`).
- Name (2-line clamp), category name, price via `formatTaka` with strikethrough `compare_at_price`;
  show "From ৳X" when `price_range` is set.
- Button: "Add to cart" for simple in-stock products (phase 3; link to product page until then),
  "Customize" for `is_customizable` (goes to product page), "Out of stock" disabled.

Optional later sections (do not build now): how custom orders work (3 steps), gallery of past work,
testimonials, prototype CTA banner.

## Shop page (`/shop`) and category page (`/categories/[slug]`)
- SSR. Filters live in the URL query (shareable, crawlable). Changing a filter → `router.replace({ query })`
  → `useApi` keyed on the query refetches.
- Desktop: left sidebar from `GET /products/filters` — category, price range, material, color swatches,
  in stock, customizable. Mobile: "Filter" button opens a bottom-sheet drawer with the same filters
  and an "Apply" button.
- Top bar: result count, search input (debounced 300 ms → `q`), sort select
  (Newest, Price low→high, Price high→low, Popular), active-filter chips with clear-all.
- Grid 4 / 3 / 2 columns, 24 per page, numbered pagination (no infinite scroll — better for SEO and the back button).
- Skeleton cards while loading; empty state with "Reset filters".
- Category page: banner (name, description, image) above the same shop component with category locked.

## Product page (`/products/[slug]`)
- Gallery: main image + thumbnails, swipe on mobile. If `model_3d_url` exists, a "View in 3D" tab with
  Google `<model-viewer>` (lazy-load its script only when the tab opens; enable AR attribute).
- Variant picker: material / color swatches / size; selecting updates price, stock and the main image.
- Customization fields rendered from `customization_schema`: text (with live preview overlay and
  character counter), image (upload in phase 4), URL for NFC; show each field's extra price.
- Quantity, add to cart, production time notice ("Ready in 2–4 days"), description, specs (dimensions,
  material), related products grid.
- SEO: `useSeoMeta` (title, description, og:image) + Product JSON-LD with price in BDT and availability.

## Cart & checkout (phase 3)
- Pinia store persisted to localStorage: `variant_id`, display snapshot, `quantity`, `customization`.
- Cart page and checkout call `POST /cart/validate` and display only server prices; surface `messages`
  (price changed, out of stock).
- Checkout is guest-first: name, phone (BD format with inline validation), optional email, district
  select (sets `shipping_zone`: Dhaka → inside_dhaka), area, address, payment method, order summary.
  Submit → `/order/{number}` or gateway redirect.

## Credentialed calls
Cart, checkout and account calls go through `$send()` (`composables/useApi.ts`): it sends the Sanctum session cookie,
fetches `/sanctum/csrf-cookie` when needed and echoes `X-XSRF-TOKEN` (retrying once on 419). `/cart`, `/checkout`,
`/account` and `/order/**` are client-rendered, so none of this runs on the server. Request/response shapes for these
endpoints are in `../backend/CLAUDE.md` ("Phase 3 API details") and `app/types/api.ts`.

## Rules
- All API calls go through `useApi` with types from `types/api.ts`. No scattered raw `fetch`.
- Never compute totals for submission on the client; display server values.
- Images: always `NuxtImg` with width and height; lazy everywhere except above the fold. Do **not** pass
  `sizes` while the provider is `none` — it generates a bogus `srcset` (`1w, 2w`). Add `sizes` once the API
  exposes several conversions per image.
- `<script setup lang="ts">` and Composition API only.
- Semantic HTML, alt text, keyboard-accessible filters and drawer, focus trap in drawers.
- Per-page SEO: title, description, canonical URL, og:image. `noindex` on cart and checkout.
- Keep `three` confined to the hero and product 3D chunks — check the build output when adding 3D code.

## Production
`NUXT_PUBLIC_API_BASE=https://api.byte3d.store/api/v1`, `NUXT_PUBLIC_SITE_URL=https://byte3d.store` (used by canonical links, the sitemap and
robots.txt), optional `NUXT_PUBLIC_GA_ID`. The Meta Pixel ID comes from the backend admin, not from here. Build with `npm run build` and run
`node .output/server/index.mjs` behind a reverse proxy with TLS (use Supervisor or pm2 to keep it up). The sitemap is cached for an hour.
Before launch: run Lighthouse (mobile) on `/`, a category and a product page; the budget is Performance ≥ 85.

## Language (English / Bangla)
Native and dependency-free: `useLocale()` (`app/composables/useLocale.ts`) gives `t(key, params)` and `tp(base, n)` (plurals via `.one` / `.other`).
The choice lives in the `b3d-lang` cookie, so the server renders the right language on the first request (no flash) and sets `<html lang>`;
`LayoutLangToggle` (header + mobile menu) switches it.
- Text lives in `app/locales/en.ts` and `app/locales/bn.ts`. `bn` is typed `Record<MessageKey, string>`, so **a missing Bangla key is a type error**
  (`npm run typecheck`). New UI text: add the key to both files, never hard-code a string in a template.
- Plain functions that cannot call composables (validation, file checks) take `t` as a parameter (`type Translate`).
- Not translated, on purpose: product/category names and descriptions and the hero text once the admin has edited it (they come from the backend as the
  admin wrote them), server validation messages, district names, the long legal pages (About, Privacy, Terms, Returns) and the name-keyring builder
  (it only prints English letters). The Bangla wording was written by Claude: have a native speaker review it before launch.
