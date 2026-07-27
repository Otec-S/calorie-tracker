import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Дневник калорий',
        short_name: 'Калории',
        lang: 'ru',
        description:
          'Оценка калорийности и БЖУ блюда по фото или тексту через Claude API',
        theme_color: '#1d2318',
        background_color: '#1d2318',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // /api/analyze costs real Anthropic API usage — never serve it from
        // cache, always hit the network (and just fail if offline).
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
