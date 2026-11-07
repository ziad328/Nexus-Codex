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
    const path = req.url?.split('?')[0] ?? ''
    // API routes have no file extension; anything with one (like /api/_lib/catalog.ts) is source code for Vite.
    if (!path.startsWith('/api/') || /\.\w+$/.test(path)) return next()
    if (process.env.E2E_NO_UPSTREAM) {
      // Smoke tests stub /api in the browser; anything that slips through must not reach IGDB.
      res.statusCode = 503
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: `Unstubbed API call in a test: ${req.url}` }))
      return
    }
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
      // Values already set (by a test runner, say) win over .env.local.
      for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), 'TWITCH_'))) process.env[key] ??= value
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
      // A new version installs, takes over and reloads the page by itself. The old 'prompt' mode left visitors
      // on the old app until they cleared site data: the update waited while any tab was open, and its
      // button didn't reload when another tab had found the update.
      registerType: 'autoUpdate',
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
        // /api answers must never be swapped for the app's page.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Covers and screenshots. IGDB never changes an image at a given address, and sends CORS headers,
            // so the app asks with crossorigin and only full (non-opaque) answers are kept.
            urlPattern: /^https:\/\/images\.igdb\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'igdb-images',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Our proxy: fresh when online, the last good answer when offline or slow.
            urlPattern: /\/api\/(games|genres)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nexus-api',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
        // shortcut: the old RAWG caches (rawg-api-cache, rawg-images-cache) stay in browsers that had them until
        // the browser clears storage; deleting them needs custom service-worker code. Add it if storage complaints appear.
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000,
  },
})
