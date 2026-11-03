import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/image', '@nuxt/fonts', '@pinia/nuxt', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    public: {
      // Default is the built-in mock API. Real API: http://localhost:8000/api/v1
      apiBase: '/mock-api/v1',
      siteUrl: 'http://localhost:3000',
    },
  },

  // <model-viewer> is a web component (product 3D viewer).
  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag === 'model-viewer',
    },
  },

  // The backend already serves WebP conversions (card / large), so no re-processing here.
  image: {
    provider: 'none',
    densities: [1],
  },

  fonts: {
    families: [
      { name: 'Space Grotesk', provider: 'google', weights: [500, 600, 700] },
      { name: 'Inter', provider: 'google', weights: [400, 500, 600] },
      { name: 'Hind Siliguri', provider: 'google', weights: [400, 600], subsets: ['bengali'] },
    ],
  },

  nitro: {
    // Pre-compress static assets (gzip + brotli) for node/CDN-less hosting.
    compressPublicAssets: true,
  },

  routeRules: {
    '/cart': { ssr: false, headers: { 'X-Robots-Tag': 'noindex' } },
    '/checkout': { ssr: false, headers: { 'X-Robots-Tag': 'noindex' } },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'color-scheme', content: 'dark light' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      // Runs before first paint: apply the saved theme, else follow the device. Prevents a flash.
      script: [{
        key: 'theme-init',
        tagPriority: 'critical',
        innerHTML: "(function(){try{var p=localStorage.getItem('b3d-theme');var d=(p==='light'||p==='dark')?p:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');var r=document.documentElement;r.setAttribute('data-theme',d);r.style.colorScheme=d}catch(e){}})()",
      }],
    },
  },
})
