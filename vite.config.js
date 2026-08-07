import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Базовый путь. На GitHub Pages (project-сайт) приложение живёт по под-пути
// /training-app/. Для корневого хостинга (Netlify/Vercel/свой домен) можно
// собрать с BASE=/ : `BASE=/ npm run build`.
const BASE = process.env.BASE || '/training-app/'

export default defineConfig({
  base: BASE,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // Иконки лежат в public/icons и копируются в dist как есть.
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Дневник тренировок',
        short_name: 'Тренировки',
        description: 'Простой дневник тренировок в зале',
        lang: 'ru',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111111',
        theme_color: '#111111',
        // Относительные пути (без ведущего слэша) резолвятся относительно
        // расположения манифеста, т.е. корректны при любом под-пути.
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Прекэшируем весь собранный бандл — это даёт полный офлайн.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: BASE + 'index.html'
      }
    })
  ]
})
