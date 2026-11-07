import { defineConfig, loadEnv } from 'vite'
import type { Connect, Plugin, ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Serves /api locally with the same code Vercel runs, so `npm run dev` needs no Vercel tools.
 * Only TWITCH_ values are read, into this Node process; nothing reaches the browser bundle.
 */
function localApi(): Plugin {
  const handler = (server: ViteDevServer | null): Connect.NextHandleFunction => async (req, res, next) => {
    if (!req.url?.startsWith('/api/')) return next()
    try {
      const { handleApi } = server
        ? await server.ssrLoadModule('/api/_lib/router.ts')
        : await import('./api/_lib/router.ts')
      const response: Response = await handleApi(new Request(`http://localhost${req.url}`, { method: req.method }))
      res.statusCode = response.status
      response.headers.forEach((value, key) => res.setHeader(key, value))
      res.end(Buffer.from(await response.arrayBuffer()))
    } catch (error) {
      next(error)
    }
  }
  return {
    name: 'local-api',
    config(_, { mode }) {
      Object.assign(process.env, loadEnv(mode, process.cwd(), 'TWITCH_'))
    },
    configureServer(server) {
      server.middlewares.use(handler(server))
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler(null))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    localApi(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['nexus_logo.png'],
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: 'Nexus Codex',
        short_name: 'Nexus',
        description: 'Your ultimate game discovery platform',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        icons: [
          {
            src: '/nexus_logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/nexus_logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/media\.rawg\.io\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'rawg-images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.rawg\.io\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'rawg-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000,
  },
})
