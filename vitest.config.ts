import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    env: {
      VITE_SUPABASE_URL: 'https://supabase.test.invalid',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/types/**', 'src/vite-env.d.ts'],
      reporter: ['text-summary', 'text', 'html'],
    },
  },
});
