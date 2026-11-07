import { defineConfig, devices } from '@playwright/test';

const port = 4173;

// Lets the stubs answer the service worker's own requests too, so the offline tests use stubbed /api answers.
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  reporter: 'list',
  workers: 2,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${port}`,
    viewport: { width: 1440, height: 900 },
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    launchOptions: {
      // Last line of defence: whatever the stubs miss, including a service worker's requests, can't resolve.
      args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost'],
    },
  },
  webServer: {
    // Its own folder and fake keys, so a real key in a local .env file can't reach this build.
    command: `npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      // The preview server must never call IGDB in a test; the browser's stubs answer /api instead.
      E2E_NO_UPSTREAM: '1',
      VITE_SUPABASE_URL: 'https://supabase.test.invalid',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'e2e-publishable-key',
    },
  },
});
