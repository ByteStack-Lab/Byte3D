import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/image', '@nuxt/fonts', '@pinia/nuxt', '@nuxt/eslint'],

  css: ['~/assets/css/main.css', '~/assets/css/motion.css'],

  // Native cross-page transition (no JS library). Browsers without it, and visitors who ask for
  // reduced motion, simply get an instant page change. See app/plugins/motion.client.ts.
  experimental: { viewTransition: true },

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8000/api/v1',
      siteUrl: 'http://localhost:3000',
      // Google Analytics 4 measurement id (G-XXXXXXX), optional. Set with NUXT_PUBLIC_GA_ID.
      gaId: '',
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
      // Name-keyring builder only (/custom-keyring). Used from that page's CSS, so other pages don't load them.
      { name: 'Fredoka', provider: 'google', weights: [600], subsets: ['latin'] },
      { name: 'Pacifico', provider: 'google', weights: [400], subsets: ['latin'] },
      { name: 'Lobster', provider: 'google', weights: [400], subsets: ['latin'] },
      { name: 'Lilita One', provider: 'google', weights: [400], subsets: ['latin'] },
      { name: 'Permanent Marker', provider: 'google', weights: [400], subsets: ['latin'] },
      { name: 'Bungee', provider: 'google', weights: [400], subsets: ['latin'] },
      { name: 'Bowlby One', provider: 'google', weights: [400], subsets: ['latin'] },
    ],
  },

  nitro: {
    // Pre-compress static assets (gzip + brotli) for node/CDN-less hosting.
    compressPublicAssets: true,
  },

  routeRules: {
    '/cart': { ssr: false, headers: { 'X-Robots-Tag': 'noindex' } },
    '/checkout': { ssr: false, headers: { 'X-Robots-Tag': 'noindex' } },
    '/account': { ssr: false, headers: { 'X-Robots-Tag': 'noindex' } },
    '/order/**': { ssr: false, headers: { 'X-Robots-Tag': 'noindex' } },
    '/track': { headers: { 'X-Robots-Tag': 'noindex' } },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'color-scheme', content: 'dark light' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/favicon-48.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
      // Runs before first paint: apply the saved theme, else follow the device. Prevents a flash.
      script: [{
        key: 'theme-init',
        tagPriority: 'critical',
        innerHTML: "(function(){try{var p=localStorage.getItem('b3d-theme');var d=(p==='light'||p==='dark')?p:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');var r=document.documentElement;r.setAttribute('data-theme',d);r.style.colorScheme=d}catch(e){}})()",
      }],
    },
  },
})
